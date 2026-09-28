import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { procesarFoto, ANGULOS } from '@/lib/ingest/fotos';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST /api/admin/ingest/foto — procesa UNA foto candidata que el revisor eligió
// (las recomendadas ya vienen procesadas): sin fondo, recortada y orientada.
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

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
