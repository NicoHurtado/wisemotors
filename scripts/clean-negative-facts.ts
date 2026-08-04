// ============================================================================
// LIMPIEZA DE HECHOS NEGATIVOS INVENTADOS.
//
// La primera tanda de ingesta publicó `false` y `0` para todo lo que el
// extractor no encontró: del Chevrolet Tracker, 64 de 64 "datos" eran falsos.
// Eso no es un dato faltante, es una afirmación falsa — dice que el carro NO
// tiene airbags, NO tiene aire acondicionado, tiene 0 estrellas NCAP — y
// además inflaba la cobertura, así que la ficha se veía "completa" mintiendo.
//
// El extractor ya no los genera (lib/ingest/extract.ts). Este script borra los
// que quedaron, reconstruye specifications y recalcula la cobertura.
//
//   npx tsx scripts/clean-negative-facts.ts           # simulación
//   npx tsx scripts/clean-negative-facts.ts --write   # aplica
//
// Ojo: se borran TODOS los false/0, incluidos los que por casualidad fueran
// ciertos. Es deliberado — no hay forma de distinguirlos, y un hueco honesto
// vale más que una negación que nadie verificó.
// ============================================================================

import { prisma } from '../lib/prisma';
import { ATTRIBUTE_REGISTRY } from '../lib/attributes/registry';
import { computeCoverage } from '../lib/attributes/coverage';

const APLICAR = process.argv.includes('--write');

/** Reconstruye el JSON anidado a partir de las keys del registro. */
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
  const vehiculos = await prisma.vehicle.findMany({
    select: { id: true, brand: true, model: true, year: true, fuelType: true, specifications: true },
    orderBy: { brand: 'asc' },
  });

  console.log(`\nModo: ${APLICAR ? 'APLICAR' : 'simulación (usa --write para guardar)'}\n`);

  let borradosTotal = 0;

  for (const v of vehiculos) {
    const attrs = await prisma.vehicleAttribute.findMany({
      where: { vehicleId: v.id },
      select: { id: true, attributeKey: true, valueNum: true, valueBool: true, valueText: true },
    });

    const esNegativoInventado = (a: (typeof attrs)[number]) =>
      a.valueBool === false || (a.valueNum !== null && a.valueNum === 0);

    const aBorrar = attrs.filter(esNegativoInventado);
    const sobreviven = attrs.filter(a => !esNegativoInventado(a));

    if (aBorrar.length === 0) {
      console.log(`· ${v.brand} ${v.model}: limpio (${attrs.length} datos).`);
      continue;
    }

    borradosTotal += aBorrar.length;

    // Cobertura antes/después: el número que se le muestra al comprador
    const cobAntes = computeCoverage(v.fuelType, new Set(attrs.map(a => a.attributeKey)));
    const cobDespues = computeCoverage(v.fuelType, new Set(sobreviven.map(a => a.attributeKey)));

    console.log(
      `▸ ${v.brand} ${v.model}: se borran ${aBorrar.length} de ${attrs.length}; ` +
        `cobertura ${Math.round(cobAntes.global * 100)}% → ${Math.round(cobDespues.global * 100)}%`
    );

    if (!APLICAR) continue;

    await prisma.vehicleAttribute.deleteMany({ where: { id: { in: aBorrar.map(a => a.id) } } });

    // specifications se reconstruye desde los hechos que sobreviven, pero se
    // conservan las claves comerciales (precio, razonamiento) que no vienen
    // del registro de atributos.
    let specsViejas: any = {};
    try {
      specsViejas =
        typeof v.specifications === 'string' ? JSON.parse(v.specifications) : v.specifications ?? {};
    } catch {
      specsViejas = {};
    }

    const pares = sobreviven
      .map(a => {
        const def = ATTRIBUTE_REGISTRY.find(d => d.key === a.attributeKey);
        if (!def) return null;
        const value =
          def.dataType === 'numeric'
            ? a.valueNum
            : def.dataType === 'boolean'
              ? a.valueBool
              : a.valueText;
        if (value === null || value === undefined) return null;
        return { key: a.attributeKey, value };
      })
      .filter(Boolean) as { key: string; value: number | string | boolean }[];

    const specsNuevas = anidar(pares);
    if (specsViejas.commercial) {
      specsNuevas.commercial = { ...specsViejas.commercial, ...(specsNuevas.commercial ?? {}) };
    }

    await prisma.vehicle.update({
      where: { id: v.id },
      data: {
        specifications: JSON.stringify(specsNuevas),
        coverageGlobal: cobDespues.global,
        coverageByDimension: JSON.stringify(cobDespues.byDimension),
      },
    });
    console.log(`  ✔ specifications y cobertura reconstruidas`);
  }

  console.log(
    `\n${borradosTotal} hechos negativos ${APLICAR ? 'borrados' : 'a borrar'}.` +
      (APLICAR ? '' : ' Nada se guardó (simulación).')
  );

  await prisma.$disconnect();
}

main().catch(async e => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
