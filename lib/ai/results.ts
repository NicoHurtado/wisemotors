// Advanced Result Processing for Different Query Types
import { prisma } from '@/lib/prisma';
import { CategorizedIntent, QueryType } from './categorization';
import { computeVehicleFeatures, getMarketStats, generateVehicleTags } from './features';
import { getValidImageUrl, createImagePlaceholder } from '@/lib/utils/imageUtils';

// Generic function to evaluate technical specifications filters
function evaluateTechnicalFilter(specs: any, filter: any): boolean {
  try {
    if (!filter || !filter.field_path || !filter.operator || filter.value === undefined) {
      return false;
    }
    
    // Get the actual value from specs using the field path
    const actualValue = getValueByPath(specs, filter.field_path);
    
    if (actualValue === null || actualValue === undefined) {
      return false; // If field doesn't exist, filter doesn't match
    }
    
    // Apply the operator
    switch (filter.operator) {
      case 'equals':
        return actualValue === filter.value;
      
      case 'greater_than':
        return typeof actualValue === 'number' && typeof filter.value === 'number' && 
               actualValue > filter.value;
      
      case 'less_than':
        return typeof actualValue === 'number' && typeof filter.value === 'number' && 
               actualValue < filter.value;
      
      case 'greater_equal':
        return typeof actualValue === 'number' && typeof filter.value === 'number' && 
               actualValue >= filter.value;
      
      case 'less_equal':
        return typeof actualValue === 'number' && typeof filter.value === 'number' && 
               actualValue <= filter.value;
      
      case 'contains':
        return typeof actualValue === 'string' && typeof filter.value === 'string' && 
               actualValue.toLowerCase().includes(filter.value.toLowerCase());
      
      default:
        return false;
    }
  } catch (error) {
    console.error('Error evaluating technical filter:', error, filter);
    return false;
  }
}

// Helper function to get nested values by path (e.g., "performance.acceleration0to100")
// Función para calcular porcentaje de coincidencia en búsquedas objetivas
function calculateObjectiveMatchPercentage(vehicle: any, intent: CategorizedIntent): number {
  if (!intent.objective_filters && !intent.subjective_weights) return 100;
  
  let totalCriteria = 0;
  let matchedCriteria = 0;
  
  // Evaluar filtros duros
  if (intent.objective_filters) {
    const filters = intent.objective_filters;
    
    if (filters.brands && filters.brands.length > 0) {
      totalCriteria++;
      if (filters.brands.includes(vehicle.brand)) {
        matchedCriteria++;
      }
    }
    
    if (filters.body_types && filters.body_types.length > 0) {
      totalCriteria++;
      if (filters.body_types.includes(vehicle.type)) {
        matchedCriteria++;
      }
    }
    
    if (filters.fuel_types && filters.fuel_types.length > 0) {
      totalCriteria++;
      if (filters.fuel_types.includes(vehicle.fuelType)) {
        matchedCriteria++;
      }
    }
    
    if (filters.price_range) {
      totalCriteria++;
      const price = vehicle.price;
      const minOk = !filters.price_range.min || price >= filters.price_range.min;
      const maxOk = !filters.price_range.max || price <= filters.price_range.max;
      if (minOk && maxOk) {
        matchedCriteria++;
      } else if ((filters.price_range.min && price >= filters.price_range.min * 0.9) || 
                 (filters.price_range.max && price <= filters.price_range.max * 1.1)) {
        matchedCriteria += 0.7; // Coincidencia parcial para precios cercanos
      }
    }
    
    if (filters.year_range && filters.year_range.min) {
      totalCriteria++;
      if (vehicle.year >= filters.year_range.min) {
        matchedCriteria++;
      } else if (vehicle.year >= filters.year_range.min - 2) {
        matchedCriteria += 0.5; // Coincidencia parcial para años cercanos
      }
    }
  }
  
  // Si no hay criterios específicos, asumir coincidencia por búsqueda textual
  if (totalCriteria === 0) {
    return 85; // Coincidencia general para búsquedas amplias
  }
  
  const percentage = Math.round((matchedCriteria / totalCriteria) * 100);
  return Math.max(50, Math.min(100, percentage)); // Mínimo 50%, máximo 100%
}

function getValueByPath(obj: any, path: string): any {
  try {
    if (!obj || !path) return null;
    
    // Handle multiple possible paths for engine-specific fields
    const enginePaths = getEngineSpecificPaths(path);
    
    for (const enginePath of enginePaths) {
      try {
        const value = enginePath.split('.').reduce((current, key) => {
          return current && current[key] !== undefined ? current[key] : null;
        }, obj);
        
        if (value !== null && value !== undefined) {
          // Convert string numbers to actual numbers
          if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
            return Number(value);
          }
          return value;
        }
      } catch (pathError) {
        continue; // Try next path if this one fails
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting value by path:', error, path);
    return null;
  }
}

// Generate all possible paths for engine-specific fields
function getEngineSpecificPaths(path: string): string[] {
  try {
    if (!path || typeof path !== 'string') return [path];
    
    const engineTypes = ['combustion', 'hybrid', 'phev', 'electric'];
    
    // Common fields that exist in multiple engine types
    const engineFields = [
      'maxPower', 'maxTorque', 'displacement', 'turbo', 'fuelTankCapacity', 
      'cityConsumption', 'highwayConsumption', 'transmissionType', 'gears'
    ];
    
    // If the path starts with an engine-specific field, generate all variants
    const fieldName = path.split('.').pop();
    if (fieldName && engineFields.includes(fieldName)) {
      const paths = [];
      // Add original path
      paths.push(path);
      // Add engine-specific variants
      for (const engineType of engineTypes) {
        paths.push(`${engineType}.${fieldName}`);
      }
      return paths;
    }
    
    // For non-engine fields, return as-is
    return [path];
  } catch (error) {
    console.error('Error generating engine specific paths:', error, path);
    return [path];
  }
}

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
  const technicalFilters = (where as any)._technicalFilters;
  const filtersApplied = buildFiltersDescription(intent);
  
  // Remove the technical filters from the where clause since we'll filter manually
  delete (where as any)._technicalFilters;
  
  let vehicles = await prisma.vehicle.findMany({
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
  
  // Apply technical specifications filtering if specified
  if (technicalFilters && technicalFilters.length > 0) {
    vehicles = vehicles.filter(vehicle => {
      try {
        const specs = vehicle.specifications ? JSON.parse(vehicle.specifications) : {};
        
        // Check all technical specifications
        return technicalFilters.every((filter: any) => {
          return evaluateTechnicalFilter(specs, filter);
        });
      } catch (error) {
        console.error('Error parsing vehicle specifications:', error);
        return false; // Skip vehicles with invalid specifications
      }
    });
  }
  
  // Si no hay resultados, aplicar fallback progresivo para búsquedas objetivas
  if (vehicles.length === 0) {
    // Intentar relajar algunos filtros de manera inteligente
    const relaxedWhere = { ...where };
    
    // Relajar filtros de precio si existen
    if (relaxedWhere.price) {
      if (relaxedWhere.price.lte) {
        relaxedWhere.price.lte = Math.floor(relaxedWhere.price.lte * 1.3);
      }
      if (relaxedWhere.price.gte) {
        relaxedWhere.price.gte = Math.floor(relaxedWhere.price.gte * 0.8);
      }
    }
    
    // Relajar filtro de año
    if (relaxedWhere.year && relaxedWhere.year.gte) {
      relaxedWhere.year.gte = Math.max(2010, relaxedWhere.year.gte - 3);
    }
    
    vehicles = await prisma.vehicle.findMany({
      where: relaxedWhere,
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
    
    // Si aún no hay resultados, eliminar algunos filtros opcionales
    if (vehicles.length === 0) {
      const finalWhere = { ...relaxedWhere };
      
      // Mantener solo filtros esenciales (marca, tipo de combustible si es muy específico)
      if (!finalWhere.brand && !finalWhere.fuelType) {
        // Si no hay marca ni combustible específico, eliminar tipo de carrocería
        delete finalWhere.type;
      }
      
      vehicles = await prisma.vehicle.findMany({
        where: finalWhere,
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
        take: 30
      });
    }
    
    // Último fallback: mostrar vehículos populares
    if (vehicles.length === 0) {
      vehicles = await prisma.vehicle.findMany({
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

  const vehicleResults = vehicles.map(vehicle => {
    const rawImageUrl = vehicle.images?.[0]?.url || null;
    const validImageUrl = getValidImageUrl(rawImageUrl);
    const finalImageUrl = validImageUrl || createImagePlaceholder(vehicle.brand, vehicle.model);
    
    // Calcular porcentaje de coincidencia para búsquedas objetivas
    const matchPercentage = calculateObjectiveMatchPercentage(vehicle, intent);
    
    return {
      id: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      price: vehicle.price,
      fuelType: vehicle.fuelType,
      type: vehicle.type,
      imageUrl: finalImageUrl,
      matchPercentage
    };
  });

  return {
    query_type: QueryType.OBJECTIVE_FEATURE,
    total_matches: vehicles.length,
    all_matches: {
      vehicles: vehicleResults,
      filters_applied: filtersApplied,
      count_by_category: generateCategoryCount(vehicleResults),
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
  
  // Technical specifications filtering
  if (filters.technical_specs && filters.technical_specs.length > 0) {
    // Store technical specifications for post-processing
    (where as any)._technicalFilters = filters.technical_specs;
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
  
  // Technical specifications
  if (filters.technical_specs && filters.technical_specs.length > 0) {
    filters.technical_specs.forEach(spec => {
      descriptions.push(spec.description);
    });
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
    .filter(([_, weight]) => (weight as number) > 0.3)
    .sort(([_, a], [__, b]) => (b as number) - (a as number))
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
    .filter(([_, weight]) => (weight as number) > 0.3)
    .sort(([_, a], [__, b]) => (b as number) - (a as number))
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
