// ============================================================================
// SCORING DETERMINÍSTICO — el orden base del buscador.
//
// Hasta hoy el ranking dependía 100% del LLM (`det_score: 0`): la misma
// consulta podía dar órdenes distintos y no había forma de explicar por qué
// un carro quedó de primero. Este módulo pone el orden con una fórmula:
//
//   score = Σ ( percentil_winsorizado(feature, candidatos) × peso_del_perfil )
//
// Reproducible, explicable, auditable y gratis. El LLM pasa a ser el
// EXPLICADOR (afina el top y escribe las razones), no el ranking.
//
// El percentil se calcula DENTRO del set de candidatos que ya filtró la
// búsqueda — la misma matemática anti-Bugatti de lib/comparison/cohorts.ts:
// un outlier de 1500 HP no aplasta la escala de un Corolla.
//
// Cuando la migración a VehicleAttribute esté aplicada (fase B), la fuente de
// datos cambia a hechos con confianza; la fórmula y este módulo quedan igual.
// ============================================================================

import type { VehicleFeatures } from './features';
import type { VehicleCandidate } from './features';
import { winsorizedPercentile } from '@/lib/comparison/cohorts';

// ---------------------------------------------------------------------------
// Perfiles: qué features pesan según lo que la persona busca.
// Las claves son campos reales de VehicleFeatures.
// ---------------------------------------------------------------------------
type FeatureKey = keyof VehicleFeatures;
type ProfileWeights = Partial<Record<FeatureKey, number>>;

const PROFILES: Record<string, { labelEs: string; weights: ProfileWeights }> = {
  palmas: {
    labelEs: 'para subir pendientes',
    weights: { hill_climb_score: 1.0, power_to_weight_norm: 0.8, acceleration_norm: 0.8 },
  },
  huecos: {
    labelEs: 'aguanta calles malas',
    weights: { potholes_score: 1.0, ground_clearance_norm: 0.6, reliability_norm: 0.3 },
  },
  finca: {
    labelEs: 'para finca y destapado',
    weights: { offroad_score: 1.0, ground_clearance_norm: 0.5, potholes_score: 0.5 },
  },
  economia: {
    labelEs: 'económico de mantener',
    // "Que no gaste mucho" es primero no pagar de más y después gastar poco al mes.
    // El precio pesa triple: combinado con otro perfil ("familia que no gaste"),
    // un carro de $230 M no puede ganarle a uno de $95 M por tener más baúl.
    weights: { quality_price_ratio_norm: 3.0, efficiency_norm: 1.0, reliability_norm: 0.4 },
  },
  familia: {
    labelEs: 'para la familia',
    // El espacio pesa doble: con "que no gaste", un Picanto de 255 L de baúl no
    // puede ser la mejor opción para una familia solo por ser el más barato.
    weights: { space_norm: 2.0, safety_norm: 1.0, comfort_norm: 0.5, reliability_norm: 0.4 },
  },
  ciudad: {
    labelEs: 'para la ciudad y el trancón',
    weights: { urban_score: 1.0, efficiency_norm: 0.5, comfort_norm: 0.3 },
  },
  desempeno: {
    labelEs: 'con buen desempeño',
    weights: { acceleration_norm: 0.9, power_to_weight_norm: 1.0, max_speed_norm: 0.4 },
  },
  prestigio: {
    labelEs: 'con presencia',
    weights: { prestige_norm: 1.0, comfort_norm: 0.5, tech_norm: 0.4 },
  },
  seguridad: {
    labelEs: 'seguro',
    weights: { safety_norm: 1.0, braking_norm: 0.5, reliability_norm: 0.3 },
  },
  viajes: {
    labelEs: 'para carretera',
    weights: { highway_score: 1.0, comfort_norm: 0.6, efficiency_norm: 0.4 },
  },
};

// Perfil neutro cuando la consulta no activa ninguno: balance general honesto,
// no un sesgo escondido hacia potencia o precio.
const DEFAULT_WEIGHTS: ProfileWeights = {
  quality_price_ratio_norm: 0.8,
  reliability_norm: 0.6,
  comfort_norm: 0.5,
  efficiency_norm: 0.5,
  safety_norm: 0.5,
};

// ---------------------------------------------------------------------------
// Router determinístico: regex + diccionario es-CO (plan §6.2).
// Sin LLM: mismo texto → mismos pesos, siempre.
// ---------------------------------------------------------------------------
// Solo frontera inicial (\b al inicio): las alternativas son PREFIJOS
// ("rapid" debe matchear "rápido", "econ..." debe matchear "económico").
// Un \b de cierre exigiría que la palabra termine ahí y rompería todos los prefijos.
const KEYWORDS: Record<string, RegExp> = {
  palmas: /\b(palmas|subid[ao]|pendiente|loma|monta[ñn]a|empinad|subir)/,
  huecos: /\b(hueco|calles? mal|v[ií]as? mal|destapad|resistente)/,
  finca: /\b(finca|trocha|4x4|todo\s?terreno|campo|vereda|barro)/,
  // "que no gaste mucho", "gastar poco", "cuidar el bolsillo": así lo dice la gente.
  economia: /\b(econ[oó]mic|barat|ahorr|consum|rendidor|gast[aeo]|eficien|presupuest|bolsillo|plata)/,
  familia: /\b(famili|ni[ñn]o|hij[oa]|beb[eé]|espaci|ba[uú]l|puestos|asientos|mascota|perr[oa]|gat[oa])/,
  ciudad: /\b(ciudad|tranc[oó]n|parquear|parqueadero|compact|urban|medell[ií]n|bogot[aá]|peque[ñn]o)/,
  desempeno: /\b(r[aá]pid|deportiv|potenci|potente|veloz|correr|acelera)/,
  prestigio: /\b(lujo|prestigi|elegante|premium|ejecutiv|estatus|fino)/,
  seguridad: /\b(segur[oa]|seguridad|airbag|freno|protecci[oó]n)/,
  viajes: /\b(viaj|carretera|autopista|ruta|paseo)/,
};

export interface QueryProfile {
  /** Pesos combinados de todos los perfiles activados. */
  weights: ProfileWeights;
  /** Perfiles detectados, para explicar el orden ("priorizado para subir pendientes"). */
  activeProfiles: string[];
  labelsEs: string[];
}

export function detectQueryProfile(query: string): QueryProfile {
  const q = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, ''); // sin tildes: "económico" y "economico" son lo mismo

  const active = Object.keys(KEYWORDS).filter(k =>
    KEYWORDS[k].test(q) ||
    // probar también contra el patrón sin tildes
    KEYWORDS[k].test(q.normalize('NFD').replace(/[̀-ͯ]/g, ''))
  );

  if (active.length === 0) {
    return { weights: { ...DEFAULT_WEIGHTS }, activeProfiles: [], labelsEs: [] };
  }

  // Combinar: si varios perfiles piden la misma feature, gana el peso mayor
  // (sumar inflaría features compartidas como reliability).
  const weights: ProfileWeights = {};
  for (const name of active) {
    const p = PROFILES[name].weights;
    for (const key of Object.keys(p) as FeatureKey[]) {
      weights[key] = Math.max(weights[key] ?? 0, p[key]!);
    }
  }

  return {
    weights,
    activeProfiles: active,
    labelsEs: active.map(a => PROFILES[a].labelEs),
  };
}

// ---------------------------------------------------------------------------
// Scoring del set de candidatos
// ---------------------------------------------------------------------------
export interface DeterministicResult {
  /** 0-100. Comparable solo dentro de esta búsqueda (percentiles del set). */
  score: number;
  /** Contribución por feature, para depurar y para las razones del fallback. */
  breakdown: Record<string, number>;
}

/**
 * Puntúa cada candidato contra el resto del set (percentil winsorizado por
 * feature × peso del perfil). Devuelve un mapa id → resultado.
 *
 * Determinismo: mismo set + misma consulta ⇒ mismos puntajes. Los empates se
 * resuelven después con desempate estable (precio, id), nunca por orden de BD.
 */
export function scoreDeterministically(
  candidates: VehicleCandidate[],
  profile: QueryProfile
): Map<string, DeterministicResult> {
  const results = new Map<string, DeterministicResult>();
  if (candidates.length === 0) return results;

  const entries = Object.entries(profile.weights) as [FeatureKey, number][];
  const totalWeight = entries.reduce((s, [, w]) => s + w, 0) || 1;

  // Pre-extraer columnas de valores por feature (una sola pasada por feature)
  const columns = new Map<FeatureKey, number[]>();
  for (const [key] of entries) {
    // Solo los valores conocidos forman la escala; NaN = "no sabemos".
    columns.set(key, candidates.map(c => c.features[key]).filter(v => Number.isFinite(v)));
  }

  for (const candidate of candidates) {
    const breakdown: Record<string, number> = {};
    let sum = 0;

    for (const [key, weight] of entries) {
      const values = columns.get(key)!;
      const v = candidate.features[key];
      // Dato faltante = mediana: ni premia ni castiga. Con menos de 2 datos la
      // feature no separa a nadie.
      const pct = Number.isFinite(v) && values.length >= 2 ? winsorizedPercentile(v, values) : 50;
      const contribution = (pct * weight) / totalWeight;
      breakdown[key] = Math.round(contribution * 10) / 10;
      sum += contribution;
    }

    results.set(candidate.id, {
      score: Math.round(sum),
      breakdown,
    });
  }

  return results;
}

/**
 * Ordena candidatos por puntaje determinístico, con desempate estable:
 * score desc → precio asc (a igual puntaje, el más barato primero) → id.
 */
export function rankCandidates<T extends VehicleCandidate & { score: number }>(
  candidates: T[]
): T[] {
  return [...candidates].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.price !== b.price) return a.price - b.price;
    return a.id.localeCompare(b.id);
  });
}
