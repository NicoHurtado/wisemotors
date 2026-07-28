// ============================================================================
// Verificación del scoring determinístico — primeros tests del repo.
// Solo funciones puras, sin base de datos ni API keys.
//
//   npx tsx scripts/verify-scoring.ts
//
// Sale con código 1 si algo falla (sirve para CI).
// ============================================================================

import {
  detectQueryProfile,
  scoreDeterministically,
  rankCandidates,
} from '../lib/ai/deterministic';
import type { VehicleCandidate, VehicleFeatures } from '../lib/ai/features';

let failures = 0;

function check(name: string, condition: boolean, detail = '') {
  if (condition) {
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

// Candidato de prueba con todas las features en un valor base
function candidate(id: string, price: number, overrides: Partial<VehicleFeatures> = {}): VehicleCandidate {
  const base: any = {};
  const keys = [
    'power_to_weight_norm', 'acceleration_norm', 'braking_norm', 'max_speed_norm',
    'ground_clearance_norm', 'efficiency_norm', 'comfort_norm', 'safety_norm',
    'tech_norm', 'reliability_norm', 'urban_score', 'highway_score',
    'offroad_score', 'hill_climb_score', 'potholes_score',
    'quality_price_ratio_norm', 'prestige_norm',
    'performance_score', 'efficiency_score', 'safety_score', 'comfort_score',
  ];
  for (const k of keys) base[k] = 0.5;
  Object.assign(base, overrides);

  return {
    id, price,
    brand: 'Marca', model: `Modelo-${id}`, year: 2026,
    fuelType: 'Gasolina', vehicleType: 'Sedán', type: 'Sedán',
    imageUrl: null, features: base as VehicleFeatures, tags: [],
  };
}

function scoreAndRank(cands: VehicleCandidate[], query: string) {
  const profile = detectQueryProfile(query);
  const res = scoreDeterministically(cands, profile);
  return rankCandidates(cands.map(c => ({ ...c, score: res.get(c.id)!.score })));
}

// ---------------------------------------------------------------------------
console.log('\n1. Router de perfiles (regex + diccionario es-CO)');
// ---------------------------------------------------------------------------
{
  const p1 = detectQueryProfile('un carro pa subir a Palmas rápido');
  check('"pa subir a Palmas" activa palmas', p1.activeProfiles.includes('palmas'));
  check('"rápido" activa desempeño', p1.activeProfiles.includes('desempeno'));

  const p2 = detectQueryProfile('algo economico para la ciudad');
  check('"economico" (sin tilde) activa economía', p2.activeProfiles.includes('economia'));
  check('"ciudad" activa ciudad', p2.activeProfiles.includes('ciudad'));

  const p3 = detectQueryProfile('camioneta blanca bonita');
  check('consulta sin señales usa perfil neutro', p3.activeProfiles.length === 0
    && Object.keys(p3.weights).length > 0);

  const p4 = detectQueryProfile('carro que aguante huecos para ir a la finca');
  check('"huecos" + "finca" activan ambos', p4.activeProfiles.includes('huecos')
    && p4.activeProfiles.includes('finca'));
}

// ---------------------------------------------------------------------------
console.log('\n2. Determinismo y desempate estable');
// ---------------------------------------------------------------------------
{
  const cands = [
    candidate('a', 90_000_000, { hill_climb_score: 0.9 }),
    candidate('b', 80_000_000, { hill_climb_score: 0.3 }),
    candidate('c', 70_000_000, { hill_climb_score: 0.6 }),
    candidate('d', 60_000_000, { hill_climb_score: 0.6 }),
  ];

  const r1 = scoreAndRank(cands, 'pa subir lomas').map(c => c.id).join(',');
  const r2 = scoreAndRank([...cands].reverse(), 'pa subir lomas').map(c => c.id).join(',');
  check('mismo set + misma consulta ⇒ mismo orden (aun barajado)', r1 === r2, `${r1} vs ${r2}`);

  const iguales = [candidate('caro', 100_000_000), candidate('barato', 50_000_000)];
  const r3 = scoreAndRank(iguales, 'carro bonito');
  check('a igual puntaje, el más barato primero', r3[0].id === 'barato');
}

// ---------------------------------------------------------------------------
console.log('\n3. El problema del Bugatti (winsorización)');
// ---------------------------------------------------------------------------
{
  // 9 carros normales + 1 outlier absurdo en potencia
  const normales = Array.from({ length: 9 }, (_, i) =>
    candidate(`n${i}`, 80_000_000, { power_to_weight_norm: 0.3 + i * 0.05 }));
  const conBugatti = [...normales, candidate('bugatti', 8_000_000_000, { power_to_weight_norm: 1.0 })];

  const sin = scoreAndRank(normales, 'carro potente');
  const con = scoreAndRank(conBugatti, 'carro potente').filter(c => c.id !== 'bugatti');

  const medioSin = sin.find(c => c.id === 'n4')!.score;
  const medioCon = con.find(c => c.id === 'n4')!.score;
  check('un outlier no aplasta el puntaje de un carro medio',
    Math.abs(medioSin - medioCon) <= 10, `sin: ${medioSin}, con: ${medioCon}`);
}

// ---------------------------------------------------------------------------
console.log('\n4. El perfil manda sobre el orden');
// ---------------------------------------------------------------------------
{
  const cands = [
    candidate('trepador', 90_000_000, { hill_climb_score: 0.95, efficiency_norm: 0.2 }),
    candidate('ahorrador', 90_000_000, { hill_climb_score: 0.2, efficiency_norm: 0.95 }),
  ];
  const porSubida = scoreAndRank(cands, 'pa subir pendientes');
  const porAhorro = scoreAndRank(cands, 'que gaste poco, economico');
  check('buscando subida gana el trepador', porSubida[0].id === 'trepador');
  check('buscando economía gana el ahorrador', porAhorro[0].id === 'ahorrador');
}

// ---------------------------------------------------------------------------
console.log(failures === 0 ? '\nTodo verificado ✓\n' : `\n${failures} verificaciones fallaron ✗\n`);
process.exit(failures === 0 ? 0 : 1);
