import { NextRequest, NextResponse } from 'next/server';
import { extractIntent } from '@/lib/ai/nlu';
import { generateScoredCandidates } from '@/lib/ai/scoring';
import { rerankWithLLM } from '@/lib/ai/rerank';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt inválido' }, { status: 400 });
    }

    // PASO 1: Extraer intención estructurada (NLU)
    const intent = await extractIntent(prompt);
    
    // PASO 2 & 3: Candidate generation + Scoring determinístico
    const scoredCandidates = await generateScoredCandidates(intent);
    
    if (scoredCandidates.length === 0) {
      return NextResponse.json({ 
        prompt, 
        results: [],
        message: 'No se encontraron vehículos que coincidan con los criterios'
      });
    }
    
    // PASO 4: Rerank + justificaciones con LLM (contexto ultracompacto)
    const finalRecommendations = await rerankWithLLM(scoredCandidates, intent, prompt);

    return NextResponse.json({ 
      prompt, 
      results: finalRecommendations,
      // Metadata adicional para debugging (opcional)
      meta: {
        intent_detected: intent.use_case,
        candidates_evaluated: scoredCandidates.length,
        top_weights: Object.entries(intent.soft_weights)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([key, value]) => ({ [key]: Math.round(value * 100) / 100 }))
      }
    });
    
  } catch (e) {
    console.error('Error interno:', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
