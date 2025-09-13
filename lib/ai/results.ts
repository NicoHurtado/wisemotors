// Advanced Result Processing for Different Query Types
import { prisma } from '@/lib/prisma';
import { CategorizedIntent, QueryType } from './categorization';
import { computeVehicleFeatures, getMarketStats, generateVehicleTags } from './features';
import { getValidImageUrl, createImagePlaceholder } from '@/lib/utils/imageUtils';

export interface VehicleResult {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  fuelType: string;
  type: string;
  imageUrl: string | null;
  affinity?: number; // For subjective rankings (0-100)
  reasons?: string[]; // For subjective rankings
  tags?: string[];
}

export interface ProcessedResults {
  query_type: QueryType;
  total_matches: number;
  
  // For SUBJECTIVE_PREFERENCE and HYBRID
  top_recommendations?: {
    vehicles: VehicleResult[];
    explanation: string;
  };
  
  // For OBJECTIVE_FEATURE and HYBRID  
  all_matches?: {
    vehicles: VehicleResult[];
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

// Process subjective preference queries (show top 3 + more with affinity)
async function processSubjectiveQuery(intent: CategorizedIntent, startTime: number): Promise<ProcessedResults> {
  // Get all vehicles for subjective ranking
  const vehicles = await prisma.vehicle.findMany({
    include: {
      images: {
        orderBy: { order: 'asc' },
        take: 1
      }
    },
    take: 50 // Limit for performance
  });

  const marketStats = await getMarketStats();
  
  // Compute features and affinity scores
  const vehiclesWithAffinity = vehicles.map(vehicle => {
    const features = computeVehicleFeatures(vehicle, marketStats);
    const tags = generateVehicleTags(vehicle, features);
    const affinity = calculateSubjectiveAffinity(vehicle, features, intent);
    
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
      type: vehicle.type,
      imageUrl: finalImageUrl,
      affinity: Math.round(affinity * 100),
      tags,
      features
    };
  });

  // Sort by affinity
  vehiclesWithAffinity.sort((a, b) => (b.affinity || 0) - (a.affinity || 0));
  
  // Generate reasons for top 3
  const top3WithReasons = vehiclesWithAffinity.slice(0, 3).map((vehicle, index) => ({
    ...vehicle,
    reasons: generateSubjectiveReasons(vehicle, intent, index + 1)
  }));

  return {
    query_type: QueryType.SUBJECTIVE_PREFERENCE,
    total_matches: vehiclesWithAffinity.length,
    top_recommendations: {
      vehicles: top3WithReasons,
      explanation: generateSubjectiveExplanation(intent)
    },
    all_matches: {
      vehicles: vehiclesWithAffinity.slice(3), // Rest of vehicles for "more options"
      filters_applied: ['Ranking por afinidad basado en preferencias'],
      count_by_category: generateCategoryCount(vehiclesWithAffinity)
    },
    processing_time_ms: Date.now() - startTime,
    confidence: intent.confidence,
    original_query: intent.original_query
  };
}

// Process objective feature queries (show all matches)
async function processObjectiveQuery(intent: CategorizedIntent, startTime: number): Promise<ProcessedResults> {
  const where = buildObjectiveWhereClause(intent);
  const filtersApplied = buildFiltersDescription(intent);
  
  const vehicles = await prisma.vehicle.findMany({
    where,
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
    ]
  });

  const vehicleResults = vehicles.map(vehicle => {
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
      type: vehicle.type,
      imageUrl: finalImageUrl
    };
  });

  return {
    query_type: QueryType.OBJECTIVE_FEATURE,
    total_matches: vehicles.length,
    all_matches: {
      vehicles: vehicleResults,
      filters_applied: filtersApplied,
      count_by_category: generateCategoryCount(vehicleResults)
    },
    processing_time_ms: Date.now() - startTime,
    confidence: intent.confidence,
    original_query: intent.original_query
  };
}

// Process hybrid queries (objective filters + subjective ranking)
async function processHybridQuery(intent: CategorizedIntent, startTime: number): Promise<ProcessedResults> {
  const where = buildObjectiveWhereClause(intent);
  const filtersApplied = buildFiltersDescription(intent);
  
  const vehicles = await prisma.vehicle.findMany({
    where,
    include: {
      images: {
        orderBy: { order: 'asc' },
        take: 1
      }
    }
  });

  if (vehicles.length === 0) {
    return {
      query_type: QueryType.HYBRID,
      total_matches: 0,
      all_matches: {
        vehicles: [],
        filters_applied: filtersApplied,
        count_by_category: {}
      },
      processing_time_ms: Date.now() - startTime,
      confidence: intent.confidence,
      original_query: intent.original_query
    };
  }

  const marketStats = await getMarketStats();
  
  // Apply subjective ranking to filtered results
  const vehiclesWithAffinity = vehicles.map(vehicle => {
    const features = computeVehicleFeatures(vehicle, marketStats);
    const tags = generateVehicleTags(vehicle, features);
    const affinity = calculateSubjectiveAffinity(vehicle, features, intent);
    
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
      type: vehicle.type,
      imageUrl: finalImageUrl,
      affinity: Math.round(affinity * 100),
      tags,
      features
    };
  });

  // Sort by affinity
  vehiclesWithAffinity.sort((a, b) => (b.affinity || 0) - (a.affinity || 0));
  
  // Top 3 with reasons
  const top3WithReasons = vehiclesWithAffinity.slice(0, 3).map((vehicle, index) => ({
    ...vehicle,
    reasons: generateSubjectiveReasons(vehicle, intent, index + 1)
  }));

  return {
    query_type: QueryType.HYBRID,
    total_matches: vehicles.length,
    top_recommendations: {
      vehicles: top3WithReasons,
      explanation: generateHybridExplanation(intent, filtersApplied)
    },
    all_matches: {
      vehicles: vehiclesWithAffinity.slice(3),
      filters_applied: filtersApplied,
      count_by_category: generateCategoryCount(vehiclesWithAffinity)
    },
    processing_time_ms: Date.now() - startTime,
    confidence: intent.confidence,
    original_query: intent.original_query
  };
}

// Build WHERE clause for objective filtering
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
  
  if (filters.price_range) {
    where.price = {};
    if (filters.price_range.min) where.price.gte = filters.price_range.min;
    if (filters.price_range.max) where.price.lte = filters.price_range.max;
  }
  
  if (filters.year_range) {
    where.year = {};
    if (filters.year_range.min) where.year.gte = filters.year_range.min;
    if (filters.year_range.max) where.year.lte = filters.year_range.max;
  }
  
  // TODO: Add support for doors, seats, features when database schema supports it
  
  return where;
}

// Build human-readable description of applied filters
function buildFiltersDescription(intent: CategorizedIntent): string[] {
  const filters = intent.objective_filters;
  const descriptions: string[] = [];
  
  if (!filters) return descriptions;
  
  if (filters.brands && filters.brands.length > 0) {
    descriptions.push(`Marca: ${filters.brands.join(', ')}`);
  }
  
  if (filters.body_types && filters.body_types.length > 0) {
    descriptions.push(`Tipo: ${filters.body_types.join(', ')}`);
  }
  
  if (filters.fuel_types && filters.fuel_types.length > 0) {
    descriptions.push(`Combustible: ${filters.fuel_types.join(', ')}`);
  }
  
  if (filters.price_range) {
    const min = filters.price_range.min ? `$${(filters.price_range.min / 1000000).toFixed(1)}M` : '';
    const max = filters.price_range.max ? `$${(filters.price_range.max / 1000000).toFixed(1)}M` : '';
    if (min && max) {
      descriptions.push(`Precio: ${min} - ${max}`);
    } else if (min) {
      descriptions.push(`Precio mínimo: ${min}`);
    } else if (max) {
      descriptions.push(`Precio máximo: ${max}`);
    }
  }
  
  if (filters.door_count) {
    descriptions.push(`${filters.door_count} puertas`);
  }
  
  if (filters.seat_count) {
    descriptions.push(`${filters.seat_count} asientos`);
  }
  
  return descriptions;
}

// Calculate subjective affinity score
function calculateSubjectiveAffinity(vehicle: any, features: any, intent: CategorizedIntent): number {
  const weights = intent.subjective_weights;
  if (!weights) return 0.5; // Default neutral score
  
  let score = 0;
  let totalWeight = 0;
  
  Object.entries(weights).forEach(([key, weight]) => {
    if (weight > 0) {
      totalWeight += weight;
      
      switch (key) {
        case 'beauty':
          score += weight * calculateBeautyScore(vehicle, features);
          break;
        case 'family_friendly':
          score += weight * calculateFamilyScore(vehicle, features);
          break;
        case 'sportiness':
          score += weight * features.performance_score;
          break;
        case 'luxury':
          score += weight * features.prestige_norm;
          break;
        case 'reliability':
          score += weight * features.reliability_norm;
          break;
        case 'efficiency':
          score += weight * features.efficiency_norm;
          break;
        case 'practicality':
          score += weight * calculatePracticalityScore(vehicle, features);
          break;
        case 'status':
          score += weight * features.prestige_norm;
          break;
        case 'comfort':
          score += weight * features.comfort_norm;
          break;
        case 'safety':
          score += weight * features.safety_norm;
          break;
      }
    }
  });
  
  return totalWeight > 0 ? score / totalWeight : 0.5;
}

// Helper functions for subjective scoring
function calculateBeautyScore(vehicle: any, features: any): number {
  // Beauty is subjective, but we can use some heuristics
  let score = 0.5;
  
  // Newer cars tend to be more modern/beautiful
  const ageScore = Math.max(0, Math.min(1, (vehicle.year - 2010) / 14));
  score += ageScore * 0.3;
  
  // Deportivos and convertibles are generally considered more beautiful
  if (vehicle.type === 'Deportivo') score += 0.3;
  if (vehicle.type === 'Convertible') score += 0.2;
  
  // Higher-end vehicles tend to have better design
  score += features.prestige_norm * 0.2;
  
  return Math.max(0, Math.min(1, score));
}

function calculateFamilyScore(vehicle: any, features: any): number {
  let score = features.comfort_norm * 0.4 + features.safety_norm * 0.4;
  
  // SUVs and sedans are more family-friendly
  if (vehicle.type === 'SUV') score += 0.2;
  if (vehicle.type === 'Sedán') score += 0.1;
  if (vehicle.type === 'Deportivo') score -= 0.2;
  
  return Math.max(0, Math.min(1, score));
}

function calculatePracticalityScore(vehicle: any, features: any): number {
  let score = features.urban_score * 0.4 + features.efficiency_norm * 0.3;
  
  // Practical vehicle types
  if (vehicle.type === 'Hatchback') score += 0.2;
  if (vehicle.type === 'SUV') score += 0.1;
  if (vehicle.type === 'Pickup') score += 0.15;
  if (vehicle.type === 'Deportivo') score -= 0.1;
  
  return Math.max(0, Math.min(1, score));
}

// Generate reasons for subjective recommendations
function generateSubjectiveReasons(vehicle: any, intent: CategorizedIntent, rank: number): string[] {
  const reasons: string[] = [];
  const weights = intent.subjective_weights || {};
  
  // Find top 2 weighted criteria
  const topCriteria = Object.entries(weights)
    .filter(([_, weight]) => weight > 0.3)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 2);
  
  topCriteria.forEach(([criteria, weight]) => {
    switch (criteria) {
      case 'beauty':
        if (vehicle.type === 'Deportivo') reasons.push('Diseño deportivo y atractivo');
        else if (vehicle.year >= 2020) reasons.push('Diseño moderno y elegante');
        else reasons.push('Estética atractiva para su categoría');
        break;
      case 'family_friendly':
        if (vehicle.type === 'SUV') reasons.push('Amplio espacio para toda la familia');
        else reasons.push('Cómodo y seguro para uso familiar');
        break;
      case 'sportiness':
        reasons.push('Excelente rendimiento deportivo');
        break;
      case 'luxury':
        reasons.push('Características premium y acabados de lujo');
        break;
      case 'efficiency':
        reasons.push('Excelente eficiencia de combustible');
        break;
    }
  });
  
  // Add a ranking-specific reason
  if (rank === 1) {
    reasons.unshift('Mejor coincidencia general para tus preferencias');
  }
  
  return reasons.slice(0, 3);
}

// Generate explanations
function generateSubjectiveExplanation(intent: CategorizedIntent): string {
  const topWeights = Object.entries(intent.subjective_weights || {})
    .filter(([_, weight]) => weight > 0.3)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 2)
    .map(([key, _]) => key);
  
  return `Vehículos rankeados por ${topWeights.join(' y ')} según tus preferencias`;
}

function generateHybridExplanation(intent: CategorizedIntent, filters: string[]): string {
  return `Filtrado por ${filters.join(', ')} y rankeado por preferencias`;
}

// Generate category counts for filtering UI
function generateCategoryCount(vehicles: VehicleResult[]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  // Count by brand
  vehicles.forEach(v => {
    const brandKey = `brand_${v.brand}`;
    counts[brandKey] = (counts[brandKey] || 0) + 1;
  });
  
  // Count by type
  vehicles.forEach(v => {
    const typeKey = `type_${v.type}`;
    counts[typeKey] = (counts[typeKey] || 0) + 1;
  });
  
  // Count by fuel type
  vehicles.forEach(v => {
    const fuelKey = `fuel_${v.fuelType}`;
    counts[fuelKey] = (counts[fuelKey] || 0) + 1;
  });
  
  return counts;
}
