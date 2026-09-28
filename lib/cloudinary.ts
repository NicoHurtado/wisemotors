import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

/**
 * Upload a base64 image to Cloudinary
 * @param base64Data - The base64 string (with or without data URI prefix)
 * @param folder - The folder in Cloudinary to store the image
 * @returns The secure URL of the uploaded image
 */
export async function uploadToCloudinary(
  base64Data: string,
  folder: string = 'wise-vehicles'
): Promise<{ url: string; publicId: string }> {
  // Ensure the base64 string has the data URI prefix
  const dataUri = base64Data.startsWith('data:')
    ? base64Data
    : `data:image/jpeg;base64,${base64Data}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: 'image',
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

/**
 * Delete an image from Cloudinary by its public_id
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
  }
}

export function cloudinaryConfigurado(): boolean {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

/**
 * Foto de carro con el mismo acabado para todo el catálogo:
 *  - exterior: se quita el fondo (queda transparente: sobre las tarjetas claras
 *    se ve en blanco y en el inicio oscuro no deja un rectángulo), se recorta al
 *    carro y, si la foto de lado mira a la izquierda, se voltea (todos miran a la
 *    derecha, como el resto del diseño);
 *  - interior: solo se optimiza, sin quitar fondo.
 * Devuelve la URL ya transformada. Lanza si Cloudinary no puede procesarla.
 */
export async function procesarFotoCarro(
  origen: string,
  opciones: { recortar: boolean; voltear: boolean; carpeta?: string }
): Promise<{ url: string; publicId: string; recortada: boolean }> {
  const pasos: Record<string, unknown>[] = [];
  if (opciones.recortar) pasos.push({ effect: 'background_removal' }, { effect: 'trim' });
  if (opciones.voltear) pasos.push({ angle: 'hflip' });
  pasos.push({ crop: 'limit', width: 1800, height: 1200 });
  pasos.push({ quality: 'auto', fetch_format: opciones.recortar ? 'png' : 'auto' });

  const subir = (eager: Record<string, unknown>[]) =>
    cloudinary.uploader.upload(origen, {
      folder: opciones.carpeta ?? 'wise-vehicles/ingesta',
      resource_type: 'image',
      // Una transformación encadenada, generada al subir: la URL sirve de inmediato.
      eager: [eager as any],
      eager_async: false,
    });

  try {
    const r = await subir(pasos);
    return { url: r.eager?.[0]?.secure_url ?? r.secure_url, publicId: r.public_id, recortada: opciones.recortar };
  } catch (err) {
    if (!opciones.recortar) throw err;
    // Sin el recorte con IA habilitado en la cuenta: la foto sigue, con su fondo.
    console.warn('Cloudinary no pudo quitar el fondo; se sube sin recorte:', err);
    const r = await subir(pasos.filter(p => p.effect !== 'background_removal' && p.effect !== 'trim'));
    return { url: r.eager?.[0]?.secure_url ?? r.secure_url, publicId: r.public_id, recortada: false };
  }
}

/**
 * Check if a URL is a Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes('res.cloudinary.com');
}
