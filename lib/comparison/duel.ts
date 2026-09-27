// ============================================================================
// Comparación por preguntas de comprador (usada por el "frente a frente").
//
// Cada ronda es UNA pregunta que un comprador sin conocimiento técnico sí se
// hace ("¿cuál arranca más rápido?", "¿dónde cabe más mercado?"), traducida a
// un dato del registro. Gana la ronda el mejor valor; los empates suman a ambos.
//
// Reglas que vienen del producto (CLAUDE.md):
// - "No comparable" es un estado de primera clase: si menos de dos carros
//   tienen el dato, la ronda se muestra pero no reparte puntos. Nunca un cero.
// - No se mezclan unidades: km/galón de un carro de gasolina no se enfrenta a
//   la autonomía de un eléctrico.
// ============================================================================

export interface DuelVehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  fuelType: string;
  specifications?: unknown;
}

export interface DuelEntry {
  vehicleId: string;
  value: number | null;
  /** El valor en palabras de persona ("≈ 9 maletas de cabina"). */
  display: string | null;
  /** 0–1: largo de la barra relativo al mejor de la ronda. */
  bar: number;
  winner: boolean;
}

export interface DuelRound {
  id: string;
  titulo: string;
  pregunta: string;
  /** Por qué importa, en una línea, sin tecnicismos. */
  porQue: string;
  entries: DuelEntry[];
  comparable: boolean;
  /** Si no es comparable, por qué (se muestra tal cual). */
  motivoNoComparable?: string;
}

export interface DuelResult {
  rounds: DuelRound[];
  /** Puntos por vehículo (solo rondas comparables). */
  score: Record<string, number>;
}

type Direction = 'higher' | 'lower';

interface RoundDef {
  id: string;
  titulo: string;
  pregunta: string;
  porQue: string;
  direction: Direction;
  /** Devuelve el valor numérico o null si no hay dato / no aplica. */
  read: (v: DuelVehicle, specs: Record<string, any>) => number | null;
  display: (n: number, v: DuelVehicle) => string;
  /** Si aplica solo a algunos trenes motrices, explica a quién deja fuera. */
  aplica?: (v: DuelVehicle) => boolean;
  motivoNoAplica?: string;
}

function parseSpecs(raw: unknown): Record<string, any> {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) ?? {};
    } catch {
      return {};
    }
  }
  return typeof raw === 'object' ? (raw as Record<string, any>) : {};
}

/** Lee el primer path con un número positivo. */
function num(specs: Record<string, any>, ...paths: string[]): number | null {
  for (const path of paths) {
    let cur: any = specs;
    for (const k of path.split('.')) cur = cur?.[k];
    const n = typeof cur === 'string' ? parseFloat(cur.replace(',', '.')) : cur;
    if (typeof n === 'number' && Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

const esElectrico = (v: DuelVehicle) => v.fuelType === 'Eléctrico';

const millones = (n: number) => {
  const m = n / 1_000_000;
  return `$${m >= 100 ? Math.round(m) : m.toFixed(1).replace('.0', '')} millones`;
};

/** Maleta de cabina estándar ≈ 40 L: la unidad que cualquiera entiende. */
const LITROS_MALETA = 40;

export const DUEL_ROUNDS: RoundDef[] = [
  {
    id: 'arranque',
    titulo: 'Aceleración',
    pregunta: '¿Cuál sale más rápido?',
    porQue: 'Se nota al incorporarte a una autopista o adelantar un camión.',
    direction: 'lower',
    read: (_v, s) => num(s, 'performance.acceleration0to100'),
    display: n => `${n.toFixed(1).replace('.0', '')} s de 0 a 100`,
  },
  {
    id: 'musculo',
    titulo: 'Potencia',
    pregunta: '¿Cuál tiene más fuerza?',
    porQue: 'Subir a Las Palmas con el carro lleno sin sufrir.',
    direction: 'higher',
    read: (_v, s) =>
      num(s, 'combustion.maxPower', 'hybrid.maxPower', 'phev.maxPower'),
    display: n => `${Math.round(n)} caballos`,
  },
  {
    id: 'bolsillo',
    titulo: 'Precio',
    pregunta: '¿Cuál cuesta menos?',
    porQue: 'Lo que pagas por sacarlo del concesionario.',
    direction: 'lower',
    read: v => (Number.isFinite(v.price) && v.price > 0 ? v.price : null),
    display: n => millones(n),
  },
  {
    id: 'rinde',
    titulo: 'Consumo',
    pregunta: '¿Cuál va más lejos con un galón?',
    porQue: 'Menos visitas a la bomba cada mes.',
    direction: 'higher',
    aplica: v => !esElectrico(v),
    motivoNoAplica: 'Es eléctrico: no gasta galones (mira la ronda de Autonomía).',
    read: (_v, s) => num(s, 'combustion.combinedConsumption'),
    display: n => `${Math.round(n)} km por galón`,
  },
  {
    id: 'autonomia',
    titulo: 'Autonomía',
    pregunta: '¿Cuál llega más lejos con una carga?',
    porQue: 'Cuántos días aguantas sin enchufarlo.',
    direction: 'higher',
    aplica: esElectrico,
    motivoNoAplica: 'No es 100% eléctrico.',
    read: (_v, s) => num(s, 'electric.realRangeMixed', 'electric.electricRange', 'electric.theoreticalRangeMixed'),
    display: n => `${Math.round(n)} km por carga`,
  },
  {
    id: 'baul',
    titulo: 'Baúl',
    pregunta: '¿Dónde cabe más?',
    porQue: 'El mercado del mes, las maletas del paseo o el coche del bebé.',
    direction: 'higher',
    read: (_v, s) => num(s, 'dimensions.cargoCapacity'),
    display: n => {
      const maletas = Math.max(1, Math.round(n / LITROS_MALETA));
      return `${Math.round(n)} L · ≈ ${maletas} ${maletas === 1 ? 'maleta' : 'maletas'} de cabina`;
    },
  },
  {
    id: 'escudo',
    titulo: 'Pruebas de choque',
    pregunta: '¿Cuál te protege mejor en un choque?',
    porQue: 'Las estrellas vienen de pruebas de choque reales; más es mejor.',
    direction: 'higher',
    read: (_v, s) => num(s, 'safety.ncapRating'),
    display: n => `${'★'.repeat(Math.round(n))}${'☆'.repeat(Math.max(0, 5 - Math.round(n)))} en pruebas de choque`,
  },
  {
    id: 'airbags',
    titulo: 'Bolsas de aire',
    pregunta: '¿Cuál trae más airbags?',
    porQue: 'Cada airbag es un cojín más entre tú y el golpe.',
    direction: 'higher',
    read: (_v, s) => num(s, 'safety.airbags'),
    display: n => `${Math.round(n)} airbags`,
  },
  {
    id: 'hueco',
    titulo: 'Altura al piso',
    pregunta: '¿Cuál pasa los reductores sin raspar?',
    porQue: 'Más altura al piso = menos sustos con huecos y policías acostados.',
    direction: 'higher',
    read: (_v, s) => num(s, 'chassis.groundClearance'),
    display: n => `${(n / 10).toFixed(1).replace('.0', '')} cm del piso`,
  },
];

/** Barra mínima para que un perdedor no se vea como "cero". */
const BARRA_MIN = 0.12;

export function runDuel(vehicles: DuelVehicle[]): DuelResult {
  const score: Record<string, number> = Object.fromEntries(vehicles.map(v => [v.id, 0]));
  const specs = new Map(vehicles.map(v => [v.id, parseSpecs(v.specifications)]));

  const rounds: DuelRound[] = [];

  for (const def of DUEL_ROUNDS) {
    const aplicables = def.aplica ? vehicles.filter(def.aplica) : vehicles;
    // Una ronda que no aplica a nadie de los elegidos (Autonomía entre carros
    // de gasolina) no se muestra: sería ruido, no información.
    if (aplicables.length === 0) continue;

    const values = vehicles.map(v => {
      if (def.aplica && !def.aplica(v)) return { v, value: null as number | null, noAplica: true };
      return { v, value: def.read(v, specs.get(v.id)!), noAplica: false };
    });

    const conDato = values.filter(x => x.value !== null) as { v: DuelVehicle; value: number; noAplica: boolean }[];
    const comparable = conDato.length >= 2;

    let best: number | null = null;
    if (conDato.length > 0) {
      const nums = conDato.map(x => x.value);
      best = def.direction === 'higher' ? Math.max(...nums) : Math.min(...nums);
    }

    const entries: DuelEntry[] = values.map(({ v, value, noAplica }) => {
      if (value === null || best === null) {
        return {
          vehicleId: v.id,
          value: null,
          display: noAplica ? (def.motivoNoAplica ?? 'No aplica') : null,
          bar: 0,
          winner: false,
        };
      }
      const ratio = def.direction === 'higher' ? value / best : best / value;
      const winner = comparable && value === best;
      if (winner) score[v.id] += 1;
      return {
        vehicleId: v.id,
        value,
        display: def.display(value, v),
        bar: Math.max(BARRA_MIN, Math.min(1, ratio)),
        winner,
      };
    });

    let motivoNoComparable: string | undefined;
    if (!comparable) {
      const sinDato = values.filter(x => x.value === null && !x.noAplica).map(x => `${x.v.brand} ${x.v.model}`);
      motivoNoComparable =
        sinDato.length > 0
          ? `Todavía no tenemos este dato de ${sinDato.join(' ni de ')}. Esta ronda no reparte puntos.`
          : 'Solo un vehículo compite en esta ronda. No reparte puntos.';
    }

    rounds.push({
      id: def.id,
      titulo: def.titulo,
      pregunta: def.pregunta,
      porQue: def.porQue,
      entries,
      comparable,
      motivoNoComparable,
    });
  }

  // Las rondas jugables primero: el juego arranca con acción, no con "sin dato".
  rounds.sort((a, b) => Number(b.comparable) - Number(a.comparable));

  return { rounds, score };
}
