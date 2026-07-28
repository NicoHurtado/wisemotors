// ============================================================================
// MIGRACIÓN: Vehicle.specifications (JSON string) → vehicle_attributes (filas)
//
// - Idempotente: usa upsert por (vehicleId, attributeKey). Correr N veces es seguro.
// - No destructiva: NO toca la columna `specifications`. Queda como respaldo.
// - Lo curado a mano se marca confidence=1.0, sourceTier=1 (verdad de referencia).
// - Al final calcula cobertura por vehículo y reporta un resumen + diff.
//
// Uso:  npx tsx scripts/migrate-attributes.ts          (dry-run, no escribe)
//       npx tsx scripts/migrate-attributes.ts --write  (escribe de verdad)
// ============================================================================

import { PrismaClient } from '@prisma/client';
import { ATTRIBUTE_REGISTRY, attributeAppliesTo } from '../lib/attributes/registry';
import { computeCoverage } from '../lib/attributes/coverage';

const prisma = new PrismaClient();
const WRITE = process.argv.includes('--write');

function getByPath(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), obj);
}

interface Stats {
  vehicles: number;
  factsWritten: number;
  skippedNotApplicable: number;
  skippedEmpty: number;
  outOfRange: { vehicle: string; key: string; value: number }[];
  unknownKeys: Map<string, number>; // paths presentes en el JSON sin definición
}

async function seedDefinitions() {
  console.log(`\n— Sembrando ${ATTRIBUTE_REGISTRY.length} definiciones de atributos…`);
  for (const d of ATTRIBUTE_REGISTRY) {
    const data = {
      labelEs: d.labelEs,
      unit: d.unit ?? null,
      dataType: d.dataType,
      direction: d.direction,
      appliesTo: d.appliesTo,
      displayGroup: d.displayGroup,
      dimension: d.dimension,
      displayPriority: d.displayPriority,
      cardEligible: d.cardEligible ?? false,
      coAvailability: d.coAvailability ?? 'common',
      comparable: d.comparable ?? true,
      expectedMin: d.expectedMin ?? null,
      expectedMax: d.expectedMax ?? null,
    };
    if (WRITE) {
      await prisma.attributeDefinition.upsert({
        where: { key: d.key },
        create: { key: d.key, ...data },
        update: data,
      });
    }
  }
  console.log(WRITE ? '  ✓ definiciones sembradas' : '  (dry-run: no se escribió)');
}

function collectKnownPaths(specs: any, prefix = ''): string[] {
  // Recorre el JSON y devuelve todos los paths hoja (para detectar keys sin definición)
  const paths: string[] = [];
  if (specs == null || typeof specs !== 'object' || Array.isArray(specs)) return paths;
  for (const [k, v] of Object.entries(specs)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v != null && typeof v === 'object' && !Array.isArray(v)) {
      paths.push(...collectKnownPaths(v, p));
    } else if (v != null && v !== '') {
      paths.push(p);
    }
  }
  return paths;
}

async function migrateVehicles(): Promise<Stats> {
  const stats: Stats = {
    vehicles: 0,
    factsWritten: 0,
    skippedNotApplicable: 0,
    skippedEmpty: 0,
    outOfRange: [],
    unknownKeys: new Map(),
  };

  const defByKey = new Map(ATTRIBUTE_REGISTRY.map(d => [d.key, d]));
  const vehicles = await prisma.vehicle.findMany({
    select: { id: true, brand: true, model: true, year: true, fuelType: true, specifications: true },
  });

  console.log(`\n— Migrando ${vehicles.length} vehículos…`);

  for (const v of vehicles) {
    stats.vehicles++;
    let specs: any;
    try {
      specs = JSON.parse(v.specifications || '{}');
    } catch {
      console.warn(`  ⚠ ${v.brand} ${v.model} ${v.year}: specifications no es JSON válido, se omite`);
      continue;
    }

    // Detectar paths del JSON que no tienen definición (cola larga de .passthrough())
    const leafPaths = collectKnownPaths(specs);
    for (const p of leafPaths) {
      if (!defByKey.has(p)) {
        stats.unknownKeys.set(p, (stats.unknownKeys.get(p) ?? 0) + 1);
      }
    }

    const presentKeys = new Set<string>();

    for (const d of ATTRIBUTE_REGISTRY) {
      const raw = getByPath(specs, d.key);
      if (raw === undefined || raw === null || raw === '') {
        stats.skippedEmpty++;
        continue;
      }
      if (!attributeAppliesTo(d, v.fuelType)) {
        // El dato existe pero no aplica a este tren motriz (ej. residuos de formulario).
        stats.skippedNotApplicable++;
        continue;
      }

      let valueNum: number | null = null;
      let valueBool: boolean | null = null;
      let valueText: string | null = null;

      if (d.dataType === 'numeric') {
        const n = typeof raw === 'number' ? raw : parseFloat(String(raw));
        if (isNaN(n)) { stats.skippedEmpty++; continue; }
        valueNum = n;
        if ((d.expectedMin !== undefined && n < d.expectedMin) || (d.expectedMax !== undefined && n > d.expectedMax)) {
          stats.outOfRange.push({ vehicle: `${v.brand} ${v.model} ${v.year}`, key: d.key, value: n });
        }
      } else if (d.dataType === 'boolean') {
        valueBool = Boolean(raw);
      } else {
        valueText = Array.isArray(raw) ? raw.join(', ') : String(raw);
      }

      presentKeys.add(d.key);
      stats.factsWritten++;

      if (WRITE) {
        await prisma.vehicleAttribute.upsert({
          where: { vehicleId_attributeKey: { vehicleId: v.id, attributeKey: d.key } },
          create: {
            vehicleId: v.id,
            attributeKey: d.key,
            valueNum, valueBool, valueText,
            confidence: 1.0,
            sourceTier: 1, // curado a mano en el admin = verdad de referencia
          },
          update: { valueNum, valueBool, valueText },
        });
      }
    }

    // Cobertura
    const coverage = computeCoverage(v.fuelType, presentKeys);
    if (WRITE) {
      await prisma.vehicle.update({
        where: { id: v.id },
        data: {
          coverageGlobal: coverage.global,
          coverageByDimension: JSON.stringify(coverage.byDimension),
        },
      });
    }
  }

  return stats;
}

async function main() {
  console.log(`\n=== Migración specifications → vehicle_attributes (${WRITE ? 'WRITE' : 'DRY-RUN'}) ===`);

  await seedDefinitions();
  const stats = await migrateVehicles();

  console.log('\n=== RESUMEN ===');
  console.log(`Vehículos procesados:        ${stats.vehicles}`);
  console.log(`Hechos ${WRITE ? 'escritos' : 'a escribir'}:            ${stats.factsWritten}`);
  console.log(`Campos vacíos (normal):      ${stats.skippedEmpty}`);
  console.log(`No aplicables (ignorados):   ${stats.skippedNotApplicable}`);

  if (stats.outOfRange.length > 0) {
    console.log(`\n⚠ ${stats.outOfRange.length} valores FUERA DE RANGO físico (revisar a mano):`);
    for (const o of stats.outOfRange.slice(0, 25)) {
      console.log(`   ${o.vehicle} · ${o.key} = ${o.value}`);
    }
    if (stats.outOfRange.length > 25) console.log(`   … y ${stats.outOfRange.length - 25} más`);
  }

  if (stats.unknownKeys.size > 0) {
    const sorted = Array.from(stats.unknownKeys.entries()).sort((a, b) => b[1] - a[1]);
    console.log(`\nℹ ${stats.unknownKeys.size} paths del JSON sin definición en el registro (cola larga):`);
    for (const [k, count] of sorted.slice(0, 30)) {
      console.log(`   ${k}  (${count} vehículos)`);
    }
    if (sorted.length > 30) console.log(`   … y ${sorted.length - 30} más`);
    console.log('   → Los importantes se agregan al registro (una fila). El resto se deja morir.');
  }

  if (!WRITE) console.log('\nDry-run terminado. Ejecuta con --write para aplicar.');
  await prisma.$disconnect();
}

main().catch(async e => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
