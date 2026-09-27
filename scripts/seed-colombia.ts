// ============================================================================
// Seed de tablas de contexto Colombia:
// Los datos viven en lib/db/semillas.ts (también los usa el deploy).
//  - price_bands: bandas de precio H2-2026, calibradas con mercado real.
//    Se recalibran CADA SEMESTRE: se cierra la vigencia de las actuales
//    (validTo) y se insertan las nuevas. Nunca se editan en caliente.
//  - brand_perception_co: percepción de marca curada. ESTOS VALORES SON UN
//    PUNTO DE PARTIDA EDITORIAL — ajústenlos con el criterio de la casa.
//
// Uso: npx tsx scripts/seed-colombia.ts --write
// ============================================================================

import { PrismaClient } from '@prisma/client';
import { BRAND_PERCEPTION, PRICE_BANDS, sembrarBandas, sembrarPercepcion } from '../lib/db/semillas';

const prisma = new PrismaClient();
const WRITE = process.argv.includes('--write');
const M = 1_000_000; // COP (para imprimir)

async function main() {
  console.log(`\n=== Seed tablas Colombia (${WRITE ? 'WRITE' : 'DRY-RUN'}) ===`);

  // ---- Bandas de precio: cerrar vigentes y crear nuevas ----
  console.log(`\n— ${PRICE_BANDS.length} bandas de precio (H2-2026)`);
  if (WRITE) {
    await sembrarBandas(prisma);
    console.log('  ✓ bandas creadas (las anteriores quedaron con vigencia cerrada)');
  } else {
    for (const b of PRICE_BANDS) {
      const top = b.maxPrice ? `$${b.maxPrice / M}M` : 'sin techo';
      console.log(`  ${b.labelEs.padEnd(12)} $${b.minPrice / M}M → ${top}`);
    }
  }

  // ---- Percepción de marca ----
  console.log(`\n— ${BRAND_PERCEPTION.length} marcas en brand_perception_co`);
  if (WRITE) {
    await sembrarPercepcion(prisma);
    console.log('  ✓ percepción de marca sembrada (ajustar con criterio editorial)');
  }

  if (!WRITE) console.log('\nDry-run. Ejecuta con --write para aplicar.');
  await prisma.$disconnect();
}

main().catch(async e => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
