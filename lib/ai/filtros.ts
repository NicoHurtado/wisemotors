// ============================================================================
// Filtros objetivos que viven dentro de la ficha (equipamiento) y los datos
// para afinar resultados con preguntas.
//
// Antes el equipamiento se filtraba con `specifications contains "Turbo"`: como
// TODAS las fichas tienen la clave `turbo` (aunque diga false), "con turbo"
// devolvía el catálogo entero. Aquí cada pedido se evalúa contra el dato real.
// ============================================================================

import { leer, specsDe } from '@/lib/vehiculo-datos';

const norm = (x: string) =>
  x
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

const si = (x: unknown) => x === true || (typeof x === 'string' && x.trim() !== '' && !/^(no|false|0)$/i.test(x.trim()));

/** Todos los VALORES de texto de la ficha (nunca las claves), para lo que no tiene campo propio. */
function textoValores(s: Record<string, any>): string {
  const out: string[] = [];
  const walk = (o: any) => {
    for (const v of Object.values(o ?? {})) {
      if (v && typeof v === 'object') walk(v);
      else if (typeof v === 'string') out.push(v);
    }
  };
  walk(s);
  return norm(out.join(' | '));
}

const trenes = (s: Record<string, any>) => [s.combustion, s.hybrid, s.phev, s.electric].filter(Boolean);

/** Caja del carro en palabras de persona, o null si no la sabemos. Un eléctrico es automático. */
export function caja(vehiculo: { fuelType?: string; specifications?: unknown }): 'Automática' | 'Manual' | null {
  if (vehiculo.fuelType === 'Eléctrico') return 'Automática';
  const s = specsDe(vehiculo.specifications);
  const t = trenes(s)
    .map(x => x.transmissionType)
    .find((x: unknown) => typeof x === 'string' && x);
  if (!t) return null;
  return /manual|mec[aá]nic/i.test(t) ? 'Manual' : 'Automática';
}

interface Regla {
  /** A qué pedidos responde (texto normalizado, sin tildes). */
  pide: RegExp;
  cumple: (s: Record<string, any>, v: { fuelType?: string; specifications?: unknown }) => boolean;
  /** Cómo se le dice al comprador que lo cumple. */
  razon: string;
}

const REGLAS: Regla[] = [
  {
    pide: /turbo|supercargad|compresor/,
    cumple: s => trenes(s).some(t => t.turbo === true || t.supercharger === true || /turbo|compresor/i.test(String(t.inductionType ?? ''))),
    razon: 'Tiene motor turbo',
  },
  { pide: /autom/, cumple: (_s, v) => caja(v) === 'Automática', razon: 'Caja automática' },
  { pide: /manual|mecanic/, cumple: (_s, v) => caja(v) === 'Manual', razon: 'Caja manual' },
  { pide: /carplay|android auto|smartphone|celular/, cumple: s => si(s.technology?.smartphoneIntegration), razon: 'Conecta el celular (CarPlay / Android Auto)' },
  { pide: /360/, cumple: s => si(s.assistance?.cameras360), razon: 'Cámara 360°' },
  { pide: /camara|reversa/, cumple: s => si(s.assistance?.reverseCamera) || si(s.assistance?.cameras360), razon: 'Cámara de reversa' },
  { pide: /sensor/, cumple: s => si(s.assistance?.parkingSensors), razon: 'Sensores de parqueo' },
  { pide: /cargador|inalambric/, cumple: s => si(s.technology?.wirelessCharger), razon: 'Cargador inalámbrico' },
  { pide: /crucero|adaptativ/, cumple: s => si(s.safety?.adaptiveCruiseControl), razon: 'Crucero adaptativo' },
  { pide: /frenado autom|aeb|emergencia/, cumple: s => si(s.safety?.autonomousEmergencyBraking), razon: 'Frenado automático de emergencia' },
  { pide: /punto ciego/, cumple: s => si(s.safety?.blindSpotDetection), razon: 'Alerta de punto ciego' },
  { pide: /carril/, cumple: s => si(s.safety?.laneAssist), razon: 'Asistente de carril' },
  { pide: /7 puestos|siete puestos|7 pasajeros|tercera fila/, cumple: s => (leer(s, 'interior.passengerCapacity') ?? 0) >= 7, razon: '7 puestos' },
  { pide: /\bled\b/, cumple: s => /led/i.test(String(s.lighting?.headlightType ?? '')), razon: 'Luces LED' },
  { pide: /climatizad|aire automatico/, cumple: s => si(s.comfort?.automaticClimateControl), razon: 'Aire acondicionado automático' },
  { pide: /asientos? calefact/, cumple: s => si(s.comfort?.heatedSeats), razon: 'Asientos con calefacción' },
  { pide: /asientos? ventilad/, cumple: s => si(s.comfort?.ventilatedSeats), razon: 'Asientos ventilados' },
];

/**
 * ¿El carro tiene lo que pidió? Primero contra su campo propio; si el pedido no
 * tiene campo (techo panorámico, 4x4, cuero, blindaje), contra el texto de la
 * ficha, que el comprador puede verificar.
 */
export function cumpleEquipamiento(vehiculo: { fuelType?: string; specifications?: unknown }, pedido: string): { cumple: boolean; razon: string } {
  const p = norm(pedido);
  const s = specsDe(vehiculo.specifications);
  const regla = REGLAS.find(r => r.pide.test(p));
  if (regla) return { cumple: regla.cumple(s, vehiculo), razon: regla.razon };

  const texto = textoValores(s);
  const sinonimos: Record<string, string[]> = {
    '4x4': ['4x4', '4wd', 'awd', 'traccion integral', 'traccion total', 'traccion en las cuatro'],
    awd: ['awd', '4x4', '4wd', 'traccion integral', 'traccion total'],
    '4wd': ['4wd', '4x4', 'awd', 'traccion integral', 'traccion total'],
    sunroof: ['sunroof', 'techo corredizo', 'techo panoramico', 'quemacocos'],
    'techo panoramico': ['techo panoramico', 'sunroof', 'quemacocos'],
    cuero: ['cuero', 'leather'],
  };
  const buscar = sinonimos[p] ?? [p];
  return { cumple: buscar.some(b => texto.includes(b)), razon: pedido.charAt(0).toUpperCase() + pedido.slice(1) };
}

// ---------------------------------------------------------------------------
// Afinar con preguntas
// ---------------------------------------------------------------------------

export type Dimension = 'presupuesto' | 'combustible' | 'carroceria' | 'caja' | 'prioridad';
export const DIMENSIONES: Dimension[] = ['presupuesto', 'combustible', 'carroceria', 'caja', 'prioridad'];

export type Prioridad = 'comodidad' | 'economia' | 'seguridad' | 'espacio' | 'desempeno';

/** Lo que el cliente necesita de cada carro para filtrar al instante, sin volver a la IA. */
export interface DatosAfinar {
  precio: number;
  combustible: string;
  carroceria: string;
  caja: 'Automática' | 'Manual' | null;
  /** 0-100 dentro de estos resultados (percentil): para ordenar según lo que más le importe. */
  prioridades: Record<Prioridad, number>;
}
