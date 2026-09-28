// ============================================================================
// Los carros más parecidos a uno dado: "si estás mirando este, mira también".
//
// Distancia entre dos carros (menor = más parecido), sumando:
//   - tipo de carrocería distinto (una SUV no se cambia por un sedán),
//   - diferencia de precio en proporción (±20 % pesa igual en $60 M que en $300 M),
//   - tren motriz distinto (gasolina / híbrido / eléctrico / diésel),
//   - diferencias de características que sí tengan ambos: potencia, tamaño,
//     puestos, baúl, altura al piso. Un dato que falta no suma ni resta.
// ============================================================================

import { leer, specsDe } from '@/lib/vehiculo-datos';

export interface CarroComparable {
  id: string;
  price: number;
  type: string;
  fuelType: string;
  specifications: unknown;
}

const potencia = (s: Record<string, any>) => leer(s, 'combustion.maxPower', 'hybrid.maxPower', 'phev.maxPower', 'electric.maxPower');

const RASGOS: { leer: (s: Record<string, any>) => number | null; peso: number }[] = [
  { leer: potencia, peso: 1 },
  { leer: s => leer(s, 'dimensions.length'), peso: 1 },
  { leer: s => leer(s, 'interior.passengerCapacity'), peso: 1.2 },
  { leer: s => leer(s, 'dimensions.cargoCapacity'), peso: 0.6 },
  { leer: s => leer(s, 'chassis.groundClearance'), peso: 0.5 },
];

// Trenes motrices vecinos: un híbrido se parece más a un gasolina que a un eléctrico.
const FAMILIA: Record<string, number> = { Gasolina: 0, Diesel: 0.5, Híbrido: 1, 'Híbrido Enchufable': 2, Eléctrico: 3 };

export function distancia(a: CarroComparable, b: CarroComparable): number {
  const sa = specsDe(a.specifications);
  const sb = specsDe(b.specifications);
  let d = 0;
  if (a.type !== b.type) d += 3;
  if (a.price > 0 && b.price > 0) d += Math.abs(Math.log(b.price / a.price)) * 6; // 20 % más caro ≈ 1,1
  d += Math.abs((FAMILIA[a.fuelType] ?? 0) - (FAMILIA[b.fuelType] ?? 0)) * 0.5;
  for (const r of RASGOS) {
    const x = r.leer(sa);
    const y = r.leer(sb);
    if (x !== null && y !== null) d += (Math.abs(x - y) / Math.max(x, y)) * r.peso * 2;
  }
  return d;
}

/** Los `n` más parecidos a `base`, del más al menos parecido. */
export function masParecidos<T extends CarroComparable>(base: CarroComparable, candidatos: T[], n = 3): T[] {
  return candidatos
    .filter(c => c.id !== base.id)
    .map(c => ({ c, d: distancia(base, c) }))
    .sort((x, y) => x.d - y.d)
    .slice(0, n)
    .map(x => x.c);
}
