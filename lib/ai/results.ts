// Advanced Result Processing for Different Query Types
import { prisma } from '@/lib/prisma';
import { CategorizedIntent, QueryType } from './categorization';
import { computeVehicleFeatures, getMarketStats, generateVehicleTags } from './features';
import { getValidImageUrl, createImagePlaceholder } from '@/lib/utils/imageUtils';

// Helper function to get nested values by path - moved before checkTurbo
function getValueByPathInternal(obj: any, path: string): any {
  try {
    if (!obj || !path) return null;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return null;
      }
    }
    
    return current !== undefined ? current : null;
  } catch (error) {
    return null;
  }
}

// Special handling for turbo field - checks alimentacion for "Turbo"
function checkTurbo(specs: any): boolean | null {
  if (!specs || typeof specs !== 'object') {
    return null;
  }
  
  // First, check powertrain.alimentacion for "Turbo", "Biturbo", etc.
  // This is the most common location in the actual database structure
  try {
    const alimentacion = specs.powertrain?.alimentacion;
    if (alimentacion && typeof alimentacion === 'string') {
      const alimentacionLower = alimentacion.toLowerCase().trim();
      // Check for turbo variations
      if (alimentacionLower.includes('turbo') || 
          alimentacionLower.includes('biturbo') || 
          alimentacionLower === 'turbo' ||
          alimentacionLower === 'biturbo') {
        return true;
      }
      // If alimentacion exists and has a value but doesn't mention turbo,
      // it's likely not turbo (e.g., "Atmosférico", "Naturalmente aspirado", etc.)
      // Return false to indicate "no turbo"
      if (alimentacionLower.length > 0) {
        return false;
      }
    }
  } catch (e) {
    // Continue to other checks
  }
  
  // Check direct turbo boolean fields in combustion, hybrid, phev, electric
  const turboPaths = [
    'combustion.turbo',
    'hybrid.turbo', 
    'phev.turbo', 
    'electric.turbo',
    'turbo' // Direct field (unlikely but possible)
  ];
  
  for (const path of turboPaths) {
    try {
      const parts = path.split('.');
      let value = specs;
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          value = undefined;
          break;
        }
      }
      
      if (value !== null && value !== undefined) {
        // If it's a boolean, use it directly
        if (typeof value === 'boolean') {
          return value;
        }
        // If it's a string that says "true" or "false", parse it
        if (typeof value === 'string') {
          const lower = value.toLowerCase().trim();
          if (lower === 'true' || lower === '1' || lower === 'yes' || lower === 'sí') {
            return true;
          }
          if (lower === 'false' || lower === '0' || lower === 'no') {
            return false;
          }
        }
      }
    } catch (e) {
      continue;
    }
  }
  
  // If no turbo info found at all, return null (unknown)
  return null;
}

// Generic function to evaluate technical specifications filters
function evaluateTechnicalFilter(specs: any, filter: any, vehicleInfo?: { brand?: string; model?: string }): { matches: boolean; reason?: string } {
  try {
    if (!filter || !filter.field_path || !filter.operator || filter.value === undefined) {
      return { matches: false, reason: 'Invalid filter' };
    }
    
    const vehicleStr = vehicleInfo ? `${vehicleInfo.brand} ${vehicleInfo.model}` : 'vehicle';
    
    // Special handling for turbo field
    if (filter.field_path === 'turbo' || filter.field_path.endsWith('.turbo')) {
      const hasTurbo = checkTurbo(specs);
      
      console.log(`[evaluateTechnicalFilter] ${vehicleStr} - Turbo check: hasTurbo=${hasTurbo}, filter=${filter.value} (${filter.operator})`);
      
      if (hasTurbo === null) {
        // Turbo info not found - behavior depends on the query
        // If asking for "con turbo" (equals true), exclude (we don't know if it has turbo)
        // If asking for "sin turbo" (equals false), include (we assume it doesn't have turbo if not specified)
        if (filter.operator === 'equals') {
          if (filter.value === true) {
            console.log(`[evaluateTechnicalFilter] ${vehicleStr} - Turbo info NOT FOUND, EXCLUDING (asked for "con turbo")`);
            return { matches: false, reason: 'Turbo information not found, cannot confirm it has turbo' };
          } else if (filter.value === false) {
            console.log(`[evaluateTechnicalFilter] ${vehicleStr} - Turbo info NOT FOUND, INCLUDING (asked for "sin turbo" - assuming no turbo)`);
            return { matches: true, reason: 'Turbo info not found, assuming no turbo for "sin turbo" query' };
          }
        }
        // For other operators, exclude if info not found
        return { matches: false, reason: 'Turbo information not found' };
      } else {
        // Turbo info found - check if it matches
        const matches = hasTurbo === filter.value;
        console.log(`[evaluateTechnicalFilter] ${vehicleStr} - Turbo: ${hasTurbo}, filter wants: ${filter.value}, MATCHES: ${matches}`);
        return { matches, reason: matches ? undefined : `Turbo ${hasTurbo} does not match ${filter.value}` };
      }
    }
    
    // Get the actual value from specs using the field path
    const actualValue = getValueByPath(specs, filter.field_path);
    
    // For boolean fields with equals false, if field doesn't exist, assume it's false (matches)
    if (actualValue === null || actualValue === undefined) {
      if (filter.operator === 'equals' && filter.value === false) {
        console.log(`[evaluateTechnicalFilter] ${vehicleStr} - Field "${filter.field_path}" not found, assuming false (matches "sin ${filter.field_path}")`);
        return { matches: true, reason: `Field not found, assuming false` };
      }
      
      // For other cases, exclude if field doesn't exist (strict filtering)
      console.log(`[evaluateTechnicalFilter] ${vehicleStr} - Field "${filter.field_path}" not found - EXCLUDING`);
      return { matches: false, reason: `Field ${filter.field_path} not found` };
    }
    
    // Apply the operator
    let matches = false;
    switch (filter.operator) {
      case 'equals':
        // For strings, do case-insensitive comparison
        if (typeof actualValue === 'string' && typeof filter.value === 'string') {
          matches = actualValue.toLowerCase() === filter.value.toLowerCase();
        } else {
          matches = actualValue === filter.value;
        }
        break;
      
      case 'greater_than':
        if (typeof actualValue === 'number' && typeof filter.value === 'number') {
          matches = actualValue > filter.value;
        } else {
          return { matches: false, reason: 'Type mismatch for greater_than' };
        }
        break;
      
      case 'less_than':
        if (typeof actualValue === 'number' && typeof filter.value === 'number') {
          matches = actualValue < filter.value;
        } else {
          return { matches: false, reason: 'Type mismatch for less_than' };
        }
        break;
      
      case 'greater_equal':
        if (typeof actualValue === 'number' && typeof filter.value === 'number') {
          matches = actualValue >= filter.value;
        } else {
          return { matches: false, reason: 'Type mismatch for greater_equal' };
        }
        break;
      
      case 'less_equal':
        if (typeof actualValue === 'number' && typeof filter.value === 'number') {
          matches = actualValue <= filter.value;
        } else {
          return { matches: false, reason: 'Type mismatch for less_equal' };
        }
        break;
      
      case 'contains':
        if (typeof actualValue === 'string' && typeof filter.value === 'string') {
          matches = actualValue.toLowerCase().includes(filter.value.toLowerCase());
        } else if (typeof actualValue === 'string' && typeof filter.value !== 'string') {
          // If filter.value is not a string, convert it
          matches = actualValue.toLowerCase().includes(String(filter.value).toLowerCase());
        } else {
          return { matches: false, reason: 'Type mismatch for contains' };
        }
        break;
      
      default:
        return { matches: false, reason: `Unknown operator: ${filter.operator}` };
    }
    
    if (!matches) {
      console.log(`[evaluateTechnicalFilter] ${vehicleStr} FAILED filter: ${filter.field_path} ${filter.operator} ${filter.value} (actual: ${actualValue})`);
    } else {
      console.log(`[evaluateTechnicalFilter] ${vehicleStr} PASSED filter: ${filter.field_path} ${filter.operator} ${filter.value} (actual: ${actualValue})`);
    }
    
    return { matches, reason: matches ? undefined : `Value ${actualValue} does not satisfy ${filter.operator} ${filter.value}` };
  } catch (error) {
    console.error('Error evaluating technical filter:', error, filter);
    return { matches: false, reason: `Error: ${error}` };
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
    if (!obj || !path) {
      console.log(`[getValueByPath] Invalid input - obj: ${!!obj}, path: ${path}`);
      return null;
    }
    
    // Handle multiple possible paths for engine-specific fields
    const enginePaths = getEngineSpecificPaths(path);
    
    for (const enginePath of enginePaths) {
      try {
        // Navigate through the object using the path
        const keys = enginePath.split('.');
        let current = obj;
        let found = true;
        
        for (const key of keys) {
          if (current && typeof current === 'object' && key in current) {
            current = current[key];
          } else {
            found = false;
            break;
          }
        }
        
        if (found && current !== null && current !== undefined) {
          // Convert string numbers to actual numbers
          if (typeof current === 'string' && !isNaN(Number(current)) && current.trim() !== '') {
            const numValue = Number(current);
            console.log(`[getValueByPath] Found "${path}" via "${enginePath}": "${current}" → ${numValue}`);
            return numValue;
          }
          console.log(`[getValueByPath] Found "${path}" via "${enginePath}": ${current} (type: ${typeof current})`);
          return current;
        }
      } catch (pathError) {
        // Try next path if this one fails
        continue;
      }
    }
    
    // Only log if we're debugging (reduce noise)
    // console.log(`[getValueByPath] Field "${path}" NOT FOUND in object. Tried paths:`, enginePaths);
    
    // Try to find similar keys (case-insensitive, partial match) - but only for non-critical searches
    if (obj && typeof obj === 'object') {
      const pathLower = path.toLowerCase();
      const lastKey = path.split('.').pop()?.toLowerCase();
      
      // Search recursively for similar keys (limited depth)
      const searchInObject = (o: any, depth: number = 0): any => {
        if (depth > 3) return null; // Limit depth to avoid infinite recursion
        if (!o || typeof o !== 'object') return null;
        
        for (const key in o) {
          const keyLower = key.toLowerCase();
          if (keyLower === lastKey || keyLower.includes(lastKey || '') || (lastKey && lastKey.includes(keyLower))) {
            return o[key];
          }
          if (typeof o[key] === 'object' && o[key] !== null) {
            const nested = searchInObject(o[key], depth + 1);
            if (nested !== null) return nested;
          }
        }
        return null;
      };
      
      const similarValue = searchInObject(obj);
      if (similarValue !== null) {
        console.log(`[getValueByPath] Found similar field for "${path}":`, similarValue);
        return similarValue;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting value by path:', error, path);
    return null;
  }
}

// Generate all possible paths for engine-specific fields
// Maps AI-generated paths to actual database structure
function getEngineSpecificPaths(path: string): string[] {
  try {
    if (!path || typeof path !== 'string') return [path];
    
    const paths: string[] = [];
    
    // Extract the field name (last part of the path)
    const pathParts = path.split('.');
    const fieldName = pathParts[pathParts.length - 1];
    
    // Map AI paths to actual database structure
    const fieldMappings: Record<string, string[]> = {
      // Turbo: puede estar en powertrain.alimentacion (como "Turbo") o en otros lugares
      'turbo': [
        'powertrain.alimentacion', // Buscar "Turbo" en alimentacion
        'combustion.turbo',
        'hybrid.turbo',
        'phev.turbo',
        'electric.turbo',
      ],
      // Potencia: está en powertrain.potenciaMaxMotorTermico o potenciaMaxSistemaHibrido
      'maxPower': [
        'powertrain.potenciaMaxMotorTermico',
        'powertrain.potenciaMaxSistemaHibrido',
        'powertrain.potenciaMaxEV',
        'combustion.maxPower',
        'hybrid.maxPower',
        'phev.maxPower',
        'electric.maxPower',
      ],
      // Torque: está en powertrain.torqueMaxMotorTermico
      'maxTorque': [
        'powertrain.torqueMaxMotorTermico',
        'powertrain.torqueMaxSistemaHibrido',
        'powertrain.torqueMaxEV',
        'combustion.maxTorque',
        'hybrid.maxTorque',
        'phev.maxTorque',
        'electric.maxTorque',
      ],
      // Cilindraje: está en powertrain.cilindrada
      'displacement': [
        'powertrain.cilindrada',
        'combustion.displacement',
        'hybrid.displacement',
        'phev.displacement',
      ],
      // Capacidad tanque: está en efficiency.capacidadTanque
      'fuelTankCapacity': [
        'efficiency.capacidadTanque',
        'combustion.fuelTankCapacity',
        'hybrid.fuelTankCapacity',
        'phev.fuelTankCapacity',
      ],
      // Consumo: está en efficiency.consumoCiudad, consumoCarretera, consumoMixto
      'cityConsumption': [
        'efficiency.consumoCiudad',
        'efficiency.consumoMixto', // Fallback a mixto si no hay ciudad
        'combustion.cityConsumption',
        'hybrid.cityConsumption',
        'phev.cityConsumption',
      ],
      'highwayConsumption': [
        'efficiency.consumoCarretera',
        'efficiency.consumoMixto', // Fallback a mixto si no hay carretera
        'combustion.highwayConsumption',
        'hybrid.highwayConsumption',
        'phev.highwayConsumption',
      ],
    };
    
    // Check if we have a mapping for this field
    if (fieldMappings[fieldName]) {
      // Add all mapped paths
      paths.push(...fieldMappings[fieldName]);
      // Also add original path in case it's already correct
      if (!paths.includes(path)) {
        paths.unshift(path);
      }
    } else {
      // For other fields, try common paths
      paths.push(path);
      
      // Performance fields are usually in performance.*
      if (path.includes('acceleration') || path.includes('maxSpeed') || path.includes('quarterMile')) {
        if (!path.startsWith('performance.')) {
          paths.push(`performance.${fieldName}`);
        }
      }
      
      // Dimension fields are usually in dimensions.*
      if (path.includes('Weight') || path.includes('weight') || path.includes('length') || path.includes('width') || path.includes('height')) {
        if (!path.startsWith('dimensions.')) {
          paths.push(`dimensions.${fieldName}`);
        }
      }
    }
    
    console.log(`[getEngineSpecificPaths] Generated paths for "${path}":`, paths);
    return paths;
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
  
  // Generate reasons for top 3 - pasar features para validación
  const top3WithReasons = vehiclesWithAffinity.slice(0, 3).map((vehicle, index) => ({
    ...vehicle,
    reasons: generateSubjectiveReasons(vehicle, intent, index + 1, vehicle.features)
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
  const whereRaw = await buildObjectiveWhereClause(intent);
  const technicalFilters = (whereRaw as any)._technicalFilters;
  const exactYear = (whereRaw as any)._exactYear; // Store exact year for strict filtering logic
  const filtersApplied = buildFiltersDescription(intent);
  
  // Create a clean where clause without metadata fields (they're not valid Prisma fields)
  // IMPORTANT: Create a new object to avoid passing metadata to Prisma
  const where: any = {};
  if (whereRaw.brand) where.brand = whereRaw.brand;
  if (whereRaw.type) where.type = whereRaw.type;
  if (whereRaw.fuelType) where.fuelType = whereRaw.fuelType;
  if (whereRaw.year) where.year = whereRaw.year;
  if (whereRaw.price) where.price = whereRaw.price;
  // Do NOT copy _technicalFilters or _exactYear - these are metadata only
  
  console.log(`[processObjectiveQuery] WHERE clause (clean):`, JSON.stringify(where, null, 2));
  console.log(`[processObjectiveQuery] Exact year: ${exactYear || 'none'}`);
  console.log(`[processObjectiveQuery] Technical filters:`, technicalFilters ? technicalFilters.map((f: any) => `${f.field_path} ${f.operator} ${f.value}`) : 'none');
  
  // Check if WHERE clause is empty (no basic filters - only technical filters)
  const hasBasicFilters = Object.keys(where).length > 0;
  
  // IMPORTANT: If we only have technical filters (no basic filters like brand/type/fuelType),
  // we need to get ALL vehicles first, then filter by technical specs
  // For example: "con turbo" or "sin turbo" should search ALL vehicles, not just specific ones
  let vehicles = await prisma.vehicle.findMany({
    where: hasBasicFilters ? where : undefined, // If no basic filters, get all vehicles
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
    // If no basic filters, we might have many vehicles - limit for performance when filtering by technical specs
    // But make sure we get enough to filter properly
    ...(hasBasicFilters ? {} : { 
      take: technicalFilters && technicalFilters.length > 0 ? 1000 : 500 // More vehicles if we have technical filters
    })
  });
  
  console.log(`[processObjectiveQuery] Found ${vehicles.length} vehicles before technical filters (hasBasicFilters: ${hasBasicFilters}, technicalFilters: ${technicalFilters?.length || 0})`);
  
  // CRITICAL FIX: If we have 0 vehicles before technical filters AND we have technical filters,
  // it means the basic WHERE clause filtered everything out. This shouldn't happen if we only
  // have technical filters (no basic filters), but if we have both, it's possible.
  if (vehicles.length === 0 && hasBasicFilters && technicalFilters && technicalFilters.length > 0) {
    console.log(`[processObjectiveQuery] WARNING: 0 vehicles found with basic filters, but technical filters exist. Basic filters may be too strict.`);
  }
  
  // Apply technical specifications filtering if specified
  if (technicalFilters && technicalFilters.length > 0) {
    console.log(`[processObjectiveQuery] Applying ${technicalFilters.length} technical filters:`, technicalFilters.map((f: any) => `${f.field_path} ${f.operator} ${f.value} (${f.description})`));
    
    const vehiclesBeforeTechFilter = vehicles.length;
    const filterStats = {
      passed: 0,
      failed: 0,
      errors: 0
    };
    
    vehicles = vehicles.filter(vehicle => {
      try {
        const specs = vehicle.specifications ? JSON.parse(vehicle.specifications) : {};
        
        // Check all technical specifications - ALL must match
        const filterResults = technicalFilters.map((filter: any) => {
          return evaluateTechnicalFilter(specs, filter, { brand: vehicle.brand, model: vehicle.model });
        });
        
        const allMatch = filterResults.every(result => result.matches);
        
        if (allMatch) {
          filterStats.passed++;
        } else {
          filterStats.failed++;
          const failedFilters = filterResults
            .map((result, index) => !result.matches ? technicalFilters[index].description : null)
            .filter(Boolean);
          console.log(`[processObjectiveQuery] EXCLUDING ${vehicle.brand} ${vehicle.model} - Failed: ${failedFilters.join(', ')}`);
        }
        
        return allMatch;
      } catch (error) {
        filterStats.errors++;
        console.error(`[processObjectiveQuery] Error parsing specifications for ${vehicle.brand} ${vehicle.model}:`, error);
        // For errors, exclude the vehicle to be safe
        return false;
      }
    });
    
    const vehiclesAfterTechFilter = vehicles.length;
    console.log(`[processObjectiveQuery] Technical filters applied: ${vehiclesBeforeTechFilter} → ${vehiclesAfterTechFilter} vehicles`);
    console.log(`[processObjectiveQuery] Filter stats: ${filterStats.passed} passed, ${filterStats.failed} failed, ${filterStats.errors} errors`);
    
    // Debug: Si no hay resultados, muestrar algunos ejemplos de specs para entender qué está pasando
    if (vehicles.length === 0 && vehiclesBeforeTechFilter > 0) {
      console.log(`[processObjectiveQuery] ⚠️ DEBUG: No vehicles passed technical filters. Checking first ${Math.min(3, vehiclesBeforeTechFilter)} vehicles:`);
      try {
        // Get vehicles that were filtered out to see why
        const sampleVehicles = await prisma.vehicle.findMany({
          where: hasBasicFilters ? where : undefined,
          select: { brand: true, model: true, fuelType: true, specifications: true },
          take: Math.min(3, vehiclesBeforeTechFilter)
        });
        
        for (const sampleVehicle of sampleVehicles) {
          const sampleSpecs = sampleVehicle.specifications ? JSON.parse(sampleVehicle.specifications) : {};
          console.log(`[processObjectiveQuery] Sample: ${sampleVehicle.brand} ${sampleVehicle.model} (${sampleVehicle.fuelType})`);
          console.log(`[processObjectiveQuery]   - Specs keys:`, Object.keys(sampleSpecs));
          console.log(`[processObjectiveQuery]   - powertrain:`, sampleSpecs.powertrain ? JSON.stringify(sampleSpecs.powertrain, null, 2) : 'MISSING');
          console.log(`[processObjectiveQuery]   - performance:`, sampleSpecs.performance ? JSON.stringify(sampleSpecs.performance, null, 2) : 'MISSING');
          
          // Test the filters on this vehicle
          if (technicalFilters) {
            technicalFilters.forEach((filter: any) => {
              const result = evaluateTechnicalFilter(sampleSpecs, filter, { brand: sampleVehicle.brand, model: sampleVehicle.model });
              console.log(`[processObjectiveQuery]   - Filter "${filter.description}": ${result.matches ? 'PASSED' : 'FAILED'} - ${result.reason || 'OK'}`);
            });
          }
        }
      } catch (debugError) {
        console.error(`[processObjectiveQuery] Error in debug:`, debugError);
      }
    }
  }
  
  // Identificar filtros estrictos que NO deben ser relajados
  // Filtros estrictos = valores exactos o muy específicos que el usuario pidió explícitamente
  const strictFilters = {
    exactYear: !!exactYear, // Año exacto (ej: "2025" = año 2025 exacto) - viene de buildObjectiveWhereClause
    exactFuelType: false, // Tipo de combustible específico
    exactBrand: false, // Marca específica
    exactBodyType: false, // Tipo de carrocería específico
    technicalSpecs: false // Especificaciones técnicas
  };
  
  // Si tenemos exactYear de buildObjectiveWhereClause, usarlo
  if (exactYear) {
    console.log(`[processObjectiveQuery] Detected EXACT year filter: ${exactYear} - will NOT relax`);
  } else if (where.year && where.year.gte && where.year.lte && where.year.gte === where.year.lte) {
    // Fallback: detectar año exacto desde where clause
    strictFilters.exactYear = true;
    console.log(`[processObjectiveQuery] Detected EXACT year filter from WHERE: ${where.year.gte} - will NOT relax`);
  }
  
  // Detectar filtros estrictos de otros campos
  if (where.fuelType) strictFilters.exactFuelType = true;
  if (where.brand) strictFilters.exactBrand = true;
  if (where.type) strictFilters.exactBodyType = true;
  if (technicalFilters && technicalFilters.length > 0) strictFilters.technicalSpecs = true;
  
  const hasTechnicalFilters = technicalFilters && technicalFilters.length > 0;
  const hasStrictFilters = Object.values(strictFilters).some(v => v === true);
  
  if (vehicles.length === 0) {
    if (hasTechnicalFilters || hasStrictFilters) {
      // Si hay filtros estrictos o técnicos pero no hay resultados:
      // NO aplicar fallback - retornar resultados vacíos
      // Es mejor mostrar "0 resultados" que mostrar resultados incorrectos
      
      if (strictFilters.exactYear) {
        console.log(`[processObjectiveQuery] EXACT year filter specified (${where.year?.gte}) but no matches - returning empty results (no fallback)`);
      } else if (hasTechnicalFilters) {
        console.log(`[processObjectiveQuery] Technical filters specified but no matches - returning empty results (no fallback)`);
      } else {
        console.log(`[processObjectiveQuery] Strict filters specified but no matches - returning empty results (no fallback)`);
      }
      
      // NO aplicar fallback para filtros estrictos
    } else {
      // No hay filtros estrictos, aplicar fallback solo para filtros flexibles (precio, rango de años)
      console.log(`[processObjectiveQuery] No results found, applying progressive fallback for flexible filters...`);
      
      // Intentar relajar solo filtros FLEXIBLES (precio, rangos)
    const relaxedWhere = { ...where };
    
      // Relajar filtros de precio si existen (precio es más flexible)
    if (relaxedWhere.price) {
      if (relaxedWhere.price.lte) {
        relaxedWhere.price.lte = Math.floor(relaxedWhere.price.lte * 1.3);
      }
      if (relaxedWhere.price.gte) {
        relaxedWhere.price.gte = Math.floor(relaxedWhere.price.gte * 0.8);
      }
    }
    
      // Relajar filtro de año SOLO si es un rango (no año exacto)
      // Si es un rango (min !== max), podemos expandirlo ligeramente
      if (relaxedWhere.year && !strictFilters.exactYear) {
        if (relaxedWhere.year.gte && relaxedWhere.year.lte && relaxedWhere.year.gte !== relaxedWhere.year.lte) {
          // Es un rango, podemos expandirlo
          const rangeSize = relaxedWhere.year.lte - relaxedWhere.year.gte;
          relaxedWhere.year.gte = Math.max(2010, relaxedWhere.year.gte - Math.floor(rangeSize * 0.2));
          relaxedWhere.year.lte = Math.min(new Date().getFullYear() + 1, relaxedWhere.year.lte + Math.floor(rangeSize * 0.2));
          console.log(`[processObjectiveQuery] Relaxing year range: ${relaxedWhere.year.gte}-${relaxedWhere.year.lte}`);
        } else if (relaxedWhere.year.gte && !relaxedWhere.year.lte) {
          // Solo mínimo, podemos bajar un poco
          relaxedWhere.year.gte = Math.max(2010, relaxedWhere.year.gte - 2);
        }
      }
      
      // NO relajar fuelType, brand, type - son filtros estrictos
    
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
    
    console.log(`[processObjectiveQuery] After relaxing price/year: ${vehicles.length} vehicles`);
    
    // Si aún no hay resultados, eliminar algunos filtros opcionales
    // PERO mantener fuelType si fue especificado
    if (vehicles.length === 0) {
      const finalWhere = { ...relaxedWhere };
      
      // Mantener solo filtros esenciales (marca, tipo de combustible si es muy específico)
      if (!finalWhere.brand && !finalWhere.fuelType) {
        // Si no hay marca ni combustible específico, eliminar tipo de carrocería
        delete finalWhere.type;
      }
      
      // NO eliminar fuelType - es un filtro crítico
      
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
      
      console.log(`[processObjectiveQuery] After removing optional filters: ${vehicles.length} vehicles`);
    }
    
      // Último fallback: solo si NO hay filtros estrictos
      // Si hay filtros estrictos (año exacto, fuelType, brand, type), NO mostrar otros vehículos
      if (vehicles.length === 0 && !hasStrictFilters) {
        console.log(`[processObjectiveQuery] No strict filters, showing popular vehicles as last resort`);
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
      } else if (vehicles.length === 0 && hasStrictFilters) {
        console.log(`[processObjectiveQuery] Strict filters specified but no matches found - returning empty results`);
      }
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
// MEJORADO: Match percentage refleja cumplimiento de filtros objetivos (100% si cumple todos)
// Scoring subjetivo solo se usa para RANKING, no para el porcentaje de match
async function processHybridQuery(intent: CategorizedIntent, startTime: number): Promise<ProcessedResults> {
  const whereRaw = await buildObjectiveWhereClause(intent);
  const technicalFilters = (whereRaw as any)._technicalFilters;
  const filtersApplied = buildFiltersDescription(intent);
  
  // Create clean where clause without metadata
  const where: any = {};
  if (whereRaw.brand) where.brand = whereRaw.brand;
  if (whereRaw.type) where.type = whereRaw.type;
  if (whereRaw.fuelType) where.fuelType = whereRaw.fuelType;
  if (whereRaw.year) where.year = whereRaw.year;
  if (whereRaw.price) where.price = whereRaw.price;
  
  console.log(`[processHybridQuery] WHERE clause:`, JSON.stringify(where, null, 2));
  console.log(`[processHybridQuery] Technical filters:`, technicalFilters ? technicalFilters.map((f: any) => `${f.field_path} ${f.operator} ${f.value}`) : 'none');
  
  // Check if WHERE clause is empty (no basic filters - only technical filters)
  const hasBasicFilters = Object.keys(where).length > 0;
  
  let vehicles = await prisma.vehicle.findMany({
    where: hasBasicFilters ? where : undefined,
    include: {
      images: {
        orderBy: { order: 'asc' },
        take: 1
      }
    },
    ...(hasBasicFilters ? {} : { 
      take: technicalFilters && technicalFilters.length > 0 ? 1000 : 500
    })
  });
  
  console.log(`[processHybridQuery] Found ${vehicles.length} vehicles before technical filters`);
  
  // Apply technical specifications filtering if specified
  if (technicalFilters && technicalFilters.length > 0) {
    console.log(`[processHybridQuery] Applying ${technicalFilters.length} technical filters`);
    
    vehicles = vehicles.filter(vehicle => {
      try {
        const specs = vehicle.specifications ? JSON.parse(vehicle.specifications) : {};
        
        // Check all technical specifications - ALL must match
        const filterResults = technicalFilters.map((filter: any) => {
          return evaluateTechnicalFilter(specs, filter, { brand: vehicle.brand, model: vehicle.model });
        });
        
        return filterResults.every(result => result.matches);
      } catch (error) {
        console.error(`[processHybridQuery] Error parsing specifications for ${vehicle.brand} ${vehicle.model}:`, error);
        return false;
      }
    });
    
    console.log(`[processHybridQuery] After technical filters: ${vehicles.length} vehicles`);
  }

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
  
  // Check if we have objective filters
  // If vehicle passed Prisma WHERE clause AND technical filters, it meets ALL objective filters = 100%
  const hasObjectiveFilters = !!(intent.objective_filters && (
    intent.objective_filters.brands?.length > 0 ||
    intent.objective_filters.body_types?.length > 0 ||
    intent.objective_filters.fuel_types?.length > 0 ||
    intent.objective_filters.price_range ||
    intent.objective_filters.year_range ||
    (intent.objective_filters.technical_specs && intent.objective_filters.technical_specs.length > 0)
  ));
  
  // Apply hybrid scoring: objective match + subjective ranking
  const vehiclesWithAffinity = vehicles.map(vehicle => {
    const features = computeVehicleFeatures(vehicle, marketStats);
    const tags = generateVehicleTags(vehicle, features);
    
    // Calculate objective match percentage
    // If vehicle passed Prisma WHERE clause AND technical filters (if any), it meets ALL filters = 100%
    let objectiveMatch = 100;
    if (hasObjectiveFilters) {
      // Vehicle already passed:
      // 1. Basic filters in WHERE clause (brand, type, fuelType, year, price)
      // 2. Technical filters (if any) in post-processing
      // Therefore, it's 100% match on all objective criteria
      objectiveMatch = 100;
    } else {
      // No strict objective filters, calculate match based on criteria
      objectiveMatch = calculateObjectiveMatchPercentage(vehicle, intent);
    }
    
    // Calculate subjective affinity for RANKING only (not for match percentage)
    const subjectiveAffinity = intent.subjective_weights ? 
      calculateSubjectiveAffinity(vehicle, features, intent) : 0.5;
    
    // For hybrid queries: match percentage = objective match (100% if meets all filters)
    // Subjective affinity is only used for sorting
    const matchPercentage = objectiveMatch;
    
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
      affinity: Math.round(matchPercentage), // Use objective match as affinity
      tags,
      features,
      _subjectiveAffinity: subjectiveAffinity // Store for sorting
    };
  });

  // Sort by subjective affinity if available (for ranking), otherwise by objective match
  vehiclesWithAffinity.sort((a, b) => {
    // If we have subjective weights, use subjective affinity for ranking
    if (intent.subjective_weights) {
      const aSubj = (a as any)._subjectiveAffinity || 0;
      const bSubj = (b as any)._subjectiveAffinity || 0;
      if (Math.abs(aSubj - bSubj) > 0.05) { // If difference is significant
        return bSubj - aSubj;
      }
    }
    // Otherwise, sort by objective match (should all be 100% if filters are strict)
    return (b.affinity || 0) - (a.affinity || 0);
  });
  
  // Remove internal _subjectiveAffinity field before returning
  vehiclesWithAffinity.forEach(v => delete (v as any)._subjectiveAffinity);
  
  // Top 3 with reasons - generate hybrid reasons (objective + subjective)
  const top3WithReasons = vehiclesWithAffinity.slice(0, 3).map((vehicle, index) => ({
    ...vehicle,
    reasons: generateHybridReasons(vehicle, intent, index + 1, vehicle.features, filtersApplied)
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

// Normalize fuel type values to match database values
// This function maps AI-generated values to actual database values
async function normalizeFuelTypes(aiFuelTypes: string[]): Promise<string[]> {
  if (!aiFuelTypes || aiFuelTypes.length === 0) return [];
  
  try {
    // Get actual fuel types from database
    const dbFuelTypes = await prisma.vehicle.findMany({
      select: { fuelType: true },
      distinct: ['fuelType'],
    });
    
    const actualFuelTypes = dbFuelTypes
      .map(v => v.fuelType)
      .filter(Boolean) as string[];
    
    // Create a normalization map
    const normalizeMap: Record<string, string[]> = {};
    
    // For each AI-generated fuel type, find matching database values
    const normalized: string[] = [];
    
    for (const aiFuelType of aiFuelTypes) {
      const aiLower = aiFuelType.toLowerCase().trim();
      
      // Try exact match first (case-insensitive)
      const exactMatch = actualFuelTypes.find(
        dbType => dbType.toLowerCase().trim() === aiLower
      );
      
      if (exactMatch) {
        if (!normalized.includes(exactMatch)) {
          normalized.push(exactMatch);
        }
        continue;
      }
      
      // Try partial match for common variations
      // Map common AI variations to database values
      // IMPORTANT: Only map to values that actually exist in the database
      const variations: Record<string, string[]> = {
        'híbrido': ['Híbrido', 'Híbrido Enchufable'], // Híbrido includes both regular and plug-in
        'hibrido': ['Híbrido', 'Híbrido Enchufable'],
        'hybrid': ['Híbrido', 'Híbrido Enchufable'],
        'híbrido enchufable': ['Híbrido Enchufable'], // Specific: only plug-in hybrid
        'hibrido enchufable': ['Híbrido Enchufable'],
        'phev': ['Híbrido Enchufable'],
        'plug-in': ['Híbrido Enchufable'],
        'plug-in hybrid': ['Híbrido Enchufable'],
        'eléctrico': ['Eléctrico'],
        'electrico': ['Eléctrico'],
        'electric': ['Eléctrico'],
        'ev': ['Eléctrico'],
        'gasolina': ['Gasolina'],
        'gasoline': ['Gasolina'],
        'petrol': ['Gasolina'],
        'diésel': ['Diesel'],
        'diesel': ['Diesel'],
      };
      
      // Check if we have a variation mapping
      const variationMatch = variations[aiLower];
      if (variationMatch) {
        // Only include variations that actually exist in the database
        for (const dbType of variationMatch) {
          if (actualFuelTypes.includes(dbType) && !normalized.includes(dbType)) {
            normalized.push(dbType);
          }
        }
        if (normalized.length > 0) {
          continue; // Found a match via variation mapping
        }
      }
      
      // Last resort: Try fuzzy match (contains) - but be careful
      // Only use fuzzy match if we haven't found anything yet
      // This helps catch minor variations but should not be too permissive
      const fuzzyMatches = actualFuelTypes.filter(dbType => {
        const dbLower = dbType.toLowerCase().trim();
        // Only match if the AI value is contained in DB value or vice versa
        // But be strict: don't match "híbrido" with "gasolina" for example
        if (dbLower.includes(aiLower) || aiLower.includes(dbLower)) {
          // Additional check: make sure they're semantically related
          // For example, "híbrido" should match "Híbrido" or "Híbrido Enchufable" but not "Gasolina"
          const hybridKeywords = ['híbrido', 'hibrido', 'hybrid', 'phev'];
          const electricKeywords = ['eléctrico', 'electrico', 'electric', 'ev'];
          const gasKeywords = ['gasolina', 'gasoline', 'petrol'];
          const dieselKeywords = ['diésel', 'diesel'];
          
          const aiIsHybrid = hybridKeywords.some(k => aiLower.includes(k));
          const aiIsElectric = electricKeywords.some(k => aiLower.includes(k));
          const aiIsGas = gasKeywords.some(k => aiLower.includes(k));
          const aiIsDiesel = dieselKeywords.some(k => aiLower.includes(k));
          
          const dbIsHybrid = hybridKeywords.some(k => dbLower.includes(k));
          const dbIsElectric = electricKeywords.some(k => dbLower.includes(k));
          const dbIsGas = gasKeywords.some(k => dbLower.includes(k));
          const dbIsDiesel = dieselKeywords.some(k => dbLower.includes(k));
          
          // Only match if they're in the same category
          return (aiIsHybrid && dbIsHybrid) ||
                 (aiIsElectric && dbIsElectric) ||
                 (aiIsGas && dbIsGas) ||
                 (aiIsDiesel && dbIsDiesel);
        }
        return false;
      });
      
      for (const match of fuzzyMatches) {
        if (!normalized.includes(match)) {
          normalized.push(match);
        }
      }
    }
    
    console.log(`[NormalizeFuelTypes] AI: [${aiFuelTypes.join(', ')}] → DB: [${normalized.join(', ')}]`);
    
    return normalized;
  } catch (error) {
    console.error('Error normalizing fuel types:', error);
    // Fallback: return original values if normalization fails
    return aiFuelTypes;
  }
}

// Normalize brand names to match database values
async function normalizeBrands(aiBrands: string[]): Promise<string[]> {
  if (!aiBrands || aiBrands.length === 0) return [];
  
  try {
    // Get actual brands from database
    const dbBrands = await prisma.vehicle.findMany({
      select: { brand: true },
      distinct: ['brand'],
    });
    
    const actualBrands = dbBrands
      .map(v => v.brand)
      .filter(Boolean) as string[];
    
    const normalized: string[] = [];
    
    for (const aiBrand of aiBrands) {
      const aiLower = aiBrand.toLowerCase().trim();
      
      // Try exact match first (case-insensitive)
      const exactMatch = actualBrands.find(
        dbBrand => dbBrand.toLowerCase().trim() === aiLower
      );
      
      if (exactMatch) {
        if (!normalized.includes(exactMatch)) {
          normalized.push(exactMatch);
        }
        continue;
      }
      
      // Try fuzzy match (contains)
      const fuzzyMatches = actualBrands.filter(dbBrand => {
        const dbLower = dbBrand.toLowerCase().trim();
        return dbLower.includes(aiLower) || aiLower.includes(dbLower);
      });
      
      for (const match of fuzzyMatches) {
        if (!normalized.includes(match)) {
          normalized.push(match);
        }
      }
    }
    
    console.log(`[NormalizeBrands] AI: [${aiBrands.join(', ')}] → DB: [${normalized.join(', ')}]`);
    
    return normalized;
  } catch (error) {
    console.error('Error normalizing brands:', error);
    return aiBrands;
  }
}

// Normalize body types to match database values
async function normalizeBodyTypes(aiBodyTypes: string[]): Promise<string[]> {
  if (!aiBodyTypes || aiBodyTypes.length === 0) return [];
  
  try {
    // Get actual body types from database
    const dbBodyTypes = await prisma.vehicle.findMany({
      select: { type: true },
      distinct: ['type'],
    });
    
    const actualBodyTypes = dbBodyTypes
      .map(v => v.type)
      .filter(Boolean) as string[];
    
    const normalized: string[] = [];
    
    for (const aiBodyType of aiBodyTypes) {
      const aiLower = aiBodyType.toLowerCase().trim();
      
      // Try exact match first (case-insensitive)
      const exactMatch = actualBodyTypes.find(
        dbType => dbType.toLowerCase().trim() === aiLower
      );
      
      if (exactMatch) {
        if (!normalized.includes(exactMatch)) {
          normalized.push(exactMatch);
        }
        continue;
      }
      
      // Map common variations
      const variations: Record<string, string[]> = {
        'pickup': ['Pickup'],
        'pick-up': ['Pickup'],
        'suv': ['SUV'],
        'sedán': ['Sedán'],
        'sedan': ['Sedán'],
        'hatchback': ['Hatchback'],
        'deportivo': ['Deportivo'],
        'sport': ['Deportivo'],
        'wagon': ['Wagon'],
        'convertible': ['Convertible'],
      };
      
      const variationMatch = variations[aiLower];
      if (variationMatch) {
        for (const dbType of variationMatch) {
          if (actualBodyTypes.includes(dbType) && !normalized.includes(dbType)) {
            normalized.push(dbType);
          }
        }
        continue;
      }
      
      // Try fuzzy match
      const fuzzyMatches = actualBodyTypes.filter(dbType => {
        const dbLower = dbType.toLowerCase().trim();
        return dbLower.includes(aiLower) || aiLower.includes(dbLower);
      });
      
      for (const match of fuzzyMatches) {
        if (!normalized.includes(match)) {
          normalized.push(match);
        }
      }
    }
    
    console.log(`[NormalizeBodyTypes] AI: [${aiBodyTypes.join(', ')}] → DB: [${normalized.join(', ')}]`);
    
    return normalized;
  } catch (error) {
    console.error('Error normalizing body types:', error);
    return aiBodyTypes;
  }
}

// Build WHERE clause for objective filtering
async function buildObjectiveWhereClause(intent: CategorizedIntent): Promise<any> {
  const where: any = {};
  const filters = intent.objective_filters;
  
  console.log(`[buildObjectiveWhereClause] Received filters:`, JSON.stringify(filters, null, 2));
  
  if (!filters) {
    console.log(`[buildObjectiveWhereClause] No filters provided - returning empty WHERE clause`);
    return where;
  }
  
  // Normalize brands
  if (filters.brands && filters.brands.length > 0) {
    const normalizedBrands = await normalizeBrands(filters.brands);
    if (normalizedBrands.length > 0) {
      where.brand = { in: normalizedBrands };
    }
  }
  
  // Normalize body types
  if (filters.body_types && filters.body_types.length > 0) {
    const normalizedBodyTypes = await normalizeBodyTypes(filters.body_types);
    if (normalizedBodyTypes.length > 0) {
      where.type = { in: normalizedBodyTypes };
    }
  }
  
  // Normalize fuel types - THIS IS THE KEY FIX
  if (filters.fuel_types && filters.fuel_types.length > 0) {
    const normalizedFuelTypes = await normalizeFuelTypes(filters.fuel_types);
    if (normalizedFuelTypes.length > 0) {
      where.fuelType = { in: normalizedFuelTypes };
      console.log(`[buildObjectiveWhereClause] Filtering by fuelType: [${normalizedFuelTypes.join(', ')}]`);
    } else {
      console.warn(`[buildObjectiveWhereClause] No normalized fuel types found for: [${filters.fuel_types.join(', ')}]`);
    }
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
    
    // Si min === max, es un año exacto - marcarlo como estricto
    if (filters.year_range.min === filters.year_range.max) {
      console.log(`[buildObjectiveWhereClause] EXACT year filter: ${filters.year_range.min} (strict, no fallback)`);
      (where as any)._exactYear = filters.year_range.min;
    } else if (filters.year_range.min && filters.year_range.max) {
      console.log(`[buildObjectiveWhereClause] Year range filter: ${filters.year_range.min}-${filters.year_range.max}`);
    }
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
// MEJORADO: Sistema integral que considera múltiples factores para cada criterio
function calculateSubjectiveAffinity(vehicle: any, features: any, intent: CategorizedIntent): number {
  const weights = intent.subjective_weights;
  if (!weights) return 0.5; // Default neutral score
  
  // Parse specs once for all scoring functions
  const specs = vehicle.specifications ? JSON.parse(vehicle.specifications) : {};
  
  let score = 0;
  let totalWeight = 0;
  
  Object.entries(weights).forEach(([key, weight]) => {
    if (weight > 0) {
      totalWeight += weight;
      
      switch (key) {
        case 'beauty':
          score += weight * calculateComprehensiveBeautyScore(vehicle, specs, features);
          break;
        case 'family_friendly':
          score += weight * calculateComprehensiveFamilyScore(vehicle, specs, features);
          break;
        case 'sportiness':
          score += weight * calculateComprehensiveSportinessScore(vehicle, specs, features);
          break;
        case 'luxury':
        case 'status':
          score += weight * calculateComprehensiveLuxuryScore(vehicle, specs, features);
          break;
        case 'reliability':
          score += weight * calculateComprehensiveReliabilityScore(vehicle, specs, features);
          break;
        case 'efficiency':
          score += weight * calculateComprehensiveEfficiencyScore(vehicle, specs, features);
          break;
        case 'practicality':
          score += weight * calculateComprehensivePracticalityScore(vehicle, specs, features);
          break;
        case 'comfort':
          score += weight * calculateComprehensiveComfortScore(vehicle, specs, features);
          break;
        case 'safety':
          score += weight * calculateComprehensiveSafetyScore(vehicle, specs, features);
          break;
      }
    }
  });
  
  return totalWeight > 0 ? score / totalWeight : 0.5;
}

// ============================================================================
// COMPREHENSIVE SCORING FUNCTIONS - Sistema integral de scoring
// Cada función considera múltiples factores relevantes para el criterio
// ============================================================================

// COMFORT: Considera dimensiones, asientos, conectividad, tipo eléctrico, tipo de vehículo, features
function calculateComprehensiveComfortScore(vehicle: any, specs: any, features: any): number {
  let score = 0;
  let factors = 0;
  
  // 1. Comfort features (25%)
  const comfortFeatures = {
    airConditioning: specs.comfort?.airConditioning ? 1 : 0,
    automaticClimateControl: specs.comfort?.automaticClimateControl ? 1.5 : 0,
    heatedSeats: specs.comfort?.heatedSeats ? 1 : 0,
    ventilatedSeats: specs.comfort?.ventilatedSeats ? 1.5 : 0,
    massageSeats: specs.comfort?.massageSeats ? 2 : 0,
    ajusteElectricoConductor: specs.comfort?.ajusteElectricoConductor ? 1 : 0,
    ajusteElectricoPasajero: specs.comfort?.ajusteElectricoPasajero ? 0.5 : 0,
    memoriaAsientos: specs.comfort?.memoriaAsientos ? 0.5 : 0,
    cristalesAcusticos: specs.comfort?.cristalesAcusticos ? 1 : 0,
    iluminacionAmbiental: specs.comfort?.iluminacionAmbiental ? 0.5 : 0,
    techoPanoramico: (specs.comfort?.techoPanoramico || specs.comfort?.sunroof) ? 1 : 0,
    climatizadorZonas: specs.comfort?.climatizadorZonas ? Math.min(parseFloat(specs.comfort.climatizadorZonas) * 0.5, 2) : 0,
  };
  const comfortFeaturesScore = Object.values(comfortFeatures).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
  score += Math.min(comfortFeaturesScore / 10, 1) * 25; // Normalizar a 0-25
  factors += 25;
  
  // 2. Dimensiones y espacio (20%)
  const length = parseFloat(specs.dimensions?.length) || 0;
  const width = parseFloat(specs.dimensions?.width) || 0;
  const height = parseFloat(specs.dimensions?.height) || 0;
  const wheelbase = parseFloat(specs.dimensions?.wheelbase) || 0;
  const passengerCapacity = parseFloat(specs.interior?.passengerCapacity) || 0;
  const seatRows = parseFloat(specs.interior?.seatRows) || 0;
  
  let spaceScore = 0;
  // Wheelbase largo = más espacio entre ejes = más cómodo
  if (wheelbase > 2800) spaceScore += 8;
  else if (wheelbase > 2700) spaceScore += 6;
  else if (wheelbase > 2600) spaceScore += 4;
  else if (wheelbase > 2500) spaceScore += 2;
  
  // Más asientos = más cómodo para grupos
  if (passengerCapacity >= 7) spaceScore += 5;
  else if (passengerCapacity >= 5) spaceScore += 3;
  else if (passengerCapacity >= 4) spaceScore += 1;
  
  // Dimensiones grandes = más espacio interior
  const interiorVolume = length * width * height;
  if (interiorVolume > 150000000) spaceScore += 7; // Muy grande
  else if (interiorVolume > 120000000) spaceScore += 5;
  else if (interiorVolume > 100000000) spaceScore += 3;
  
  score += Math.min(spaceScore / 20, 1) * 20;
  factors += 20;
  
  // 3. Tipo de vehículo (15%) - SUV y Sedán son más cómodos
  let typeScore = 0;
  if (vehicle.type === 'SUV') typeScore = 15;
  else if (vehicle.type === 'Sedán') typeScore = 12;
  else if (vehicle.type === 'Hatchback') typeScore = 8;
  else if (vehicle.type === 'Pickup') typeScore = 6;
  else if (vehicle.type === 'Deportivo') typeScore = 4;
  else if (vehicle.type === 'Convertible') typeScore = 7;
  else typeScore = 5;
  
  score += typeScore;
  factors += 15;
  
  // 4. Conectividad y tecnología (15%)
  let techScore = 0;
  if (specs.technology?.touchscreen) techScore += 3;
  if (specs.technology?.navigation) techScore += 2;
  if (specs.technology?.smartphoneIntegration?.includes('CarPlay')) techScore += 3;
  if (specs.technology?.smartphoneIntegration?.includes('Android Auto')) techScore += 3;
  if (specs.technology?.wirelessCharger) techScore += 2;
  if (specs.technology?.bluetooth) techScore += 1;
  if (specs.technology?.cameras360) techScore += 1;
  
  score += Math.min(techScore / 15, 1) * 15;
  factors += 15;
  
  // 5. Si es eléctrico o híbrido (10%) - más silencioso = más cómodo
  let powertrainScore = 0;
  if (vehicle.fuelType === 'Eléctrico') powertrainScore = 10;
  else if (vehicle.fuelType === 'Híbrido' || vehicle.fuelType === 'PHEV') powertrainScore = 7;
  else powertrainScore = 5; // Combustión tradicional
  
  score += powertrainScore;
  factors += 10;
  
  // 6. Año del vehículo (10%) - más nuevo = más cómodo (mejor tech, mejor diseño)
  const currentYear = new Date().getFullYear();
  const age = currentYear - vehicle.year;
  let ageScore = 0;
  if (age <= 1) ageScore = 10;
  else if (age <= 3) ageScore = 8;
  else if (age <= 5) ageScore = 6;
  else if (age <= 8) ageScore = 4;
  else if (age <= 12) ageScore = 2;
  else ageScore = 1;
  
  score += ageScore;
  factors += 10;
  
  // 7. Wisemetrics comfort si existe (5%) - usar como ajuste fino
  if (specs.wisemetrics?.comfort !== undefined && specs.wisemetrics.comfort !== null) {
    const wisemetricsComfort = parseFloat(specs.wisemetrics.comfort);
    if (!isNaN(wisemetricsComfort)) {
      score += (wisemetricsComfort / 100) * 5;
    }
  } else {
    score += 2.5; // Default si no existe
  }
  factors += 5;
  
  // Normalizar a 0-1
  const normalizedScore = factors > 0 ? score / factors : 0.5;
  
  // Asegurar mínimo según tipo
  const minComfortByType: Record<string, number> = {
    'SUV': 0.55,
    'Sedán': 0.50,
    'Hatchback': 0.48,
    'Pickup': 0.45,
    'Convertible': 0.45,
    'Deportivo': 0.40,
  };
  const minComfort = minComfortByType[vehicle.type] || 0.45;
  
  return Math.max(minComfort, Math.min(1, normalizedScore));
}

// SPORTINESS: Considera potencia, aceleración, tipo, características deportivas, tracción
function calculateComprehensiveSportinessScore(vehicle: any, specs: any, features: any): number {
  let score = 0;
  let factors = 0;
  
  // 1. Performance metrics (40%)
  const power = parseFloat(specs.powertrain?.potenciaMaxMotorTermico) || 
                parseFloat(specs.powertrain?.potenciaMaxSistemaHibrido) ||
                parseFloat(specs.powertrain?.potenciaMaxEV) ||
                parseFloat(specs.performance?.maxPower) || 
                parseFloat(specs.combustion?.maxPower) || 
                parseFloat(specs.hybrid?.maxPower) ||
                parseFloat(specs.electric?.maxPower) ||
                150;
  const acceleration = parseFloat(specs.performance?.acceleration0to100) || 10;
  const topSpeed = parseFloat(specs.performance?.maxSpeed) || 180;
  const weight = parseFloat(specs.dimensions?.curbWeight) || parseFloat(specs.dimensions?.weight) || 1500;
  const powerToWeight = power / weight;
  
  // Potencia (15%)
  let powerScore = 0;
  if (power >= 400) powerScore = 15;
  else if (power >= 300) powerScore = 12;
  else if (power >= 250) powerScore = 10;
  else if (power >= 200) powerScore = 7;
  else if (power >= 150) powerScore = 5;
  else powerScore = 3;
  
  score += powerScore;
  factors += 15;
  
  // Aceleración (15%) - menos tiempo = mejor
  let accelerationScore = 0;
  if (acceleration < 5) accelerationScore = 15;
  else if (acceleration < 6) accelerationScore = 12;
  else if (acceleration < 7) accelerationScore = 10;
  else if (acceleration < 8) accelerationScore = 7;
  else if (acceleration < 9) accelerationScore = 5;
  else if (acceleration < 10) accelerationScore = 3;
  else accelerationScore = 1;
  
  score += accelerationScore;
  factors += 15;
  
  // Relación potencia/peso (10%)
  let powerWeightScore = 0;
  if (powerToWeight >= 0.25) powerWeightScore = 10; // >250 HP/ton
  else if (powerToWeight >= 0.20) powerWeightScore = 8;
  else if (powerToWeight >= 0.15) powerWeightScore = 6;
  else if (powerToWeight >= 0.12) powerWeightScore = 4;
  else if (powerToWeight >= 0.10) powerWeightScore = 2;
  else powerWeightScore = 1;
  
  score += powerWeightScore;
  factors += 10;
  
  // 2. Tipo de vehículo (20%)
  let typeScore = 0;
  if (vehicle.type === 'Deportivo') typeScore = 20;
  else if (vehicle.type === 'Convertible') typeScore = 15;
  else if (vehicle.type === 'Sedán') typeScore = 8; // Sedanes deportivos
  else if (vehicle.type === 'SUV') typeScore = 5; // SUV deportivos (pocos)
  else if (vehicle.type === 'Hatchback') typeScore = 6; // Hot hatches
  else if (vehicle.type === 'Pickup') typeScore = 4;
  else typeScore = 3;
  
  score += typeScore;
  factors += 20;
  
  // 3. Características deportivas (15%)
  let sportFeaturesScore = 0;
  // Turbo = más potencia
  const hasTurbo = specs.powertrain?.alimentacion?.toLowerCase().includes('turbo') ||
                   specs.combustion?.turbo ||
                   specs.hybrid?.turbo ||
                   false;
  if (hasTurbo) sportFeaturesScore += 5;
  
  // Modo sport
  if (specs.performance?.sportMode || specs.performance?.launchControl) sportFeaturesScore += 3;
  
  // Tracción AWD/4WD puede ayudar en performance
  const drivetrain = specs.powertrain?.tipoTraccion || specs.drivetrain || '';
  if (drivetrain === 'AWD' || drivetrain === '4WD') sportFeaturesScore += 4;
  else if (drivetrain === 'RWD') sportFeaturesScore += 3; // RWD es mejor para deportivos
  
  // Suspensión deportiva
  if (specs.chassis?.suspensionSetup?.toLowerCase().includes('deportiv')) sportFeaturesScore += 3;
  
  score += Math.min(sportFeaturesScore / 15, 1) * 15;
  factors += 15;
  
  // 4. Velocidad máxima (10%)
  let speedScore = 0;
  if (topSpeed >= 250) speedScore = 10;
  else if (topSpeed >= 220) speedScore = 8;
  else if (topSpeed >= 200) speedScore = 6;
  else if (topSpeed >= 180) speedScore = 4;
  else if (topSpeed >= 160) speedScore = 2;
  else speedScore = 1;
  
  score += speedScore;
  factors += 10;
  
  // 5. Año (10%) - tecnología más nueva = mejor performance
  const currentYear = new Date().getFullYear();
  const age = currentYear - vehicle.year;
  let ageScore = 0;
  if (age <= 3) ageScore = 10;
  else if (age <= 5) ageScore = 8;
  else if (age <= 8) ageScore = 6;
  else if (age <= 12) ageScore = 4;
  else ageScore = 2;
  
  score += ageScore;
  factors += 10;
  
  // 6. Wisemetrics drivingFun si existe (5%)
  if (specs.wisemetrics?.drivingFun !== undefined && specs.wisemetrics.drivingFun !== null) {
    const drivingFun = parseFloat(specs.wisemetrics.drivingFun);
    if (!isNaN(drivingFun)) {
      score += (drivingFun / 100) * 5;
    }
  } else {
    score += 2.5;
  }
  factors += 5;
  
  // Normalizar
  return Math.max(0, Math.min(1, factors > 0 ? score / factors : 0.3));
}

// EFFICIENCY: Considera consumo, tipo de combustible, peso, tamaño, año, aerodinámica
function calculateComprehensiveEfficiencyScore(vehicle: any, specs: any, features: any): number {
  let score = 0;
  let factors = 0;
  
  // 1. Tipo de combustible (35%) - eléctrico e híbrido son más eficientes
  let fuelTypeScore = 0;
  if (vehicle.fuelType === 'Eléctrico') {
    fuelTypeScore = 35;
    // Bonificación por autonomía eléctrica
    const electricRange = parseFloat(specs.electric?.electricRange) || 0;
    if (electricRange >= 400) fuelTypeScore += 5;
    else if (electricRange >= 300) fuelTypeScore += 3;
    else if (electricRange >= 200) fuelTypeScore += 1;
  } else if (vehicle.fuelType === 'Híbrido' || vehicle.fuelType === 'PHEV') {
    fuelTypeScore = 28;
  } else if (vehicle.fuelType === 'Gasolina') {
    fuelTypeScore = 15;
  } else if (vehicle.fuelType === 'Diesel') {
    fuelTypeScore = 18; // Diesel es más eficiente que gasolina
  } else {
    fuelTypeScore = 12;
  }
  
  score += Math.min(fuelTypeScore, 40);
  factors += 35;
  
  // 2. Consumo de combustible (30%)
  const cityConsumption = parseFloat(specs.combustion?.cityConsumption) || 
                         parseFloat(specs.hybrid?.cityConsumption) ||
                         parseFloat(specs.phev?.cityConsumption) ||
                         0;
  const highwayConsumption = parseFloat(specs.combustion?.highwayConsumption) || 
                            parseFloat(specs.hybrid?.highwayConsumption) ||
                            parseFloat(specs.phev?.highwayConsumption) ||
                            0;
  const combinedConsumption = parseFloat(specs.combustion?.combinedConsumption) ||
                             parseFloat(specs.hybrid?.combinedConsumption) ||
                             parseFloat(specs.phev?.combinedConsumption) ||
                             0;
  
  // Usar el consumo disponible (priorizar combined, luego city)
  const consumption = combinedConsumption || cityConsumption || highwayConsumption || 8;
  
  let consumptionScore = 0;
  if (vehicle.fuelType === 'Eléctrico') {
    consumptionScore = 30; // Eléctricos son muy eficientes
  } else {
    // Para combustión: menos consumo = mejor
    if (consumption <= 5) consumptionScore = 30;
    else if (consumption <= 6) consumptionScore = 25;
    else if (consumption <= 7) consumptionScore = 20;
    else if (consumption <= 8) consumptionScore = 15;
    else if (consumption <= 9) consumptionScore = 10;
    else if (consumption <= 10) consumptionScore = 7;
    else if (consumption <= 12) consumptionScore = 5;
    else consumptionScore = 3;
  }
  
  score += consumptionScore;
  factors += 30;
  
  // 3. Peso (15%) - más ligero = más eficiente
  const weight = parseFloat(specs.dimensions?.curbWeight) || parseFloat(specs.dimensions?.weight) || 1500;
  let weightScore = 0;
  if (weight < 1200) weightScore = 15;
  else if (weight < 1400) weightScore = 12;
  else if (weight < 1600) weightScore = 10;
  else if (weight < 1800) weightScore = 7;
  else if (weight < 2000) weightScore = 5;
  else if (weight < 2200) weightScore = 3;
  else weightScore = 1;
  
  score += weightScore;
  factors += 15;
  
  // 4. Tamaño (10%) - más pequeño = más eficiente (generalmente)
  const length = parseFloat(specs.dimensions?.length) || 4500;
  let sizeScore = 0;
  if (length < 4000) sizeScore = 10; // Muy compacto
  else if (length < 4300) sizeScore = 8;
  else if (length < 4600) sizeScore = 6;
  else if (length < 4800) sizeScore = 4;
  else if (length < 5000) sizeScore = 2;
  else sizeScore = 1;
  
  score += sizeScore;
  factors += 10;
  
  // 5. Año (5%) - más nuevo = más eficiente (mejor tecnología)
  const currentYear = new Date().getFullYear();
  const age = currentYear - vehicle.year;
  let ageScore = 0;
  if (age <= 3) ageScore = 5;
  else if (age <= 5) ageScore = 4;
  else if (age <= 8) ageScore = 3;
  else if (age <= 12) ageScore = 2;
  else ageScore = 1;
  
  score += ageScore;
  factors += 5;
  
  // 6. Tecnologías de eficiencia (5%)
  let efficiencyTechScore = 0;
  if (specs.combustion?.startStop || specs.hybrid?.startStop) efficiencyTechScore += 2;
  if (specs.combustion?.ecoMode || specs.hybrid?.ecoMode) efficiencyTechScore += 2;
  if (specs.electric?.regenerativeBraking) efficiencyTechScore += 1;
  
  score += Math.min(efficiencyTechScore / 5, 1) * 5;
  factors += 5;
  
  // Normalizar
  return Math.max(0, Math.min(1, factors > 0 ? score / factors : 0.5));
}

// LUXURY/STATUS: Considera precio, marca, features premium, tecnología, acabados
function calculateComprehensiveLuxuryScore(vehicle: any, specs: any, features: any): number {
  let score = 0;
  let factors = 0;
  
  // 1. Marca premium (25%)
  const prestigeBrands: Record<string, number> = {
    'Mercedes': 25, 'Mercedes-Benz': 25,
    'BMW': 25,
    'Audi': 25,
    'Porsche': 30,
    'Lexus': 23,
    'Tesla': 22,
    'Jaguar': 20,
    'Land Rover': 20,
    'Range Rover': 25,
    'Volvo': 18,
    'Infiniti': 18,
    'Acura': 17,
    'Cadillac': 17,
    'Lincoln': 16,
    'Genesis': 19,
    'Maserati': 28,
    'Bentley': 35,
    'Rolls-Royce': 40,
    'Ferrari': 35,
    'Lamborghini': 35,
    'McLaren': 35,
  };
  const brandScore = prestigeBrands[vehicle.brand] || 10;
  score += brandScore;
  factors += 25;
  
  // 2. Precio (20%) - más caro generalmente = más lujo
  // Normalizar precio (asumir rango típico de $20M a $500M)
  const price = vehicle.price || 0;
  let priceScore = 0;
  if (price >= 300000000) priceScore = 20; // >$300M
  else if (price >= 200000000) priceScore = 17;
  else if (price >= 150000000) priceScore = 15;
  else if (price >= 100000000) priceScore = 12;
  else if (price >= 70000000) priceScore = 10;
  else if (price >= 50000000) priceScore = 7;
  else if (price >= 30000000) priceScore = 5;
  else priceScore = 3;
  
  score += priceScore;
  factors += 20;
  
  // 3. Features premium (20%)
  let premiumFeaturesScore = 0;
  if (specs.comfort?.massageSeats) premiumFeaturesScore += 4;
  if (specs.comfort?.ventilatedSeats) premiumFeaturesScore += 3;
  if (specs.comfort?.heatedSeats) premiumFeaturesScore += 2;
  if (specs.comfort?.ajusteElectricoConductor) premiumFeaturesScore += 2;
  if (specs.comfort?.ajusteElectricoPasajero) premiumFeaturesScore += 1;
  if (specs.comfort?.memoriaAsientos) premiumFeaturesScore += 1;
  if (specs.comfort?.cristalesAcusticos) premiumFeaturesScore += 2;
  if (specs.comfort?.iluminacionAmbiental) premiumFeaturesScore += 1;
  if (specs.comfort?.techoPanoramico || specs.comfort?.sunroof) premiumFeaturesScore += 2;
  if (specs.comfort?.climatizadorZonas) premiumFeaturesScore += Math.min(parseFloat(specs.comfort.climatizadorZonas) * 0.5, 2);
  
  score += Math.min(premiumFeaturesScore / 20, 1) * 20;
  factors += 20;
  
  // 4. Tecnología avanzada (15%)
  let techScore = 0;
  if (specs.technology?.touchscreen) techScore += 2;
  if (specs.technology?.navigation) techScore += 2;
  if (specs.technology?.smartphoneIntegration?.includes('CarPlay')) techScore += 2;
  if (specs.technology?.smartphoneIntegration?.includes('Android Auto')) techScore += 2;
  if (specs.technology?.wirelessCharger) techScore += 1;
  if (specs.technology?.cameras360) techScore += 2;
  if (specs.assistance?.autonomousEmergencyBraking) techScore += 2;
  if (specs.assistance?.adaptiveCruiseControl) techScore += 2;
  
  score += Math.min(techScore / 15, 1) * 15;
  factors += 15;
  
  // 5. Materiales y acabados (10%) - inferido por precio y marca
  let materialsScore = 0;
  if (brandScore >= 20) materialsScore = 10;
  else if (brandScore >= 15) materialsScore = 7;
  else if (brandScore >= 10) materialsScore = 5;
  else materialsScore = 3;
  
  score += materialsScore;
  factors += 10;
  
  // 6. Año (5%) - más nuevo = mejor tecnología de lujo
  const currentYear = new Date().getFullYear();
  const age = currentYear - vehicle.year;
  let ageScore = 0;
  if (age <= 2) ageScore = 5;
  else if (age <= 4) ageScore = 4;
  else if (age <= 6) ageScore = 3;
  else if (age <= 8) ageScore = 2;
  else ageScore = 1;
  
  score += ageScore;
  factors += 5;
  
  // 7. Wisemetrics prestige si existe (5%)
  if (specs.wisemetrics?.prestige !== undefined && specs.wisemetrics.prestige !== null) {
    const prestige = parseFloat(specs.wisemetrics.prestige);
    if (!isNaN(prestige)) {
      score += (prestige / 100) * 5;
    }
  } else {
    score += 2.5;
  }
  factors += 5;
  
  // Normalizar
  return Math.max(0, Math.min(1, factors > 0 ? score / factors : 0.3));
}

// RELIABILITY: Considera marca, año, tipo de vehículo, tipo de combustible, histórico
function calculateComprehensiveReliabilityScore(vehicle: any, specs: any, features: any): number {
  let score = 0;
  let factors = 0;
  
  // 1. Marca (40%) - basado en históricos de confiabilidad conocidos
  const reliabilityBrands: Record<string, number> = {
    'Toyota': 40, 'Lexus': 38,
    'Honda': 38, 'Acura': 36,
    'Mazda': 35,
    'Subaru': 34,
    'Hyundai': 33, 'Genesis': 35,
    'Kia': 32,
    'Nissan': 30, 'Infiniti': 32,
    'Volkswagen': 28,
    'Ford': 27,
    'Chevrolet': 26,
    'BMW': 25,
    'Mercedes': 24, 'Mercedes-Benz': 24,
    'Audi': 23,
    'Volvo': 29,
    'Tesla': 22, // Nuevo, pero bueno
    'Porsche': 26,
    'Jaguar': 20,
    'Land Rover': 18, 'Range Rover': 19,
    'Fiat': 15,
    'Jeep': 22,
    'Ram': 24,
    'GMC': 25,
    'Dodge': 23,
    'Chrysler': 21,
  };
  const brandScore = reliabilityBrands[vehicle.brand] || 25; // Default promedio
  score += brandScore;
  factors += 40;
  
  // 2. Año (25%) - más nuevo = menos problemas
  const currentYear = new Date().getFullYear();
  const age = currentYear - vehicle.year;
  let ageScore = 0;
  if (age <= 1) ageScore = 25;
  else if (age <= 3) ageScore = 23;
  else if (age <= 5) ageScore = 20;
  else if (age <= 8) ageScore = 15;
  else if (age <= 12) ageScore = 10;
  else if (age <= 15) ageScore = 7;
  else ageScore = 4;
  
  score += ageScore;
  factors += 25;
  
  // 3. Tipo de combustible (15%) - híbrido puede ser más confiable
  let fuelTypeScore = 0;
  if (vehicle.fuelType === 'Híbrido') fuelTypeScore = 15; // Híbridos Toyota/Honda son muy confiables
  else if (vehicle.fuelType === 'Eléctrico') fuelTypeScore = 12; // Menos partes móviles, pero batería es preocupación
  else if (vehicle.fuelType === 'Gasolina') fuelTypeScore = 10;
  else if (vehicle.fuelType === 'Diesel') fuelTypeScore = 9;
  else fuelTypeScore = 8;
  
  score += fuelTypeScore;
  factors += 15;
  
  // 4. Tipo de vehículo (10%) - algunos tipos son más confiables
  let typeScore = 0;
  if (vehicle.type === 'Sedán') typeScore = 10; // Sedanes son probados y confiables
  else if (vehicle.type === 'SUV') typeScore = 9;
  else if (vehicle.type === 'Hatchback') typeScore = 9;
  else if (vehicle.type === 'Pickup') typeScore = 8;
  else if (vehicle.type === 'Deportivo') typeScore = 7; // Más complejos
  else typeScore = 8;
  
  score += typeScore;
  factors += 10;
  
  // 5. Wisemetrics reliability si existe (10%)
  if (specs.wisemetrics?.reliability !== undefined && specs.wisemetrics.reliability !== null) {
    const reliability = parseFloat(specs.wisemetrics.reliability);
    if (!isNaN(reliability)) {
      score += (reliability / 100) * 10;
    }
  } else {
    score += 5; // Default
  }
  factors += 10;
  
  // Normalizar
  return Math.max(0, Math.min(1, factors > 0 ? score / factors : 0.6));
}

// SAFETY: Considera airbags, sistemas de seguridad, tamaño, año, calificación NCAP
function calculateComprehensiveSafetyScore(vehicle: any, specs: any, features: any): number {
  let score = 0;
  let factors = 0;
  
  // 1. Sistemas de seguridad (30%)
  let safetySystemsScore = 0;
  const airbags = parseFloat(specs.safety?.airbags) || 0;
  if (airbags >= 8) safetySystemsScore += 10;
  else if (airbags >= 6) safetySystemsScore += 8;
  else if (airbags >= 4) safetySystemsScore += 6;
  else if (airbags >= 2) safetySystemsScore += 4;
  else safetySystemsScore += 2;
  
  if (specs.safety?.stabilityControl) safetySystemsScore += 5;
  if (specs.safety?.tractionControl) safetySystemsScore += 3;
  if (specs.safety?.autonomousEmergencyBraking) safetySystemsScore += 5;
  if (specs.assistance?.blindSpotMonitoring) safetySystemsScore += 2;
  if (specs.assistance?.laneDepartureWarning) safetySystemsScore += 2;
  if (specs.assistance?.rearCrossTrafficAlert) safetySystemsScore += 2;
  if (specs.assistance?.adaptiveCruiseControl) safetySystemsScore += 1;
  
  score += Math.min(safetySystemsScore / 30, 1) * 30;
  factors += 30;
  
  // 2. Calificación NCAP (20%) - si existe
  const ncapRating = parseFloat(specs.safety?.ncapRating) || 0;
  let ncapScore = 0;
  if (ncapRating >= 5) ncapScore = 20;
  else if (ncapRating >= 4.5) ncapScore = 17;
  else if (ncapRating >= 4) ncapScore = 14;
  else if (ncapRating >= 3.5) ncapScore = 10;
  else if (ncapRating >= 3) ncapScore = 7;
  else if (ncapRating > 0) ncapScore = 5;
  else ncapScore = 10; // Default si no hay calificación
  
  score += ncapScore;
  factors += 20;
  
  // 3. Tamaño (20%) - más grande generalmente = más seguro (más masa)
  const weight = parseFloat(specs.dimensions?.curbWeight) || parseFloat(specs.dimensions?.weight) || 1500;
  let sizeScore = 0;
  if (weight >= 2000) sizeScore = 20;
  else if (weight >= 1800) sizeScore = 17;
  else if (weight >= 1600) sizeScore = 14;
  else if (weight >= 1400) sizeScore = 10;
  else if (weight >= 1200) sizeScore = 7;
  else sizeScore = 5;
  
  score += sizeScore;
  factors += 20;
  
  // 4. Año (15%) - más nuevo = más seguro (mejor tecnología)
  const currentYear = new Date().getFullYear();
  const age = currentYear - vehicle.year;
  let ageScore = 0;
  if (age <= 2) ageScore = 15;
  else if (age <= 4) ageScore = 13;
  else if (age <= 6) ageScore = 11;
  else if (age <= 8) ageScore = 8;
  else if (age <= 12) ageScore = 5;
  else ageScore = 3;
  
  score += ageScore;
  factors += 15;
  
  // 5. Tipo de vehículo (10%) - SUV y Sedán son más seguros
  let typeScore = 0;
  if (vehicle.type === 'SUV') typeScore = 10;
  else if (vehicle.type === 'Sedán') typeScore = 9;
  else if (vehicle.type === 'Pickup') typeScore = 8;
  else if (vehicle.type === 'Hatchback') typeScore = 7;
  else if (vehicle.type === 'Deportivo') typeScore = 6;
  else typeScore = 7;
  
  score += typeScore;
  factors += 10;
  
  // 6. Wisemetrics safety si existe (5%)
  // Nota: No hay campo safety en wisemetrics típicamente, pero podríamos usar otros
  score += 5; // Default
  factors += 5;
  
  // Normalizar
  return Math.max(0, Math.min(1, factors > 0 ? score / factors : 0.6));
}

// FAMILY_FRIENDLY: Considera espacio, asientos, seguridad, confort, tipo
function calculateComprehensiveFamilyScore(vehicle: any, specs: any, features: any): number {
  let score = 0;
  let factors = 0;
  
  // 1. Espacio y asientos (30%)
  const passengerCapacity = parseFloat(specs.interior?.passengerCapacity) || 0;
  const seatRows = parseFloat(specs.interior?.seatRows) || 0;
  const cargoCapacity = parseFloat(specs.dimensions?.cargoCapacity) || 0;
  const wheelbase = parseFloat(specs.dimensions?.wheelbase) || 0;
  
  let spaceScore = 0;
  // Capacidad de pasajeros
  if (passengerCapacity >= 7) spaceScore += 15;
  else if (passengerCapacity >= 5) spaceScore += 10;
  else if (passengerCapacity >= 4) spaceScore += 6;
  else spaceScore += 3;
  
  // Filas de asientos
  if (seatRows >= 3) spaceScore += 10;
  else if (seatRows >= 2) spaceScore += 6;
  else spaceScore += 3;
  
  // Capacidad de carga
  if (cargoCapacity >= 1000) spaceScore += 5;
  else if (cargoCapacity >= 500) spaceScore += 3;
  else if (cargoCapacity >= 300) spaceScore += 2;
  else spaceScore += 1;
  
  score += Math.min(spaceScore / 30, 1) * 30;
  factors += 30;
  
  // 2. Seguridad (25%) - crítica para familias
  const safetyScore = calculateComprehensiveSafetyScore(vehicle, specs, features);
  score += safetyScore * 25;
  factors += 25;
  
  // 3. Confort (20%) - importante para viajes largos
  const comfortScore = calculateComprehensiveComfortScore(vehicle, specs, features);
  score += comfortScore * 20;
  factors += 20;
  
  // 4. Tipo de vehículo (15%)
  let typeScore = 0;
  if (vehicle.type === 'SUV') typeScore = 15;
  else if (vehicle.type === 'Sedán') typeScore = 12;
  else if (vehicle.type === 'Pickup') typeScore = 10;
  else if (vehicle.type === 'Hatchback') typeScore = 8;
  else if (vehicle.type === 'Deportivo') typeScore = 3;
  else typeScore = 6;
  
  score += typeScore;
  factors += 15;
  
  // 5. Features familiares (10%)
  let familyFeaturesScore = 0;
  if (specs.interior?.seatRows >= 3) familyFeaturesScore += 5; // Tercera fila
  if (specs.comfort?.segundaFilaCorrediza) familyFeaturesScore += 2; // Segunda fila corrediza
  if (specs.technology?.rearEntertainmentSystem) familyFeaturesScore += 3; // Entretenimiento trasero
  
  score += Math.min(familyFeaturesScore / 10, 1) * 10;
  factors += 10;
  
  // Normalizar
  return Math.max(0, Math.min(1, factors > 0 ? score / factors : 0.5));
}

// PRACTICALITY: Considera tamaño urbano, espacio de carga, versatilidad, eficiencia
function calculateComprehensivePracticalityScore(vehicle: any, specs: any, features: any): number {
  let score = 0;
  let factors = 0;
  
  // 1. Tamaño urbano (25%) - compacto pero funcional
  const length = parseFloat(specs.dimensions?.length) || 4500;
  const width = parseFloat(specs.dimensions?.width) || 1800;
  
  let urbanSizeScore = 0;
  // Longitud ideal para ciudad: 4200-4600mm
  if (length >= 4000 && length <= 4600) urbanSizeScore += 15;
  else if (length >= 3800 && length <= 4800) urbanSizeScore += 12;
  else if (length >= 3600 && length <= 5000) urbanSizeScore += 8;
  else urbanSizeScore += 5;
  
  // Ancho: no demasiado ancho para parqueo
  if (width <= 1850) urbanSizeScore += 10;
  else if (width <= 1950) urbanSizeScore += 7;
  else urbanSizeScore += 4;
  
  score += Math.min(urbanSizeScore / 25, 1) * 25;
  factors += 25;
  
  // 2. Espacio de carga (25%)
  const cargoCapacity = parseFloat(specs.dimensions?.cargoCapacity) || 0;
  const trunkCapacity = parseFloat(specs.interior?.trunkCapacitySeatsDown) || cargoCapacity;
  
  let cargoScore = 0;
  if (trunkCapacity >= 600) cargoScore = 25;
  else if (trunkCapacity >= 400) cargoScore = 20;
  else if (trunkCapacity >= 300) cargoScore = 15;
  else if (trunkCapacity >= 200) cargoScore = 10;
  else if (trunkCapacity >= 100) cargoScore = 5;
  else cargoScore = 2;
  
  score += cargoScore;
  factors += 25;
  
  // 3. Tipo de vehículo (20%)
  let typeScore = 0;
  if (vehicle.type === 'Hatchback') typeScore = 20; // Muy práctico
  else if (vehicle.type === 'SUV') typeScore = 18;
  else if (vehicle.type === 'Pickup') typeScore = 16;
  else if (vehicle.type === 'Sedán') typeScore = 12;
  else if (vehicle.type === 'Deportivo') typeScore = 5;
  else typeScore = 10;
  
  score += typeScore;
  factors += 20;
  
  // 4. Eficiencia (15%) - práctico = económico
  const efficiencyScore = calculateComprehensiveEfficiencyScore(vehicle, specs, features);
  score += efficiencyScore * 15;
  factors += 15;
  
  // 5. Versatilidad (10%) - múltiples usos
  let versatilityScore = 0;
  const passengerCapacity = parseFloat(specs.interior?.passengerCapacity) || 0;
  if (passengerCapacity >= 5) versatilityScore += 5;
  else versatilityScore += 3;
  
  if (cargoCapacity >= 300) versatilityScore += 5;
  else versatilityScore += 2;
  
  score += Math.min(versatilityScore / 10, 1) * 10;
  factors += 10;
  
  // 6. Features prácticos (5%)
  let practicalFeaturesScore = 0;
  if (specs.assistance?.parkingSensors) practicalFeaturesScore += 2;
  if (specs.assistance?.rearCamera) practicalFeaturesScore += 2;
  if (specs.assistance?.cameras360) practicalFeaturesScore += 1;
  
  score += Math.min(practicalFeaturesScore / 5, 1) * 5;
  factors += 5;
  
  // Normalizar
  return Math.max(0, Math.min(1, factors > 0 ? score / factors : 0.5));
}

// BEAUTY: Considera diseño, año, tipo, marca, características estéticas
function calculateComprehensiveBeautyScore(vehicle: any, specs: any, features: any): number {
  let score = 0;
  let factors = 0;
  
  // 1. Tipo de vehículo (30%) - algunos tipos son más atractivos
  let typeScore = 0;
  if (vehicle.type === 'Deportivo') typeScore = 30;
  else if (vehicle.type === 'Convertible') typeScore = 28;
  else if (vehicle.type === 'Sedán') typeScore = 20;
  else if (vehicle.type === 'SUV') typeScore = 18;
  else if (vehicle.type === 'Hatchback') typeScore = 15;
  else if (vehicle.type === 'Pickup') typeScore = 12;
  else typeScore = 10;
  
  score += typeScore;
  factors += 30;
  
  // 2. Año (25%) - más nuevo = diseño más moderno
  const currentYear = new Date().getFullYear();
  const age = currentYear - vehicle.year;
  let ageScore = 0;
  if (age <= 2) ageScore = 25;
  else if (age <= 4) ageScore = 22;
  else if (age <= 6) ageScore = 18;
  else if (age <= 8) ageScore = 14;
  else if (age <= 12) ageScore = 10;
  else ageScore = 6;
  
  score += ageScore;
  factors += 25;
  
  // 3. Marca (20%) - algunas marcas tienen mejor diseño
  const designBrands: Record<string, number> = {
    'Porsche': 20,
    'Audi': 19,
    'BMW': 18,
    'Mercedes': 17, 'Mercedes-Benz': 17,
    'Tesla': 16,
    'Lexus': 15,
    'Jaguar': 16,
    'Maserati': 19,
    'Ferrari': 20,
    'Lamborghini': 20,
    'McLaren': 20,
    'Mazda': 14,
    'Volvo': 13,
    'Genesis': 15,
  };
  const brandScore = designBrands[vehicle.brand] || 10;
  score += brandScore;
  factors += 20;
  
  // 4. Features estéticos (15%)
  let aestheticFeaturesScore = 0;
  if (specs.comfort?.techoPanoramico || specs.comfort?.sunroof) aestheticFeaturesScore += 5;
  if (specs.comfort?.iluminacionAmbiental) aestheticFeaturesScore += 3;
  if (specs.lighting?.ledHeadlights) aestheticFeaturesScore += 4;
  if (specs.lighting?.automaticHighBeam) aestheticFeaturesScore += 2;
  if (vehicle.type === 'Convertible') aestheticFeaturesScore += 1; // Bonificación adicional
  
  score += Math.min(aestheticFeaturesScore / 15, 1) * 15;
  factors += 15;
  
  // 5. Precio (10%) - vehículos más caros suelen tener mejor diseño
  const price = vehicle.price || 0;
  let priceScore = 0;
  if (price >= 200000000) priceScore = 10;
  else if (price >= 100000000) priceScore = 8;
  else if (price >= 50000000) priceScore = 6;
  else if (price >= 30000000) priceScore = 4;
  else priceScore = 2;
  
  score += priceScore;
  factors += 10;
  
  // Normalizar
  return Math.max(0, Math.min(1, factors > 0 ? score / factors : 0.5));
}

// Generate reasons for hybrid queries (objective filters + subjective preferences)
// MEJORADO: Prioriza mencionar filtros objetivos cumplidos, luego aspectos subjetivos
function generateHybridReasons(vehicle: any, intent: CategorizedIntent, rank: number, features: any, filtersApplied: string[]): string[] {
  const reasons: string[] = [];
  const objectiveFilters = intent.objective_filters;
  
  // 1. PRIMERO: Mencionar filtros objetivos cumplidos (más importante)
  if (objectiveFilters) {
    // Marca
    if (objectiveFilters.brands && objectiveFilters.brands.length > 0) {
      if (objectiveFilters.brands.includes(vehicle.brand)) {
        reasons.push(`Marca ${vehicle.brand} como solicitaste`);
      }
    }
    
    // Tipo de combustible
    if (objectiveFilters.fuel_types && objectiveFilters.fuel_types.length > 0) {
      if (objectiveFilters.fuel_types.includes(vehicle.fuelType)) {
        const fuelTypeName = vehicle.fuelType === 'Híbrido' ? 'híbrido' : 
                            vehicle.fuelType === 'Eléctrico' ? 'eléctrico' :
                            vehicle.fuelType === 'PHEV' ? 'híbrido enchufable' :
                            vehicle.fuelType.toLowerCase();
        reasons.push(`Tipo ${fuelTypeName} como solicitaste`);
      }
    }
    
    // Tipo de vehículo
    if (objectiveFilters.body_types && objectiveFilters.body_types.length > 0) {
      if (objectiveFilters.body_types.includes(vehicle.type)) {
        reasons.push(`Tipo ${vehicle.type} como solicitaste`);
      }
    }
    
    // Año
    if (objectiveFilters.year_range) {
      if (objectiveFilters.year_range.min === objectiveFilters.year_range.max) {
        reasons.push(`Año ${objectiveFilters.year_range.min} como solicitaste`);
      } else if (vehicle.year >= (objectiveFilters.year_range.min || 0) && 
                 vehicle.year <= (objectiveFilters.year_range.max || 9999)) {
        reasons.push(`Año ${vehicle.year} dentro del rango solicitado`);
      }
    }
    
    // Precio
    if (objectiveFilters.price_range) {
      const priceInMillions = (vehicle.price / 1000000).toFixed(1);
      if (objectiveFilters.price_range.min && objectiveFilters.price_range.max) {
        reasons.push(`Precio $${priceInMillions}M dentro del rango solicitado`);
      } else if (objectiveFilters.price_range.max) {
        reasons.push(`Precio $${priceInMillions}M dentro del presupuesto`);
      }
    }
    
    // Especificaciones técnicas
    if (objectiveFilters.technical_specs && objectiveFilters.technical_specs.length > 0) {
      objectiveFilters.technical_specs.slice(0, 1).forEach(spec => {
        if (spec.description) {
          reasons.push(spec.description);
        }
      });
    }
  }
  
  // 2. SEGUNDO: Agregar aspectos subjetivos relevantes (solo si hay subjective_weights Y hay espacio)
  // IMPORTANTE: Solo agregar razones subjetivas si el usuario realmente expresó preferencias subjetivas
  if (reasons.length < 3 && intent.subjective_weights) {
    const hasSignificantSubjectiveWeights = Object.values(intent.subjective_weights).some(
      (weight: any) => weight > 0.3
    );
    
    // Solo agregar razones subjetivas si hay pesos subjetivos significativos
    if (hasSignificantSubjectiveWeights) {
      const specs = vehicle.specifications ? JSON.parse(vehicle.specifications) : {};
      const weights = intent.subjective_weights || {};
      
      // Solo agregar razones subjetivas si son relevantes y válidas
      const topSubjectiveCriteria = Object.entries(weights)
        .filter(([_, weight]) => (weight as number) > 0.3)
        .sort(([_, a], [__, b]) => (b as number) - (a as number))
        .slice(0, 2);
      
      for (const [criteria, weight] of topSubjectiveCriteria) {
        if (reasons.length >= 3) break;
        
        let score = 0;
        let isValid = false;
        
        switch (criteria) {
          case 'comfort':
            score = calculateComprehensiveComfortScore(vehicle, specs, features);
            isValid = score > 0.6; // Solo si es realmente cómodo
            if (isValid && score > 0.7) {
              reasons.push('Muy cómodo para el día a día');
            }
            break;
          case 'family_friendly':
            score = calculateComprehensiveFamilyScore(vehicle, specs, features);
            isValid = score > 0.6;
            if (isValid && vehicle.type === 'SUV') {
              reasons.push('Ideal para familia y viajes');
            } else if (isValid) {
              reasons.push('Cómodo y seguro para familia');
            }
            break;
          case 'efficiency':
            score = calculateComprehensiveEfficiencyScore(vehicle, specs, features);
            isValid = score > 0.6;
            if (isValid && score > 0.7) {
              reasons.push('Excelente eficiencia de combustible');
            }
            break;
          case 'safety':
            score = calculateComprehensiveSafetyScore(vehicle, specs, features);
            isValid = score > 0.6;
            if (isValid) {
              reasons.push('Equipamiento de seguridad completo');
            }
            break;
          case 'reliability':
            score = calculateComprehensiveReliabilityScore(vehicle, specs, features);
            isValid = score > 0.65;
            if (isValid) {
              reasons.push('Alta confiabilidad y durabilidad');
            }
            break;
        }
      }
    }
  }
  
  // 3. Si no hay suficientes razones, agregar razones basadas en los filtros objetivos cumplidos
  if (reasons.length === 0) {
    // Si tenemos filtros objetivos pero no generamos razones, algo salió mal
    // Agregar razón genérica basada en que cumple los filtros
    if (objectiveFilters && (objectiveFilters.brands?.length > 0 || objectiveFilters.fuel_types?.length > 0)) {
      reasons.push('Cumple todos los criterios solicitados');
    } else if (rank === 1) {
      reasons.push('Mejor opción que cumple tus criterios');
    } else {
      reasons.push('Cumple todos los criterios solicitados');
    }
  }
  
  return reasons.slice(0, 3);
}

// Generate reasons for subjective recommendations
// MEJORADO: Verifica scores reales antes de generar razones
function generateSubjectiveReasons(vehicle: any, intent: CategorizedIntent, rank: number, features: any): string[] {
  const reasons: string[] = [];
  const weights = intent.subjective_weights || {};
  
  if (!features) {
    // Fallback si no hay features
    if (rank === 1) {
      reasons.push('Mejor coincidencia general para tus preferencias');
    }
    return reasons;
  }
  
  // Find top weighted criteria and verify scores
  const criteriaWithScores = Object.entries(weights)
    .filter(([_, weight]) => (weight as number) > 0.2) // Bajar threshold para considerar más criterios
    .map(([criteria, weight]) => {
      let score = 0;
      let isValid = false;
      
      // Usar las funciones comprehensivas para calcular scores reales
      const specs = vehicle.specifications ? JSON.parse(vehicle.specifications) : {};
      
    switch (criteria) {
        case 'sportiness':
          score = calculateComprehensiveSportinessScore(vehicle, specs, features);
          isValid = score > 0.4; // Más permisivo: aceptar si score > 40%
          break;
        case 'comfort':
          score = calculateComprehensiveComfortScore(vehicle, specs, features);
          isValid = score > 0.45; // Aceptar si score > 45%
          break;
        case 'efficiency':
          score = calculateComprehensiveEfficiencyScore(vehicle, specs, features);
          isValid = score > 0.4;
          break;
        case 'luxury':
        case 'status':
          score = calculateComprehensiveLuxuryScore(vehicle, specs, features);
          isValid = score > 0.4;
          break;
        case 'reliability':
          score = calculateComprehensiveReliabilityScore(vehicle, specs, features);
          isValid = score > 0.45;
          break;
        case 'safety':
          score = calculateComprehensiveSafetyScore(vehicle, specs, features);
          isValid = score > 0.45;
          break;
      case 'beauty':
          score = calculateComprehensiveBeautyScore(vehicle, specs, features);
          isValid = true; // Siempre válido para beauty (es subjetivo)
        break;
      case 'family_friendly':
          score = calculateComprehensiveFamilyScore(vehicle, specs, features);
          isValid = score > 0.4; // Más permisivo para family_friendly
          break;
        case 'practicality':
          score = calculateComprehensivePracticalityScore(vehicle, specs, features);
          isValid = score > 0.45;
          break;
        default:
          isValid = false;
      }
      
      return { criteria, weight: weight as number, score, isValid };
    })
    .filter(item => item.isValid) // Solo incluir criterios válidos
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3); // Tomar top 3 criterios válidos
  
  // Generar razones basadas en criterios válidos y scores reales
  criteriaWithScores.forEach(({ criteria, score, weight }) => {
    switch (criteria) {
      case 'beauty':
        if (vehicle.type === 'Deportivo') {
          reasons.push('Diseño deportivo y atractivo');
        } else if (vehicle.year >= 2020) {
          reasons.push('Diseño moderno y elegante');
        } else {
          reasons.push('Estética atractiva para su categoría');
        }
        break;
      case 'family_friendly':
        if (vehicle.type === 'SUV') {
          reasons.push('Amplio espacio para toda la familia');
        } else if (score > 0.6) {
          reasons.push('Cómodo y seguro para uso familiar');
        } else {
          reasons.push('Buena opción para uso familiar');
        }
        break;
      case 'sportiness':
        if (score > 0.7) {
        reasons.push('Excelente rendimiento deportivo');
        } else if (score > 0.5) {
          reasons.push('Buen rendimiento y potencia');
        } else {
          // No agregar razón si el score es bajo
          // Pero si weight es muy alto, decir algo más honesto
          if (weight > 0.7) {
            reasons.push('Rendimiento adecuado para uso diario');
          }
        }
        break;
      case 'comfort':
        if (score > 0.7) {
          reasons.push('Excelente comodidad para el día a día');
        } else if (score > 0.5) {
          reasons.push('Cómodo y práctico para uso diario');
        } else {
          reasons.push('Buena opción cómoda');
        }
        break;
      case 'luxury':
      case 'status':
        if (score > 0.7) {
        reasons.push('Características premium y acabados de lujo');
        } else if (score > 0.5) {
          reasons.push('Buen nivel de equipamiento y acabados');
        } else {
          reasons.push('Buen equilibrio calidad-precio');
        }
        break;
      case 'efficiency':
        if (score > 0.7) {
        reasons.push('Excelente eficiencia de combustible');
        } else if (score > 0.5) {
          reasons.push('Buen consumo de combustible');
        } else {
          reasons.push('Eficiencia adecuada');
        }
        break;
      case 'reliability':
        if (score > 0.7) {
          reasons.push('Alta confiabilidad y durabilidad');
        } else if (score > 0.5) {
          reasons.push('Buena confiabilidad');
        }
        break;
      case 'safety':
        if (score > 0.7) {
          reasons.push('Excelente seguridad y equipamiento');
        } else if (score > 0.5) {
          reasons.push('Buen equipamiento de seguridad');
        }
        break;
      case 'practicality':
        if (score > 0.7) {
          reasons.push('Muy práctico para uso urbano');
        } else if (score > 0.5) {
          reasons.push('Práctico y versátil');
        }
        break;
    }
  });
  
  // Si no hay razones válidas, agregar razones genéricas basadas en el ranking
  if (reasons.length === 0) {
  if (rank === 1) {
      reasons.push('Mejor coincidencia general para tus preferencias');
    } else if (rank === 2) {
      reasons.push('Excelente alternativa que cumple tus necesidades');
    } else {
      reasons.push('Buena opción dentro de tus preferencias');
    }
    
    // Agregar razón basada en tipo de vehículo si no hay otras
    if (vehicle.type === 'SUV') {
      reasons.push('Ideal para familia y viajes');
    } else if (vehicle.type === 'Sedán') {
      reasons.push('Cómodo y elegante');
    } else if (vehicle.type === 'Hatchback') {
      reasons.push('Práctico para ciudad');
    }
  } else if (rank === 1 && reasons.length < 3) {
    // Si es el #1 pero tiene pocas razones, agregar razón de ranking
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
