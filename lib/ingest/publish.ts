// ============================================================================
// Escritura de un borrador aprobado a la base de datos.
//
// Vive aquí y no en el route handler para que la ruta de admin y los scripts
// de carga masiva usen exactamente el mismo camino: si la regla cambia, cambia
// en un solo lugar.
// ============================================================================

import { prisma } from '@/lib/prisma';
import { ATTRIBUTE_REGISTRY } from '@/lib/attributes/registry';
import { computeCoverage } from '@/lib/attributes/coverage';

export interface AcceptedFact {
  key: string;
  value: number | string | boolean;
  confidence: number;
  sourceTier: number;
  sourceUrl?: string;
}

export interface PublishInput {
  brand: string;
  model: string;
  year: number;
  type: string;
  vehicleType: string;
  fuelType: string;
  price: number;
  priceEstimated?: boolean;
  priceReasoningEs?: string;
  facts: AcceptedFact[];
  /** userId del revisor humano; null en cargas automáticas de prueba. */
  verifiedBy: string | null;
}

export type PublishResult =
  | { ok: true; vehicleId: string; factsWritten: number; coverage: number }
  | { ok: false; error: string; status: number };

/** a.b.c = 1 → { a: { b: { c: 1 } } } — las keys del registro SON paths del JSON. */
function nestByPath(facts: AcceptedFact[]): Record<string, any> {
  const specs: Record<string, any> = {};
  for (const f of facts) {
    const parts = f.key.split('.');
    let node = specs;
    for (let i = 0; i < parts.length - 1; i++) {
      node[parts[i]] = node[parts[i]] ?? {};
      node = node[parts[i]];
    }
    node[parts[parts.length - 1]] = f.value;
  }
  return specs;
}

export async function publishDraft(input: PublishInput): Promise<PublishResult> {
  const { brand, model, year, type, vehicleType, fuelType, price } = input;

  if (!brand || !model || !year || !type || !vehicleType || !fuelType) {
    return { ok: false, error: 'Identidad incompleta', status: 400 };
  }
  if (!Number.isFinite(price) || price <= 0) {
    return { ok: false, error: 'El precio es obligatorio para publicar', status: 400 };
  }

  const validKeys = new Set(ATTRIBUTE_REGISTRY.map(d => d.key));
  const clean = (input.facts ?? []).filter(
    f => validKeys.has(f.key) && f.value !== null && f.value !== undefined
  );

  const existing = await prisma.vehicle.findFirst({
    where: {
      brand: { equals: brand, mode: 'insensitive' },
      model: { equals: model, mode: 'insensitive' },
      year: Number(year),
    },
    select: { id: true },
  });
  if (existing) {
    return {
      ok: false,
      error: `Ya existe ${brand} ${model} ${year} (id ${existing.id})`,
      status: 409,
    };
  }

  const specs = nestByPath(clean);
  specs.commercial = specs.commercial ?? {};
  specs.commercial.priceCop = price;
  if (input.priceEstimated) {
    specs.commercial.priceEstimated = true;
    specs.commercial.priceReasoningEs = String(input.priceReasoningEs ?? '');
  }

  const coverage = computeCoverage(fuelType, new Set(clean.map(f => f.key)));

  const vehicle = await prisma.vehicle.create({
    data: {
      brand,
      model,
      year: Number(year),
      price,
      type,
      vehicleType,
      fuelType,
      specifications: JSON.stringify(specs),
      status: 'Disponible',
      coverageGlobal: coverage.global,
      coverageByDimension: JSON.stringify(coverage.byDimension),
      attributes: {
        create: clean.map(f => {
          const def = ATTRIBUTE_REGISTRY.find(d => d.key === f.key)!;
          return {
            attributeKey: f.key,
            valueNum: def.dataType === 'numeric' ? Number(f.value) : null,
            valueBool: def.dataType === 'boolean' ? Boolean(f.value) : null,
            valueText:
              def.dataType === 'text' || def.dataType === 'enum' ? String(f.value) : null,
            confidence: Math.max(0, Math.min(1, Number(f.confidence) || 0.5)),
            sourceTier: [1, 2, 3].includes(Number(f.sourceTier)) ? Number(f.sourceTier) : 3,
            sourceUrl: f.sourceUrl ? String(f.sourceUrl).slice(0, 500) : null,
            verifiedBy: input.verifiedBy,
            verifiedAt: input.verifiedBy ? new Date() : null,
          };
        }),
      },
    },
    select: { id: true },
  });

  return {
    ok: true,
    vehicleId: vehicle.id,
    factsWritten: clean.length,
    coverage: coverage.global,
  };
}
