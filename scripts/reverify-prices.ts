// ============================================================================
// RE-VERIFICACIÓN DE PRECIOS ESTIMADOS YA PUBLICADOS.
//
// Los primeros vehículos se ingestaron ANTES de que existiera price-check.ts:
// sus precios son estimaciones sin contrastar (el Model Y quedó en $160M
// cuando arranca en ~$120M). Este script vuelve a pasar cada estimación por
// la verificación contra el catálogo real.
//
// Dry-run por defecto. Para aplicar:  npx tsx scripts/reverify-prices.ts --write
//
// Un precio con fuente (estimated:false) NO se toca nunca: la fuente manda.
// ============================================================================

import { prisma } from '../lib/prisma';
import { verificarPrecio } from '../lib/ingest/price-check';

const APLICAR = process.argv.includes('--write');

function millones(n: number): string {
  return `$${(n / 1_000_000).toFixed(1)}M`;
}

async function main() {
  const vehiculos = await prisma.vehicle.findMany({
    select: {
      id: true,
      brand: true,
      model: true,
      year: true,
      price: true,
      type: true,
      fuelType: true,
      specifications: true,
    },
    orderBy: { brand: 'asc' },
  });

  console.log(
    `\n${vehiculos.length} vehículos en catálogo. Modo: ${APLICAR ? 'APLICAR' : 'simulación (usa --write para guardar)'}\n`
  );

  let revisados = 0;
  let corregidos = 0;

  for (const v of vehiculos) {
    let specs: any = {};
    try {
      specs = typeof v.specifications === 'string' ? JSON.parse(v.specifications) : v.specifications ?? {};
    } catch {
      specs = {};
    }

    const comercial = specs.commercial ?? {};
    if (!comercial.priceEstimated) {
      console.log(`· ${v.brand} ${v.model} ${v.year}: precio con fuente, no se toca.`);
      continue;
    }

    revisados++;

    // Se re-verifica el precio TAL COMO ESTÁ hoy, con su razonamiento original.
    const resultado = await verificarPrecio(
      {
        value: v.price,
        estimated: true,
        reasoningEs: String(comercial.priceReasoningEs ?? ''),
        confidence: 0.5,
      },
      { brand: v.brand, model: v.model, year: v.year, type: v.type, fuelType: v.fuelType }
    );

    const nuevo = resultado.price.value;
    const cambio = nuevo !== v.price;

    console.log(`\n▸ ${v.brand} ${v.model} ${v.year}`);
    console.log(`  actual: ${millones(v.price)}${cambio ? ` → propuesto: ${millones(nuevo)}` : ' (se sostiene)'}`);
    if (resultado.comparables.length > 0) {
      console.log(
        `  comparables (${resultado.comparables.length}): ` +
          resultado.comparables.slice(0, 4).map(c => `${c.etiqueta} ${millones(c.precio)}`).join(', ')
      );
    }
    if (resultado.notaEs) console.log(`  nota: ${resultado.notaEs}`);

    if (!cambio) continue;
    corregidos++;

    if (!APLICAR) continue;

    specs.commercial = {
      ...comercial,
      priceCop: nuevo,
      priceEstimated: true,
      priceReasoningEs: resultado.price.reasoningEs,
      // Rastro de la corrección: el revisor tiene que poder ver de dónde venía.
      priceOriginalEstimate: resultado.precioOriginal ?? v.price,
      priceComparables: resultado.comparables.slice(0, 8),
      priceVerifiedAt: new Date().toISOString(),
    };

    await prisma.vehicle.update({
      where: { id: v.id },
      data: { price: nuevo, specifications: JSON.stringify(specs) },
    });
    console.log(`  ✔ guardado`);
  }

  console.log(
    `\nResumen: ${revisados} estimaciones revisadas, ${corregidos} con corrección propuesta.` +
      (APLICAR ? ' Aplicadas.' : ' Nada se guardó (simulación).')
  );

  await prisma.$disconnect();
}

main().catch(async e => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
