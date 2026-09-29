import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/calificaciones — resumen por tipo (últimos 30 días y total) y
// las últimas calificaciones, las negativas primero: son las que enseñan.
/** El detalle se guarda recortado a 4.000 caracteres: si quedó cortado, no se lee. */
function leer(x: string | null) {
  try {
    return x ? JSON.parse(x) : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const hace30 = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const tipos = ['busqueda', 'comparacion'];
  const resumen = await Promise.all(
    tipos.map(async tipo => {
      const [total, utiles, total30, utiles30] = await Promise.all([
        prisma.calificacionIA.count({ where: { tipo } }),
        prisma.calificacionIA.count({ where: { tipo, util: true } }),
        prisma.calificacionIA.count({ where: { tipo, createdAt: { gte: hace30 } } }),
        prisma.calificacionIA.count({ where: { tipo, util: true, createdAt: { gte: hace30 } } }),
      ]);
      return { tipo, total, utiles, total30, utiles30 };
    })
  );
  const util = request.nextUrl.searchParams.get('util');
  const lista = await prisma.calificacionIA.findMany({
    where: util === 'no' ? { util: false } : util === 'si' ? { util: true } : {},
    orderBy: [{ util: 'asc' }, { updatedAt: 'desc' }],
    take: 100,
  });
  return NextResponse.json({
    resumen,
    lista: lista.map(c => ({
      id: c.id,
      tipo: c.tipo,
      clave: c.clave,
      util: c.util,
      comentario: c.comentario,
      detalle: leer(c.detalle),
      conCuenta: !!c.userId,
      fecha: c.updatedAt,
    })),
  });
}
