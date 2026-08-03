import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { publishDraft } from '@/lib/ingest/publish';

export const dynamic = 'force-dynamic';

// POST /api/admin/ingest/publish — crea el vehículo con SOLO los hechos que el
// humano aceptó. La escritura vive en lib/ingest/publish para que los scripts
// de carga masiva usen el mismo camino.
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();

    const resultado = await publishDraft({
      brand: body?.brand,
      model: body?.model,
      year: Number(body?.year),
      type: body?.type,
      vehicleType: body?.vehicleType,
      fuelType: body?.fuelType,
      price: Number(body?.price),
      priceEstimated: !!body?.priceEstimated,
      priceReasoningEs: body?.priceReasoningEs,
      facts: Array.isArray(body?.facts) ? body.facts : [],
      // La aceptación en la pantalla de revisión ES la verificación humana
      verifiedBy: auth.userId,
    });

    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: resultado.status });
    }

    return NextResponse.json({
      vehicle: {
        id: resultado.vehicleId,
        brand: body.brand,
        model: body.model,
        year: Number(body.year),
        coverageGlobal: resultado.coverage,
      },
      factsWritten: resultado.factsWritten,
    });
  } catch (error) {
    console.error('Error publicando vehículo ingestado:', error);
    return NextResponse.json({ error: 'Error interno publicando el vehículo' }, { status: 500 });
  }
}
