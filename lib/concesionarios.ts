// Carros de un concesionario: la relación VehicleDealer (la que usa la página).
import type { Prisma } from '@prisma/client';

/** Deja exactamente esos carros asociados al concesionario (agrega los nuevos, quita los que salieron). */
export async function sincronizarCarros(tx: Prisma.TransactionClient, dealerId: string, vehicleIds: string[]) {
  const pedidos = Array.from(new Set(vehicleIds));
  // Solo ids de carros que existen (un id viejo o inventado no rompe el guardado)
  const existentes = new Set((await tx.vehicle.findMany({ where: { id: { in: pedidos } }, select: { id: true } })).map(v => v.id));
  const actuales = new Set((await tx.vehicleDealer.findMany({ where: { dealerId }, select: { vehicleId: true } })).map(v => v.vehicleId));
  const agregar = pedidos.filter(id => existentes.has(id) && !actuales.has(id));
  const quitar = Array.from(actuales).filter(id => !pedidos.includes(id));
  if (quitar.length) await tx.vehicleDealer.deleteMany({ where: { dealerId, vehicleId: { in: quitar } } });
  if (agregar.length) await tx.vehicleDealer.createMany({ data: agregar.map(vehicleId => ({ dealerId, vehicleId })), skipDuplicates: true });
  return { agregados: agregar.length, quitados: quitar.length };
}
