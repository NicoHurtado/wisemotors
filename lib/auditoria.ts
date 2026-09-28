// ============================================================================
// Cola de auditoría (plan §5.1, último paso): la segunda mirada humana después
// de publicar.
//
// Entra a la cola todo hecho publicado que merezca desconfianza:
//   - sin revisor (cargas automáticas, carros DEMO),
//   - confianza < 0.7,
//   - fuente de comunidad (tier 3),
// más todo vehículo con precio ESTIMADO. Sale cuando alguien lo confirma, lo
// corrige o lo quita. Corregir o quitar actualiza también `specifications`
// (lo que lee la interfaz) y la cobertura, para que nunca se contradigan.
// ============================================================================

import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ATTRIBUTE_REGISTRY } from '@/lib/attributes/registry';
import { computeCoverage } from '@/lib/attributes/coverage';
import { specsDe } from '@/lib/vehiculo-datos';

export const CONFIANZA_MINIMA = 0.7;

/** Condición SQL de "este hecho necesita una segunda mirada". */
export const PENDIENTE: Prisma.VehicleAttributeWhereInput = {
  auditedAt: null,
  OR: [{ verifiedBy: null }, { confidence: { lt: CONFIANZA_MINIMA } }, { sourceTier: 3 }],
};

const DEF = new Map(ATTRIBUTE_REGISTRY.map(d => [d.key, d]));

export interface HechoPendiente {
  id: string;
  key: string;
  etiqueta: string;
  unidad: string | null;
  tipo: string;
  opciones: string[] | null;
  valor: number | string | boolean | null;
  confianza: number;
  tier: number;
  fuente: string | null;
  motivos: string[];
}

export interface VehiculoPendiente {
  id: string;
  nombre: string;
  demo: boolean;
  precio: number;
  precioEstimado: boolean;
  razonPrecio: string | null;
  hechos: HechoPendiente[];
}

export async function colaDeAuditoria(): Promise<{ vehiculos: VehiculoPendiente[]; totalHechos: number }> {
  const [hechos, vehiculos] = await Promise.all([
    prisma.vehicleAttribute.findMany({ where: PENDIENTE, orderBy: { vehicleId: 'asc' } }),
    prisma.vehicle.findMany({ select: { id: true, brand: true, model: true, year: true, price: true, history: true, specifications: true } }),
  ]);

  const porVehiculo = new Map<string, HechoPendiente[]>();
  for (const h of hechos) {
    const d = DEF.get(h.attributeKey);
    const motivos = [
      h.verifiedBy ? null : 'nadie lo revisó',
      h.confidence < CONFIANZA_MINIMA ? `confianza ${Math.round(h.confidence * 100)}%` : null,
      h.sourceTier === 3 ? 'fuente de comunidad' : null,
    ].filter((x): x is string => !!x);
    const lista = porVehiculo.get(h.vehicleId) ?? [];
    lista.push({
      id: h.id,
      key: h.attributeKey,
      etiqueta: d?.labelEs ?? h.attributeKey,
      unidad: d?.unit ?? null,
      tipo: d?.dataType ?? 'text',
      opciones: d?.opciones ?? null,
      valor: h.valueNum ?? h.valueBool ?? h.valueText,
      confianza: h.confidence,
      tier: h.sourceTier,
      fuente: h.sourceUrl,
      motivos,
    });
    porVehiculo.set(h.vehicleId, lista);
  }

  const out: VehiculoPendiente[] = [];
  for (const v of vehiculos) {
    const s = specsDe(v.specifications);
    const precioEstimado = !!s.commercial?.priceEstimated;
    const lista = porVehiculo.get(v.id) ?? [];
    if (!precioEstimado && lista.length === 0) continue;
    lista.sort((a, b) => (DEF.get(b.key)?.displayPriority ?? 0) - (DEF.get(a.key)?.displayPriority ?? 0));
    out.push({
      id: v.id,
      nombre: `${v.brand} ${v.model} ${v.year}`,
      demo: (v.history ?? '').startsWith('DEMO'),
      precio: v.price,
      precioEstimado,
      razonPrecio: s.commercial?.priceReasoningEs ?? null,
      hechos: lista,
    });
  }
  // Primero los reales (lo que ven compradores de verdad), después los DEMO.
  out.sort((a, b) => Number(a.demo) - Number(b.demo) || b.hechos.length - a.hechos.length);
  return { vehiculos: out, totalHechos: hechos.length };
}

/** Pone o quita un valor en el JSON por su path ('combustion.maxPower'). */
function fijarEnSpecs(specs: Record<string, any>, key: string, valor: unknown | undefined) {
  const partes = key.split('.');
  let nodo = specs;
  for (let i = 0; i < partes.length - 1; i++) {
    if (valor === undefined && !nodo[partes[i]]) return;
    nodo[partes[i]] = nodo[partes[i]] ?? {};
    nodo = nodo[partes[i]];
  }
  if (valor === undefined) delete nodo[partes[partes.length - 1]];
  else nodo[partes[partes.length - 1]] = valor;
}

/** "4,5" → 4.5 · "4.5" → 4.5 · "1.250.000" → 1250000 (así se escriben en Colombia). */
function numeroEscrito(t: string): number {
  const x = t.trim().replace(/\s/g, '');
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(x)) return parseFloat(x.replace(/\./g, '').replace(',', '.'));
  return parseFloat(x.replace(',', '.'));
}

/** Convierte lo que escribió el auditor al tipo del atributo; null si no sirve. */
export function valorAuditado(key: string, crudo: unknown): number | string | boolean | null {
  const d = DEF.get(key);
  if (!d) return null;
  if (d.dataType === 'numeric') {
    const n = typeof crudo === 'number' ? crudo : numeroEscrito(String(crudo));
    if (!Number.isFinite(n) || n <= 0) return null;
    if (d.expectedMin !== undefined && n < d.expectedMin) return null;
    if (d.expectedMax !== undefined && n > d.expectedMax) return null;
    return n;
  }
  if (d.dataType === 'boolean') return crudo === true || crudo === 'true';
  const t = String(crudo ?? '').trim().slice(0, 200);
  if (!t) return null;
  if (d.opciones && !d.opciones.includes(t)) return null;
  return t;
}

export type AccionAuditoria =
  | { accion: 'confirmar'; id: string }
  | { accion: 'corregir'; id: string; valor: unknown }
  | { accion: 'quitar'; id: string }
  | { accion: 'confirmarVehiculo'; vehicleId: string }
  | { accion: 'precio'; vehicleId: string; precio: number };

export async function aplicarAuditoria(a: AccionAuditoria, userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const ahora = new Date();

  if (a.accion === 'confirmarVehiculo') {
    await prisma.vehicleAttribute.updateMany({
      where: { vehicleId: a.vehicleId, ...PENDIENTE },
      data: { auditedBy: userId, auditedAt: ahora },
    });
    return { ok: true };
  }

  if (a.accion === 'precio') {
    const precio = Math.round(Number(a.precio));
    if (!Number.isFinite(precio) || precio < 20_000_000 || precio > 5_000_000_000) {
      return { ok: false, error: 'Precio fuera de rango (entre $20 M y $5.000 M)' };
    }
    const v = await prisma.vehicle.findUnique({ where: { id: a.vehicleId }, select: { specifications: true } });
    if (!v) return { ok: false, error: 'Vehículo no encontrado' };
    const s = specsDe(v.specifications);
    s.commercial = { ...(s.commercial ?? {}), priceCop: precio, priceConfirmedAt: ahora.toISOString() };
    delete s.commercial.priceEstimated;
    delete s.commercial.priceReasoningEs;
    await prisma.$transaction([
      prisma.vehicle.update({ where: { id: a.vehicleId }, data: { price: precio, specifications: JSON.stringify(s) } }),
      prisma.vehicleAttribute.updateMany({
        where: { vehicleId: a.vehicleId, attributeKey: 'commercial.priceCop' },
        data: { valueNum: precio, confidence: 1, verifiedBy: userId, verifiedAt: ahora, auditedBy: userId, auditedAt: ahora },
      }),
    ]);
    return { ok: true };
  }

  const hecho = await prisma.vehicleAttribute.findUnique({ where: { id: a.id } });
  if (!hecho) return { ok: false, error: 'Dato no encontrado' };

  if (a.accion === 'confirmar') {
    await prisma.vehicleAttribute.update({ where: { id: a.id }, data: { auditedBy: userId, auditedAt: ahora } });
    return { ok: true };
  }

  const v = await prisma.vehicle.findUnique({ where: { id: hecho.vehicleId }, select: { specifications: true, fuelType: true } });
  if (!v) return { ok: false, error: 'Vehículo no encontrado' };
  const s = specsDe(v.specifications);

  if (a.accion === 'corregir') {
    const valor = valorAuditado(hecho.attributeKey, a.valor);
    if (valor === null) return { ok: false, error: 'Valor inválido para este dato (revisa la unidad y el rango)' };
    const d = DEF.get(hecho.attributeKey)!;
    fijarEnSpecs(s, hecho.attributeKey, valor);
    await prisma.$transaction([
      prisma.vehicleAttribute.update({
        where: { id: a.id },
        data: {
          valueNum: d.dataType === 'numeric' ? (valor as number) : null,
          valueBool: d.dataType === 'boolean' ? (valor as boolean) : null,
          valueText: d.dataType === 'text' || d.dataType === 'enum' ? String(valor) : null,
          // Un humano lo corrigió con su criterio: es el dato más confiable que hay.
          confidence: 1,
          verifiedBy: userId,
          verifiedAt: ahora,
          auditedBy: userId,
          auditedAt: ahora,
        },
      }),
      prisma.vehicle.update({ where: { id: hecho.vehicleId }, data: { specifications: JSON.stringify(s) } }),
    ]);
    return { ok: true };
  }

  // quitar: el dato no se sostiene. Faltante es mejor que falso.
  fijarEnSpecs(s, hecho.attributeKey, undefined);
  const restantes = await prisma.vehicleAttribute.findMany({
    where: { vehicleId: hecho.vehicleId, id: { not: a.id } },
    select: { attributeKey: true },
  });
  const cobertura = computeCoverage(v.fuelType, new Set(restantes.map(r => r.attributeKey)));
  await prisma.$transaction([
    prisma.vehicleAttribute.delete({ where: { id: a.id } }),
    prisma.vehicle.update({
      where: { id: hecho.vehicleId },
      data: {
        specifications: JSON.stringify(s),
        coverageGlobal: cobertura.global,
        coverageByDimension: JSON.stringify(cobertura.byDimension),
      },
    }),
  ]);
  return { ok: true };
}
