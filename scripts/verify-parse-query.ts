// Pruebas del parser de una línea de la ingesta.
// Uso: npx tsx scripts/verify-parse-query.ts

import { parseVehicleQuery, parseVehicleList } from '../lib/ingest/parse-query';

// Fecha fija: 2º semestre de 2026 → año-modelo por defecto 2027.
const HOY = new Date('2026-09-27T12:00:00Z');

let fallos = 0;
function check(nombre: string, real: unknown, esperado: unknown) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) fallos++;
  console.log(`${ok ? '✓' : '✗'} ${nombre}${ok ? '' : `\n    esperado ${JSON.stringify(esperado)}\n    real     ${JSON.stringify(real)}`}`);
}

const p = (s: string) => parseVehicleQuery(s, HOY);

check('Ónix RS 2026 → Chevrolet inferida', p('Ónix RS 2026'),
  { brand: 'Chevrolet', model: 'Ónix RS', year: 2026, yearAssumed: false });
check('marca explícita', p('Renault Duster 2026'),
  { brand: 'Renault', model: 'Duster', year: 2026, yearAssumed: false });
check('alias de marca (vw)', p('vw T-Cross 2025'),
  { brand: 'Volkswagen', model: 'T-Cross', year: 2025, yearAssumed: false });
check('marca de dos palabras', p('Mercedes Benz GLA 200 2026'),
  { brand: 'Mercedes-Benz', model: 'GLA 200', year: 2026, yearAssumed: false });
check('sin año → modelo vigente', p('BYD Dolphin Mini'),
  { brand: 'BYD', model: 'Dolphin Mini', year: 2027, yearAssumed: true });
check('Peugeot 2008 sin año: 2008 es modelo', p('Peugeot 2008'),
  { brand: 'Peugeot', model: '2008', year: 2027, yearAssumed: true });
check('Peugeot 2008 2026', p('Peugeot 2008 2026'),
  { brand: 'Peugeot', model: '2008', year: 2026, yearAssumed: false });
check('modelo desconocido → marca vacía (la pone la IA)', p('Tank 300 2026'),
  { brand: '', model: 'Tank 300', year: 2026, yearAssumed: false });
check('año en medio', p('Kia 2026 Sportage GT-Line'),
  { brand: 'Kia', model: 'Sportage GT-Line', year: 2026, yearAssumed: false });
check('vacío → null', p('   '), null);
check('solo año → null', p('2026'), null);

const lista = parseVehicleList('1. Onix RS 2026\n- Duster 2026; onix rs 2026\n\n• Tracker', HOY);
check('lista: viñetas, ";" y duplicados', lista.map(l => l.raw), ['Onix RS 2026', 'Duster 2026', 'Tracker']);

console.log(fallos === 0 ? '\nTodo OK' : `\n${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
