import { NextRequest, NextResponse } from 'next/server';
import { categorizeQuery } from '@/lib/ai/categorization';
import { processResults } from '@/lib/ai/results';
import { registrarBusqueda } from '@/lib/demanda-servidor';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';

function conCuenta(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return false;
  try {
    return !!verifyToken(token)?.userId;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, sesion } = await request.json();
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt inválido' }, { status: 400 });
    }

    // STEP 1: Categorize the query (subjective vs objective vs hybrid)
    const categorizedIntent = await categorizeQuery(prompt);
    
    // DEBUG: Log what the AI categorized
    console.log(`[AI Recommendations] Query: "${prompt}"`);
    console.log(`[AI Recommendations] Query type: ${categorizedIntent.query_type}`);
    console.log(`[AI Recommendations] Confidence: ${categorizedIntent.confidence}`);
    console.log(`[AI Recommendations] Objective filters:`, JSON.stringify(categorizedIntent.objective_filters, null, 2));
    console.log(`[AI Recommendations] Reasoning: ${categorizedIntent.reasoning}`);
    
    // STEP 2: Process results based on query type
    const processedResults = await processResults(categorizedIntent);
    
    // Demanda: se guarda qué quería la persona (agrupado por intención) para
    // los informes. Sin nombre ni IP; la ciudad es la que estima Vercel.
    const primeros = [...(processedResults.top_recommendations?.vehicles ?? []), ...(processedResults.all_matches?.vehicles ?? [])]
      .map((v: any) => v?.id)
      .filter(Boolean);
    const ciudad = request.headers.get('x-vercel-ip-city');
    await registrarBusqueda(prompt, categorizedIntent, { total: processedResults.total_matches, mostrados: primeros }, {
      sesion: typeof sesion === 'string' && /^[a-z0-9-]{8,64}$/i.test(sesion) ? sesion : null,
      ciudad: ciudad ? decodeURIComponent(ciudad) : null,
      conCuenta: conCuenta(request),
    });

    // Ya no retornamos resultados vacíos, el sistema de fallback siempre devuelve algo
    // if (processedResults.total_matches === 0) {
    //   return NextResponse.json({ 
    //     prompt, 
    //     results: [],
    //     query_type: categorizedIntent.query_type,
    //     message: 'No se encontraron vehículos que coincidan con los criterios'
    //   });
    // }

    return NextResponse.json({ 
      prompt, 
      query_type: categorizedIntent.query_type,
      results: processedResults,
      // Metadata for debugging
      meta: {
        query_classification: categorizedIntent.query_type,
        confidence: categorizedIntent.confidence,
        processing_time_ms: processedResults.processing_time_ms,
        total_matches: processedResults.total_matches,
        reasoning: categorizedIntent.reasoning
      }
    });
    
  } catch (e) {
    console.error('Error interno:', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
