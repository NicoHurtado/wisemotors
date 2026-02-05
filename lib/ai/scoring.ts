// Helper types and functions for candidate scoring and payload generation
import type { VehicleCandidate } from './features';
import { getValidImageUrl, createImagePlaceholder } from '@/lib/utils/imageUtils';

export interface ScoredCandidate extends VehicleCandidate {
  score: number;
  breakdown?: Record<string, number>; // Optional now
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

    // Score determinístico para referencia (placeholder)
    det_score: 0
  }));
}
