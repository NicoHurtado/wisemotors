// ============================================================================
// Carga masiva de vehículos por el pipeline de ingesta.
//
// OJO: esto ACEPTA POR DEFECTO todo lo que el pipeline traiga, salvo lo que
// quede fuera de rango físico. Es para llenar la base y probar el sistema,
// NO reemplaza la revisión humana de /admin/ingest. Los hechos quedan con
// verifiedBy = null justamente para poder distinguirlos después.
//
// Uso:  npx tsx --env-file=.env.local scripts/ingest-batch.ts
//       npx tsx --env-file=.env.local scripts/ingest-batch.ts --solo "Polo Track"
// ============================================================================

import { runIngestPipeline } from '../lib/ingest/pipeline';
import { publishDraft } from '../lib/ingest/publish';

const CATALOGO = [
  { brand: 'Tesla', model: 'Model Y', year: 2025 },
  { brand: 'BYD', model: 'Seagull', year: 2025 },
  { brand: 'Toyota', model: 'Hilux', year: 2025 },
  { brand: 'Toyota', model: 'RAV4', year: 2025 },
  { brand: 'Chevrolet', model: 'Onix', year: 2025 },
  { brand: 'Chevrolet', model: 'Tracker', year: 2025 },
  { brand: 'Volkswagen', model: 'Polo Track', year: 2025 },
  // Relevante en Colombia: la SUV del segmento más disputado, y Renault es
  // top 3 en ventas del país.
  { brand: 'Renault', model: 'Duster', year: 2025 },
];

const filtro = process.argv.includes('--solo')
  ? process.argv[process.argv.indexOf('--solo') + 1]?.toLowerCase()
  : null;

function millones(n: number) {
  return `$${Math.round(n / 1_000_000)}M`;
}

async function main() {
  const objetivo = filtro
    ? CATALOGO.filter(c => `${c.brand} ${c.model}`.toLowerCase().includes(filtro))
    : CATALOGO;

  console.log(`\n=== Ingesta masiva: ${objetivo.length} vehículos ===`);
  console.log('Aceptación automática (menos lo fuera de rango). Revisar después en el panel.\n');

  const resumen: string[] = [];

  for (const [i, entrada] of Array.from(objetivo.entries())) {
    const etiqueta = `${entrada.brand} ${entrada.model} ${entrada.year}`;
    process.stdout.write(`[${i + 1}/${objetivo.length}] ${etiqueta} … `);

    try {
      const draft = await runIngestPipeline({ ...entrada, country: 'CO' });

      const fuentesOk = draft.sourcesReport.filter(s => s.ok).length;
      const aceptados = draft.facts.filter(f => !f.outOfRange);
      const conflictos = aceptados.filter(f => f.conflict).length;

      if (!draft.price) {
        console.log('SIN PRECIO, se omite');
        resumen.push(`✗ ${etiqueta}: sin precio ni estimación`);
        continue;
      }

      const resultado = await publishDraft({
        brand: draft.brand,
        model: draft.model,
        year: draft.year,
        type: draft.type,
        vehicleType: draft.vehicleType,
        fuelType: draft.fuelType,
        price: draft.price.value,
        priceEstimated: draft.price.estimated,
        priceReasoningEs: draft.price.reasoningEs,
        facts: aceptados.map(f => ({
          key: f.key,
          value: f.value,
          confidence: f.confidence,
          sourceTier: f.tier,
          sourceUrl: f.sourceUrl,
        })),
        verifiedBy: null, // carga automática: nadie lo verificó todavía
      });

      if (!resultado.ok) {
        console.log(`omitido (${resultado.error})`);
        resumen.push(`✗ ${etiqueta}: ${resultado.error}`);
        continue;
      }

      const precioTxt = `${millones(draft.price.value)}${draft.price.estimated ? ' est.' : ''}`;
      console.log(
        `OK · ${resultado.factsWritten} datos · ${precioTxt} · cobertura ${Math.round(resultado.coverage * 100)}%`
      );
      resumen.push(
        `✓ ${etiqueta} — ${resultado.factsWritten} datos, ${fuentesOk} fuentes, ` +
          `${conflictos} conflictos, ${precioTxt}, ${draft.fuelType}`
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`FALLÓ (${msg.slice(0, 80)})`);
      resumen.push(`✗ ${etiqueta}: ${msg.slice(0, 80)}`);
    }
  }

  console.log('\n=== RESUMEN ===');
  resumen.forEach(l => console.log(' ', l));
  console.log('');
}

main()
  .catch(e => {
    console.error('Error fatal:', e);
    process.exit(1);
  })
  .then(() => process.exit(0));
