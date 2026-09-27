// ============================================================================
// Entrada de una línea para la ingesta: "Ónix RS 2026" → { marca?, modelo, año }.
//
// Es un pre-parseo determinístico y barato. No intenta separar modelo de
// versión ("Corolla Cross XEI" vs "Onix RS"): eso lo decide resolveIdentity
// con el LLM, que sí conoce los nombres comerciales en Colombia. Aquí solo se
// saca el año y, si se reconoce, la marca, para que el LLM parta de algo firme.
// ============================================================================

export interface ParsedVehicleQuery {
  /** Marca canónica si se reconoció; '' si hay que inferirla. */
  brand: string;
  /** Todo lo que no es marca ni año: modelo + versión, tal como lo escribió el humano. */
  model: string;
  year: number;
  /** true si el año no venía en el texto y se asumió el del modelo vigente. */
  yearAssumed: boolean;
}

/** Marca canónica por alias (minúsculas, sin tildes). */
const BRAND_ALIASES: Record<string, string> = {
  'toyota': 'Toyota',
  'kia': 'Kia',
  'renault': 'Renault',
  'chevrolet': 'Chevrolet',
  'chevy': 'Chevrolet',
  'mazda': 'Mazda',
  'hyundai': 'Hyundai',
  'nissan': 'Nissan',
  'suzuki': 'Suzuki',
  'volkswagen': 'Volkswagen',
  'vw': 'Volkswagen',
  'ford': 'Ford',
  'byd': 'BYD',
  'mercedes-benz': 'Mercedes-Benz',
  'mercedes benz': 'Mercedes-Benz',
  'mercedes': 'Mercedes-Benz',
  'bmw': 'BMW',
  'audi': 'Audi',
  'volvo': 'Volvo',
  'mg': 'MG',
  'chery': 'Chery',
  'jac': 'JAC',
  'fiat': 'Fiat',
  'jeep': 'Jeep',
  'ram': 'RAM',
  'honda': 'Honda',
  'subaru': 'Subaru',
  'mitsubishi': 'Mitsubishi',
  'peugeot': 'Peugeot',
  'citroen': 'Citroën',
  'tesla': 'Tesla',
  'geely': 'Geely',
  'great wall': 'GWM',
  'gwm': 'GWM',
  'haval': 'Haval',
  'dfsk': 'DFSK',
  'changan': 'Changan',
  'zeekr': 'Zeekr',
  'porsche': 'Porsche',
  'land rover': 'Land Rover',
  'mini': 'MINI',
  'dodge': 'Dodge',
  'opel': 'Opel',
  'jetour': 'Jetour',
  'deepal': 'Deepal',
};

/**
 * Modelos que en Colombia se nombran sin marca ("un Onix", "una Duster").
 * Solo nombres inequívocos: si un nombre existe en dos marcas, no va aquí.
 */
const MODEL_TO_BRAND: Record<string, string> = {
  'onix': 'Chevrolet', 'tracker': 'Chevrolet', 'captiva': 'Chevrolet', 'spark': 'Chevrolet',
  'joy': 'Chevrolet', 'montana': 'Chevrolet', 'colorado': 'Chevrolet', 'equinox': 'Chevrolet',
  'corolla': 'Toyota', 'hilux': 'Toyota', 'rav4': 'Toyota', 'fortuner': 'Toyota', 'yaris': 'Toyota',
  'prado': 'Toyota', 'land cruiser': 'Toyota',
  'duster': 'Renault', 'sandero': 'Renault', 'logan': 'Renault', 'stepway': 'Renault',
  'kwid': 'Renault', 'koleos': 'Renault', 'oroch': 'Renault', 'arkana': 'Renault',
  'picanto': 'Kia', 'sportage': 'Kia', 'sorento': 'Kia', 'seltos': 'Kia', 'sonet': 'Kia', 'k3': 'Kia',
  'mazda 2': 'Mazda', 'mazda 3': 'Mazda', 'cx-30': 'Mazda', 'cx-5': 'Mazda', 'cx-50': 'Mazda',
  'cx-60': 'Mazda', 'cx-90': 'Mazda', 'bt-50': 'Mazda',
  'tucson': 'Hyundai', 'creta': 'Hyundai', 'kona': 'Hyundai', 'santa fe': 'Hyundai', 'venue': 'Hyundai',
  'kicks': 'Nissan', 'versa': 'Nissan', 'frontier': 'Nissan', 'x-trail': 'Nissan', 'march': 'Nissan',
  'swift': 'Suzuki', 'vitara': 'Suzuki', 'jimny': 'Suzuki', 's-cross': 'Suzuki', 'dzire': 'Suzuki',
  'polo': 'Volkswagen', 't-cross': 'Volkswagen', 'nivus': 'Volkswagen', 'tiguan': 'Volkswagen',
  'virtus': 'Volkswagen', 'amarok': 'Volkswagen', 'taos': 'Volkswagen',
  'ranger': 'Ford', 'territory': 'Ford', 'escape': 'Ford', 'bronco': 'Ford', 'explorer': 'Ford',
  'dolphin': 'BYD', 'seagull': 'BYD', 'yuan': 'BYD', 'song': 'BYD', 'seal': 'BYD', 'atto': 'BYD',
  'model y': 'Tesla', 'model 3': 'Tesla',
  'zs': 'MG', 'hs': 'MG', 'mg zs': 'MG',
  'tiggo': 'Chery',
  'renegade': 'Jeep', 'compass': 'Jeep', 'wrangler': 'Jeep', 'commander': 'Jeep',
  'cr-v': 'Honda', 'hr-v': 'Honda', 'wr-v': 'Honda', 'civic': 'Honda',
  '2008': 'Peugeot', '3008': 'Peugeot', '208': 'Peugeot',
};

function normalizar(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
}

/** Año por defecto: el año-modelo que se vende hoy (en el 2º semestre ya circula el siguiente). */
export function defaultModelYear(now = new Date()): number {
  return now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
}

export function parseVehicleQuery(input: string, now = new Date()): ParsedVehicleQuery | null {
  let resto = input.replace(/\s+/g, ' ').trim();
  if (!resto) return null;

  // Año: el último número de 4 cifras plausible. "Peugeot 2008 2026" → año 2026, modelo 2008.
  const maxYear = now.getFullYear() + 2;
  const candidatos = Array.from(resto.matchAll(/\b(19[9]\d|20\d\d)\b/g))
    .filter(m => Number(m[1]) >= 1990 && Number(m[1]) <= maxYear);
  let year = defaultModelYear(now);
  let yearAssumed = true;
  const ultimo = candidatos[candidatos.length - 1];
  // Si el único número es a la vez nombre de modelo (Peugeot 2008) y no hay otro, no es año.
  const esNombreDeModelo = (n: string) => MODEL_TO_BRAND[n] !== undefined;
  if (ultimo && !(candidatos.length === 1 && esNombreDeModelo(ultimo[1]))) {
    year = Number(ultimo[1]);
    yearAssumed = false;
    resto = (resto.slice(0, ultimo.index) + resto.slice(ultimo.index! + 4)).replace(/\s+/g, ' ').trim();
  }

  // Marca explícita al inicio (la más larga que calce: "mercedes benz" antes que "mercedes").
  const norm = normalizar(resto);
  let brand = '';
  const aliases = Object.keys(BRAND_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of aliases) {
    if (norm === alias || norm.startsWith(alias + ' ')) {
      brand = BRAND_ALIASES[alias];
      resto = resto.slice(alias.length).trim();
      break;
    }
  }

  // Sin marca: se infiere del modelo si es inequívoco.
  if (!brand) {
    const modelos = Object.keys(MODEL_TO_BRAND).sort((a, b) => b.length - a.length);
    for (const m of modelos) {
      if (norm === m || norm.startsWith(m + ' ')) {
        brand = MODEL_TO_BRAND[m];
        break;
      }
    }
  }

  const model = resto.replace(/^[-–,\s]+|[-–,\s]+$/g, '');
  if (!model) return null;

  return { brand, model, year, yearAssumed };
}

/** Varias líneas (o separadas por ";") → lista de consultas, sin duplicados. */
export function parseVehicleList(text: string, now = new Date()): { raw: string; parsed: ParsedVehicleQuery | null }[] {
  const vistos = new Set<string>();
  return text
    .split(/[\n;]+/)
    .map(l => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter(Boolean)
    .filter(l => {
      const k = normalizar(l);
      if (vistos.has(k)) return false;
      vistos.add(k);
      return true;
    })
    .map(raw => ({ raw, parsed: parseVehicleQuery(raw, now) }));
}
