// ============================================================================
// VERIFICACIÓN DEL PRECIO ESTIMADO.
//
// El error del Model Y (estimado en $160M cuando arranca en ~$120M) no fue
// culpa de la IA: fue culpa de haberla dejado estimar SIN ANCLAS. Un analista
// serio no tira un número al aire, lo contrasta contra lo que ya sabe.
//
// Aquí se hace lo mismo, en dos pasos:
//   1. Contraste determinístico contra el catálogo real y las bandas vigentes.
//   2. Si el número se sale del rango razonable, se le devuelve al modelo con
//      los comparables en la mano y se le pide reconsiderar.
//
// El resultado guarda SIEMPRE la primera estimación y el motivo del ajuste:
// el humano tiene que poder ver que hubo una corrección y por qué.
// ============================================================================

import { prisma } from '@/lib/prisma';
import type { PriceDraft } from './types';

/** Desviación contra la mediana de comparables que dispara una revisión. */
const UMBRAL_DESVIACION = 0.3;
/** Mínimo de comparables para que la mediana signifique algo. */
const MIN_COMPARABLES = 3;

export interface PriceCheck {
  /** Precio final tras la verificación. */
  price: PriceDraft;
  /** Qué encontró el contraste, en español, para mostrarlo en la revisión. */
  notaEs: string | null;
  /** Estimación original, si hubo corrección. */
  precioOriginal: number | null;
  comparables: { etiqueta: string; precio: number }[];
}

/** Rango físicamente posible para un carro nuevo en Colombia (COP). */
const COP_MIN = 30_000_000;
const COP_MAX = 3_000_000_000;

function millones(n: number): string {
  return `$${Math.round(n / 1_000_000)}M`;
}

/**
 * El modelo a veces responde "85" queriendo decir 85 millones. Un precio de
 * $85 pesos se publicaría igual de callado que uno correcto, así que aquí se
 * normaliza lo que es obviamente una cifra en millones y se rechaza el resto.
 * Devuelve null si el número no es defendible: es preferible quedarse con la
 * estimación anterior que guardar una cifra absurda.
 */
export function normalizarCop(valor: unknown): number | null {
  const n = Number(valor);
  if (!Number.isFinite(n) || n <= 0) return null;

  // Respuesta expresada en millones (o en miles de millones)
  const escalado = n < 10_000 ? n * 1_000_000 : n;

  if (escalado < COP_MIN || escalado > COP_MAX) return null;
  return Math.round(escalado);
}

function mediana(valores: number[]): number {
  const s = [...valores].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export async function verificarPrecio(
  price: PriceDraft,
  identidad: { brand: string; model: string; year: number; type: string; fuelType: string }
): Promise<PriceCheck> {
  // Un precio con fuente verificable no se toca: la fuente manda.
  if (!price.estimated) {
    return { price, notaEs: null, precioOriginal: null, comparables: [] };
  }

  // ── 1. Anclas del catálogo real ──
  const [mismoSegmento, mismaMarca, bandas] = await Promise.all([
    prisma.vehicle.findMany({
      where: { type: identidad.type, fuelType: identidad.fuelType, status: 'Disponible' },
      select: { brand: true, model: true, year: true, price: true },
      take: 40,
    }),
    prisma.vehicle.findMany({
      where: { brand: { equals: identidad.brand, mode: 'insensitive' } },
      select: { brand: true, model: true, year: true, price: true },
      take: 20,
    }),
    prisma.priceBand.findMany({ where: { validTo: null }, orderBy: { minPrice: 'asc' } }),
  ]);

  // El propio vehículo NO puede ser su propio comparable: si ya está publicado
  // con esta estimación, dejarlo entrar hace que el precio se valide a sí mismo.
  const yoMismo = `${identidad.brand}-${identidad.model}-${identidad.year}`.toLowerCase();
  const vistos = new Set<string>();
  const comparables = [...mismoSegmento, ...mismaMarca]
    .filter(v => {
      const clave = `${v.brand}-${v.model}-${v.year}`.toLowerCase();
      if (clave === yoMismo) return false;
      if (vistos.has(clave)) return false;
      vistos.add(clave);
      return true;
    })
    .map(v => ({ etiqueta: `${v.brand} ${v.model} ${v.year}`, precio: v.price }));

  const banda = bandas.find(
    b => price.value >= b.minPrice && (b.maxPrice == null || price.value < b.maxPrice)
  );

  // ── 2. Catálogo insuficiente: se contrasta igual, con las bandas de mercado ──
  // Rendirse aquí sería lo cómodo, pero es justo el caso del catálogo nuevo:
  // sin comparables propios TODAS las estimaciones pasarían sin revisar.
  if (comparables.length < MIN_COMPARABLES) {
    const revisado = await reconsiderarConAnclas(price, identidad, comparables, null, bandas);

    if (!revisado || revisado.value === price.value) {
      return {
        price: {
          ...(revisado ?? price),
          reasoningEs:
            (revisado ?? price).reasoningEs +
            `\n\nSolo ${comparables.length} comparables en el catálogo: el contraste se hizo contra ` +
            `las bandas de precio vigentes (${banda?.labelEs ?? 'sin clasificar'}). ` +
            `Verificar contra el concesionario.`,
        },
        notaEs: `Catálogo con solo ${comparables.length} comparables: contrastado contra bandas de mercado, no contra vehículos.`,
        precioOriginal: null,
        comparables,
      };
    }

    return {
      price: revisado,
      notaEs:
        `Sin comparables suficientes (${comparables.length}), el contraste contra las bandas de mercado ` +
        `corrigió la estimación de ${millones(price.value)} a ${millones(revisado.value)}.`,
      precioOriginal: price.value,
      comparables,
    };
  }

  // ── 3. ¿Se sale de lo razonable? ──
  const med = mediana(comparables.map(c => c.precio));
  const desviacion = Math.abs(price.value - med) / med;

  if (desviacion <= UMBRAL_DESVIACION) {
    return {
      price: {
        ...price,
        confidence: Math.min(0.7, price.confidence + 0.1),
        reasoningEs:
          price.reasoningEs +
          `\n\nContrastado contra ${comparables.length} comparables del catálogo ` +
          `(mediana ${millones(med)}): la estimación queda dentro del rango esperado.`,
      },
      notaEs: null,
      precioOriginal: null,
      comparables,
    };
  }

  // ── 4. Se sale: se le devuelve al modelo con los comparables en la mano ──
  const revisado = await reconsiderarConAnclas(price, identidad, comparables, med, bandas);

  return {
    price: revisado ?? {
      ...price,
      confidence: Math.max(0.2, price.confidence - 0.2),
      reasoningEs:
        price.reasoningEs +
        `\n\nATENCIÓN: se desvía ${Math.round(desviacion * 100)}% de la mediana de ` +
        `${comparables.length} comparables (${millones(med)}). Verificar antes de publicar.`,
    },
    notaEs:
      `La primera estimación (${millones(price.value)}) se desviaba ` +
      `${Math.round(desviacion * 100)}% de la mediana de comparables (${millones(med)}).`,
    precioOriginal: price.value,
    comparables,
  };
}

/** Segunda pasada: mismo modelo, pero con los precios reales del catálogo delante. */
async function reconsiderarConAnclas(
  original: PriceDraft,
  identidad: { brand: string; model: string; year: number; type: string; fuelType: string },
  comparables: { etiqueta: string; precio: number }[],
  med: number | null,
  bandas: { labelEs: string; minPrice: number; maxPrice: number | null }[]
): Promise<PriceDraft | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const listaComparables =
    comparables.length > 0
      ? comparables
          .slice(0, 12)
          .map(c => `- ${c.etiqueta}: ${millones(c.precio)}`)
          .join('\n')
      : '(el catálogo todavía no tiene comparables útiles para este segmento)';

  const listaBandas = bandas
    .map(
      b =>
        `- ${b.labelEs}: ${millones(b.minPrice)}${b.maxPrice ? ` a ${millones(b.maxPrice)}` : ' en adelante'}`
    )
    .join('\n');

  const fn = {
    name: 'reconsiderar_precio',
    description: 'Revisa la estimación con los comparables reales delante',
    parameters: {
      type: 'object',
      properties: {
        priceCop: { type: 'number', description: 'Precio corregido en COP, versión de entrada' },
        reasoning: {
          type: 'string',
          description:
            'Español, 2-3 frases: por qué se mantiene o se corrige, citando comparables concretos',
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
      },
      required: ['priceCop', 'reasoning', 'confidence'],
    },
  };

  try {
    const respuesta = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: `Estimaste el ${identidad.brand} ${identidad.model} ${identidad.year} (${identidad.fuelType}, ${identidad.type}) en ${millones(original.value)} para Colombia.

${
  med != null
    ? `Ese número se desvía de la mediana de comparables reales del catálogo (${millones(med)}).`
    : 'El catálogo aún no tiene suficientes comparables, así que hay que contrastar contra las bandas de mercado.'
}

COMPARABLES REALES DEL CATÁLOGO:
${listaComparables}

BANDAS DE PRECIO VIGENTES EN COLOMBIA:
${listaBandas}

REFERENCIAS DE MERCADO COLOMBIA H1-2026:
- Los 10 modelos más vendidos cotizan entre $75M y $136M en versión de entrada
- Tesla Model Y: se vende oficialmente en Colombia desde $119,9M (fue el SUV eléctrico más vendido)
- El más barato del mercado (FAW Bestune Xiaoma): ~$47M
- Renault Kwid: desde ~$56M
- Toyota Hilux: desde ~$150M en versión de entrada
- Un SUV compacto de marca masiva rara vez pasa de $140M en versión de entrada

REGLAS:
1. Usa SIEMPRE el precio de la VERSIÓN DE ENTRADA, no el tope de gama. Ese es el error más común y el que más daño hace.
2. No asumas que el modelo se importa por cuenta propia: muchas marcas que parecen ausentes sí tienen distribución oficial en Colombia. Solo suma arancel e IVA si estás seguro de que no se vende localmente.
3. Si tu estimación estaba mal, corrígela sin defenderla. Si estaba bien, sostenla y explica qué justifica el nivel.`,
          },
        ],
        functions: [fn],
        function_call: { name: 'reconsiderar_precio' },
        temperature: 0.1,
      }),
    });

    if (!respuesta.ok) return null;
    const datos = await respuesta.json();
    const args = JSON.parse(datos.choices?.[0]?.message?.function_call?.arguments ?? '{}');

    // Si la cifra no pasa el saneo, se descarta la corrección entera: la
    // estimación previa, aunque discutible, al menos es del orden correcto.
    const corregido = normalizarCop(args.priceCop);
    if (corregido === null) return null;

    const cambio = corregido !== original.value;

    return {
      value: corregido,
      estimated: true,
      confidence: Math.min(0.65, Number(args.confidence) || 0.4),
      reasoningEs:
        (cambio
          ? `Corregido de ${millones(original.value)} a ${millones(corregido)} tras contrastar con el catálogo. `
          : `Sostenido en ${millones(corregido)} tras contrastar con el catálogo. `) +
        String(args.reasoning ?? ''),
    };
  } catch {
    return null;
  }
}
