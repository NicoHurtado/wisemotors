// NLU (Natural Language Understanding) para extraer intención estructurada
import { z } from 'zod';

// Schema para la intención estructurada
export const IntentSchema = z.object({
  use_case: z.enum([
    'ciudad', 'viajes_largos', 'finca', 'subir_palmas', 'trabajo', 
    'familia', 'deportivo', 'lujo', 'economico', 'estudiante'
  ]).optional(),
  
  hard_filters: z.object({
    seats_min: z.number().min(2).max(9).optional(),
    seats_max: z.number().min(2).max(9).optional(),
    fuel_type: z.enum(['Gasolina', 'Eléctrico', 'Híbrido', 'Diésel']).optional(),
    transmission: z.enum(['Manual', 'Automática', 'CVT']).optional(),
    budget_min: z.number().min(0).optional(),
    budget_max: z.number().min(0).optional(),
    body_type: z.enum(['Sedán', 'SUV', 'Hatchback', 'Pickup', 'Deportivo', 'Convertible']).optional(),
    year_min: z.number().min(1990).optional(),
    ground_clearance_min: z.number().min(100).optional(), // mm
  }).optional(),
  
  soft_weights: z.object({
    hill_climb: z.number().min(0).max(1).default(0), // Subir Palmas, pendientes
    comfort: z.number().min(0).max(1).default(0), // Comodidad, viajes largos
    efficiency: z.number().min(0).max(1).default(0), // Economía de combustible
    safety: z.number().min(0).max(1).default(0), // Seguridad familiar
    tech: z.number().min(0).max(1).default(0), // Tecnología moderna
    prestige: z.number().min(0).max(1).default(0), // Lujo, estatus
    cargo: z.number().min(0).max(1).default(0), // Espacio de carga
    potholes: z.number().min(0).max(1).default(0), // Resistencia a huecos
    urban: z.number().min(0).max(1).default(0), // Uso urbano, parqueo
    performance: z.number().min(0).max(1).default(0), // Deportividad, velocidad
  }),
  
  locale: z.object({
    region: z.enum(['Medellín', 'Antioquia', 'Colombia']).default('Medellín'),
    keywords: z.array(z.string()).default([]), // "Palmas", "Eje Cafetero", etc.
  }),
});

export type VehicleIntent = z.infer<typeof IntentSchema>;

// Function calling schema para OpenAI
export const extractIntentFunction = {
  name: 'extract_vehicle_intent',
  description: 'Extrae la intención estructurada de una búsqueda de vehículos en lenguaje natural',
  parameters: {
    type: 'object',
    properties: {
      use_case: {
        type: 'string',
        enum: ['ciudad', 'viajes_largos', 'finca', 'subir_palmas', 'trabajo', 'familia', 'deportivo', 'lujo', 'economico', 'estudiante'],
        description: 'Caso de uso principal identificado'
      },
      hard_filters: {
        type: 'object',
        properties: {
          seats_min: { type: 'number', minimum: 2, maximum: 9 },
          seats_max: { type: 'number', minimum: 2, maximum: 9 },
          fuel_type: { type: 'string', enum: ['Gasolina', 'Eléctrico', 'Híbrido', 'Diésel'] },
          transmission: { type: 'string', enum: ['Manual', 'Automática', 'CVT'] },
          budget_min: { type: 'number', minimum: 0 },
          budget_max: { type: 'number', minimum: 0 },
          body_type: { type: 'string', enum: ['Sedán', 'SUV', 'Hatchback', 'Pickup', 'Deportivo', 'Convertible'] },
          year_min: { type: 'number', minimum: 1990 },
          ground_clearance_min: { type: 'number', minimum: 100 }
        }
      },
      soft_weights: {
        type: 'object',
        properties: {
          hill_climb: { type: 'number', minimum: 0, maximum: 1, description: 'Importancia para subir pendientes/Palmas' },
          comfort: { type: 'number', minimum: 0, maximum: 1, description: 'Comodidad para viajes largos' },
          efficiency: { type: 'number', minimum: 0, maximum: 1, description: 'Economía de combustible' },
          safety: { type: 'number', minimum: 0, maximum: 1, description: 'Seguridad familiar' },
          tech: { type: 'number', minimum: 0, maximum: 1, description: 'Tecnología moderna' },
          prestige: { type: 'number', minimum: 0, maximum: 1, description: 'Lujo y estatus' },
          cargo: { type: 'number', minimum: 0, maximum: 1, description: 'Espacio de carga' },
          potholes: { type: 'number', minimum: 0, maximum: 1, description: 'Resistencia a huecos/calles destapadas' },
          urban: { type: 'number', minimum: 0, maximum: 1, description: 'Uso urbano, facilidad de parqueo' },
          performance: { type: 'number', minimum: 0, maximum: 1, description: 'Deportividad, velocidad' }
        },
        required: ['hill_climb', 'comfort', 'efficiency', 'safety', 'tech', 'prestige', 'cargo', 'potholes', 'urban', 'performance']
      },
      locale: {
        type: 'object',
        properties: {
          region: { type: 'string', enum: ['Medellín', 'Antioquia', 'Colombia'], default: 'Medellín' },
          keywords: { type: 'array', items: { type: 'string' }, description: 'Palabras clave detectadas como Palmas, Eje Cafetero, etc.' }
        }
      }
    },
    required: ['soft_weights', 'locale']
  }
};

export async function extractIntent(prompt: string): Promise<VehicleIntent> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY no configurada');
  }

  const systemPrompt = `Eres un experto en vehículos en Colombia, especialmente en Medellín y Antioquia. 
Tu trabajo es extraer la intención estructurada de búsquedas de vehículos en lenguaje natural.

Contexto regional importante:
- "Palmas" se refiere a Las Palmas (zona montañosa que requiere potencia para subir)
- "Eje Cafetero" implica viajes largos por carretera
- "Huecos" o "calles destapadas" requieren mayor altura libre
- Medellín tiene tráfico pesado (eficiencia importante)
- "Finca" implica terrenos difíciles, carga, robustez

Categorías WiseMotors:
- Cada vehículo tiene categorías únicas ingresadas manualmente (ej: "Bueno para correr", "Perfecto para las chicas", "Pa subir rápido")
- Estas categorías describen características especiales, usos recomendados, o personalidad del vehículo
- Debes interpretar inteligentemente qué significa cada categoría y cuándo es relevante recomendarla
- Las categorías pueden ser coloquiales, técnicas, o descriptivas

Analiza el prompt y extrae:
1. Filtros duros (requisitos obligatorios)
2. Pesos suaves (importancia relativa de cada característica, suma debe ser razonable)
3. Contexto regional, palabras clave, y detecta si el prompt coincide con alguna categoría WiseMotors`;

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
      functions: [extractIntentFunction],
      function_call: { name: 'extract_vehicle_intent' },
      temperature: 0.1
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const functionCall = data.choices[0]?.message?.function_call;
  
  if (!functionCall || functionCall.name !== 'extract_vehicle_intent') {
    throw new Error('No se pudo extraer la intención');
  }

  try {
    const rawIntent = JSON.parse(functionCall.arguments);
    return IntentSchema.parse(rawIntent);
  } catch (error) {
    console.error('Error parsing intent:', error);
    // Fallback con intención básica
    return {
      soft_weights: {
        hill_climb: 0.1,
        comfort: 0.1,
        efficiency: 0.2,
        safety: 0.1,
        tech: 0.1,
        prestige: 0.1,
        cargo: 0.1,
        potholes: 0.1,
        urban: 0.1,
        performance: 0.1
      },
      locale: {
        region: 'Medellín' as const,
        keywords: []
      }
    };
  }
}

