import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { aplicarAuditoria, colaDeAuditoria, type AccionAuditoria } from '@/lib/auditoria';

export const dynamic = 'force-dynamic';

// GET /api/admin/auditoria — lo publicado que necesita una segunda mirada.
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await colaDeAuditoria());
}

// POST /api/admin/auditoria — confirmar, corregir o quitar un dato; confirmar un precio.
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json().catch(() => null)) as AccionAuditoria | null;
  const validas = ['confirmar', 'corregir', 'quitar', 'confirmarVehiculo', 'precio', 'agregar', 'sinDato'];
  if (!body || !validas.includes(body.accion)) {
    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  }
  const r = await aplicarAuditoria(body, auth.userId);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
