// ============================================================================
// Mapas de los concesionarios, sin depender de una API paga:
//   - El equipo pega el link de Google Maps del concesionario y de ahí se leen
//     las coordenadas (los links cortos maps.app.goo.gl se resuelven en el
//     servidor: lib/mapas-servidor.ts).
//   - El mapa se incrusta con la Maps Embed API (gratis, sin límite de uso) si
//     hay NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY; si no, con el embed clásico sin clave.
//   - "Cómo llegar" es un link de Google Maps (gratis): solo DESPUÉS de que la
//     persona escribió, para no sacarla de WiseMotors antes del lead.
//   - La distancia a la persona se calcula EN SU NAVEGADOR (lib/distancia.ts):
//     su ubicación nunca llega al servidor.
// ============================================================================

export interface PuntoMapa {
  name: string;
  address?: string | null;
  location?: string | null;
  lat?: number | null;
  lng?: number | null;
}

const enRango = (lat: number, lng: number) => Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);

/**
 * Coordenadas de un link de Google Maps. Prioriza el punto del lugar (!3d!4d)
 * sobre el centro de la vista (@lat,lng), que puede estar corrido.
 */
export function coordenadasDeLink(url: string): { lat: number; lng: number } | null {
  let u = url.trim();
  try {
    u = decodeURIComponent(u);
  } catch {
    // se usa tal cual
  }
  const num = '(-?\\d{1,3}(?:\\.\\d+)?)';
  const patrones = [
    new RegExp(`!3d${num}!4d${num}`), // el pin del lugar
    new RegExp(`[?&](?:q|query|ll|destination|center)=${num},\\s*${num}`),
    new RegExp(`/place/${num},\\s*${num}`),
    new RegExp(`@${num},${num}`), // centro de la vista
  ];
  for (const p of patrones) {
    const m = u.match(p);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[2]);
      if (enRango(lat, lng)) return { lat, lng };
    }
  }
  return null;
}

/** ¿Es un link de Google Maps (o su versión corta)? Solo esos se resuelven en el servidor. */
export function esLinkDeMaps(url: string): boolean {
  try {
    const u = new URL(url.trim());
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    const h = u.hostname.toLowerCase();
    return (
      h === 'maps.app.goo.gl' ||
      (h === 'goo.gl' && u.pathname.startsWith('/maps')) ||
      h === 'maps.google.com' ||
      /^(www\.)?google\.[a-z.]{2,6}$/.test(h)
    );
  } catch {
    return false;
  }
}

const consulta = (p: PuntoMapa) => [p.name, p.address, p.location].filter(Boolean).join(', ');

/** URL del iframe del mapa. Con nombre + dirección Google muestra la ficha del lugar (calificación, fotos). */
export function urlMapaIncrustado(p: PuntoMapa, clave = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY): string | null {
  const tieneCoords = typeof p.lat === 'number' && typeof p.lng === 'number';
  if (!tieneCoords && !p.address) return null;
  if (clave) {
    const q = encodeURIComponent(consulta(p) || `${p.lat},${p.lng}`);
    const centro = tieneCoords ? `&center=${p.lat},${p.lng}` : '';
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(clave)}&q=${q}${centro}&zoom=16&language=es&region=CO`;
  }
  const q = tieneCoords ? `${p.lat},${p.lng}` : consulta(p);
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=16&hl=es&output=embed`;
}

/** "Cómo llegar": abre Google Maps (la app en el celular) con la ruta desde donde esté la persona. */
export function urlComoLlegar(p: PuntoMapa): string {
  const destino = typeof p.lat === 'number' && typeof p.lng === 'number' ? `${p.lat},${p.lng}` : consulta(p);
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}`;
}
