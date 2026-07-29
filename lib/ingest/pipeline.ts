// ============================================================================
// Orquestador de la ingesta (plan §5.1):
//   identidad → fuentes → fetch → extracción → reconciliación → validación
//   → precio (encontrado o ESTIMADO con razonamiento) → borrador
//
// El borrador NO toca la base de datos. La publicación es otra llamada,
// después de que el humano acepte o rechace campo por campo.
// ============================================================================

import { ATTRIBUTE_REGISTRY } from '@/lib/attributes/registry';
import { fetchPageText } from './fetcher';
import { discoverSources } from './sources';
import { extractFromPage, resolveIdentity } from './extract';
import type { DraftFact, PriceDraft, RawFact, VehicleDraft } from './types';

const PRICE_KEY = 'commercial.priceCop';
/** Discrepancia relativa entre fuentes que marca conflicto (plan §5.1 paso 4). */
const CONFLICT_THRESHOLD = 0.10;

// ---------------------------------------------------------------------------
// Reconciliación multi-fuente: gana el mejor tier; el resto queda como
// alternativa visible. Numéricos con >10% de diferencia → bandera de conflicto.
// ---------------------------------------------------------------------------
function reconcile(raw: RawFact[]): DraftFact[] {
  const byKey = new Map<string, RawFact[]>();
  for (const f of raw) {
    const list = byKey.get(f.key) ?? [];
    list.push(f);
    byKey.set(f.key, list);
  }

  const drafts: DraftFact[] = [];

  byKey.forEach((facts, key) => {
    const def = ATTRIBUTE_REGISTRY.find(d => d.key === key);
    if (!def) return;

    // Mejor tier primero; a igual tier, el primero encontrado
    const sorted = [...facts].sort((a, b) => a.tier - b.tier);
    const winner = sorted[0];
    const others = sorted.slice(1);

    let conflict = false;
    if (def.dataType === 'numeric') {
      const w = winner.value as number;
      conflict = others.some(o => {
        const v = o.value as number;
        return w !== 0 && Math.abs(v - w) / Math.abs(w) > CONFLICT_THRESHOLD;
      });
    } else {
      conflict = others.some(o => o.value !== winner.value);
    }

    // Validación física (plan §5.1 paso 5): fuera de rango se marca, no se esconde
    let outOfRange = false;
    if (def.dataType === 'numeric') {
      const v = winner.value as number;
      if (def.expectedMin !== undefined && v < def.expectedMin) outOfRange = true;
      if (def.expectedMax !== undefined && v > def.expectedMax) outOfRange = true;
    }

    // Confianza: base por tier, castigada por conflicto o rango imposible
    const tierBase = winner.tier === 1 ? 0.95 : winner.tier === 2 ? 0.8 : 0.5;
    const agreementBonus = others.length > 0 && !conflict ? 0.05 : 0;
    const confidence = Math.max(
      0.1,
      Math.min(1, tierBase + agreementBonus - (conflict ? 0.3 : 0) - (outOfRange ? 0.4 : 0))
    );

    drafts.push({
      key,
      labelEs: def.labelEs,
      unit: def.unit,
      displayGroup: def.displayGroup,
      value: winner.value,
      confidence: Math.round(confidence * 100) / 100,
      sourceUrl: winner.sourceUrl,
      tier: winner.tier,
      quote: winner.quote,
      conflict,
      outOfRange,
      alternatives: others
        .filter(o => o.value !== winner.value)
        .slice(0, 3)
        .map(o => ({ value: o.value, sourceUrl: o.sourceUrl, tier: o.tier })),
    });
  });

  // Orden estable para la UI: grupo → prioridad del registro
  const priority = new Map(ATTRIBUTE_REGISTRY.map(d => [d.key, d.displayPriority]));
  return drafts.sort((a, b) => {
    if (a.displayGroup !== b.displayGroup) return a.displayGroup.localeCompare(b.displayGroup);
    return (priority.get(b.key) ?? 0) - (priority.get(a.key) ?? 0);
  });
}

// ---------------------------------------------------------------------------
// Precio: de fuentes si existe; si no, ESTIMACIÓN con razonamiento explícito.
// (Regla original del plan era no estimar nunca; decisión de producto del
// 28-jul-2026: se permite estimar, marcado como estimación, con razonamiento
// visible, y SIEMPRE sujeto a aprobación humana antes de publicar.)
// ---------------------------------------------------------------------------
async function resolvePrice(
  facts: DraftFact[],
  identity: { brand: string; model: string; year: number; fuelType: string; type: string }
): Promise<{ price: PriceDraft | null; remainingFacts: DraftFact[] }> {
  const priceFact = facts.find(f => f.key === PRICE_KEY);
  const remainingFacts = facts.filter(f => f.key !== PRICE_KEY);

  if (priceFact && typeof priceFact.value === 'number' && !priceFact.outOfRange) {
    return {
      price: {
        value: priceFact.value,
        estimated: false,
        reasoningEs: `Precio encontrado en fuente tier ${priceFact.tier}: "${priceFact.quote}"`,
        sourceUrl: priceFact.sourceUrl,
        confidence: priceFact.confidence,
      },
      remainingFacts,
    };
  }

  // Estimación razonada con el modelo grande (una sola llamada)
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { price: null, remainingFacts };

  const fn = {
    name: 'estimate_price',
    description: 'Estima el precio en COP con razonamiento explícito',
    parameters: {
      type: 'object',
      properties: {
        priceCop: { type: 'number', description: 'Precio estimado en pesos colombianos (versión de entrada)' },
        reasoning: {
          type: 'string',
          description: 'Razonamiento en español, 2-4 frases: contra qué rivales del mercado colombiano se ancla la estimación y por qué',
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
      },
      required: ['priceCop', 'reasoning', 'confidence'],
    },
  };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: `Estima el precio de lista en Colombia (COP, versión de entrada) del ${identity.brand} ${identity.model} ${identity.year} (${identity.fuelType}, ${identity.type}).

Ancla el razonamiento en rivales directos que SÍ se venden en Colombia y sus precios conocidos (H1-2026: los 10 más vendidos cotizan entre $75M y $136M base; Tesla Model Y desde $119,99M; el más barato del mercado ~$47M). Ajusta por segmento, tren motriz y posicionamiento de marca. Si el modelo no se vende en Colombia, estima el precio que tendría al importarse (incluye arancel e IVA) y dilo en el razonamiento.`,
          },
        ],
        functions: [fn],
        function_call: { name: 'estimate_price' },
        temperature: 0.2,
      }),
    });

    if (!response.ok) return { price: null, remainingFacts };
    const data = await response.json();
    const args = JSON.parse(data.choices?.[0]?.message?.function_call?.arguments ?? '{}');
    if (!args.priceCop || !Number.isFinite(args.priceCop)) return { price: null, remainingFacts };

    return {
      price: {
        value: Math.round(args.priceCop),
        estimated: true,
        reasoningEs: String(args.reasoning ?? 'Sin razonamiento — revisar manualmente.'),
        confidence: Math.min(0.6, Number(args.confidence) || 0.4), // una estimación nunca supera 0.6
      },
      remainingFacts,
    };
  } catch {
    return { price: null, remainingFacts };
  }
}

// ---------------------------------------------------------------------------
// Pipeline completo
// ---------------------------------------------------------------------------
export async function runIngestPipeline(input: {
  brand: string;
  model: string;
  year: number;
  country: string;
}): Promise<VehicleDraft> {
  const warningsEs: string[] = [];

  // 1. Identidad canónica
  const identity = await resolveIdentity(input.brand, input.model, input.year, input.country);
  const label = `${identity.brand} ${identity.model} ${input.year} (mercado ${input.country})`;

  // 2. Fuentes por tier
  const candidates = await discoverSources(identity.brand, identity.model, input.year);
  if (candidates.length === 0) {
    warningsEs.push('No se encontraron fuentes candidatas. Revisar el nombre del modelo.');
  }

  // 3+4. Fetch + extracción (fuentes en paralelo, máx 5)
  const sourcesReport: VehicleDraft['sourcesReport'] = [];
  const rawFacts: RawFact[] = [];

  const toProcess = candidates.slice(0, 6);
  const results = await Promise.allSettled(
    toProcess.map(async source => {
      const text = await fetchPageText(source.url);
      if (!text || text.length < 300) {
        return { source, facts: [] as RawFact[], ok: false, note: 'Página vacía, inaccesible o bloqueada por robots.txt' };
      }
      const facts = await extractFromPage(text, source.url, source.tier, label);
      return { source, facts, ok: true, note: `${facts.length} datos extraídos` };
    })
  );

  for (const r of results) {
    if (r.status === 'fulfilled') {
      sourcesReport.push({ url: r.value.source.url, nameEs: r.value.source.nameEs, tier: r.value.source.tier, ok: r.value.ok, note: r.value.note });
      rawFacts.push(...r.value.facts);
    } else {
      warningsEs.push(`Una fuente falló: ${String(r.reason).slice(0, 120)}`);
    }
  }

  const okSources = sourcesReport.filter(s => s.ok).length;
  if (okSources === 0) {
    warningsEs.push('Ninguna fuente respondió con contenido útil. El borrador está vacío: no publicar.');
  } else if (okSources === 1) {
    warningsEs.push('Solo una fuente respondió: sin reconciliación multi-fuente, revisar con más cuidado.');
  }

  // 5. Reconciliación + validación
  const allFacts = reconcile(rawFacts);
  const conflicted = allFacts.filter(f => f.conflict).length;
  if (conflicted > 0) warningsEs.push(`${conflicted} campos tienen fuentes en desacuerdo (marcados en la revisión).`);
  const impossible = allFacts.filter(f => f.outOfRange).length;
  if (impossible > 0) warningsEs.push(`${impossible} campos quedaron fuera del rango físico esperado (desmarcados por defecto).`);

  // 6. Precio
  const { price, remainingFacts } = await resolvePrice(allFacts, { ...identity, year: input.year });
  if (price?.estimated) {
    warningsEs.push('El precio es una ESTIMACIÓN (ninguna fuente lo traía). Verificar antes de publicar.');
  } else if (!price) {
    warningsEs.push('Sin precio: ni encontrado ni estimable. Hay que ponerlo a mano.');
  }

  return {
    brand: identity.brand,
    model: identity.model,
    year: input.year,
    country: input.country,
    type: identity.type,
    vehicleType: identity.vehicleType,
    fuelType: identity.fuelType,
    price,
    facts: remainingFacts,
    sourcesReport,
    warningsEs,
  };
}
