// Demanda: lo que toca la base de datos (guardar cada búsqueda y leer el
// periodo). La lógica de agrupación es pura y vive en lib/demanda.ts.

import { prisma } from '@/lib/prisma';
import type { CategorizedIntent } from '@/lib/ai/categorization';
import { fichaDeBusqueda, hashSesion, normalizarBusqueda, resumirDemanda } from '@/lib/demanda';

/**
 * Guarda la búsqueda. Nunca rompe la búsqueda: si falla, se registra en el log y ya.
 */
export async function registrarBusqueda(
  texto: string,
  intent: CategorizedIntent,
  resultado: { total: number; mostrados: string[] },
  contexto: { sesion?: string | null; ciudad?: string | null; conCuenta?: boolean }
) {
  try {
    await prisma.busqueda.create({
      data: {
        ...fichaDeBusqueda(texto, intent),
        resultados: resultado.total,
        mostrados: resultado.mostrados.slice(0, 3),
        sesion: contexto.sesion ? hashSesion(contexto.sesion) : null,
        ciudad: contexto.ciudad?.slice(0, 80) || null,
        conCuenta: !!contexto.conCuenta,
      },
    });
  } catch (err) {
    console.error('No se pudo registrar la búsqueda:', err);
  }
}

export async function demandaDelPeriodo(dias: number) {
  const ahora = Date.now();
  const desde = new Date(ahora - dias * 864e5);
  const desdeAnterior = new Date(ahora - 2 * dias * 864e5);
  const [filas, anteriores, calificaciones] = await Promise.all([
    prisma.busqueda.findMany({
      where: { createdAt: { gte: desde } },
      orderBy: { createdAt: 'desc' },
      take: 50_000,
      select: {
        texto: true,
        normalizado: true,
        necesidades: true,
        carrocerias: true,
        combustibles: true,
        marcas: true,
        marcasFaltantes: true,
        presupuestoMin: true,
        presupuestoMax: true,
        intencion: true,
        resultados: true,
        sesion: true,
        ciudad: true,
        createdAt: true,
      },
    }),
    prisma.busqueda.findMany({ where: { createdAt: { gte: desdeAnterior, lt: desde } }, select: { intencion: true }, take: 50_000 }),
    prisma.calificacionIA.findMany({ where: { tipo: 'busqueda', createdAt: { gte: desde } }, select: { clave: true, util: true } }),
  ]);
  const votos = new Map<string, [number, number]>();
  for (const c of calificaciones) {
    const k = normalizarBusqueda(c.clave);
    const [u, t] = votos.get(k) ?? [0, 0];
    votos.set(k, [u + (c.util ? 1 : 0), t + 1]);
  }
  return { dias, ...resumirDemanda(filas, anteriores, votos) };
}

