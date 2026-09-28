// Rerank final con Claude (Haiku): afina y explica el orden determinístico.
import { z } from 'zod/v4';
import { pedirJson } from './claude';
import type { ScoredCandidate } from './scoring';
import type { VehicleFeatures } from './features';
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
    /** Aptitudes normalizadas (0-1) ya calculadas: la ficha del podio las dibuja. */
    features: VehicleFeatures;
  };
}

// Esquema del rerank: Claude devuelve un JSON validado, nunca texto suelto.
const RerankSchema = z.object({
  recommendations: z.array(
    z.object({
      id: z.string().describe('id del vehículo, EXACTAMENTE uno de la lista'),
      match: z.number().describe('Compatibilidad de 0 a 100 con lo que pidió'),
      reasons: z.array(z.string()).describe('2 o 3 razones cortas, con cifra o dato real cuando lo haya'),
    })
  ),
});

/** Cuántos candidatos (ya ordenados por el scoring determinístico) ve la IA. */
const MAX_CANDIDATOS_IA = 30;

export async function rerankWithLLM(
  candidates: ScoredCandidate[],
  subjectiveContext: string,
  originalPrompt: string
): Promise<FinalRecommendation[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    // Sin clave: el orden determinístico ES el resultado, para no romper la búsqueda.
    return createFallbackRecommendations(candidates);
  }

  // Payload compacto: solo los mejores del orden base, JSON sin espacios.
  const compactCandidates = createCompactPayload(candidates.slice(0, MAX_CANDIDATOS_IA));

  const systemPrompt = `Eres el asesor de WiseMotors, un marketplace de carros nuevos en Colombia (Medellín). Tu trabajo es ordenar los candidatos para lo que pidió el comprador y explicar por qué, en palabras de persona (tuteas, cero jerga).

REGLAS:
1. SOLO recomiendas carros de la lista, con su id exacto. No inventas modelos, marcas ni datos.
2. Devuelve los 10 mejores (o todos si hay menos), del más al menos recomendable.
3. Cada candidato trae "det_score": un orden base calculado con datos reales, y la lista ya viene ordenada por él. Respétalo como punto de partida; mueve un carro solo si lo que pidió el comprador lo justifica claramente.
4. Razones concretas y distintas para cada carro, nunca genéricas. Los "features" van de 0 a 1 frente al catálogo (1 = el mejor).
5. Contexto local: las lomas de Medellín y Las Palmas piden fuerza; los huecos y reductores piden altura; el trancón y el parqueo piden un carro manejable; la finca pide carga y terreno difícil.
6. Los "tags" incluyen categorías propias de WiseMotors (p. ej. "Pa subir rápido"); si coinciden con la búsqueda, dale prioridad y menciónalas.`;

  const userPrompt = `Búsqueda del comprador: "${originalPrompt}"
Lo que más le importa: "${subjectiveContext}"

Candidatos:
${JSON.stringify(compactCandidates)}`;

  try {
    const result = await pedirJson({
      schema: RerankSchema,
      modelo: 'haiku',
      maxTokens: 2500,
      system: systemPrompt,
      prompt: userPrompt,
    });
    const recs = processLLMRerank(result.recommendations, candidates);
    return ensureMinimum(recs, candidates, 10);
  } catch (error) {
    console.error('Error en el rerank con Claude:', error);
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
    if (recommendations.some(r => r.vehicle.id === candidate.id)) continue; // repetido

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
        imageUrl: candidate.imageUrl,
        features: candidate.features
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

    // Usar el score determinístico real del candidato, no un número inventado
    const fallbackMatch = Math.max(1, Math.min(100, Math.round(c.score)));

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
        features: c.features,
      }
    });
  }

  return [...recs, ...extras].map((r, i) => ({ ...r, rank: i + 1 }));
}

// Fallback usando solo scoring determinístico
function createFallbackRecommendations(candidates: ScoredCandidate[]): FinalRecommendation[] {
  // Los candidatos llegan ordenados por el scoring determinístico real
  // (percentiles winsorizados × pesos del perfil). Si el LLM no está, este
  // orden ES el resultado: correcto aunque sin prosa — degradación real,
  // no la ficción anterior del 90-85-80 inventado.
  return candidates.slice(0, 10).map((candidate, index) => ({
    rank: index + 1,
    match: Math.max(1, Math.min(100, Math.round(candidate.score))),
    reasons: generateFallbackReasons(candidate),
    vehicle: {
      id: candidate.id,
      brand: candidate.brand,
      model: candidate.model,
      year: candidate.year,
      price: candidate.price,
      fuelType: candidate.fuelType,
      type: candidate.type,
      imageUrl: candidate.imageUrl,
      features: candidate.features
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
