import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { esLinkDeMaps } from '@/lib/mapas';
import { resolverLinkMaps } from '@/lib/mapas-servidor';

export const dynamic = 'force-dynamic';

// POST /api/admin/ubicacion { url } — lee las coordenadas del link de Google
// Maps de un concesionario (también los cortos maps.app.goo.gl).
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { url } = await request.json().catch(() => ({ url: '' }));
  if (typeof url !== 'string' || !esLinkDeMaps(url)) {
    return NextResponse.json({ error: 'Pega un link de Google Maps (empieza por https://maps.app.goo.gl o https://www.google.com/maps).' }, { status: 400 });
  }
  const r = await resolverLinkMaps(url);
  if (!r) {
    return NextResponse.json(
      { error: 'No pude leer la ubicación de ese link. Abre el lugar en Google Maps, toca "Compartir" y copia el link; o escribe las coordenadas a mano.' },
      { status: 422 }
    );
  }
  return NextResponse.json(r);
}
