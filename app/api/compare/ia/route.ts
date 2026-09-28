import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/api-auth';
import { veredictoIA } from '@/lib/ai/comparar';

// Claude tarda unos segundos en razonar la comparación.
export const maxDuration = 60;

/**
 * POST /api/compare/ia  { ids: string[] }  (2 a 4 carros)
 * Veredicto en palabras de persona. Requiere sesión: cada llamada cuesta.
 */
export async function POST(request: NextRequest) {
  const auth = requireUser(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const ids: unknown = body?.ids;
  if (!Array.isArray(ids) || ids.length < 2 || ids.length > 4 || !ids.every(x => typeof x === 'string')) {
    return NextResponse.json({ error: 'Envía entre 2 y 4 ids de vehículos.' }, { status: 400 });
  }

  const carros = await prisma.vehicle.findMany({
    where: { id: { in: ids as string[] } },
    select: { id: true, brand: true, model: true, year: true, price: true, fuelType: true, type: true, specifications: true },
  });
  if (carros.length !== ids.length) {
    return NextResponse.json({ error: 'Alguno de los vehículos no existe.' }, { status: 404 });
  }

  try {
    const orden = (ids as string[]).map(id => carros.find(c => c.id === id)!);
    const veredicto = await veredictoIA(orden);
    return NextResponse.json({ veredicto });
  } catch (e) {
    console.error('[compare/ia]', e);
    const msg = e instanceof Error ? e.message : '';
    const deCuenta = /sin saldo|no es válida|saturado|Demasiadas/.test(msg);
    return NextResponse.json(
      { error: deCuenta ? msg : 'La IA no pudo comparar estos carros ahora. Intenta de nuevo en un momento.' },
      { status: 502 }
    );
  }
}
