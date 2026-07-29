import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';
import { ATTRIBUTE_REGISTRY } from '@/lib/attributes/registry';
import { computeCoverage } from '@/lib/attributes/coverage';

export const dynamic = 'force-dynamic';

interface AcceptedFact {
  key: string;
  value: number | string | boolean;
  confidence: number;
  sourceTier: number;
  sourceUrl?: string;
}

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

// POST /api/admin/ingest/publish — crea el vehículo con SOLO los hechos que
// el humano aceptó. Escribe VehicleAttribute (fuente y confianza por fila) y
// el JSON specifications equivalente para compatibilidad con el buscador actual.
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { brand, model, year, type, vehicleType, fuelType, price, priceEstimated, priceReasoningEs, facts } = body ?? {};

    if (!brand || !model || !year || !type || !vehicleType || !fuelType) {
      return NextResponse.json({ error: 'Identidad incompleta (brand/model/year/type/vehicleType/fuelType)' }, { status: 400 });
    }
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      return NextResponse.json({ error: 'El precio es obligatorio para publicar (puede ser el estimado aceptado)' }, { status: 400 });
    }

    const accepted: AcceptedFact[] = Array.isArray(facts) ? facts : [];
    const validKeys = new Set(ATTRIBUTE_REGISTRY.map(d => d.key));
    const clean = accepted.filter(f => validKeys.has(f.key) && f.value !== null && f.value !== undefined);

    // Duplicado exacto: mejor avisar que crear dos fichas del mismo carro
    const existing = await prisma.vehicle.findFirst({
      where: { brand: { equals: brand, mode: 'insensitive' }, model: { equals: model, mode: 'insensitive' }, year: Number(year) },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Ya existe ${brand} ${model} ${year} (id ${existing.id}). Edítalo en vez de duplicarlo.` },
        { status: 409 }
      );
    }

    const specs = nestByPath(clean);
    // La procedencia del precio queda en el JSON: la ficha puede mostrar
    // "precio estimado" hasta que un humano lo verifique con fuente T1.
    specs.commercial = specs.commercial ?? {};
    specs.commercial.priceCop = priceNum;
    if (priceEstimated) {
      specs.commercial.priceEstimated = true;
      specs.commercial.priceReasoningEs = String(priceReasoningEs ?? '');
    }

    const coverage = computeCoverage(fuelType, new Set(clean.map(f => f.key)));

    const vehicle = await prisma.vehicle.create({
      data: {
        brand,
        model,
        year: Number(year),
        price: priceNum,
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
              valueText: def.dataType === 'text' || def.dataType === 'enum' ? String(f.value) : null,
              confidence: Math.max(0, Math.min(1, Number(f.confidence) || 0.5)),
              sourceTier: [1, 2, 3].includes(Number(f.sourceTier)) ? Number(f.sourceTier) : 3,
              sourceUrl: f.sourceUrl ? String(f.sourceUrl).slice(0, 500) : null,
              // La aceptación en la revisión ES la verificación humana
              verifiedBy: auth.userId,
              verifiedAt: new Date(),
            };
          }),
        },
      },
      select: { id: true, brand: true, model: true, year: true, coverageGlobal: true },
    });

    return NextResponse.json({ vehicle, factsWritten: clean.length });
  } catch (error) {
    console.error('Error publicando vehículo ingestado:', error);
    return NextResponse.json({ error: 'Error interno publicando el vehículo' }, { status: 500 });
  }
}
