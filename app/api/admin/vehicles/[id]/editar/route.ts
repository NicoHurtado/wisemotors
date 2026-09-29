import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { editarVehiculo } from '@/lib/editar-vehiculo';

export const dynamic = 'force-dynamic';

// POST /api/admin/vehicles/[id]/editar — guarda en un paso lo que cambió en el editor.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  try {
    const r = await editarVehiculo(params.id, body, auth.userId);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error editando vehículo:', err);
    return NextResponse.json({ error: 'No se pudo guardar' }, { status: 500 });
  }
}
