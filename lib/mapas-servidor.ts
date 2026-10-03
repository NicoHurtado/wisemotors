// Resuelve el link de Google Maps que pega el equipo (incluidos los cortos
// maps.app.goo.gl) a coordenadas. Solo sigue redirecciones hacia dominios de
// Google (esLinkDeMaps): el servidor no se puede usar para pedir otras URLs.

import { coordenadasDeLink, esLinkDeMaps } from '@/lib/mapas';

export interface UbicacionResuelta {
  lat: number;
  lng: number;
  urlFinal: string;
  /** Nombre del lugar si viene en el link (/place/Nombre/...). */
  nombre: string | null;
}

function nombreDeLink(url: string): string | null {
  const m = url.match(/\/place\/([^/@?]+)/);
  if (!m) return null;
  try {
    const n = decodeURIComponent(m[1].replace(/\+/g, ' ')).trim();
    return /^-?\d/.test(n) ? null : n; // "/place/6.2,-75.5" no es un nombre
  } catch {
    return null;
  }
}

export async function resolverLinkMaps(url: string): Promise<UbicacionResuelta | null> {
  let actual = url.trim();
  if (!esLinkDeMaps(actual)) return null;
  for (let salto = 0; salto < 5; salto++) {
    const coords = coordenadasDeLink(actual);
    if (coords) return { ...coords, urlFinal: actual, nombre: nombreDeLink(actual) };
    let res: Response;
    try {
      res = await fetch(actual, { redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0 (WiseMotors)' }, signal: AbortSignal.timeout(6000) });
    } catch {
      return null;
    }
    const siguiente = res.headers.get('location');
    if (siguiente && res.status >= 300 && res.status < 400) {
      const abs = new URL(siguiente, actual).toString();
      if (!esLinkDeMaps(abs)) return null;
      actual = abs;
      continue;
    }
    // Sin redirección: a veces las coordenadas vienen en el HTML (meta / APP_INITIALIZATION_STATE)
    if (res.ok) {
      const html = (await res.text()).slice(0, 400_000);
      const enHtml = html.match(/center=(-?\d{1,3}\.\d+)%2C(-?\d{1,3}\.\d+)/) ?? html.match(/\[null,null,(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)\]/);
      if (enHtml) {
        const lat = parseFloat(enHtml[1]);
        const lng = parseFloat(enHtml[2]);
        if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng, urlFinal: actual, nombre: nombreDeLink(actual) };
      }
    }
    return null;
  }
  return null;
}
