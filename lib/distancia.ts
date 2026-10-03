// Distancia entre la persona y un concesionario, en línea recta (fórmula del
// haversine). Se calcula en el navegador: la ubicación de la persona no sale
// de su dispositivo. La distancia por carretera necesitaría una API paga.

export interface Coordenadas {
  lat: number;
  lng: number;
}

export function kmEntre(a: Coordenadas, b: Coordenadas): number {
  const R = 6371;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** "850 m", "3,2 km", "48 km" */
export function textoDistancia(km: number): string {
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
  if (km < 10) return `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(km)} km`;
  return `${Math.round(km)} km`;
}

/** Ordena de más cerca a más lejos; los que no tienen coordenadas van al final. */
export function porCercania<T extends { lat?: number | null; lng?: number | null }>(lista: T[], yo: Coordenadas | null): T[] {
  if (!yo) return lista;
  const d = (x: T) => (typeof x.lat === 'number' && typeof x.lng === 'number' ? kmEntre(yo, { lat: x.lat, lng: x.lng }) : Infinity);
  return [...lista].sort((a, b) => d(a) - d(b));
}
