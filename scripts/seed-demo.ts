// ============================================================================
// Vehículos DEMO para desarrollo local.
//
// Sirve para ver el diseño con carros de verdad en la base (catálogo, ficha,
// comparador) cuando no hay acceso a las fuentes de la ingesta. NO es la
// ingesta: los datos salen del conocimiento general de Claude, son
// APROXIMADOS y quedan marcados como tales:
//   - Vehicle.history empieza con "DEMO"
//   - cada hecho: sourceTier 3, confianza 0.4, sin verificador
//   - precio marcado como estimado
//
// Se niega a correr contra una base que no sea local.
//
// Uso:  npx tsx --env-file=.env.local scripts/seed-demo.ts
//       npx tsx --env-file=.env.local scripts/seed-demo.ts --borrar   (quita los DEMO)
// ============================================================================

import { z } from 'zod/v4';
import { prisma } from '../lib/prisma';
import { pedirJson } from '../lib/ai/claude';
import { ATTRIBUTE_REGISTRY } from '../lib/attributes/registry';
import { publishDraft } from '../lib/ingest/publish';

const MARCA_DEMO = 'DEMO — datos aproximados para probar el diseño; no verificados.';

const CARROS: {
  brand: string;
  model: string;
  year: number;
  type: string;
  vehicleType: string;
  fuelType: string;
  foto?: string;
}[] = [
  { brand: 'Toyota', model: 'RAV4 Híbrida', year: 2026, type: 'SUV', vehicleType: 'Automóvil', fuelType: 'Híbrido', foto: '/images/demo/toyota-rav4.png' },
  { brand: 'BYD', model: 'Dolphin', year: 2026, type: 'Hatchback', vehicleType: 'Económico', fuelType: 'Eléctrico', foto: '/images/demo/byd-dolphin.png' },
  { brand: 'Chevrolet', model: 'Tracker RS', year: 2026, type: 'SUV', vehicleType: 'Automóvil', fuelType: 'Gasolina' },
  { brand: 'Renault', model: 'Duster', year: 2026, type: 'SUV', vehicleType: 'Automóvil', fuelType: 'Gasolina' },
  { brand: 'Mazda', model: 'CX-30', year: 2026, type: 'SUV', vehicleType: 'Automóvil', fuelType: 'Gasolina' },
  { brand: 'Mazda', model: '3 Sedán', year: 2026, type: 'Sedán', vehicleType: 'Automóvil', fuelType: 'Gasolina' },
  { brand: 'Kia', model: 'Picanto', year: 2026, type: 'Hatchback', vehicleType: 'Económico', fuelType: 'Gasolina' },
  { brand: 'Toyota', model: 'Hilux', year: 2026, type: 'Pickup', vehicleType: 'Todoterreno', fuelType: 'Diesel' },
  { brand: 'Tesla', model: 'Model Y', year: 2026, type: 'SUV', vehicleType: 'Automóvil', fuelType: 'Eléctrico' },
  { brand: 'Volkswagen', model: 'Polo Track', year: 2026, type: 'Hatchback', vehicleType: 'Económico', fuelType: 'Gasolina' },
];

function esLocal(url: string | undefined) {
  if (!url) return false;
  try {
    const h = new URL(url).hostname;
    return h === 'localhost' || h === '127.0.0.1';
  } catch {
    return false;
  }
}

const CATALOGO = ATTRIBUTE_REGISTRY.filter(d => d.coAvailability !== 'never_published' && d.key !== 'commercial.priceCop');

const DemoSchema = z.object({
  priceCop: z.number().describe('Precio de lista aproximado en Colombia, versión de entrada, COP completos'),
  facts: z.array(
    z.object({
      key: z.string(),
      value: z.union([z.number(), z.string(), z.boolean()]),
    })
  ),
});

async function sembrar(c: (typeof CARROS)[number]) {
  const catalogo = CATALOGO.map(d => `${d.key} | ${d.labelEs}${d.unit ? ` (${d.unit})` : ''} | ${d.dataType}`).join('\n');
  const r = await pedirJson({
    schema: DemoSchema,
    maxTokens: 12000,
    prompt: `Datos DEMO (aproximados, para probar un diseño web) del ${c.brand} ${c.model} ${c.year}, ${c.fuelType}, mercado Colombia.

Con tu conocimiento general, da los valores típicos de su versión de entrada SOLO para las keys de este catálogo que conozcas con razonable seguridad (unas 25-40). Números en la unidad indicada; booleanos solo si el equipamiento está presente (true). Omite lo que no sepas.

CATÁLOGO (key | etiqueta | tipo):
${catalogo}`,
  });

  const facts = r.facts
    .filter(f => CATALOGO.some(d => d.key === f.key))
    .filter(f => {
      const d = CATALOGO.find(x => x.key === f.key)!;
      if (d.dataType === 'numeric') {
        const n = Number(f.value);
        if (!Number.isFinite(n) || n <= 0) return false;
        if (d.expectedMin !== undefined && n < d.expectedMin) return false;
        if (d.expectedMax !== undefined && n > d.expectedMax) return false;
        f.value = n;
      }
      if (d.dataType === 'boolean') return f.value === true;
      return true;
    })
    .map(f => ({ key: f.key, value: f.value, confidence: 0.4, sourceTier: 3 }));

  const res = await publishDraft({
    brand: c.brand,
    model: c.model,
    year: c.year,
    type: c.type,
    vehicleType: c.vehicleType,
    fuelType: c.fuelType,
    price: Math.round(r.priceCop / 100_000) * 100_000,
    priceEstimated: true,
    priceReasoningEs: 'Precio DEMO aproximado: no verificado con el concesionario.',
    facts,
    verifiedBy: null,
  });
  if (!res.ok) throw new Error(res.error);

  await prisma.vehicle.update({ where: { id: res.vehicleId }, data: { history: MARCA_DEMO } });
  if (c.foto) {
    await prisma.vehicleImage.create({
      data: { vehicleId: res.vehicleId, url: c.foto, alt: `${c.brand} ${c.model}`, type: 'cover', isThumbnail: true },
    });
  }
  return `${c.brand} ${c.model}: ${facts.length} datos, $${Math.round(r.priceCop / 1e6)}M, cobertura ${Math.round(res.coverage * 100)}%`;
}

async function main() {
  if (!esLocal(process.env.DATABASE_URL)) {
    console.error('Solo corre contra una base local (localhost). Esto son datos DEMO.');
    process.exit(1);
  }

  if (process.argv.includes('--borrar')) {
    const r = await prisma.vehicle.deleteMany({ where: { history: { startsWith: 'DEMO' } } });
    console.log(`Borrados ${r.count} vehículos DEMO`);
    return;
  }

  // Los carros de prueba viejos (sin datos) estorban: mismo criterio.
  await prisma.vehicle.deleteMany({ where: { history: { in: ['DATO DE PRUEBA LOCAL'] } } });

  const pendientes = [...CARROS];
  const resultados: string[] = [];
  // 4 en paralelo: rápido sin pisar los límites de la API.
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (pendientes.length) {
        const c = pendientes.shift()!;
        try {
          resultados.push('✓ ' + (await sembrar(c)));
        } catch (e) {
          resultados.push(`✗ ${c.brand} ${c.model}: ${e instanceof Error ? e.message : e}`);
        }
      }
    })
  );
  console.log(resultados.join('\n'));
}

main().finally(() => prisma.$disconnect());
