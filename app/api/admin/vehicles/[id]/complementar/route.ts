import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { proponerDesdeTexto } from '@/lib/ingest/complementar';
import { explicarErrorClaude } from '@/lib/ai/claude';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// POST /api/admin/vehicles/[id]/complementar { texto } — reparte un texto pegado
// en los campos del registro y devuelve la PROPUESTA (no escribe nada).
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const texto = typeof body?.texto === 'string' ? body.texto : '';
  if (texto.trim().length < 40) {
    return NextResponse.json({ error: 'Pega un texto con datos del carro (al menos un par de líneas).' }, { status: 400 });
  }
  try {
    return NextResponse.json(await proponerDesdeTexto(params.id, texto.slice(0, 200_000)));
  } catch (err) {
    console.error('Error complementando con IA:', err);
    return NextResponse.json({ error: explicarErrorClaude(err) }, { status: 500 });
  }
}
