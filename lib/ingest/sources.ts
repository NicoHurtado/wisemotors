// ============================================================================
// Descubrimiento de fuentes por tier (plan §5.1, paso 2).
//
// T1 · Sitio del fabricante en Colombia (dominio conocido por marca)
// T2 · Prensa especializada CO (búsqueda WordPress `?s=`) + Wikipedia
//
// Sin API de búsqueda externa: se usan patrones de URL verificables. Cada
// candidata se valida contra robots.txt y por contenido antes de usarse.
// ============================================================================

import type { DiscoveredSource } from './types';
import { fetchSearchResultLinks } from './fetcher';

/** Dominios de fabricantes en Colombia. Agregar una marca = agregar una línea. */
const MANUFACTURER_CO: Record<string, string> = {
  'toyota': 'https://www.toyota.com.co',
  'kia': 'https://www.kia.com/co',
  'renault': 'https://www.renault.com.co',
  'chevrolet': 'https://www.chevrolet.com.co',
  'mazda': 'https://www.mazda.com.co',
  'hyundai': 'https://www.hyundaicolombia.com.co',
  'nissan': 'https://www.nissan.com.co',
  'suzuki': 'https://www.suzuki.com.co',
  'volkswagen': 'https://www.volkswagen.com.co',
  'ford': 'https://www.ford.com.co',
  'byd': 'https://www.byd.com/co',
  'mercedes-benz': 'https://www.mercedes-benz.com.co',
  'bmw': 'https://www.bmw.com.co',
  'audi': 'https://www.audi.com.co',
  'volvo': 'https://www.volvocars.com/es-co',
  'mg': 'https://www.mgmotor.com.co',
  'chery': 'https://www.cherycolombia.com',
  'jac': 'https://www.jac.com.co',
  'fiat': 'https://www.fiat.com.co',
  'jeep': 'https://www.jeep.com.co',
  'ram': 'https://www.ram.com.co',
  'honda': 'https://www.hondaautos.com.co',
  'subaru': 'https://www.subaru.com.co',
  'mitsubishi': 'https://www.mitsubishi-motors.com.co',
  'peugeot': 'https://www.peugeot.com.co',
  'citroen': 'https://www.citroen.com.co',
  'tesla': 'https://www.tesla.com/es_mx', // Tesla no tiene sitio CO; se marca T2 abajo
};

function slug(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-');
}

/**
 * Propone fuentes en orden de tier. Devuelve solo URLs que valen la pena
 * intentar; el pipeline reporta las que fallen.
 */
export async function discoverSources(
  brand: string,
  model: string,
  year: number
): Promise<DiscoveredSource[]> {
  const sources: DiscoveredSource[] = [];
  const b = slug(brand);
  const q = encodeURIComponent(`${brand} ${model} ${year}`);

  // ── T2: prensa especializada CO (lo más confiable de encontrar) ──
  // Las búsquedas corren en paralelo; los artículos deben mencionar el modelo.
  const [ecc, adp] = await Promise.all([
    fetchSearchResultLinks(`https://www.elcarrocolombiano.com/?s=${q}`, [slug(model)]),
    fetchSearchResultLinks(`https://autosdeprimera.com/?s=${q}`, [slug(model)]),
  ]);
  for (const url of ecc) sources.push({ url, tier: 2, nameEs: 'El Carro Colombiano' });
  for (const url of adp) sources.push({ url, tier: 2, nameEs: 'Autos de Primera' });

  // ── T2 global: Wikipedia en español (fichas técnicas generales) ──
  // Va antes que las rutas adivinadas del fabricante: es una URL segura y no
  // debe quedarse sin cupo cuando las adivinanzas fallan.
  sources.push({
    url: `https://es.wikipedia.org/wiki/${encodeURIComponent(`${brand} ${model}`.replace(/\s+/g, '_'))}`,
    tier: 2,
    nameEs: 'Wikipedia',
  });

  // ── T1: fabricante CO (si el dominio se conoce) ──
  const mfg = MANUFACTURER_CO[b];
  if (mfg) {
    const isTeslaGlobal = b === 'tesla';
    // Rutas típicas de página de modelo; el fetcher descarta las que den 404.
    const candidates = [
      `${mfg}/${slug(model)}`,
      `${mfg}/vehiculos/${slug(model)}`,
    ];
    for (const url of candidates) {
      sources.push({ url, tier: isTeslaGlobal ? 2 : 1, nameEs: `Sitio oficial ${brand}` });
    }
  }

  return sources;
}
