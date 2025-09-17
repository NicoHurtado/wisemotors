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
  
  // Primera pasada con filtros duros tal cual
  let candidates = await prisma.vehicle.findMany({
    where,
    include: {
      images: {
        orderBy: { order: 'asc' },
        take: 1
      }
    },
    take: 40
  });

  // Si no hay resultados, aplicar múltiples niveles de relajación progresiva
  if (candidates.length === 0 && intent.hard_filters) {
    // Nivel 1: Relajación moderada
    let relaxedWhere: any = { ...where };

    // Relajar budget máximo a +30%
    if (intent.hard_filters.budget_max) {
      relaxedWhere.price = relaxedWhere.price || {};
      relaxedWhere.price.lte = Math.floor(intent.hard_filters.budget_max * 1.3);
    }

    // Relajar body_type -> permitir tipos cercanos
    if (intent.hard_filters.body_type && relaxedWhere.type) {
      const body = intent.hard_filters.body_type;
      const nearTypes: Record<string, string[]> = {
        'SUV': ['SUV', 'Pickup', 'Hatchback'],
        'Sedán': ['Sedán', 'Hatchback'],
        'Pickup': ['Pickup', 'SUV'],
        'Hatchback': ['Hatchback', 'Sedán', 'SUV'],
        'Deportivo': ['Deportivo', 'Convertible', 'Sedán'],
        'Convertible': ['Convertible', 'Deportivo']
      };
      relaxedWhere.type = { in: nearTypes[body] ?? [body] };
    }

    candidates = await prisma.vehicle.findMany({
      where: relaxedWhere,
      include: {
        images: {
          orderBy: { order: 'asc' },
          take: 1
        }
      },
      take: 40
    });
    
    // Nivel 2: Si aún no hay resultados, relajar más
    if (candidates.length === 0) {
      relaxedWhere = { ...where };
      
      // Relajar budget máximo a +50% y mínimo a -20%
      if (intent.hard_filters.budget_max || intent.hard_filters.budget_min) {
        relaxedWhere.price = {};
        if (intent.hard_filters.budget_max) {
          relaxedWhere.price.lte = Math.floor(intent.hard_filters.budget_max * 1.5);
        }
        if (intent.hard_filters.budget_min) {
          relaxedWhere.price.gte = Math.floor(intent.hard_filters.budget_min * 0.8);
        }
      }
      
      // Eliminar filtro de tipo de carrocería temporalmente
      if (intent.hard_filters.body_type) {
        delete relaxedWhere.type;
      }
      
      candidates = await prisma.vehicle.findMany({
        where: relaxedWhere,
        include: {
          images: {
            orderBy: { order: 'asc' },
            take: 1
          }
        },
        take: 40
      });
    }
    
    // Nivel 3: Fallback final - mostrar vehículos populares si aún no hay resultados
    if (candidates.length === 0) {
      candidates = await prisma.vehicle.findMany({
        include: {
          images: {
            orderBy: { order: 'asc' },
            take: 1
          }
        },
        orderBy: [
          { brand: 'asc' },
          { model: 'asc' },
          { year: 'desc' }
        ],
        take: 20
      });
    }
  }

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

  // Sesgo de deportividad: favorecer deportivos cuando el usuario expresa rapidez
  const textKeywords = (intent.locale?.keywords || []).join(' ').toLowerCase();
  const wantsSpeed = weights.performance > 0.7 || /rápido|rapido|deportiv|veloz|performance|potente/.test(textKeywords);
  if (wantsSpeed) {
    // Boost a deportivos y sedanes deportivos; penalizar SUV/pickup salvo que tengan alta performance
    if (candidate.type === 'Deportivo') {
      score += 0.15;
    } else if (candidate.type === 'Sedán') {
      score += 0.07;
    } else if (candidate.type === 'SUV' || candidate.type === 'Pickup') {
      score -= 0.1 * (1 - features.acceleration_norm); // menos penal si acelera bien
    }
  }
  
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
