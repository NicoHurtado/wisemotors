import { NextRequest, NextResponse } from 'next/server';
import { categorizeQuery } from '@/lib/ai/categorization';
import { processResults } from '@/lib/ai/results';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt inválido' }, { status: 400 });
    }

    // STEP 1: Categorize the query (subjective vs objective vs hybrid)
    const categorizedIntent = await categorizeQuery(prompt);
    
    // STEP 2: Process results based on query type
    const processedResults = await processResults(categorizedIntent);
    
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
