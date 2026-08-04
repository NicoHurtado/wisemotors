// ============================================================================
// RE-INGESTA sobre vehículos que YA existen.
//
// publishDraft rechaza duplicados con 409, que es lo correcto para una alta
// nueva pero inútil cuando lo que se quiere es volver a llenar una ficha que
// quedó vacía (p. ej. después de limpiar los `false` inventados). Aquí los
// hechos se FUSIONAN sobre el vehículo existente: no se borra ni se recrea,
// así que favoritos y leads asociados sobreviven.
//
//   npx tsx scripts/reingest.ts --vacios        # los que tengan < 10 datos
//   npx tsx scripts/reingest.ts --solo "Tracker"
//
// Un hecho nuevo solo pisa al anterior si viene de un tier igual o mejor: una
// fuente de comunidad no debe sobrescribir al fabricante.
// ============================================================================

import { prisma } from '../lib/prisma';
import { runIngestPipeline } from '../lib/ingest/pipeline';
import { ATTRIBUTE_REGISTRY } from '../lib/attributes/registry';
import { computeCoverage } from '../lib/attributes/coverage';

const UMBRAL_VACIO = 10;

const filtro = process.argv.includes('--solo')
  ? process.argv[process.argv.indexOf('--solo') + 1]?.toLowerCase()
  : null;
const soloVacios = process.argv.includes('--vacios');

function anidar(pares: { key: string; value: number | string | boolean }[]): any {
  const raiz: any = {};
  for (const { key, value } of pares) {
    const partes = key.split('.');
    let nodo = raiz;
    for (let i = 0; i < partes.length - 1; i++) {
      nodo[partes[i]] = nodo[partes[i]] ?? {};
      nodo = nodo[partes[i]];
    }
    nodo[partes[partes.length - 1]] = value;
  }
  return raiz;
}

async function main() {
  const todos = await prisma.vehicle.findMany({
    select: {
      id: true,
      brand: true,
      model: true,
      year: true,
      fuelType: true,
      specifications: true,
      _count: { select: { attributes: true } },
    },
    orderBy: { brand: 'asc' },
  });

  let objetivo = todos;
  if (filtro) {
    objetivo = todos.filter(v => `${v.brand} ${v.model}`.toLowerCase().includes(filtro));
  } else if (soloVacios) {
    objetivo = todos.filter(v => v._count.attributes < UMBRAL_VACIO);
  }

  console.log(`\n=== Re-ingesta: ${objetivo.length} vehículos ===\n`);

  for (const [i, v] of Array.from(objetivo.entries())) {
    const etiqueta = `${v.brand} ${v.model} ${v.year}`;
    process.stdout.write(`[${i + 1}/${objetivo.length}] ${etiqueta} (${v._count.attributes} datos) … `);

    try {
      const draft = await runIngestPipeline({
        brand: v.brand,
        model: v.model,
        year: v.year,
        country: 'CO',
      });

      const nuevos = draft.facts.filter(f => !f.outOfRange);
      if (nuevos.length === 0) {
        console.log('el pipeline no trajo nada nuevo');
        continue;
      }

      const existentes = await prisma.vehicleAttribute.findMany({
        where: { vehicleId: v.id },
        select: { attributeKey: true, sourceTier: true },
      });
      const tierPorKey = new Map(existentes.map(a => [a.attributeKey, a.sourceTier]));

      let escritos = 0;
      let respetados = 0;

      for (const f of nuevos) {
        const def = ATTRIBUTE_REGISTRY.find(d => d.key === f.key);
        if (!def) continue;

        const tierPrevio = tierPorKey.get(f.key);
        if (tierPrevio !== undefined && f.tier > tierPrevio) {
          respetados++; // ya había un dato de mejor fuente: no se pisa
          continue;
        }

        await prisma.vehicleAttribute.upsert({
          where: { vehicleId_attributeKey: { vehicleId: v.id, attributeKey: f.key } },
          create: {
            vehicleId: v.id,
            attributeKey: f.key,
            valueNum: def.dataType === 'numeric' ? Number(f.value) : null,
            valueBool: def.dataType === 'boolean' ? Boolean(f.value) : null,
            valueText: def.dataType === 'numeric' || def.dataType === 'boolean' ? null : String(f.value),
            confidence: f.confidence,
            sourceTier: f.tier,
            sourceUrl: f.sourceUrl,
            verifiedBy: null,
          },
          update: {
            valueNum: def.dataType === 'numeric' ? Number(f.value) : null,
            valueBool: def.dataType === 'boolean' ? Boolean(f.value) : null,
            valueText: def.dataType === 'numeric' || def.dataType === 'boolean' ? null : String(f.value),
            confidence: f.confidence,
            sourceTier: f.tier,
            sourceUrl: f.sourceUrl,
            extractedAt: new Date(),
          },
        });
        escritos++;
      }

      // Reconstrucción de specifications + cobertura desde el estado final
      const finales = await prisma.vehicleAttribute.findMany({
        where: { vehicleId: v.id },
        select: { attributeKey: true, valueNum: true, valueBool: true, valueText: true },
      });

      const pares = finales
        .map(a => {
          const def = ATTRIBUTE_REGISTRY.find(d => d.key === a.attributeKey);
          if (!def) return null;
          const value =
            def.dataType === 'numeric' ? a.valueNum : def.dataType === 'boolean' ? a.valueBool : a.valueText;
          if (value === null || value === undefined) return null;
          return { key: a.attributeKey, value };
        })
        .filter(Boolean) as { key: string; value: number | string | boolean }[];

      let specsViejas: any = {};
      try {
        specsViejas =
          typeof v.specifications === 'string' ? JSON.parse(v.specifications) : v.specifications ?? {};
      } catch {
        specsViejas = {};
      }

      const specs = anidar(pares);
      if (specsViejas.commercial) {
        specs.commercial = { ...specsViejas.commercial, ...(specs.commercial ?? {}) };
      }

      const cobertura = computeCoverage(v.fuelType, new Set(finales.map(a => a.attributeKey)));

      await prisma.vehicle.update({
        where: { id: v.id },
        data: {
          specifications: JSON.stringify(specs),
          coverageGlobal: cobertura.global,
          coverageByDimension: JSON.stringify(cobertura.byDimension),
        },
      });

      const fuentesOk = draft.sourcesReport.filter(s => s.ok).length;
      console.log(
        `OK · +${escritos} datos (${respetados} respetados por mejor fuente) · ` +
          `${finales.length} en total · ${fuentesOk} fuentes · cobertura ${Math.round(cobertura.global * 100)}%`
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`FALLÓ (${msg.slice(0, 90)})`);
    }
  }

  console.log('');
  await prisma.$disconnect();
}

main().catch(async e => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
