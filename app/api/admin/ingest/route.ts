import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { runIngestPipeline, type DocumentoConcesionario } from '@/lib/ingest/pipeline';
import { parseVehicleQuery } from '@/lib/ingest/parse-query';

// La ingesta hace varias llamadas LLM + fetch de fuentes: necesita más que
// los 30s por defecto del proyecto.
// Búsqueda web + lectura de 6 fuentes + extracción: ~50 s. Margen para sitios lentos.
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// POST /api/admin/ingest — corre el pipeline y devuelve un BORRADOR.
// No escribe nada en la base de datos: eso lo hace /publish tras la revisión.
//
// Acepta { query: "Ónix RS 2026" } (una línea, lo normal) o { brand, model, year }.
// Con query la marca puede faltar: resolveIdentity la deduce del modelo.
//
// Con documentos del concesionario (fichas en PDF o foto) llega como
// multipart/form-data: los mismos campos + archivos en "documentos". Vercel
// corta el cuerpo en ~4,5 MB: el cliente reduce las fotos antes de subir.
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'] as const;

async function leerCuerpo(request: NextRequest): Promise<{ body: any; documentos: DocumentoConcesionario[] }> {
  if (!(request.headers.get('content-type') ?? '').includes('multipart/form-data')) {
    return { body: await request.json(), documentos: [] };
  }
  const form = await request.formData();
  const body = Object.fromEntries(Array.from(form.entries()).filter(([, v]) => typeof v === 'string'));
  const documentos: DocumentoConcesionario[] = [];
  for (const archivo of form.getAll('documentos')) {
    if (typeof archivo === 'string') continue;
    const base64 = Buffer.from(await archivo.arrayBuffer()).toString('base64');
    const nombre = (archivo.name || 'documento').slice(0, 80);
    if (archivo.type === 'application/pdf') documentos.push({ nombre, contenido: { pdfBase64: base64 } });
    else if ((TIPOS_IMAGEN as readonly string[]).includes(archivo.type)) {
      documentos.push({ nombre, contenido: { imagenBase64: base64, mediaType: archivo.type as (typeof TIPOS_IMAGEN)[number] } });
    }
  }
  return { body, documentos };
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { body, documentos } = await leerCuerpo(request);
    let { brand, model, year } = body ?? {};
    const { query, country } = body ?? {};

    if (typeof query === 'string' && query.trim()) {
      const parsed = parseVehicleQuery(query);
      if (!parsed) {
        return NextResponse.json({ error: 'No entendí el vehículo. Ejemplo: "Onix RS 2026"' }, { status: 400 });
      }
      ({ brand, model, year } = parsed);
    } else if (!brand || !model || !year) {
      return NextResponse.json(
        { error: 'Falta el vehículo: manda query ("Onix RS 2026") o brand, model y year' },
        { status: 400 }
      );
    }

    const yearNum = parseInt(String(year));
    if (!Number.isFinite(yearNum) || yearNum < 1990 || yearNum > new Date().getFullYear() + 2) {
      return NextResponse.json({ error: 'Año inválido' }, { status: 400 });
    }

    const draft = await runIngestPipeline({
      brand: String(brand ?? '').trim(),
      model: String(model).trim(),
      year: yearNum,
      country: String(country ?? 'CO').trim().toUpperCase(),
      documentos,
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
