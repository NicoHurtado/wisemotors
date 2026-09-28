// Clasificación de la búsqueda con Claude (Haiku): filtros duros vs. intención.
import { z } from 'zod';
import { z as zv4 } from 'zod/v4';
import { prisma } from '@/lib/prisma';
import { pedirJson } from '@/lib/ai/claude';

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
  /** Marcas que pidió y no están en el catálogo ("Ferrari"): se avisan, no se filtran. */
  missing_brands: z.array(z.string()).optional(),
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

// Lo que Claude devuelve: plano y sin opcionales (la salida estructurada lo
// valida); abajo se traduce al CategorizedIntent que usa el resto del sistema.
const ClasificacionSchema = zv4.object({
  query_type: zv4.enum(['SUBJECTIVE_PREFERENCE', 'OBJECTIVE_FEATURE', 'HYBRID']),
  confidence: zv4.number().describe('0 a 1'),
  brands: zv4.array(zv4.string()).describe('Marcas mencionadas QUE ESTÁN en la lista de marcas, escritas como en la lista'),
  missing_brands: zv4.array(zv4.string()).describe('Marcas que el comprador nombró y NO están en la lista (p. ej. "Ferrari")'),
  body_types: zv4.array(zv4.string()).describe('Carrocerías pedidas, escritas como en la lista'),
  fuel_types: zv4.array(zv4.string()).describe('Combustibles pedidos, escritos como en la lista'),
  features: zv4.array(zv4.string()).describe('Equipamiento medible pedido: "Turbo", "4x4", "AWD", "Sunroof", "Cuero", "CarPlay", "Camara 360", "Blindado"'),
  year_min: zv4.number().nullable(),
  year_max: zv4.number().nullable(),
  price_min: zv4.number().nullable().describe('En pesos colombianos; solo si dio una cifra'),
  price_max: zv4.number().nullable().describe('En pesos colombianos; solo si dio una cifra'),
  subjective_context: zv4.string().describe('Lo cualitativo que pidió: "barato", "para la finca", "familiar", "que gaste poco"… Vacío si no hay.'),
  reasoning: zv4.string().describe('Una frase'),
});

/** Escribe cada valor como está en la base (mayúsculas y tildes), si existe. */
function canonico(valores: string[], opciones: string[]) {
  const norm = (x: string) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  return valores
    .map(v => opciones.find(o => norm(o) === norm(v)) ?? v)
    .filter((v, i, a) => v && a.indexOf(v) === i);
}

// Misma pregunta, misma respuesta: no se paga dos veces en una hora.
const cache = new Map<string, { hasta: number; valor: CategorizedIntent }>();
const UNA_HORA = 60 * 60 * 1000;

function sinIA(prompt: string, reasoning: string): CategorizedIntent {
  return {
    query_type: QueryType.SUBJECTIVE_PREFERENCE,
    confidence: 0,
    original_query: prompt,
    subjective_context: prompt,
    reasoning,
  };
}

export async function categorizeQuery(prompt: string): Promise<CategorizedIntent> {
  if (!process.env.ANTHROPIC_API_KEY) return sinIA(prompt, 'Sin ANTHROPIC_API_KEY: orden determinístico');

  const clave = prompt.trim().toLowerCase();
  const guardado = cache.get(clave);
  if (guardado && guardado.hasta > Date.now()) return guardado.valor;

  const db = await getDatabaseOptions();

  const system = `Analizas búsquedas de carros de compradores en Colombia (año ${new Date().getFullYear()}). Separas lo OBJETIVO (filtros duros de base de datos) de lo SUBJETIVO (lo que la IA usa para ordenar).

Opciones que existen en el catálogo:
- Marcas: ${db.brands.join(', ') || '(ninguna todavía)'}
- Carrocerías: ${db.bodyTypes.join(', ') || '(ninguna todavía)'}
- Combustibles: ${db.fuelTypes.join(', ') || '(ninguno todavía)'}

1. OBJETIVO (filtros): lo que el comprador dijo explícitamente.
   - Carrocería: si la nombra, ES filtro. "SUV", "camioneta" (en Colombia = SUV; y también Pickup si habla de platón, carga o trabajo), "sedán", "hatchback", "pickup". Escríbela EXACTAMENTE como en la lista.
   - Marca, combustible ("eléctrico", "híbrido", "diésel"): EXACTAMENTE como en las listas ("byd" → "BYD").
   - Precio: SOLO si hay cifra ("menos de 100 millones" → price_max 100000000; "entre 80 y 120 millones" → 80000000 y 120000000). "Barato" o "económico" NO son precio.
   - Año suelto ("2026") → year_min = year_max = 2026. "Nuevo" NO es año.
   - Equipamiento medible ("4x4", "turbo", "techo panorámico", "cámara 360") → features.
2. SUBJETIVO: las cualidades ("que no gaste mucho", "para la familia", "rápido", "pa la finca", "de lujo", "para subir a Las Palmas") → subjective_context, en las palabras del comprador.
3. query_type: OBJECTIVE_FEATURE si solo hay filtros ("Toyota Hilux diésel 2026"); SUBJECTIVE_PREFERENCE si solo hay cualidades ("un carro bueno pa la finca"); HYBRID si hay ambos ("una SUV que no gaste mucho", "Toyota barato").
Nunca conviertas una cualidad en filtro: "familiar" no es carrocería, "económico" no es combustible.`;

  try {
    const r = await pedirJson({ schema: ClasificacionSchema, modelo: 'haiku', maxTokens: 800, system, prompt });
    const rango = (min: number | null, max: number | null) =>
      min == null && max == null ? undefined : { ...(min != null ? { min } : {}), ...(max != null ? { max } : {}) };
    // "Camioneta" en Colombia es SUV; solo es pickup si habla de platón, carga o trabajo.
    // Regla en código: la IA a veces lo manda solo a Pickup y deja al comprador sin SUVs.
    let carrocerias = canonico(r.body_types, db.bodyTypes);
    const texto = prompt.toLowerCase();
    if (/camionet/.test(texto)) {
      const pickup = /plat[oó]n|carga|trabaj|pick ?-?up|volc/.test(texto);
      const suv = db.bodyTypes.find(t => t.toLowerCase() === 'suv') ?? 'SUV';
      const pu = db.bodyTypes.find(t => t.toLowerCase() === 'pickup') ?? 'Pickup';
      carrocerias = Array.from(new Set([...carrocerias.filter(t => t !== pu || pickup), suv, ...(pickup ? [pu] : [])]));
      if (r.query_type === 'SUBJECTIVE_PREFERENCE') r.query_type = 'HYBRID';
    }
    const valor: CategorizedIntent = {
      query_type: r.query_type as QueryType,
      confidence: Math.max(0, Math.min(1, r.confidence)),
      objective_filters: {
        brands: canonico(r.brands, db.brands),
        body_types: carrocerias,
        fuel_types: canonico(r.fuel_types, db.fuelTypes),
        features: r.features,
        year_range: rango(r.year_min, r.year_max),
        price_range: rango(r.price_min, r.price_max),
      },
      subjective_context: r.subjective_context || undefined,
      missing_brands: r.missing_brands.filter(m => !db.brands.some(b => b.toLowerCase() === m.toLowerCase())),
      original_query: prompt,
      reasoning: r.reasoning,
    };
    cache.set(clave, { hasta: Date.now() + UNA_HORA, valor });
    return valor;
  } catch (error) {
    console.error('Error clasificando la búsqueda con Claude:', error);
    return sinIA(prompt, 'Error de la IA: orden determinístico');
  }
}
