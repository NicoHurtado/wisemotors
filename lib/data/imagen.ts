/**
 * URL servible de una imagen de vehículo.
 *
 * - http(s) (Cloudinary) o ruta pública ("/images/...") → tal cual.
 * - Imagen incrustada (data:...) → la sirve /api/vehicles/[id]/image.
 * - Sin imagen → null: la interfaz dibuja el render del carro en vez de un
 *   <img> roto.
 */
export function urlImagen(vehicleId: string, url: string | null | undefined, index = 0): string | null {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/')) return url;
  return `/api/vehicles/${vehicleId}/image?index=${index}`;
}
