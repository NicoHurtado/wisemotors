import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { runIngestPipeline } from '@/lib/ingest/pipeline';

// La ingesta hace varias llamadas LLM + fetch de fuentes: necesita más que
// los 30s por defecto del proyecto.
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// POST /api/admin/ingest — corre el pipeline y devuelve un BORRADOR.
// No escribe nada en la base de datos: eso lo hace /publish tras la revisión.
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { brand, model, year, country } = body ?? {};

    if (!brand || !model || !year) {
      return NextResponse.json(
        { error: 'Faltan campos: brand, model y year son obligatorios' },
        { status: 400 }
      );
    }

    const yearNum = parseInt(String(year));
    if (!Number.isFinite(yearNum) || yearNum < 1990 || yearNum > new Date().getFullYear() + 2) {
      return NextResponse.json({ error: 'Año inválido' }, { status: 400 });
    }

    const draft = await runIngestPipeline({
      brand: String(brand).trim(),
      model: String(model).trim(),
      year: yearNum,
      country: String(country ?? 'CO').trim().toUpperCase(),
    });

    return NextResponse.json({ draft });
  } catch (error) {
    console.error('Error en pipeline de ingesta:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno en la ingesta' },
      { status: 500 }
    );
  }
}
