// ============================================================================
// Extracción estructurada CONTRA EL REGISTRO (plan §5.1, paso 3).
//
// El LLM no inventa campos: recibe el catálogo de keys válidas del registro
// de atributos y solo puede devolver esas, cada una con su cita textual.
// Un valor sin cita se descarta.
// ============================================================================

import { ATTRIBUTE_REGISTRY } from '@/lib/attributes/registry';
import type { RawFact, SourceTier } from './types';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
/** Modelo económico para extracción; el presupuesto es ~15-25 llamadas por vehículo. */
const EXTRACT_MODEL = 'gpt-4o-mini';

// Solo atributos que se publican en Colombia y con keys válidas
const EXTRACTABLE = ATTRIBUTE_REGISTRY.filter(d => d.coAvailability !== 'never_published');
const VALID_KEYS = new Set(EXTRACTABLE.map(d => d.key));

const extractFunction = {
  name: 'report_extracted_specs',
  description: 'Reporta las especificaciones encontradas en el texto, solo keys del catálogo',
  parameters: {
    type: 'object',
    properties: {
      facts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description: 'Key EXACTA del catálogo de atributos proporcionado',
            },
            value: {
              description: 'Valor: número puro para numéricos (sin unidad), true/false para booleanos, string para texto/enum',
            },
            quote: {
              type: 'string',
              description: 'Cita textual (máx 140 caracteres) del fragmento del texto que respalda el valor',
            },
          },
          required: ['key', 'value', 'quote'],
        },
      },
    },
    required: ['facts'],
  },
};

function buildCatalog(): string {
  // Catálogo compacto: key | etiqueta | unidad esperada | tipo
  return EXTRACTABLE
    .map(d => `${d.key} | ${d.labelEs}${d.unit ? ` (${d.unit})` : ''} | ${d.dataType}`)
    .join('\n');
}

const SYSTEM_PROMPT = `Eres un extractor de especificaciones de vehículos para el mercado colombiano.

REGLAS ABSOLUTAS:
1. Solo reportas datos que estén EXPLÍCITOS en el texto. Nada de conocimiento propio, nada de estimaciones.
2. Solo usas keys del catálogo. Si un dato del texto no corresponde a ninguna key, lo ignoras.
3. Números en la unidad del catálogo: convierte si el texto usa otra (kW→HP: ×1.341; kgf·m→Nm: ×9.807; km/L→L/100km: 100÷valor). La conversión de unidades mal hecha es la fuente #1 de basura en datos automotores — verifica cada una.
4. Cada valor lleva su cita textual. Sin cita, no reportes el dato.
5. Si el texto da rangos o varias versiones, usa la versión de entrada (base) salvo que el contexto pida otra.
6. Precios en COP: repórtalos SOLO en la key 'commercial.priceCop' si el texto trae precio para Colombia. Un precio en USD o de otro país NO se reporta.
7. Que el texto NO mencione algo NO significa que el carro no lo tenga. Si no encuentras un dato, OMITE la key. Jamás reportes false ni 0 para decir "no aparece": eso afirma que el carro carece del equipamiento, que es una mentira distinta a no saberlo.`;

export async function extractFromPage(
  pageText: string,
  sourceUrl: string,
  tier: SourceTier,
  vehicleLabel: string
): Promise<RawFact[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY no está definida: la ingesta necesita el extractor.');

  const userPrompt = `VEHÍCULO OBJETIVO: ${vehicleLabel}

CATÁLOGO DE ATRIBUTOS (key | etiqueta | tipo):
${buildCatalog()}

TEXTO DE LA PÁGINA (${sourceUrl}):
"""
${pageText}
"""

Extrae las especificaciones del vehículo objetivo presentes en el texto. Si el texto habla de otro vehículo, no reportes nada.`;

  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: EXTRACT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      functions: [extractFunction],
      function_call: { name: 'report_extracted_specs' },
      temperature: 0,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI ${response.status} extrayendo de ${sourceUrl}`);
  }

  const data = await response.json();
  const call = data.choices?.[0]?.message?.function_call;
  if (!call?.arguments) return [];

  let parsed: any;
  try {
    parsed = JSON.parse(call.arguments);
  } catch {
    return [];
  }

  const facts: RawFact[] = [];
  for (const f of parsed.facts ?? []) {
    // El LLM no inventa campos: keys fuera del registro mueren aquí.
    if (!VALID_KEYS.has(f.key)) continue;
    if (f.value === null || f.value === undefined || f.value === '') continue;
    if (typeof f.quote !== 'string' || f.quote.trim() === '') continue;

    const def = EXTRACTABLE.find(d => d.key === f.key)!;
    let value: number | string | boolean = f.value;

    if (def.dataType === 'numeric') {
      const n = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
      if (!Number.isFinite(n)) continue;
      // Un 0 casi nunca es un dato leído: es el modelo rellenando el catálogo
      // cuando la página no traía especificaciones. Un carro con 0 airbags o
      // 0 estrellas NCAP es una afirmación grave, y ninguna ficha real la hace.
      if (n === 0) continue;
      value = n;
    } else if (def.dataType === 'boolean') {
      // Mismo criterio: "no lo encontré" NO es "no lo tiene". La ausencia se
      // representa con el hecho inexistente (eso es lo que mide la cobertura);
      // publicar `false` la convierte en una negación que nadie verificó.
      if (value !== true && value !== 'true' && value !== 'Sí' && value !== 'si') continue;
      value = true;
    } else {
      value = String(value).slice(0, 200);
    }

    facts.push({ key: f.key, value, quote: f.quote.slice(0, 160), sourceUrl, tier });
  }

  return facts;
}

/** Resolución de identidad canónica (plan §5.1, paso 1): una sola llamada. */
export async function resolveIdentity(
  brand: string,
  model: string,
  year: number,
  country: string
): Promise<{ brand: string; model: string; type: string; vehicleType: string; fuelType: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY no está definida.');

  const fn = {
    name: 'resolve_identity',
    description: 'Normaliza la identidad del vehículo a los valores canónicos',
    parameters: {
      type: 'object',
      properties: {
        brand: { type: 'string', description: 'Marca con capitalización oficial (ej. "Toyota", "BYD")' },
        model: { type: 'string', description: 'Modelo canónico SIN marca ni año (ej. "Corolla Cross")' },
        type: { type: 'string', enum: ['Sedán', 'SUV', 'Pickup', 'Deportivo', 'Wagon', 'Hatchback', 'Convertible'] },
        vehicleType: { type: 'string', enum: ['Automóvil', 'Deportivo', 'Todoterreno', 'Lujo', 'Económico'] },
        fuelType: {
          type: 'string',
          enum: ['Gasolina', 'Diesel', 'Eléctrico', 'Híbrido', 'Híbrido Enchufable'],
          description: 'Tren motriz de la versión MÁS VENDIDA en el país indicado',
        },
      },
      required: ['brand', 'model', 'type', 'vehicleType', 'fuelType'],
    },
  };

  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: EXTRACT_MODEL,
      messages: [
        {
          role: 'user',
          content: `Vehículo: ${brand} ${model} ${year}, mercado ${country}. Normaliza su identidad. Si el modelo tiene un nombre comercial distinto en ese mercado, usa el del mercado.`,
        },
      ],
      functions: [fn],
      function_call: { name: 'resolve_identity' },
      temperature: 0,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI ${response.status} resolviendo identidad`);
  const data = await response.json();
  const args = JSON.parse(data.choices?.[0]?.message?.function_call?.arguments ?? '{}');

  return {
    brand: args.brand || brand,
    model: args.model || model,
    type: args.type || 'Sedán',
    vehicleType: args.vehicleType || 'Automóvil',
    fuelType: args.fuelType || 'Gasolina',
  };
}
