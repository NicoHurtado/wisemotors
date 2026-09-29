import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { procesarFoto, procesarFotoSubida, ANGULOS, type Angulo } from '@/lib/ingest/fotos';
import { cloudinaryConfigurado } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];

// POST /api/admin/ingest/foto
//  - JSON { original, angulo, voltear }: procesa UNA foto candidata que el
//    revisor eligió (las recomendadas ya vienen procesadas) o la voltea.
//  - multipart { archivo, angulo }: una foto del concesionario para esa vista.
// Procesar = sin fondo, recortada y orientada (Cloudinary).
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  if ((request.headers.get('content-type') ?? '').includes('multipart/form-data')) {
    if (!cloudinaryConfigurado()) {
      return NextResponse.json({ error: 'Para subir fotos hace falta Cloudinary configurado (CLOUDINARY_*).' }, { status: 503 });
    }
    const form = await request.formData();
    const archivo = form.get('archivo');
    const angulo = String(form.get('angulo') ?? '') as Angulo;
    if (!archivo || typeof archivo === 'string' || !TIPOS.includes(archivo.type) || !ANGULOS.includes(angulo)) {
      return NextResponse.json({ error: 'Foto inválida (JPG, PNG o WebP)' }, { status: 400 });
    }
    try {
      const dataUrl = `data:${archivo.type};base64,${Buffer.from(await archivo.arrayBuffer()).toString('base64')}`;
      return NextResponse.json(await procesarFotoSubida(dataUrl, angulo));
    } catch (err) {
      console.error('Error subiendo foto:', err);
      return NextResponse.json({ error: 'No se pudo subir la foto. Prueba con otra.' }, { status: 502 });
    }
  }

  const body = await request.json().catch(() => null);
  const original = typeof body?.original === 'string' ? body.original : '';
  const angulo = ANGULOS.includes(body?.angulo) ? body.angulo : null;
  if (!/^https?:\/\//.test(original) || !angulo) {
    return NextResponse.json({ error: 'Foto inválida' }, { status: 400 });
  }
  try {
    const r = await procesarFoto({ original, angulo, voltear: body?.voltear === true });
    return NextResponse.json(r);
  } catch (err) {
    console.error('Error procesando foto:', err);
    return NextResponse.json({ error: 'No se pudo procesar la foto. Prueba con otra.' }, { status: 502 });
  }
}
