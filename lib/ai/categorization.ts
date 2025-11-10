// Advanced Query Categorization System
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Query types for different recommendation approaches
export enum QueryType {
  SUBJECTIVE_PREFERENCE = 'SUBJECTIVE_PREFERENCE', // Requires AI ranking, affinity-based (pretty, family-friendly, etc.)
  OBJECTIVE_FEATURE = 'OBJECTIVE_FEATURE',         // Show all matching vehicles (pickup, Mazda, 4 doors, etc.)
  HYBRID = 'HYBRID'                                // Mix of both (fast pickup, luxury SUV, etc.)
}

// Schema for categorized intent
export const CategorizedIntentSchema = z.object({
  query_type: z.nativeEnum(QueryType),
  confidence: z.number().min(0).max(1), // Confidence in categorization
  
  // Objective filters detected from database analysis
  objective_filters: z.object({
    brands: z.array(z.string()).optional(),
    body_types: z.array(z.string()).optional(),
    fuel_types: z.array(z.string()).optional(),
    transmissions: z.array(z.string()).optional(),
    door_count: z.number().optional(),
    seat_count: z.number().optional(),
    price_range: z.object({
      min: z.number().optional(),
      max: z.number().optional()
    }).optional(),
    year_range: z.object({
      min: z.number().optional(),
      max: z.number().optional()
    }).optional(),
    technical_specs: z.array(z.object({
      field_path: z.string(),
      operator: z.string(),
      value: z.any(),
      description: z.string()
    })).optional(),
    features: z.array(z.string()).optional(), // sunroof, leather, etc.
  }).optional(),
  
  // Subjective preferences (for ranking)
  subjective_weights: z.object({
    beauty: z.number().min(0).max(1).default(0),
    family_friendly: z.number().min(0).max(1).default(0),
    sportiness: z.number().min(0).max(1).default(0),
    luxury: z.number().min(0).max(1).default(0),
    reliability: z.number().min(0).max(1).default(0),
    efficiency: z.number().min(0).max(1).default(0),
    practicality: z.number().min(0).max(1).default(0),
    status: z.number().min(0).max(1).default(0),
    comfort: z.number().min(0).max(1).default(0),
    safety: z.number().min(0).max(1).default(0),
  }).optional(),
  
  // Regional context
  regional_context: z.object({
    location: z.string().default('Medellín'),
    specific_needs: z.array(z.string()).default([]), // "subir palmas", "huecos", etc.
  }).optional(),
  
  // Original query for context
  original_query: z.string(),
  
  // Explanation of categorization
  reasoning: z.string().optional(),
});

export type CategorizedIntent = z.infer<typeof CategorizedIntentSchema>;

// Function to create the function calling schema for OpenAI categorization
// This needs to be created dynamically with database options
function createCategorizeQueryFunction(dbOptions: any) {
  return {
    name: 'categorize_vehicle_query',
    description: 'Categoriza una consulta de vehículos y extrae filtros objetivos vs preferencias subjetivas',
    parameters: {
      type: 'object',
      properties: {
        query_type: {
          type: 'string',
          enum: ['SUBJECTIVE_PREFERENCE', 'OBJECTIVE_FEATURE', 'HYBRID'],
          description: 'Tipo de consulta: SUBJECTIVE_PREFERENCE para preferencias subjetivas que requieren ranking IA (bonito, familiar), OBJECTIVE_FEATURE para características específicas (pickup, Mazda, 4 puertas), HYBRID para mezcla de ambos'
        },
        confidence: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Confianza en la categorización (0-1)'
        },
        objective_filters: {
          type: 'object',
          description: 'OBLIGATORIO: Todos los filtros objetivos (marcas, tipos, años, precios, especificaciones técnicas) DEBEN ir dentro de este objeto. NO coloques year_range, price_range, brands, etc. en el nivel raíz. TODO debe ir dentro de objective_filters.',
          properties: {
            brands: {
              type: 'array',
              items: { type: 'string' },
              description: `Marcas EXACTAS de la base de datos. DEBES usar EXACTAMENTE uno de estos valores: ${dbOptions.brands.join(', ')}. NO inventes valores. Respeta mayúsculas y minúsculas exactamente.`
            },
            body_types: {
              type: 'array',
              items: { type: 'string' },
              description: `Tipos de carrocería EXACTOS de la base de datos. DEBES usar EXACTAMENTE uno de estos valores: ${dbOptions.bodyTypes.join(', ')}. NO inventes valores. Respeta mayúsculas y minúsculas exactamente.`
            },
            fuel_types: {
              type: 'array',
              items: { type: 'string' },
              description: `Tipos de combustible EXACTOS de la base de datos. DEBES usar EXACTAMENTE uno de estos valores: ${dbOptions.fuelTypes.join(', ')}. NO inventes valores. Si el usuario dice "híbrido", usa "Híbrido" (exacto). Si dice "diésel", verifica si existe "Diesel" o "Diésel" en la lista y usa el valor EXACTO.`
            },
            transmissions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tipo de transmisión (Manual, Automática)'
            },
            door_count: {
              type: 'number',
              description: 'Número específico de puertas'
            },
            seat_count: {
              type: 'number',
              description: 'Número específico de asientos'
            },
            price_range: {
              type: 'object',
              properties: {
                min: { type: 'number' },
                max: { type: 'number' }
              },
              description: 'Rango de precio específico mencionado'
            },
                    year_range: {
                      type: 'object',
                      properties: {
                        min: { type: 'number' },
                        max: { type: 'number' }
                      },
                      description: 'Rango de año específico. Si el usuario menciona un año exacto (ej: "2025", "carro 2025"), establece min y max al mismo valor para indicar año exacto. Si menciona un rango (ej: "2020-2023"), usa min y max diferentes. IMPORTANTE: Si el usuario dice "carro 2025", debe ser año EXACTO (min: 2025, max: 2025), NO un rango.'
                    },
            technical_specs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field_path: {
                    type: 'string',
                    description: 'Ruta del campo en especificaciones (ej: performance.acceleration0to100, combustion.turbo, dimensions.length)'
                  },
                  operator: {
                    type: 'string',
                    description: 'Operador de comparación: equals, greater_than, less_than, greater_equal, less_equal, contains'
                  },
                  value: {
                    description: 'Valor a comparar (número, boolean o string)'
                  },
                  description: {
                    type: 'string',
                    description: 'Descripción legible del filtro'
                  }
                },
                required: ['field_path', 'operator', 'value', 'description']
              },
              description: 'Especificaciones técnicas específicas y medibles extraídas de la consulta'
            },
            features: {
              type: 'array',
              items: { type: 'string' },
              description: 'Características específicas (techo solar, cuero, 4x4, etc.)'
            }
          }
        },
        subjective_weights: {
          type: 'object',
          properties: {
            beauty: { type: 'number', minimum: 0, maximum: 1, description: 'Importancia de apariencia/estética' },
            family_friendly: { type: 'number', minimum: 0, maximum: 1, description: 'Adecuado para familias' },
            sportiness: { type: 'number', minimum: 0, maximum: 1, description: 'Deportividad, velocidad' },
            luxury: { type: 'number', minimum: 0, maximum: 1, description: 'Lujo, premium' },
            reliability: { type: 'number', minimum: 0, maximum: 1, description: 'Confiabilidad, durabilidad' },
            efficiency: { type: 'number', minimum: 0, maximum: 1, description: 'Eficiencia de combustible' },
            practicality: { type: 'number', minimum: 0, maximum: 1, description: 'Practicidad, utilidad' },
            status: { type: 'number', minimum: 0, maximum: 1, description: 'Estatus social, prestigio' },
            comfort: { type: 'number', minimum: 0, maximum: 1, description: 'Comodidad de manejo y pasajeros' },
            safety: { type: 'number', minimum: 0, maximum: 1, description: 'Seguridad' }
          }
        },
        regional_context: {
          type: 'object',
          properties: {
            location: { type: 'string', default: 'Medellín' },
            specific_needs: {
              type: 'array',
              items: { type: 'string' },
              description: 'Necesidades regionales específicas (subir palmas, huecos, etc.)'
            }
          }
        },
        reasoning: {
          type: 'string',
          description: 'Explicación breve de por qué se eligió esta categorización'
        }
      },
      required: ['query_type', 'confidence', 'reasoning']
    }
  };
}

// Get available database options for objective filtering
export async function getDatabaseOptions() {
  try {
    const [brands, bodyTypes, fuelTypes, yearRange, priceRange] = await Promise.all([
      // Get distinct brands
      prisma.vehicle.findMany({
        select: { brand: true },
        distinct: ['brand'],
        orderBy: { brand: 'asc' }
      }),
      
      // Get distinct body types
      prisma.vehicle.findMany({
        select: { type: true },
        distinct: ['type'],
        orderBy: { type: 'asc' }
      }),
      
      // Get distinct fuel types
      prisma.vehicle.findMany({
        select: { fuelType: true },
        distinct: ['fuelType'],
        orderBy: { fuelType: 'asc' }
      }),
      
      // Get year range
      prisma.vehicle.aggregate({
        _min: { year: true },
        _max: { year: true }
      }),
      
      // Get price range
      prisma.vehicle.aggregate({
        _min: { price: true },
        _max: { price: true }
      })
    ]);

    return {
      brands: brands.map(v => v.brand).filter(Boolean),
      bodyTypes: bodyTypes.map(v => v.type).filter(Boolean),
      fuelTypes: fuelTypes.map(v => v.fuelType).filter(Boolean),
      yearRange: {
        min: yearRange._min.year || 2000,
        max: yearRange._max.year || new Date().getFullYear()
      },
      priceRange: {
        min: priceRange._min.price || 0,
        max: priceRange._max.price || 1000000000
      }
    };
  } catch (error) {
    console.error('Error getting database options:', error);
    return {
      brands: [],
      bodyTypes: [],
      fuelTypes: [],
      yearRange: { min: 2000, max: new Date().getFullYear() },
      priceRange: { min: 0, max: 1000000000 }
    };
  }
}

// Main categorization function
export async function categorizeQuery(prompt: string): Promise<CategorizedIntent> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  // Get database options for context
  const dbOptions = await getDatabaseOptions();
  
  if (!apiKey) {
    // Fallback to heuristic categorization
    return categorizeQueryHeuristic(prompt, dbOptions);
  }

  const systemPrompt = `Eres un experto en categorización de consultas automotrices. Tu trabajo es determinar si una consulta requiere:

1. SUBJECTIVE_PREFERENCE: Preferencias subjetivas, necesidades de uso o tareas específicas
   - Ejemplos: "bonito", "elegante", "para familia", "deportivo", "confiable", "que se vea bien"
   - Casos de uso: "trepar palmas", "para la finca", "trabajo pesado", "ciudad con huecos"
   - Requiere AI para ranking con métricas de afinidad
   - Muestra top 3 + más opciones ordenadas por afinidad

2. OBJECTIVE_FEATURE: Características técnicas específicas y medibles
   - Ejemplos: "pickup", "Mazda", "4 puertas", "eléctrico", "manual", "menos de $50M"
   - Especificaciones: "0-100 en menos de 5 segundos", "con turbo", "más de 300 HP", "tanque mayor a 50 litros"
   - CUALQUIER especificación técnica: potencia, torque, aceleración, velocidad, dimensiones, peso, consumo, etc.
   - Muestra TODOS los vehículos que cumplen el criterio EXACTO
   - Sin ranking de afinidad, solo filtrado directo con verificación de especificaciones

CAMPOS TÉCNICOS DISPONIBLES EN ESPECIFICACIONES:
- performance: acceleration0to100, acceleration0to200, maxSpeed, quarterMile, powerToWeight, launchControl
- combustion/hybrid/phev/electric: maxPower, maxTorque, displacement, turbo, fuelTankCapacity, cityConsumption, highwayConsumption
- dimensions: length, width, height, curbWeight, wheelbase, cargoCapacity
- safety: airbags, ncapRating, stabilityControl, tractionControl, autonomousEmergencyBraking
- comfort: airConditioning, automaticClimateControl, heatedSeats, ventilatedSeats, massageSeats
- technology: bluetooth, touchscreen, navigation, smartphoneIntegration, wirelessCharger
- chassis: groundClearance, brakingDistance100to0, maxLateralAcceleration, suspensionSetup
- interior: trunkCapacitySeatsDown, seatRows, passengerCapacity
- weight: payload, cargoBoxVolume, towingCapacity
- lighting: headlightType, automaticHighBeam
- assistance: brakeAssist, reverseCamera, hillStartAssist, parkingSensors, cameras360

3. HYBRID: Mezcla de ambos
   - Ejemplos: "pickup deportivo", "SUV de lujo", "Mazda económico"
   - Combina filtrado objetivo + ranking subjetivo

CONTEXTO DE BASE DE DATOS DISPONIBLE:
- Marcas: ${dbOptions.brands.join(', ')}
- Tipos: ${dbOptions.bodyTypes.join(', ')}
- Combustibles: ${dbOptions.fuelTypes.join(', ')}
- Años: ${dbOptions.yearRange.min}-${dbOptions.yearRange.max}
- Precios: $${(dbOptions.priceRange.min / 1000000).toFixed(1)}M - $${(dbOptions.priceRange.max / 1000000).toFixed(1)}M

REGLAS CRÍTICAS PARA FILTROS:
1. Si menciona especificaciones técnicas medibles (aceleración, potencia, velocidad), es OBJECTIVE_FEATURE
2. Si menciona actividades o necesidades subjetivas ("trepar palmas", "trabajo en finca"), es SUBJECTIVE_PREFERENCE
3. Si combina marca/tipo específico + adjetivo subjetivo, es HYBRID
4. Para OBJECTIVE_FEATURE: Los filtros deben ser EXACTOS y verificables en especificaciones
5. IMPORTANTE: Usa EXACTAMENTE los valores de combustibles que aparecen arriba. Si el usuario dice "híbrido", usa "Híbrido" (exacto como aparece en la lista de combustibles disponibles)
6. IMPORTANTE: Usa EXACTAMENTE los valores de tipos que aparecen arriba. Si el usuario dice "pickup", usa "Pickup" (exacto como aparece en la lista de tipos disponibles)
7. IMPORTANTE: Usa EXACTAMENTE los valores de marcas que aparecen arriba. Respeta mayúsculas y minúsculas exactamente como aparecen
8. CRÍTICO: Si el usuario menciona un AÑO (ej: "2025", "carro 2024", "del 2020"), SIEMPRE debe extraerse en year_range. Esto es OBLIGATORIO.
9. CRÍTICO: Si el usuario menciona un año específico sin rango (ej: "2025"), debe ser año EXACTO: year_range: {min: 2025, max: 2025}

DETECCIÓN AUTOMÁTICA DE CAMPOS - EXTRAE TODOS LOS FILTROS MENCIONADOS:
- Años: "2025", "carro 2024", "del 2020", "2020-2023" → year_range
- Precios: "menos de $50M", "más de $30M", "entre $40M y $60M" → price_range
- Marcas: CUALQUIER marca mencionada → brands
- Tipos: "SUV", "pickup", "sedán", "hatchback" → body_types
- Combustible: "híbrido", "eléctrico", "gasolina", "diésel" → fuel_types
- Transmisión: "manual", "automática", "CVT" → transmissions (si está disponible)
- Puertas: "4 puertas", "5 puertas" → door_count
- Asientos: "7 asientos", "5 plazas" → seat_count
- Especificaciones técnicas: CUALQUIER especificación técnica mencionada → technical_specs

EJEMPLOS DE DETECCIÓN AUTOMÁTICA:
- "Quiero un carro 2025" → year_range: {min: 2025, max: 2025} (AÑO EXACTO)
- "SUV híbrido 2024" → body_types: ["SUV"], fuel_types: ["Híbrido"], year_range: {min: 2024, max: 2024}
- "Mazda con turbo menos de $50M" → brands: ["Mazda"], price_range: {max: 50000000}, technical_specs: [{"field_path": "turbo", "operator": "equals", "value": true}]
- "Pickup 4 puertas diésel" → body_types: ["Pickup"], door_count: 4, fuel_types: ["Diesel"]
- "Carro eléctrico con más de 300 HP" → fuel_types: ["Eléctrico"], technical_specs: [{"field_path": "maxPower", "operator": "greater_than", "value": 300}]

EJEMPLOS DE TECHNICAL_SPECS (USA EXACTAMENTE ESTOS PATHS):
- "0-100 en menos de 5 segundos" → [{"field_path": "performance.acceleration0to100", "operator": "less_than", "value": 5, "description": "0-100 km/h en menos de 5 segundos"}]
- "con turbo" → [{"field_path": "turbo", "operator": "equals", "value": true, "description": "con turbo"}]
- "sin turbo" → [{"field_path": "turbo", "operator": "equals", "value": false, "description": "sin turbo"}]
  NOTA: Para turbo, usa "turbo" (sin prefijo) - el sistema buscará en powertrain.alimentacion y otros lugares
- "más de 300 HP" → [{"field_path": "maxPower", "operator": "greater_than", "value": 300, "description": "más de 300 HP"}]
  NOTA: Para potencia, usa "maxPower" (sin prefijo) - el sistema buscará en powertrain.potenciaMaxMotorTermico, etc.
- "tanque mayor a 50 litros" → [{"field_path": "fuelTankCapacity", "operator": "greater_than", "value": 50, "description": "tanque mayor a 50 litros"}]
- "peso menor a 1500 kg" → [{"field_path": "dimensions.curbWeight", "operator": "less_than", "value": 1500, "description": "peso menor a 1500 kg"}]
- "velocidad máxima mayor a 200 km/h" → [{"field_path": "performance.maxSpeed", "operator": "greater_than", "value": 200, "description": "velocidad máxima mayor a 200 km/h"}]

REGLAS PARA FIELD_PATHS:
1. Campos de performance: usa "performance.{campo}" (ej: "performance.acceleration0to100", "performance.maxSpeed")
2. Campos de dimensiones: usa "dimensions.{campo}" (ej: "dimensions.curbWeight", "dimensions.length")
3. Campos de motor (potencia, torque, turbo, etc.): usa solo el nombre del campo (ej: "maxPower", "turbo", "fuelTankCapacity") - el sistema buscará automáticamente en combustion, hybrid, phev, electric
4. Campos de seguridad: usa "safety.{campo}" (ej: "safety.airbags", "safety.ncapRating")
5. Campos de confort: usa "comfort.{campo}" (ej: "comfort.airConditioning", "comfort.heatedSeats")
6. Campos de tecnología: usa "technology.{campo}" (ej: "technology.bluetooth", "technology.touchscreen")

Analiza la consulta y extrae tanto filtros objetivos como pesos subjetivos apropiados.`;

  try {
    console.log(`[categorizeQuery] Categorizing query: "${prompt}"`);
    console.log(`[categorizeQuery] Database context:`, {
      brands: dbOptions.brands.length,
      bodyTypes: dbOptions.bodyTypes.length,
      fuelTypes: dbOptions.fuelTypes.length,
      yearRange: dbOptions.yearRange,
      priceRange: dbOptions.priceRange
    });
    
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
          { role: 'user', content: `Categoriza esta consulta: "${prompt}"` }
        ],
        functions: [createCategorizeQueryFunction(dbOptions)],
        function_call: { name: 'categorize_vehicle_query' },
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[categorizeQuery] OpenAI API Error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const functionCall = data.choices[0]?.message?.function_call;
    
    if (!functionCall || functionCall.name !== 'categorize_vehicle_query') {
      console.error('[categorizeQuery] Invalid function call:', functionCall);
      throw new Error('No se pudo categorizar la consulta');
    }

    const rawResult = JSON.parse(functionCall.arguments);
    console.log(`[categorizeQuery] AI raw response:`, JSON.stringify(rawResult, null, 2));
    
    // FIX: La IA a veces devuelve year_range en el nivel raíz en lugar de dentro de objective_filters
    // Necesitamos moverlo al lugar correcto antes de validar
    let parsedResult = { ...rawResult };
    
    // Si year_range está en el nivel raíz pero no en objective_filters, moverlo
    if (parsedResult.year_range && !parsedResult.objective_filters?.year_range) {
      console.log(`[categorizeQuery] Moving year_range from root to objective_filters`);
      if (!parsedResult.objective_filters) {
        parsedResult.objective_filters = {};
      }
      parsedResult.objective_filters.year_range = parsedResult.year_range;
      delete parsedResult.year_range;
    }
    
    // Si price_range está en el nivel raíz pero no en objective_filters, moverlo
    if (parsedResult.price_range && !parsedResult.objective_filters?.price_range) {
      console.log(`[categorizeQuery] Moving price_range from root to objective_filters`);
      if (!parsedResult.objective_filters) {
        parsedResult.objective_filters = {};
      }
      parsedResult.objective_filters.price_range = parsedResult.price_range;
      delete parsedResult.price_range;
    }
    
    // Si brands está en el nivel raíz pero no en objective_filters, moverlo
    if (parsedResult.brands && !parsedResult.objective_filters?.brands) {
      console.log(`[categorizeQuery] Moving brands from root to objective_filters`);
      if (!parsedResult.objective_filters) {
        parsedResult.objective_filters = {};
      }
      parsedResult.objective_filters.brands = parsedResult.brands;
      delete parsedResult.brands;
    }
    
    // Si body_types está en el nivel raíz pero no en objective_filters, moverlo
    if (parsedResult.body_types && !parsedResult.objective_filters?.body_types) {
      console.log(`[categorizeQuery] Moving body_types from root to objective_filters`);
      if (!parsedResult.objective_filters) {
        parsedResult.objective_filters = {};
      }
      parsedResult.objective_filters.body_types = parsedResult.body_types;
      delete parsedResult.body_types;
    }
    
    // Si fuel_types está en el nivel raíz pero no en objective_filters, moverlo
    if (parsedResult.fuel_types && !parsedResult.objective_filters?.fuel_types) {
      console.log(`[categorizeQuery] Moving fuel_types from root to objective_filters`);
      if (!parsedResult.objective_filters) {
        parsedResult.objective_filters = {};
      }
      parsedResult.objective_filters.fuel_types = parsedResult.fuel_types;
      delete parsedResult.fuel_types;
    }
    
    // Si technical_specs está en el nivel raíz pero no en objective_filters, moverlo
    if (parsedResult.technical_specs && !parsedResult.objective_filters?.technical_specs) {
      console.log(`[categorizeQuery] Moving technical_specs from root to objective_filters`);
      if (!parsedResult.objective_filters) {
        parsedResult.objective_filters = {};
      }
      parsedResult.objective_filters.technical_specs = parsedResult.technical_specs;
      delete parsedResult.technical_specs;
    }
    
    console.log(`[categorizeQuery] Parsed result after fixing structure:`, JSON.stringify(parsedResult, null, 2));
    
    const categorizedIntent = CategorizedIntentSchema.parse({
      ...parsedResult,
      original_query: prompt
    });

    console.log(`[categorizeQuery] Validated intent:`, {
      query_type: categorizedIntent.query_type,
      has_year_range: !!categorizedIntent.objective_filters?.year_range,
      year_range: categorizedIntent.objective_filters?.year_range,
      has_brands: !!categorizedIntent.objective_filters?.brands?.length,
      has_fuel_types: !!categorizedIntent.objective_filters?.fuel_types?.length,
      has_technical_specs: !!categorizedIntent.objective_filters?.technical_specs?.length,
      reasoning: categorizedIntent.reasoning
    });

    return categorizedIntent;

  } catch (error) {
    console.error('Error categorizing query:', error);
    return categorizeQueryHeuristic(prompt, dbOptions);
  }
}

// Heuristic fallback categorization
function categorizeQueryHeuristic(prompt: string, dbOptions: any): CategorizedIntent {
  const text = prompt.toLowerCase();
  
  // Check for specific brands
  const mentionedBrands = dbOptions.brands.filter((brand: string) => 
    text.includes(brand.toLowerCase())
  );
  
  // Check for specific body types
  const mentionedBodyTypes = dbOptions.bodyTypes.filter((type: string) => 
    text.includes(type.toLowerCase())
  );
  
  // Extract year from prompt (4-digit numbers between 2000 and current year + 2)
  const yearRegex = /\b(20[0-3][0-9])\b/g;
  const yearMatches = prompt.match(yearRegex);
  let yearRange: { min: number; max: number } | undefined;
  
  if (yearMatches && yearMatches.length > 0) {
    const years = yearMatches.map(y => parseInt(y)).filter(y => y >= 2000 && y <= new Date().getFullYear() + 2);
    if (years.length > 0) {
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      // If only one year or min === max, it's an exact year
      if (years.length === 1 || minYear === maxYear) {
        yearRange = { min: minYear, max: minYear };
        console.log(`[categorizeQueryHeuristic] Detected EXACT year: ${minYear}`);
      } else {
        yearRange = { min: minYear, max: maxYear };
        console.log(`[categorizeQueryHeuristic] Detected year range: ${minYear}-${maxYear}`);
      }
    }
  }
  
  // Extract price ranges (patterns like "menos de $50M", "más de $30M", "entre $40M y $60M")
  let priceRange: { min?: number; max?: number } | undefined;
  const pricePatterns = [
    { regex: /menos de \$?(\d+)\s*M/i, type: 'max' },
    { regex: /máximo \$?(\d+)\s*M/i, type: 'max' },
    { regex: /más de \$?(\d+)\s*M/i, type: 'min' },
    { regex: /mínimo \$?(\d+)\s*M/i, type: 'min' },
    { regex: /entre \$?(\d+)\s*M y \$?(\d+)\s*M/i, type: 'range' },
  ];
  
  for (const pattern of pricePatterns) {
    const match = prompt.match(pattern.regex);
    if (match) {
      if (pattern.type === 'max') {
        priceRange = { max: parseInt(match[1]) * 1000000 };
      } else if (pattern.type === 'min') {
        priceRange = { min: parseInt(match[1]) * 1000000 };
      } else if (pattern.type === 'range') {
        priceRange = { min: parseInt(match[1]) * 1000000, max: parseInt(match[2]) * 1000000 };
      }
      break;
    }
  }
  
  // Check for specific features
  const objectiveKeywords = [
    'pickup', 'suv', 'sedán', 'sedan', 'hatchback', 'deportivo', 'convertible',
    'manual', 'automática', 'automatica', 'eléctrico', 'electrico', 'híbrido', 'hibrido',
    'gasolina', 'diésel', 'diesel', 'puertas', 'asientos', 'plazas',
    // Technical specifications
    '0-100', '0 a 100', 'aceleración', 'aceleracion', 'segundos', 'turbo', 'hp', 'caballos',
    'potencia', 'velocidad máxima', 'velocidad maxima', 'km/h', 'tanque', 'litros', 'capacidad',
    'peso', 'kg', 'metros', 'altura', 'ancho', 'largo', 'consumo', 'airbags', 'tracción', 'frenos',
    'bluetooth', 'pantalla', 'navegación', 'navegacion', 'asientos', 'maletero', 'suspensión', 'suspension'
  ];
  
  const subjectiveKeywords = [
    'bonito', 'elegante', 'hermoso', 'lindo', 'feo', 'deportivo', 'rápido', 'rapido',
    'familia', 'familiar', 'cómodo', 'comodo', 'confiable', 'seguro', 'económico', 'economico',
    'barato', 'caro', 'lujo', 'premium', 'estatus', 'prestigio', 'moderno', 'clásico', 'clasico',
    // Regional and use case keywords
    'trepar palmas', 'subir palmas', 'finca', 'trabajo pesado', 'huecos', 'ciudad', 'campo',
    'montaña', 'terreno difícil', 'terreno dificil', 'carga pesada', 'remolque'
  ];
  
  // Year or price in query makes it objective
  const hasObjective = objectiveKeywords.some(keyword => text.includes(keyword)) || 
                     mentionedBrands.length > 0 || 
                     mentionedBodyTypes.length > 0 ||
                     !!yearRange ||
                     !!priceRange;
  
  const hasSubjective = subjectiveKeywords.some(keyword => text.includes(keyword));
  
  let queryType: QueryType;
  let confidence = 0.7;
  
  if (hasObjective && hasSubjective) {
    queryType = QueryType.HYBRID;
  } else if (hasObjective) {
    queryType = QueryType.OBJECTIVE_FEATURE;
    confidence = yearRange ? 0.9 : 0.8; // Higher confidence if year is detected
  } else {
    queryType = QueryType.SUBJECTIVE_PREFERENCE;
    confidence = 0.6;
  }
  
  return {
    query_type: queryType,
    confidence,
    objective_filters: hasObjective ? {
      brands: mentionedBrands.length > 0 ? mentionedBrands : undefined,
      body_types: mentionedBodyTypes.length > 0 ? mentionedBodyTypes : undefined,
      year_range: yearRange,
      price_range: priceRange,
    } : undefined,
    subjective_weights: hasSubjective ? {
      beauty: text.includes('bonito') || text.includes('elegante') ? 0.8 : 0,
      family_friendly: text.includes('familia') ? 0.8 : 0,
      sportiness: text.includes('deportivo') || text.includes('rápido') ? 0.8 : 0,
      efficiency: text.includes('económico') || text.includes('barato') ? 0.7 : 0,
      luxury: text.includes('lujo') || text.includes('premium') ? 0.8 : 0,
      reliability: 0,
      practicality: 0,
      status: 0,
      comfort: 0,
      safety: 0
    } : undefined,
    original_query: prompt,
    reasoning: `Heuristic categorization: ${hasObjective ? 'objective features' : ''} ${hasSubjective ? 'subjective preferences' : ''}`
  };
}
