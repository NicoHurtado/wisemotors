import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ============================================================================
// GET /api/vehicles/[id]/provenance
//
// De dónde salió cada dato de la ficha. Público a propósito: si el comprador
// va a usar estos números para decidir en qué gastarse 100 millones, tiene
// derecho a ver la fuente sin loguearse.
//
// Agrupa por dominio (no por URL suelta) para no escupir 60 enlaces al mismo
// sitio, y se queda con el MEJOR tier visto en ese dominio.
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [vehiculo, atributos] = await Promise.all([
      prisma.vehicle.findUnique({
        where: { id: params.id },
        select: { id: true, coverageGlobal: true, coverageByDimension: true },
      }),
      prisma.vehicleAttribute.findMany({
        where: { vehicleId: params.id },
        select: {
          attributeKey: true,
          sourceUrl: true,
          sourceTier: true,
          confidence: true,
          verifiedBy: true,
          extractedAt: true,
        },
      }),
    ]);

    if (!vehiculo) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 });
    }

    // Agrupación por dominio: una fila por sitio, con el mejor tier que aportó
    const porDominio = new Map<string, { url: string; tier: number; cantidad: number }>();

    for (const a of atributos) {
      if (!a.sourceUrl) continue;
      let dominio: string;
      try {
        dominio = new URL(a.sourceUrl).hostname;
      } catch {
        continue; // URL basura: no se muestra un enlace roto
      }
      const previo = porDominio.get(dominio);
      if (previo) {
        previo.cantidad += 1;
        if (a.sourceTier < previo.tier) {
          previo.tier = a.sourceTier;
          previo.url = a.sourceUrl;
        }
      } else {
        porDominio.set(dominio, { url: a.sourceUrl, tier: a.sourceTier, cantidad: 1 });
      }
    }

    const fuentes = Array.from(porDominio.values()).sort(
      (a, b) => a.tier - b.tier || b.cantidad - a.cantidad
    );

    let cobertura: Record<string, number> | null = null;
    if (vehiculo.coverageByDimension) {
      try {
        cobertura = JSON.parse(vehiculo.coverageByDimension);
      } catch {
        cobertura = null;
      }
    }

    const verificados = atributos.filter(a => a.verifiedBy).length;
    const sinFuente = atributos.filter(a => !a.sourceUrl).length;
    const confianzas = atributos.map(a => a.confidence).filter(c => Number.isFinite(c));
    const confianzaMedia = confianzas.length
      ? confianzas.reduce((s, c) => s + c, 0) / confianzas.length
      : null;

    const fechas = atributos.map(a => a.extractedAt.getTime());
    const ultimaActualizacion = fechas.length ? new Date(Math.max(...fechas)).toISOString() : null;

    return NextResponse.json({
      total: atributos.length,
      verificados,
      sinFuente,
      confianzaMedia,
      ultimaActualizacion,
      coberturaGlobal: vehiculo.coverageGlobal,
      coberturaPorDimension: cobertura,
      fuentes,
    });
  } catch (error) {
    console.error('[provenance] error:', error);
    return NextResponse.json({ error: 'Error obteniendo la procedencia' }, { status: 500 });
  }
}
