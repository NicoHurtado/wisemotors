// ============================================================================
// Exporta los vehículos de una base local a data/semillas/vehiculos-iniciales.json
// para cargarlos en producción SIN volver a llamar a la IA (scripts/preparar-bd.ts
// los siembra una sola vez). Conserva los hechos con su fuente, tier y confianza.
//
// Uso: npx tsx --env-file=.env.local scripts/exportar-semilla.ts
// ============================================================================

import { writeFileSync } from 'node:fs';
import { prisma } from '../lib/prisma';

async function main() {
  const vehiculos = await prisma.vehicle.findMany({
    where: { history: { startsWith: 'DEMO' } },
    include: { attributes: true, images: true },
    orderBy: { createdAt: 'asc' },
  });
  const salida = vehiculos.map(v => {
    const specs = typeof v.specifications === 'string' ? JSON.parse(v.specifications) : v.specifications;
    return {
      brand: v.brand,
      model: v.model,
      year: v.year,
      type: v.type,
      vehicleType: v.vehicleType,
      fuelType: v.fuelType,
      price: v.price,
      priceEstimated: Boolean(specs?.commercial?.priceEstimated),
      priceReasoningEs: specs?.commercial?.priceReasoningEs ?? '',
      history: v.history,
      fotos: v.images.map(i => ({ url: i.url, alt: i.alt })),
      facts: v.attributes.map(a => ({
        key: a.attributeKey,
        value: a.valueNum ?? a.valueBool ?? a.valueText,
        confidence: a.confidence,
        sourceTier: a.sourceTier,
        sourceUrl: a.sourceUrl ?? undefined,
      })),
    };
  });
  writeFileSync('data/semillas/vehiculos-demo.json', JSON.stringify(salida, null, 1));
  console.log(`${salida.length} vehículos exportados → data/semillas/vehiculos-demo.json`);
  for (const v of salida) console.log(`  ${v.brand} ${v.model} ${v.year}: ${v.facts.length} datos, $${Math.round(v.price / 1e6)}M, fotos ${v.fotos.length}`);
  await prisma.$disconnect();
}
main();
