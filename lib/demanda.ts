// ============================================================================
// Demanda: qué busca la gente, agrupado por lo que de verdad quiere.
//
// Cada búsqueda se guarda con lo que la IA entendió (lib/ai/categorization)
// y los perfiles del router determinístico (lib/ai/deterministic). El grupo
// ("intención") junta tres cosas que un concesionario o una marca entienden:
//   necesidad (familia + que gaste poco…) · carrocería · banda de presupuesto.
// "Una SUV para la familia que no gaste mucho" y "camioneta familiar barata"
// caen en el mismo grupo aunque estén escritas distinto.
//
// Esto es materia prima de los informes (valor para concesionarios y marcas):
// solo se reportan AGREGADOS. El texto libre se queda en el panel interno,
// porque la gente a veces escribe datos propios.
// ============================================================================

import { createHash } from 'node:crypto';
import { detectQueryProfile } from '@/lib/ai/deterministic';
import type { CategorizedIntent } from '@/lib/ai/categorization';

// ── Etiquetas para personas (informes y panel) ─────────────────────────────
export const NECESIDADES: Record<string, string> = {
  familia: 'Familia',
  economia: 'Que gaste poco',
  ciudad: 'Ciudad y trancón',
  palmas: 'Lomas y pendientes',
  huecos: 'Calles malas',
  finca: 'Finca y destapado',
  desempeno: 'Desempeño',
  prestigio: 'Presencia y lujo',
  seguridad: 'Seguridad',
  viajes: 'Carretera',
};

// Bandas en pesos colombianos (precio de lista de carros nuevos, H2-2026)
const BANDAS: { hasta: number; clave: string; etiqueta: string }[] = [
  { hasta: 80e6, clave: 'hasta-80', etiqueta: 'Hasta $80 M' },
  { hasta: 120e6, clave: '80-120', etiqueta: '$80–120 M' },
  { hasta: 180e6, clave: '120-180', etiqueta: '$120–180 M' },
  { hasta: 300e6, clave: '180-300', etiqueta: '$180–300 M' },
  { hasta: Infinity, clave: 'mas-300', etiqueta: 'Más de $300 M' },
];
const SIN_PRESUPUESTO = { clave: 'sin', etiqueta: 'Sin presupuesto dicho' };

/** Carrocería canónica (la taxonomía de la BD), o null si no se reconoce. */
export function carroceriaCanonica(x: string): string | null {
  const t = x
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  if (/pick|platon|estaca/.test(t)) return 'Pickup';
  if (/suv|camioneta|crossover|todoterreno|campero/.test(t)) return 'SUV';
  if (/hatch/.test(t)) return 'Hatchback';
  if (/sedan/.test(t)) return 'Sedán';
  if (/coupe|cupe/.test(t)) return 'Coupé';
  if (/van|minivan|furgon/.test(t)) return 'Van';
  if (/convertible|descapotable/.test(t)) return 'Convertible';
  return null;
}

/** Carrocería dicha en el texto (con palabra completa: "van" no es "avanzado"). Respaldo si la IA no la sacó. */
export function carroceriaDelTexto(texto: string): string | null {
  const t = normalizarBusqueda(texto);
  if (/\b(pick ?up|pickup|platon|estacas?)\b/.test(t)) return 'Pickup';
  if (/\b(suv|camionetas?|crossover|campero)\b/.test(t)) return 'SUV';
  if (/\bhatch(back)?\b/.test(t)) return 'Hatchback';
  if (/\bsedan(es)?\b/.test(t)) return 'Sedán';
  if (/\b(minivan|van)\b/.test(t)) return 'Van';
  return null;
}

/**
 * Presupuesto dicho en el texto: "hasta 100 millones", "120 palos", "más de 200 M".
 * Respaldo si la IA no lo sacó. En pesos.
 */
export function presupuestoDelTexto(texto: string): { min: number | null; max: number | null } {
  const t = normalizarBusqueda(texto);
  const m = t.match(/(desde|mas de|minimo|arriba de)?\s*\$?\s*(\d{2,4})(?:\.\d{3})*\s*(millones|millon|mill|palos|m)\b/);
  if (!m) return { min: null, max: null };
  const valor = parseInt(m[2]) * 1e6;
  return m[1] ? { min: valor, max: null } : { min: null, max: valor };
}

export function normalizarBusqueda(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9$ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function bandaPresupuesto(min: number | null, max: number | null) {
  const ref = max ?? min;
  if (!ref || ref <= 0) return SIN_PRESUPUESTO;
  return BANDAS.find(b => ref <= b.hasta)!;
}

/** Clave estable del grupo: "economia+familia|SUV|80-120". */
export function claveIntencion(necesidades: string[], carrocerias: string[], min: number | null, max: number | null) {
  const n = necesidades.length ? Array.from(new Set(necesidades)).sort().join('+') : 'general';
  const c = carrocerias.length === 1 ? carrocerias[0] : carrocerias.length > 1 ? 'varias' : 'cualquiera';
  return `${n}|${c}|${bandaPresupuesto(min, max).clave}`;
}

/** "SUV · Familia + Que gaste poco · $80–120 M" */
export function etiquetaIntencion(clave: string): string {
  const [n, c, b] = clave.split('|');
  const necesidad = n === 'general' ? 'Sin necesidad específica' : n.split('+').map(x => NECESIDADES[x] ?? x).join(' + ');
  const carroceria = c === 'cualquiera' ? 'Cualquier carrocería' : c === 'varias' ? 'Varias carrocerías' : c;
  const banda = [...BANDAS, SIN_PRESUPUESTO].find(x => x.clave === b)?.etiqueta ?? b;
  return `${carroceria} · ${necesidad} · ${banda}`;
}

/** Lo que se guarda de una búsqueda: puro, sin BD (se prueba en scripts/verify-demanda.ts). */
export function fichaDeBusqueda(texto: string, intent: Pick<CategorizedIntent, 'query_type' | 'objective_filters' | 'missing_brands'>) {
  const f = intent.objective_filters ?? {};
  const deLaIA = Array.from(new Set((f.body_types ?? []).map(carroceriaCanonica).filter((x): x is string => !!x)));
  const delTexto = carroceriaDelTexto(texto);
  const carrocerias = deLaIA.length ? deLaIA : delTexto ? [delTexto] : [];
  const necesidades = detectQueryProfile(texto).activeProfiles;
  const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : null);
  const respaldo = presupuestoDelTexto(texto);
  const iaDioPrecio = num(f.price_range?.min) !== null || num(f.price_range?.max) !== null;
  const presupuestoMin = iaDioPrecio ? num(f.price_range?.min) : respaldo.min;
  const presupuestoMax = iaDioPrecio ? num(f.price_range?.max) : respaldo.max;
  return {
    texto: texto.trim().slice(0, 300),
    normalizado: normalizarBusqueda(texto).slice(0, 300),
    tipoConsulta: String(intent.query_type),
    necesidades,
    carrocerias,
    combustibles: f.fuel_types ?? [],
    marcas: f.brands ?? [],
    marcasFaltantes: intent.missing_brands ?? [],
    presupuestoMin,
    presupuestoMax,
    intencion: claveIntencion(necesidades, carrocerias, presupuestoMin, presupuestoMax),
  };
}

/** El id anónimo del navegador nunca se guarda tal cual. */
export const hashSesion = (s: string) => createHash('sha256').update(`wise-demanda:${s}`).digest('hex').slice(0, 24);

// ── Resumen para el panel y los informes ───────────────────────────────────
export type Fila = {
  texto: string;
  normalizado: string;
  necesidades: string[];
  carrocerias: string[];
  combustibles: string[];
  marcas: string[];
  marcasFaltantes: string[];
  presupuestoMin: number | null;
  presupuestoMax: number | null;
  intencion: string;
  resultados: number;
  sesion: string | null;
  ciudad: string | null;
  createdAt: Date;
};

const contar = (xs: string[]) => {
  const m = new Map<string, number>();
  for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
  return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).map(([nombre, n]) => ({ nombre, n }));
};
const mediana = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * Agrega las búsquedas del periodo. `anteriores` (el periodo previo del mismo
 * largo) da la tendencia; `votos` (normalizado → [útiles, total]) la satisfacción.
 */
export function resumirDemanda(filas: Fila[], anteriores: Pick<Fila, 'intencion'>[], votos: Map<string, [number, number]>) {
  const personas = (fs: Fila[]) => new Set(fs.map(f => f.sesion).filter(Boolean)).size;
  const porGrupo = new Map<string, Fila[]>();
  for (const f of filas) porGrupo.set(f.intencion, [...(porGrupo.get(f.intencion) ?? []), f]);
  const antes = new Map<string, number>();
  for (const a of anteriores) antes.set(a.intencion, (antes.get(a.intencion) ?? 0) + 1);

  const grupos = Array.from(porGrupo.entries())
    .map(([clave, fs]) => {
      let utiles = 0;
      let votados = 0;
      for (const f of fs) {
        const v = votos.get(f.normalizado);
        if (v) {
          utiles += v[0];
          votados += v[1];
        }
      }
      // Ejemplos: las formas de decirlo más repetidas (texto de la más reciente)
      const formas = new Map<string, { n: number; texto: string }>();
      for (const f of fs) formas.set(f.normalizado, { n: (formas.get(f.normalizado)?.n ?? 0) + 1, texto: f.texto });
      return {
        clave,
        etiqueta: etiquetaIntencion(clave),
        busquedas: fs.length,
        personas: personas(fs),
        parte: fs.length / filas.length,
        anterior: antes.get(clave) ?? 0,
        presupuestoMediano: mediana(fs.map(f => f.presupuestoMax ?? f.presupuestoMin).filter((x): x is number => x !== null)),
        sinResultado: fs.filter(f => f.resultados === 0 || f.marcasFaltantes.length > 0).length,
        satisfaccion: votados ? utiles / votados : null,
        votos: votados,
        ejemplos: Array.from(formas.values()).sort((a, b) => b.n - a.n).slice(0, 3).map(x => x.texto),
      };
    })
    .sort((a, b) => b.busquedas - a.busquedas);

  return {
    total: filas.length,
    totalAnterior: anteriores.length,
    personas: personas(filas),
    grupos,
    necesidades: contar(filas.flatMap(f => (f.necesidades.length ? f.necesidades : ['general']))).map(x => ({
      ...x,
      nombre: x.nombre === 'general' ? 'Sin necesidad específica' : NECESIDADES[x.nombre] ?? x.nombre,
    })),
    carrocerias: contar(filas.flatMap(f => (f.carrocerias.length ? f.carrocerias : ['Cualquiera']))),
    presupuestos: contar(filas.map(f => bandaPresupuesto(f.presupuestoMin, f.presupuestoMax).etiqueta)),
    combustibles: contar(filas.flatMap(f => f.combustibles)),
    marcas: contar(filas.flatMap(f => f.marcas)),
    marcasFaltantes: contar(filas.flatMap(f => f.marcasFaltantes)),
    ciudades: contar(filas.map(f => f.ciudad ?? 'Sin dato')),
    repetidas: (() => {
      const m = new Map<string, { texto: string; n: number }>();
      for (const f of filas) m.set(f.normalizado, { texto: m.get(f.normalizado)?.texto ?? f.texto, n: (m.get(f.normalizado)?.n ?? 0) + 1 });
      return Array.from(m.values()).sort((a, b) => b.n - a.n).slice(0, 15);
    })(),
  };
}

/** CSV para informes: SOLO agregados, sin texto libre ni sesiones. */
export function demandaCsv(r: ReturnType<typeof resumirDemanda>) {
  const celda = (x: unknown) => `"${String(x ?? '').replace(/"/g, '""')}"`;
  const filas = [
    ['Intención', 'Búsquedas', 'Personas', '% del total', 'Periodo anterior', 'Presupuesto mediano (COP)', 'Sin resultado exacto', '% que dijo que le sirvió'],
    ...r.grupos.map(g => [
      g.etiqueta,
      g.busquedas,
      g.personas,
      (g.parte * 100).toFixed(1),
      g.anterior,
      g.presupuestoMediano ?? '',
      g.sinResultado,
      g.satisfaccion === null ? '' : (g.satisfaccion * 100).toFixed(0),
    ]),
  ];
  return filas.map(f => f.map(celda).join(',')).join('\n');
}
