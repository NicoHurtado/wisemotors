// Scoring determinístico basado en matriz de pesos
import { prisma } from '@/lib/prisma';
import type { VehicleIntent } from './nlu';
import type { VehicleCandidate, VehicleFeatures } from './features';
import { computeVehicleFeatures, getMarketStats, generateVehicleTags } from './features';
import { getValidImageUrl, createImagePlaceholder } from '@/lib/utils/imageUtils';

export interface ScoredCandidate extends VehicleCandidate {
  score: number;
  breakdown: Record<string, number>; // Para debugging
}

// Aplicar filtros duros via Prisma
export async function applyHardFilters(intent: VehicleIntent) {
  const where: any = {};
  
  if (intent.hard_filters) {
    const filters = intent.hard_filters;
    
    if (filters.fuel_type) {
      where.fuelType = filters.fuel_type;
    }
    
    if (filters.body_type) {
      where.type = filters.body_type;
    }
    
    if (filters.budget_min || filters.budget_max) {
      where.price = {};
      if (filters.budget_min) where.price.gte = filters.budget_min;
      if (filters.budget_max) where.price.lte = filters.budget_max;
    }
    
    if (filters.year_min) {
      where.year = { gte: filters.year_min };
    }
    
    // TODO: Implementar filtros por asientos cuando tengamos ese campo
    // TODO: Implementar filtro por transmisión
    // TODO: Implementar filtro por altura libre mínima
  }
  
  const candidates = await prisma.vehicle.findMany({
    where,
    include: {
      images: {
        orderBy: { order: 'asc' },
        take: 1
      }
    },
    take: 40 // Máximo 40 candidatos para mantener velocidad
  });
  
  return candidates;
}

// Calcular score determinístico para un candidato
export function calculateDeterministicScore(
  candidate: VehicleCandidate, 
  intent: VehicleIntent
): { score: number; breakdown: Record<string, number> } {
  const weights = intent.soft_weights;
  const features = candidate.features;
  
  // Matriz de scoring con pesos configurables
  const breakdown = {
    hill_climb: weights.hill_climb * features.hill_climb_score,
    potholes: weights.potholes * features.potholes_score,
    comfort: weights.comfort * features.comfort_norm,
    safety: weights.safety * features.safety_norm,
    efficiency: weights.efficiency * features.efficiency_norm,
    tech: weights.tech * features.tech_norm,
    prestige: weights.prestige * features.prestige_norm,
    cargo: weights.cargo * features.offroad_score, // Usar offroad como proxy de cargo
    urban: weights.urban * features.urban_score,
    performance: weights.performance * features.acceleration_norm
  };
  
  // Score base sumando todos los componentes
  let score = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  
  // Normalizar por suma total de pesos (por si no suman 1.0)
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (totalWeight > 0) {
    score = score / totalWeight;
  }
  
  // Penalizaciones por filtros duros no cumplidos perfectamente
  score = applyPenalties(candidate, intent, score);
  
  return { score: Math.max(0, Math.min(1, score)), breakdown };
}

// Aplicar penalizaciones por no cumplir filtros duros perfectamente
function applyPenalties(candidate: VehicleCandidate, intent: VehicleIntent, score: number): number {
  if (!intent.hard_filters) return score;
  
  const filters = intent.hard_filters;
  let penalty = 0;
  
  // Penalizar por exceso de presupuesto (si está muy por encima del máximo)
  if (filters.budget_max && candidate.price > filters.budget_max * 1.2) {
    penalty += 0.3;
  }
  
  // Penalizar por estar muy por debajo del presupuesto mínimo
  if (filters.budget_min && candidate.price < filters.budget_min * 0.8) {
    penalty += 0.2;
  }
  
  // TODO: Agregar más penalizaciones cuando tengamos más campos
  // - Asientos insuficientes
  // - Altura libre insuficiente
  // - Transmisión no deseada
  
  return score - penalty;
}

// Pipeline completo de candidate generation + scoring
export async function generateScoredCandidates(intent: VehicleIntent): Promise<ScoredCandidate[]> {
  // 1. Aplicar filtros duros
  const rawCandidates = await applyHardFilters(intent);
  
  // 2. Obtener estadísticas del mercado para normalización
  const marketStats = await getMarketStats();
  
  // 3. Convertir a candidatos con features
  const candidates: VehicleCandidate[] = rawCandidates.map(vehicle => {
    const features = computeVehicleFeatures(vehicle, marketStats);
    const tags = generateVehicleTags(vehicle, features);
    
    // Obtener imagen válida o crear placeholder
    const rawImageUrl = vehicle.images?.[0]?.url || null;
    const validImageUrl = getValidImageUrl(rawImageUrl);
    const finalImageUrl = validImageUrl || createImagePlaceholder(vehicle.brand, vehicle.model);
    
    return {
      id: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      price: vehicle.price,
      fuelType: vehicle.fuelType,
      vehicleType: vehicle.vehicleType,
      type: vehicle.type,
      imageUrl: finalImageUrl,
      features,
      tags
    };
  });
  
  // 4. Calcular scores determinísticos
  const scoredCandidates: ScoredCandidate[] = candidates.map(candidate => {
    const { score, breakdown } = calculateDeterministicScore(candidate, intent);
    return { ...candidate, score, breakdown };
  });
  
  // 5. Ordenar por score y tomar top 10
  return scoredCandidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
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
    
    // Score determinístico para referencia
    det_score: Math.round(candidate.score * 100) / 100
  }));
}
