import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const TIPOS = ['busqueda', 'comparacion'];

// POST /api/calificaciones — 👍/👎 de una respuesta de la IA. Público (no hace
// falta cuenta); si viene con sesión se guarda quién. Una por navegador y
// respuesta: votar de nuevo la cambia.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const tipo = String(body?.tipo ?? '');
  const clave = String(body?.clave ?? '').trim().toLowerCase().slice(0, 300);
  const sesion = String(body?.sesion ?? '').slice(0, 64);
  if (!TIPOS.includes(tipo) || !clave || !/^[a-z0-9-]{8,64}$/i.test(sesion) || typeof body?.util !== 'boolean') {
    return NextResponse.json({ error: 'Calificación inválida' }, { status: 400 });
  }
  const comentario = typeof body?.comentario === 'string' && body.comentario.trim() ? body.comentario.trim().slice(0, 1000) : null;
  const detalle = body?.detalle ? JSON.stringify(body.detalle).slice(0, 4000) : null;

  let userId: string | null = null;
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (token) {
    try {
      userId = verifyToken(token)?.userId ?? null;
    } catch {
      userId = null;
    }
  }

  const datos = { util: body.util, comentario, detalle, userId };
  await prisma.calificacionIA.upsert({
    where: { tipo_clave_sesion: { tipo, clave, sesion } },
    create: { tipo, clave, sesion, ...datos },
    update: datos,
  });
  return NextResponse.json({ ok: true });
}
