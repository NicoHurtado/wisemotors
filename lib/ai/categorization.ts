// Advanced Query Categorization System
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Query types for different recommendation approaches
export enum QueryType {
  SUBJECTIVE_PREFERENCE = 'SUBJECTIVE_PREFERENCE', // Pure subjective (e.g., "carro bonito", "pa la finca")
  OBJECTIVE_FEATURE = 'OBJECTIVE_FEATURE',         // Pure objective (e.g., "Toyota 2025", "diesel 4x4")
  HYBRID = 'HYBRID'                                // Mixed (e.g., "Toyota barato", "camioneta diesel para trocha")
}

// Schema for categorized intent
export const CategorizedIntentSchema = z.object({
  query_type: z.nativeEnum(QueryType),
  confidence: z.number().min(0).max(1),

  // OBJECTIVE: Hard filters for database query
  objective_filters: z.object({
    brands: z.array(z.string()).optional(),
    body_types: z.array(z.string()).optional(),
    fuel_types: z.array(z.string()).optional(),
    transmissions: z.array(z.string()).optional(),
    door_count: z.number().optional(),
    seat_count: z.number().optional(),
    year_range: z.object({
      min: z.number().optional(),
      max: z.number().optional()
    }).optional(),
    price_range: z.object({
      min: z.number().optional(),
      max: z.number().optional()
    }).optional(),
    features: z.array(z.string()).optional(), // Keywords like "Turbo", "4x4", "Cuero", "Sunroof"
  }).optional(),

  // SUBJECTIVE: Context for the LLM to rank results
  subjective_context: z.string().optional(), // "barato", "para trocha", "status", etc.

  // Original query for fallback
  original_query: z.string(),
  reasoning: z.string().optional(),
});

export type CategorizedIntent = z.infer<typeof CategorizedIntentSchema>;

// Get available options for strict filtering
export async function getDatabaseOptions() {
  try {
    const [brands, bodyTypes, fuelTypes, yearRange, priceRange] = await Promise.all([
      prisma.vehicle.findMany({ select: { brand: true }, distinct: ['brand'], orderBy: { brand: 'asc' } }),
      prisma.vehicle.findMany({ select: { type: true }, distinct: ['type'], orderBy: { type: 'asc' } }),
      prisma.vehicle.findMany({ select: { fuelType: true }, distinct: ['fuelType'], orderBy: { fuelType: 'asc' } }),
      prisma.vehicle.aggregate({ _min: { year: true }, _max: { year: true } }),
      prisma.vehicle.aggregate({ _min: { price: true }, _max: { price: true } })
    ]);

    return {
      brands: brands.map(v => v.brand).filter(Boolean),
      bodyTypes: bodyTypes.map(v => v.type).filter(Boolean),
      fuelTypes: fuelTypes.map(v => v.fuelType).filter(Boolean),
      yearRange: {
        min: yearRange._min.year || 2000,
        max: yearRange._max.year || new Date().getFullYear() + 1
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

function createCategorizeFunction(dbOptions: any) {
  return {
    name: 'categorize_query',
    description: 'Separates objective database filters from subjective ranking intent.',
    parameters: {
      type: 'object',
      properties: {
        query_type: {
          type: 'string',
          enum: ['SUBJECTIVE_PREFERENCE', 'OBJECTIVE_FEATURE', 'HYBRID'],
          description: 'HYBRID if mostly objective but has ANY subjective adjective (cheap, good, fast). OBJECTIVE if purely technical specs. SUBJECTIVE if purely abstract.'
        },
        objective_filters: {
          type: 'object',
          description: 'STRICT Hard filters that MUST be applied to the database.',
          properties: {
            brands: {
              type: 'array', items: { type: 'string' },
              description: `EXACT brands from: ${dbOptions.brands.join(', ')}`
            },
            body_types: {
              type: 'array', items: { type: 'string' },
              description: `EXACT body types from: ${dbOptions.bodyTypes.join(', ')}`
            },
            fuel_types: {
              type: 'array', items: { type: 'string' },
              description: `EXACT fuel types from: ${dbOptions.fuelTypes.join(', ')}`
            },
            year_range: {
              type: 'object',
              properties: { min: { type: 'number' }, max: { type: 'number' } },
              description: 'Year range. If single year mentioned (e.g. 2025) use min=max=2025.'
            },
            price_range: {
              type: 'object',
              properties: { min: { type: 'number' }, max: { type: 'number' } },
              description: 'Price range in COP. Only if specific numbers mentioned (e.g. "menos de 50M"). IGNORE "barato/caro".'
            },
            door_count: { type: 'number' },
            seat_count: { type: 'number' },
            features: {
              type: 'array',
              items: { type: 'string' },
              description: 'Technical quantifiable features: "Turbo", "4x4", "AWD", "Sunroof", "Cuero", "Blindado", "Hibrido", "Electrico", "Automatico" (if not in transmission field)'
            }
          }
        },
        subjective_context: {
          type: 'string',
          description: 'The subjective part of the request to be handled by AI ranking (e.g. "barato", "para trocha", "deportivo", "bueno para familias").'
        },
        confidence: { type: 'number' },
        reasoning: { type: 'string' }
      },
      required: ['query_type', 'confidence', 'reasoning']
    }
  };
}

export async function categorizeQuery(prompt: string): Promise<CategorizedIntent> {
  const apiKey = process.env.OPENAI_API_KEY;
  const dbOptions = await getDatabaseOptions();

  if (!apiKey) {
    // Basic fallback
    return {
      query_type: QueryType.SUBJECTIVE_PREFERENCE,
      confidence: 0.5,
      original_query: prompt,
      subjective_context: prompt,
      reasoning: "No API key, fallback"
    };
  }

  const systemPrompt = `You are a vehicle query analyzer for the Colombian market (2026 Context).
  
  YOUR GOAL: Split the user query into OBECTIVE HARD FILTERS and SUBJECTIVE INTENT context.
  
  1. OBJECTIVE FILTERS (Database):
     - Only extract checks for specific Brand, Year, Fuel Type, Body Type, Transmission, Doors, Seats.
     - Brand Extraction: You MUST normalize the brand case to match the provided list EXACTLY (e.g., "byd" -> "BYD", "mazda" -> "Mazda", "bmw" -> "BMW").
     - Price: ONLY extract if specific numbers are given (e.g., "menos de 50 millones").
     - TECHNICAL FEATURES: Extract specific measurable features into 'features' array:
       - Induction: "Turbo", "Twin Turbo", "Supercharger"
       - Drivetrain: "4x4", "AWD", "4WD"
       - Interior: "Cuero", "Sunroof", "Techo panoramico", "7 puestos"
       - Tech: "CarPlay", "Android Auto", "Camara 360", "Blindado"
     - IGNORE subjective equivalents here (e.g., "barato", "nuevo", "rápido" -> DO NOT filter these in database, send to SUBJECTIVE).
  
  2. SUBJECTIVE CONTEXT (AI Ranking):
     - Extract any qualitative keywords: "barato", "económico", "rápido", "trocha", "familiar", "lujo", "status".
     - This string will be passed to an LLM to rank the filtered results.
  
  3. QUERY TYPE:
     - OBJECTIVE_FEATURE: Only hard filters, no subjective terms (e.g. "Toyota Hilux 2025 diesel").
     - SUBJECTIVE_PREFERENCE: Only subjective terms (e.g. "carro bueno para finca").
     - HYBRID: Both (e.g. "Toyota barato", "Camioneta diesel economica", "BYD comodo").
  
  CRITICAL: "Barato" is SUBJECTIVE. Do not invent a price range unless numbers are explicit.
  CRITICAL: "Nuevo" is SUBJECTIVE (implies recent years but let the AI deciding ranking handle it unless "2026" is explicit).
  `;

  try {
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
          { role: 'user', content: prompt }
        ],
        functions: [createCategorizeFunction(dbOptions)],
        function_call: { name: 'categorize_query' },
        temperature: 0.1
      })
    });

    if (!response.ok) throw new Error('OpenAI API Error');
    const data = await response.json();
    const args = JSON.parse(data.choices[0].message.function_call.arguments);

    // Normalization fixes as before (ensure correct root structure vs nested is handled if model hallucinates structure, 
    // though schema enforcement helps)

    return {
      ...args,
      original_query: prompt
    };

  } catch (error) {
    console.error("Categorization error:", error);
    return {
      query_type: QueryType.SUBJECTIVE_PREFERENCE,
      original_query: prompt,
      confidence: 0,
      subjective_context: prompt,
      reasoning: "Error fallback"
    };
  }
}

