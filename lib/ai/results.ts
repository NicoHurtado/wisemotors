// Advanced Result Processing for Different Query Types
import { prisma } from '@/lib/prisma';
import { CategorizedIntent, QueryType } from './categorization';
import { getValidImageUrl, createImagePlaceholder } from '@/lib/utils/imageUtils';
import { rerankWithLLM } from './rerank';
import { ScoredCandidate } from './scoring';
import { computeVehicleFeatures, getMarketStats, generateVehicleTags } from './features';

export interface ProcessedResults {
  query_type: QueryType;
  total_matches: number;

  // For SUBJECTIVE_PREFERENCE and HYBRID
  top_recommendations?: {
    vehicles: any[];
    explanation: string;
  };

  // For OBJECTIVE_FEATURE and HYBRID (fallback or full list)
  all_matches?: {
    vehicles: any[];
    filters_applied: string[];
    count_by_category?: Record<string, number>;
  };

  // Metadata
  processing_time_ms: number;
  confidence: number;
  original_query: string;
}

// Main result processing function
export async function processResults(categorizedIntent: CategorizedIntent): Promise<ProcessedResults> {
  const startTime = Date.now();

  switch (categorizedIntent.query_type) {
    case QueryType.SUBJECTIVE_PREFERENCE:
      return await processSubjectiveQuery(categorizedIntent, startTime);

    case QueryType.OBJECTIVE_FEATURE:
      return await processObjectiveQuery(categorizedIntent, startTime);

    case QueryType.HYBRID:
      return await processHybridQuery(categorizedIntent, startTime);

    default:
      throw new Error(`Unknown query type: ${categorizedIntent.query_type}`);
  }
}

// ============================================================================
// SUBJECTIVE QUERY: Pure AI Ranking based on "Vibes" / Knowledge
// ============================================================================
async function processSubjectiveQuery(intent: CategorizedIntent, startTime: number): Promise<ProcessedResults> {
  // 1. Fetch a broad set of candidates
  const vehicles = await prisma.vehicle.findMany({
    take: 60, // Send a healthy batch to the LLM
    orderBy: { year: 'desc' },
    include: {
      images: {
        take: 1,
        select: {
          id: true,
          type: true,
          order: true,
          isThumbnail: true
        }
      }
    }
  });

  const marketStats = await getMarketStats();

  const candidates: ScoredCandidate[] = vehicles.map(v => {
    const features = computeVehicleFeatures(v, marketStats);
    const tags = generateVehicleTags(v, features);
    return {
      id: v.id,
      brand: v.brand,
      model: v.model,
      year: v.year,
      price: v.price,
      fuelType: v.fuelType,
      type: v.type,
      vehicleType: v.vehicleType || 'Unknown',
      imageUrl: `/api/vehicles/${v.id}/image?index=0`,
      score: 0,
      features,
      tags
    };
  });

  // 2. Ask LLM to rank them based on the Subjective Context
  const rawRecommended = await rerankWithLLM(
    candidates,
    intent.subjective_context || intent.original_query,
    intent.original_query
  );

  // Flatten structure for frontend
  const allRanked = rawRecommended.map(rec => ({
    ...rec.vehicle,
    matchPercentage: rec.match,
    reasons: rec.reasons
  }));

  // Split Top 3 vs Others
  const top3 = allRanked.slice(0, 3);
  const rankedothers = allRanked.slice(3);

  // Filter out any ranked vehicle from the original list to get the unranked tail
  // ALSO Filter out "Visual Duplicates" (same Brand + Model + Year) to avoid confusing the user
  const rankedIds = new Set(allRanked.map(v => v.id));
  const rankedSignatures = new Set(allRanked.map(v => `${v.brand}-${v.model}-${v.year}`.toLowerCase()));

  const unranked = vehicles
    .filter(v => {
      if (rankedIds.has(v.id)) return false;

      const sig = `${v.brand}-${v.model}-${v.year}`.toLowerCase();
      if (rankedSignatures.has(sig)) return false;

      return true;
    })
    .map(v => ({ ...v, matchPercentage: 0, reasons: [] }));

  return {
    query_type: QueryType.SUBJECTIVE_PREFERENCE,
    total_matches: vehicles.length,
    top_recommendations: {
      vehicles: top3,
      explanation: `Recomendaciones basadas en: "${intent.subjective_context || intent.original_query}"`
    },
    all_matches: {
      vehicles: [...rankedothers, ...unranked], // Ranked others first, then the rest
      filters_applied: ['Análisis subjetivo IA']
    },
    processing_time_ms: Date.now() - startTime,
    confidence: intent.confidence,
    original_query: intent.original_query
  };
}

// ============================================================================
// OBJECTIVE QUERY: Strict Database Filtering
// ============================================================================
async function processObjectiveQuery(intent: CategorizedIntent, startTime: number): Promise<ProcessedResults> {
  const whereRaw = buildObjectiveWhereClause(intent);

  // Clean up where clause
  const where: any = {};
  if (whereRaw.brand) where.brand = whereRaw.brand;
  if (whereRaw.type) where.type = whereRaw.type;
  if (whereRaw.fuelType) where.fuelType = whereRaw.fuelType;
  if (whereRaw.year) where.year = whereRaw.year;
  if (whereRaw.price) where.price = whereRaw.price;
  if (whereRaw.transmission) where.transmission = whereRaw.transmission;
  if (whereRaw.doors) where.doors = whereRaw.doors;
  if (whereRaw.seats) where.seats = whereRaw.seats;

  const vehicles = await prisma.vehicle.findMany({
    where,
    include: {
      images: {
        take: 1,
        select: {
          id: true,
          type: true,
          order: true,
          isThumbnail: true
        }
      }
    },
    take: 100
  });

  const formattedVehicles = vehicles.map(v => ({
    id: v.id,
    brand: v.brand,
    model: v.model,
    year: v.year,
    price: v.price,
    fuelType: v.fuelType,
    type: v.type,
    imageUrl: `/api/vehicles/${v.id}/image?index=0`,
    matchPercentage: 100,
    reasons: ['Coincide con tus filtros']
  }));

  return {
    query_type: QueryType.OBJECTIVE_FEATURE,
    total_matches: vehicles.length,
    all_matches: {
      vehicles: formattedVehicles,
      filters_applied: Object.keys(where)
    },
    processing_time_ms: Date.now() - startTime,
    confidence: intent.confidence,
    original_query: intent.original_query
  };
}

// ============================================================================
// HYBRID QUERY: Filter (Objective) -> Rank (Subjective)
// ============================================================================
async function processHybridQuery(intent: CategorizedIntent, startTime: number): Promise<ProcessedResults> {
  // 1. Apply Objective Filters 
  const whereRaw = buildObjectiveWhereClause(intent);
  const where: any = {};
  if (whereRaw.brand) where.brand = whereRaw.brand;
  if (whereRaw.type) where.type = whereRaw.type;
  if (whereRaw.fuelType) where.fuelType = whereRaw.fuelType;
  if (whereRaw.year) where.year = whereRaw.year;
  if (whereRaw.price) where.price = whereRaw.price;
  if (whereRaw.transmission) where.transmission = whereRaw.transmission;
  if (whereRaw.doors) where.doors = whereRaw.doors;
  if (whereRaw.seats) where.seats = whereRaw.seats;

  const vehicles = await prisma.vehicle.findMany({
    where,
    include: {
      images: {
        take: 1,
        select: {
          id: true,
          type: true,
          order: true,
          isThumbnail: true
        }
      }
    },
    take: 100
  });

  const marketStats = await getMarketStats();

  // 2. Prepare candidates
  const candidates: ScoredCandidate[] = vehicles.map(v => {
    const features = computeVehicleFeatures(v, marketStats);
    const tags = generateVehicleTags(v, features);
    return {
      id: v.id,
      brand: v.brand,
      model: v.model,
      year: v.year,
      price: v.price,
      fuelType: v.fuelType,
      type: v.type,
      vehicleType: v.vehicleType || 'Unknown',
      imageUrl: `/api/vehicles/${v.id}/image?index=0`,
      score: 0,
      features,
      tags
    };
  });

  // 3. Rank utilizing Subjective Context
  // 3. Rank utilizing Subjective Context
  let allRanked: any[] = [];
  if (candidates.length > 0) {
    const rawRecommended = await rerankWithLLM(
      candidates,
      intent.subjective_context || intent.original_query,
      intent.original_query
    );

    // Flatten structure for frontend
    allRanked = rawRecommended.map(rec => ({
      ...rec.vehicle,
      matchPercentage: rec.match,
      reasons: rec.reasons
    }));
  }

  // Split Top 3 vs Others
  const top3 = allRanked.slice(0, 3);
  const rankedOthers = allRanked.slice(3);

  // Filter out recommended vehicles from all_matches to avoid duplication
  // ALSO Filter out "Visual Duplicates" (same Brand + Model + Year)
  const rankedIds = new Set(allRanked.map(r => r.id));
  const rankedSignatures = new Set(allRanked.map(v => `${v.brand}-${v.model}-${v.year}`.toLowerCase()));

  const remainingVehicles = vehicles
    .filter(v => {
      if (rankedIds.has(v.id)) return false;

      const sig = `${v.brand}-${v.model}-${v.year}`.toLowerCase();
      if (rankedSignatures.has(sig)) return false;

      return true;
    })
    .map(v => ({ ...v, matchPercentage: 0 }));

  return {
    query_type: QueryType.HYBRID,
    total_matches: vehicles.length,
    top_recommendations: {
      vehicles: top3,
      explanation: `Filtros: ${Object.keys(where).join(', ')} | Ranking IA: "${intent.subjective_context}"`
    },
    all_matches: {
      vehicles: [...rankedOthers, ...remainingVehicles],
      filters_applied: Object.keys(where)
    },
    processing_time_ms: Date.now() - startTime,
    confidence: intent.confidence,
    original_query: intent.original_query
  };
}

// Helper: Build Prisma Where Clause from Objective Filters
function buildObjectiveWhereClause(intent: CategorizedIntent): any {
  const where: any = {};
  const filters = intent.objective_filters;
  if (!filters) return where;

  if (filters.brands && filters.brands.length > 0) {
    where.brand = { in: filters.brands };
  }

  if (filters.body_types && filters.body_types.length > 0) {
    where.type = { in: filters.body_types };
  }

  if (filters.fuel_types && filters.fuel_types.length > 0) {
    where.fuelType = { in: filters.fuel_types };
  }

  if (filters.year_range) {
    const { min, max } = filters.year_range;
    if (min && max && min === max) {
      where.year = { equals: min };
    } else {
      if (min) where.year = { ...where.year, gte: min };
      if (max) where.year = { ...where.year, lte: max };
    }
  }

  if (filters.price_range) {
    const { min, max } = filters.price_range;
    if (min) where.price = { ...where.price, gte: min };
    if (max) where.price = { ...where.price, lte: max };
  }

  if (filters.door_count) where.doors = { equals: filters.door_count };
  if (filters.seat_count) where.seats = { equals: filters.seat_count };

  // Filter by technical features (Turbo, 4x4, etc.) in the specifications JSON string
  if (filters.features && filters.features.length > 0) {
    where.AND = filters.features.map((feature: string) => ({
      specifications: {
        contains: feature,
        mode: 'insensitive'
      }
    }));
  }

  return where;
}
