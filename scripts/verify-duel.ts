// Pruebas del modo Duelo del comparador.
// Uso: npx tsx scripts/verify-duel.ts

import { runDuel, type DuelVehicle } from '../lib/comparison/duel';

let fallos = 0;
function check(nombre: string, ok: boolean, detalle?: unknown) {
  if (!ok) fallos++;
  console.log(`${ok ? '✓' : '✗'} ${nombre}${ok ? '' : `  → ${JSON.stringify(detalle)}`}`);
}

const onix: DuelVehicle = {
  id: 'onix', brand: 'Chevrolet', model: 'Onix RS', year: 2026, price: 89_990_000, fuelType: 'Gasolina',
  specifications: JSON.stringify({
    performance: { acceleration0to100: 10.2 },
    combustion: { maxPower: 116, combinedConsumption: 52 },
    dimensions: { cargoCapacity: 303 },
    safety: { airbags: 6, ncapRating: 5 },
  }),
};
const duster: DuelVehicle = {
  id: 'duster', brand: 'Renault', model: 'Duster', year: 2026, price: 99_000_000, fuelType: 'Gasolina',
  specifications: {
    combustion: { maxPower: '130', combinedConsumption: 45 },
    dimensions: { cargoCapacity: 472 },
    safety: { airbags: 6 },
    chassis: { groundClearance: 217 },
  },
};
const dolphin: DuelVehicle = {
  id: 'dolphin', brand: 'BYD', model: 'Dolphin Mini', year: 2026, price: 79_900_000, fuelType: 'Eléctrico',
  specifications: { electric: { electricRange: 380 }, dimensions: { cargoCapacity: 230 } },
};

const r = runDuel([onix, duster]);
const ronda = (id: string, res = r) => res.rounds.find(x => x.id === id)!;

check('músculo: gana Duster (string "130" se lee)', ronda('musculo').entries.find(e => e.winner)?.vehicleId === 'duster');
check('bolsillo: gana el más barato', ronda('bolsillo').entries.find(e => e.winner)?.vehicleId === 'onix');
check('baúl: se traduce a maletas', ronda('baul').entries[1].display === '472 L · ≈ 12 maletas de cabina', ronda('baul').entries[1].display);
check('arranque: un solo dato → no comparable, sin puntos', !ronda('arranque').comparable && ronda('arranque').entries.every(e => !e.winner));
check('no comparable dice a quién le falta', ronda('arranque').motivoNoComparable?.includes('Renault Duster') === true, ronda('arranque').motivoNoComparable);
check('airbags: empate suma a ambos', ronda('airbags').entries.every(e => e.winner));
check('autonomía no aparece entre dos de gasolina', !r.rounds.some(x => x.id === 'autonomia'));
const orden = r.rounds.map(x => x.comparable);
check('rondas comparables van primero', orden.indexOf(false) > orden.lastIndexOf(true));
check('barra del perdedor nunca es 0', ronda('musculo').entries.every(e => e.bar >= 0.12));
check('marcador: bolsillo+rinde+airbags vs músculo+baúl+airbags', r.score.onix === 3 && r.score.duster === 3, r.score);

const mix = runDuel([onix, dolphin]);
const rinde = ronda('rinde', mix);
check('rinde: el eléctrico queda "no aplica", no con cero', rinde.entries.find(e => e.vehicleId === 'dolphin')?.display?.startsWith('Es eléctrico') === true, rinde.entries);
check('rinde con un solo carro de gasolina → no comparable', !rinde.comparable);
check('autonomía aparece si hay un eléctrico', mix.rounds.some(x => x.id === 'autonomia'));

check('specs inválidas no revientan', runDuel([{ ...onix, specifications: '{no json' }, duster]).rounds.length > 0);

console.log(fallos === 0 ? '\nTodo OK' : `\n${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
