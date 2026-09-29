import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { escribirHechos } from '@/lib/auditoria';

export const dynamic = 'force-dynamic';

// POST /api/admin/vehicles/[id]/complementar/aplicar { hechos: [{ key, valor }] }
// Escribe lo que el revisor aceptó de la propuesta. Viene de un texto pegado
// (fuente no verificable, tier 2) pero un humano lo revisó dato por dato.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const hechos = Array.isArray(body?.hechos) ? body.hechos.slice(0, 250) : [];
  if (hechos.length === 0) return NextResponse.json({ error: 'No hay datos para aplicar' }, { status: 400 });

  const r = await escribirHechos(
    params.id,
    hechos
      .filter((h: any) => typeof h?.key === 'string' && h.key !== 'commercial.priceCop')
      .map((h: any) => ({ key: h.key, valor: h.valor, confianza: 0.85, tier: 2, fuente: 'Complementado con IA (texto pegado)' })),
    auth.userId
  );
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json(r);
}
