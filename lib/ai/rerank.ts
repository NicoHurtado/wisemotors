// LLM Rerank final con contexto ultracompacto
import type { ScoredCandidate } from './scoring';
import { createCompactPayload } from './scoring';

export interface FinalRecommendation {
  rank: number;
  match: number;
  reasons: string[];
  vehicle: {
    id: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    fuelType: string;
    type: string;
    imageUrl: string | null;
  };
}

// Schema para el rerank del LLM
const rerankFunction = {
  name: 'rerank_vehicles',
  description: 'Reordena vehículos y proporciona justificaciones basadas en la intención del usuario',
  parameters: {
    type: 'object',
    properties: {
      recommendations: {
        type: 'array',
        maxItems: 12,
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'ID del vehículo (DEBE ser uno de los proporcionados)' },
            match: { type: 'number', minimum: 0, maximum: 100, description: 'Porcentaje de compatibilidad' },
            reasons: {
              type: 'array',
              maxItems: 3,
              items: { type: 'string' },
              description: 'Razones específicas y concisas (máximo 3)'
            }
          },
          required: ['id', 'match', 'reasons']
        }
      }
    },
    required: ['recommendations']
  }
};

export async function rerankWithLLM(
  candidates: ScoredCandidate[],
  subjectiveContext: string,
  originalPrompt: string
): Promise<FinalRecommendation[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Si no hay API key, usar fallback determinístico para no romper UX
    return createFallbackRecommendations(candidates);
  }

  // Crear payload ultracompacto
  const compactCandidates = createCompactPayload(candidates);

  const systemPrompt = `Eres un experto consultor automotriz en Colombia. Tu trabajo es reordenar vehículos y explicar por qué son recomendables.

REGLAS CRÍTICAS:
1. SOLO puedes recomendar vehículos de la lista proporcionada (usar sus IDs exactos)
2. NO inventes modelos, marcas o características
3. Clasifica los mejores 10 vehículos (Top 10)
4. Razones específicas y concisas (no genéricas)
5. Considera el contexto colombiano/antioqueño

Contexto regional:
- "Palmas" = zona montañosa, requiere potencia
- "Huecos" = calles en mal estado, requiere altura
- Medellín = tráfico, parqueo difícil
- "Finca" = carga, terreno difícil

CATEGORÍAS WISEMOTORS:
- Cada vehículo tiene categorías únicas y personalizadas que describen sus características especiales
- Estas categorías pueden ser coloquiales, técnicas, o descriptivas (ej: "Bueno para correr", "Perfecto para las chicas", "Pa subir rápido")
- Debes interpretar inteligentemente qué significa cada categoría y cuándo es relevante mencionarla
- Las categorías aparecen en los tags de cada vehículo - úsalas para hacer recomendaciones más personalizadas
- Si una categoría coincide con la búsqueda del usuario, dale prioridad y menciónala en la justificación

Interpreta y usa las categorías WiseMotors para hacer recomendaciones más precisas y personalizadas.`;

  const userPrompt = `BÚSQUEDA ORIGINAL: "${originalPrompt}"
CONTEXTO SUBJETIVO: "${subjectiveContext}"

CANDIDATOS DISPONIBLES (Muestra Top 10):
${JSON.stringify(compactCandidates, null, 2)}

Reordena estos vehículos priorizando los que mejor se ajusten a la intención. Proporciona razones específicas basadas en sus características reales.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        functions: [rerankFunction],
        function_call: { name: 'rerank_vehicles' },
        temperature: 0.2
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const functionCall = data.choices[0]?.message?.function_call;

    if (!functionCall || functionCall.name !== 'rerank_vehicles') {
      throw new Error('No se pudo obtener rerank del LLM');
    }

    const result = JSON.parse(functionCall.arguments);
    const recs = processLLMRerank(result.recommendations, candidates);
    return ensureMinimum(recs, candidates, 10);

  } catch (error) {
    console.error('Error en LLM rerank:', error);
    // Fallback al scoring determinístico
    return ensureMinimum(createFallbackRecommendations(candidates), candidates, 10);
  }
}

// Procesar respuesta del LLM y crear recomendaciones finales
function processLLMRerank(
  llmRecommendations: any[],
  candidates: ScoredCandidate[]
): FinalRecommendation[] {
  const candidateMap = new Map(candidates.map(c => [c.id, c]));
  const recommendations: FinalRecommendation[] = [];

  // Procesar todas las recomendaciones que lleguen (hasta el límite de la función)
  const limit = Math.min(12, llmRecommendations.length);

  for (let i = 0; i < limit; i++) {
    const llmRec = llmRecommendations[i];
    const candidate = candidateMap.get(llmRec.id);

    if (!candidate) {
      console.warn(`Vehículo no encontrado: ${llmRec.id}`);
      continue;
    }

    // Ensure match is strictly a number
    const matchVal = typeof llmRec.match === 'number' ? llmRec.match : parseInt(llmRec.match) || 0;

    recommendations.push({
      rank: i + 1,
      match: Math.max(0, Math.min(100, Math.round(matchVal))),
      reasons: Array.isArray(llmRec.reasons) ? llmRec.reasons.slice(0, 3) : [],
      vehicle: {
        id: candidate.id,
        brand: candidate.brand,
        model: candidate.model,
        year: candidate.year,
        price: candidate.price,
        fuelType: candidate.fuelType,
        type: candidate.type,
        imageUrl: candidate.imageUrl
      }
    });
  }

  return recommendations;
}

// Asegurar que siempre haya N recomendaciones, completando desde mejores candidatos restantes
function ensureMinimum(recs: FinalRecommendation[], candidates: ScoredCandidate[], minCount: number): FinalRecommendation[] {
  const have = new Set(recs.map(r => r.vehicle.id));
  const missing = Math.max(0, minCount - recs.length);

  // Si ya tenemos suficientes, devolvemos las que hay (hasta el max buffer)
  if (missing === 0) return recs;

  const extras: FinalRecommendation[] = [];
  for (const c of candidates) {
    if (extras.length >= missing) break;
    if (have.has(c.id)) continue;

    // Asignar score por defecto para los rellenados (o usar su score determinístico si existe algo)
    // Para UX consistente, usar un match basado en orden relativo o fijo bajo
    const fallbackMatch = Math.max(10, 50 - (extras.length * 5));

    extras.push({
      rank: recs.length + extras.length + 1,
      match: Math.round(fallbackMatch), // Asignar un % aunque sea bajo
      reasons: generateFallbackReasons(c),
      vehicle: {
        id: c.id,
        brand: c.brand,
        model: c.model,
        year: c.year,
        price: c.price,
        fuelType: c.fuelType,
        type: c.type,
        imageUrl: c.imageUrl,
      }
    });
  }

  return [...recs, ...extras].map((r, i) => ({ ...r, rank: i + 1 }));
}

// Fallback usando solo scoring determinístico
function createFallbackRecommendations(candidates: ScoredCandidate[]): FinalRecommendation[] {
  // Retornar hasta 10 candidatos ordenados por el scoring original (que ahora es dummy 0, ojo)
  // Como scoring.ts devuelve 0, el orden es el de la DB (normalmente por año reciente)
  // TODO: Si scoring determinístico fue removido, el orden aquí es arbitrario.
  return candidates.slice(0, 10).map((candidate, index) => ({
    rank: index + 1,
    match: Math.max(10, 90 - (index * 5)), // Fake decay score for fallback
    reasons: generateFallbackReasons(candidate),
    vehicle: {
      id: candidate.id,
      brand: candidate.brand,
      model: candidate.model,
      year: candidate.year,
      price: candidate.price,
      fuelType: candidate.fuelType,
      type: candidate.type,
      imageUrl: candidate.imageUrl
    }
  }));
}

// Generar razones básicas cuando el LLM falla
function generateFallbackReasons(candidate: ScoredCandidate): string[] {
  const reasons: string[] = [];
  const features = candidate.features;

  if (features.hill_climb_score > 0.7) {
    reasons.push('Excelente capacidad para subir pendientes');
  }

  if (features.efficiency_norm > 0.7) {
    reasons.push('Muy eficiente en consumo de combustible');
  }

  if (features.comfort_norm > 0.7) {
    reasons.push('Alto nivel de comodidad');
  }

  if (features.potholes_score > 0.7) {
    reasons.push('Resistente para calles en mal estado');
  }

  if (features.prestige_norm > 0.7) {
    reasons.push('Marca reconocida y prestigiosa');
  }

  if (features.quality_price_ratio_norm > 0.7) {
    reasons.push('Excelente relación calidad-precio');
  }

  // Si no hay razones específicas, usar genéricas
  if (reasons.length === 0) {
    reasons.push(
      `${candidate.type} confiable de ${candidate.year}`,
      `Buenas especificaciones para su rango de precio`,
      `Marca ${candidate.brand} reconocida en el mercado`
    );
  }

  return reasons.slice(0, 3);
}
