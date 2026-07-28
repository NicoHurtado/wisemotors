// ============================================================================
// Seed de tablas de contexto Colombia:
//  - price_bands: bandas de precio H2-2026, calibradas con mercado real.
//    Se recalibran CADA SEMESTRE: se cierra la vigencia de las actuales
//    (validTo) y se insertan las nuevas. Nunca se editan en caliente.
//  - brand_perception_co: percepción de marca curada. ESTOS VALORES SON UN
//    PUNTO DE PARTIDA EDITORIAL — ajústenlos con el criterio de la casa.
//
// Uso: npx tsx scripts/seed-colombia.ts --write
// ============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const WRITE = process.argv.includes('--write');
const M = 1_000_000; // COP

// Referencias de mercado H1-2026: top ventas entre $75M y $136M base;
// piso del mercado ~$47M (FAW Bestune Xiaoma); Model Y desde $119,99M.
const PRICE_BANDS = [
  { key: 'entrada', labelEs: 'Entrada', minPrice: 0, maxPrice: 75 * M },
  { key: 'popular', labelEs: 'Popular', minPrice: 75 * M, maxPrice: 115 * M },
  { key: 'media', labelEs: 'Media', minPrice: 115 * M, maxPrice: 170 * M },
  { key: 'media_alta', labelEs: 'Media-alta', minPrice: 170 * M, maxPrice: 250 * M },
  { key: 'premium', labelEs: 'Premium', minPrice: 250 * M, maxPrice: 450 * M },
  { key: 'lujo', labelEs: 'Lujo', minPrice: 450 * M, maxPrice: null as number | null },
];

// Percepción de marca en Colombia (0-100). Tres ejes INDEPENDIENTES a propósito:
// un Mercedes puede ser 95 en prestigio y 35 en repuestos — ese matiz es el producto.
const BRAND_PERCEPTION: Array<{
  brand: string; prestige: number; reliability: number; partsAvailability: number; notes?: string;
}> = [
  { brand: 'Mercedes-Benz', prestige: 95, reliability: 65, partsAvailability: 35, notes: 'Lujo pleno en CO; repuestos lentos y costosos fuera de red' },
  { brand: 'BMW', prestige: 92, reliability: 62, partsAvailability: 38 },
  { brand: 'Audi', prestige: 88, reliability: 63, partsAvailability: 36 },
  { brand: 'Porsche', prestige: 97, reliability: 75, partsAvailability: 25 },
  { brand: 'Tesla', prestige: 88, reliability: 70, partsAvailability: 40, notes: 'Entró con fuerza en 2026; red de servicio aún en construcción' },
  { brand: 'Toyota', prestige: 72, reliability: 98, partsAvailability: 92, notes: 'Referente de confiabilidad y reventa en CO' },
  { brand: 'Mazda', prestige: 68, reliability: 88, partsAvailability: 85 },
  { brand: 'Honda', prestige: 65, reliability: 90, partsAvailability: 70 },
  { brand: 'Volkswagen', prestige: 62, reliability: 72, partsAvailability: 75 },
  { brand: 'Kia', prestige: 58, reliability: 82, partsAvailability: 95, notes: 'Líder de ventas H1-2026' },
  { brand: 'Hyundai', prestige: 56, reliability: 80, partsAvailability: 88 },
  { brand: 'Chevrolet', prestige: 48, reliability: 72, partsAvailability: 96 },
  { brand: 'Renault', prestige: 45, reliability: 70, partsAvailability: 98, notes: 'Red de servicio más extensa del país' },
  { brand: 'Nissan', prestige: 50, reliability: 74, partsAvailability: 85 },
  { brand: 'Suzuki', prestige: 42, reliability: 80, partsAvailability: 82 },
  { brand: 'Ford', prestige: 55, reliability: 68, partsAvailability: 72 },
  { brand: 'BYD', prestige: 48, reliability: 68, partsAvailability: 55, notes: 'Crecimiento acelerado en EV; red aún corta' },
  { brand: 'Chery', prestige: 40, reliability: 62, partsAvailability: 52 },
  { brand: 'Great Wall', prestige: 38, reliability: 60, partsAvailability: 50 },
  { brand: 'JAC', prestige: 33, reliability: 55, partsAvailability: 48 },
  { brand: 'Foton', prestige: 30, reliability: 58, partsAvailability: 55, notes: 'Fuerte en carga/pickups por precio' },
  { brand: 'Volvo', prestige: 82, reliability: 78, partsAvailability: 45 },
  { brand: 'Land Rover', prestige: 90, reliability: 55, partsAvailability: 30 },
  { brand: 'Jeep', prestige: 70, reliability: 62, partsAvailability: 55 },
  { brand: 'Mitsubishi', prestige: 48, reliability: 76, partsAvailability: 70 },
  { brand: 'Subaru', prestige: 60, reliability: 84, partsAvailability: 50 },
  { brand: 'Lexus', prestige: 86, reliability: 94, partsAvailability: 45 },
  { brand: 'MINI', prestige: 78, reliability: 64, partsAvailability: 40 },
  { brand: 'FAW', prestige: 25, reliability: 52, partsAvailability: 40 },
];

async function main() {
  console.log(`\n=== Seed tablas Colombia (${WRITE ? 'WRITE' : 'DRY-RUN'}) ===`);

  // ---- Bandas de precio: cerrar vigentes y crear nuevas ----
  console.log(`\n— ${PRICE_BANDS.length} bandas de precio (H2-2026)`);
  if (WRITE) {
    const now = new Date();
    await prisma.priceBand.updateMany({
      where: { validTo: null },
      data: { validTo: now },
    });
    for (const b of PRICE_BANDS) {
      await prisma.priceBand.create({
        data: { key: b.key, labelEs: b.labelEs, minPrice: b.minPrice, maxPrice: b.maxPrice, validFrom: now },
      });
    }
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
    for (const bp of BRAND_PERCEPTION) {
      await prisma.brandPerception.upsert({
        where: { brand: bp.brand },
        create: bp,
        update: bp,
      });
    }
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
