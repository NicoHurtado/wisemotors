// ============================================================================
// Carga única de los 10 vehículos de prueba (data/semillas/vehiculos-demo.json)
// en la base de producción, sin volver a llamar a la IA.
//
// Son datos DEMO: aproximados, sin verificar, y quedan marcados como tales
// (Vehicle.history empieza con "DEMO", precio estimado, confianza 0.4, tier 3).
// Entran a la cola de auditoría como cualquier dato dudoso.
//
// Una sola vez: al terminar deja la bandera 'demo_cargado' en estado_sistema.
// Si el equipo los borra después, el siguiente deploy NO los vuelve a crear.
// Con CARGAR_DEMO=no en Vercel no se cargan nunca.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PrismaClient } from '@prisma/client';
import { publishDraft, type AcceptedFact } from '@/lib/ingest/publish';

const BANDERA = 'demo_cargado';
export const MARCA_DEMO = 'DEMO — datos aproximados para probar el diseño; no verificados.';

interface VehiculoSemilla {
  brand: string;
  model: string;
  year: number;
  type: string;
  vehicleType: string;
  fuelType: string;
  price: number;
  priceEstimated: boolean;
  priceReasoningEs: string;
  history: string;
  fotos: { url: string; alt?: string }[];
  facts: AcceptedFact[];
}

export type ResultadoDemo =
  | { estado: 'omitido'; motivo: string }
  | { estado: 'cargado'; creados: string[]; yaExistian: string[]; errores: string[] };

export async function cargarVehiculosDemo(prisma: PrismaClient): Promise<ResultadoDemo> {
  if ((process.env.CARGAR_DEMO ?? '').toLowerCase() === 'no') {
    return { estado: 'omitido', motivo: 'CARGAR_DEMO=no' };
  }
  const bandera = await prisma.estadoSistema.findUnique({ where: { clave: BANDERA } });
  if (bandera) return { estado: 'omitido', motivo: `ya se cargaron (${bandera.valor})` };

  const semillas: VehiculoSemilla[] = JSON.parse(
    readFileSync(join(process.cwd(), 'data/semillas/vehiculos-demo.json'), 'utf8')
  );

  const creados: string[] = [];
  const yaExistian: string[] = [];
  const errores: string[] = [];
  for (const v of semillas) {
    const nombre = `${v.brand} ${v.model} ${v.year}`;
    const r = await publishDraft({
      brand: v.brand,
      model: v.model,
      year: v.year,
      type: v.type,
      vehicleType: v.vehicleType,
      fuelType: v.fuelType,
      price: v.price,
      priceEstimated: true,
      priceReasoningEs: v.priceReasoningEs || 'Precio DEMO aproximado: no verificado con el concesionario.',
      facts: v.facts,
      verifiedBy: null,
    });
    if (!r.ok) {
      (r.status === 409 ? yaExistian : errores).push(r.status === 409 ? nombre : `${nombre}: ${r.error}`);
      continue;
    }
    await prisma.vehicle.update({ where: { id: r.vehicleId }, data: { history: MARCA_DEMO } });
    // publishDraft solo acepta fotos http(s); las de demo viven en /public.
    const locales = v.fotos.filter(f => f.url.startsWith('/'));
    if (locales.length) {
      await prisma.vehicleImage.createMany({
        data: locales.map((f, i) => ({
          vehicleId: r.vehicleId,
          url: f.url,
          alt: f.alt ?? nombre,
          type: i === 0 ? 'cover' : 'gallery',
          order: i,
          isThumbnail: i === 0,
        })),
      });
    }
    creados.push(nombre);
  }

  // Si algo falló se deja sin bandera: el siguiente deploy reintenta lo que falte
  // (lo ya creado responde 409 y se salta).
  if (errores.length === 0) {
    await prisma.estadoSistema.create({
      data: { clave: BANDERA, valor: `${creados.length} creados el ${new Date().toISOString().slice(0, 10)}` },
    });
  }
  return { estado: 'cargado', creados, yaExistian, errores };
}
