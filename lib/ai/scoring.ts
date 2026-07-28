// Helper types and functions for candidate scoring and payload generation
import type { VehicleCandidate } from './features';
import {
  detectQueryProfile,
  scoreDeterministically,
  rankCandidates,
  type QueryProfile,
} from './deterministic';

export interface ScoredCandidate extends VehicleCandidate {
  /** Puntaje determinístico 0-100 (percentil winsorizado × pesos del perfil). */
  score: number;
  /** Contribución por feature — con esto se explica por qué quedó donde quedó. */
  breakdown?: Record<string, number>;
}

/**
 * Puntúa y ordena los candidatos de forma determinística. Este orden es el
 * ranking base del producto: el LLM después lo afina y lo explica, pero si el
 * LLM falla o no hay API key, este orden ES el resultado — correcto aunque sin
 * prosa, no una ficción de porcentajes inventados.
 */
export function scoreCandidates(
  candidates: VehicleCandidate[],
  query: string
): { ranked: ScoredCandidate[]; profile: QueryProfile } {
  const profile = detectQueryProfile(query);
  const results = scoreDeterministically(candidates, profile);

  const scored: ScoredCandidate[] = candidates.map(c => ({
    ...c,
    score: results.get(c.id)?.score ?? 0,
    breakdown: results.get(c.id)?.breakdown,
  }));

  return { ranked: rankCandidates(scored), profile };
}

// Crear payload ultracompacto para el LLM de rerank
export function createCompactPayload(candidates: ScoredCandidate[]): any[] {
  return candidates.map(candidate => ({
    id: candidate.id,
    title: `${candidate.brand} ${candidate.model} ${candidate.year}`,
    price: candidate.price,
    fuelType: candidate.fuelType,
    vehicleType: candidate.vehicleType,

    // Features más importantes (6-10 números)
    features: {
      performance: Math.round(candidate.features.acceleration_norm * 100) / 100,
      comfort: Math.round(candidate.features.comfort_norm * 100) / 100,
      efficiency: Math.round(candidate.features.efficiency_norm * 100) / 100,
      hill_climb: Math.round(candidate.features.hill_climb_score * 100) / 100,
      potholes: Math.round(candidate.features.potholes_score * 100) / 100,
      prestige: Math.round(candidate.features.prestige_norm * 100) / 100,
      urban: Math.round(candidate.features.urban_score * 100) / 100,
      value: Math.round(candidate.features.quality_price_ratio_norm * 100) / 100
    },

    // Tags descriptivos (incluye WiseMotors originales)
    tags: candidate.tags.slice(0, 8),

    // Puntaje determinístico real: el orden base que el LLM debe respetar
    // salvo que el contexto subjetivo justifique moverlo.
    det_score: candidate.score
  }));
}
