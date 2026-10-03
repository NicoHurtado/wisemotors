// Concesionarios para la parte pública: su perfil (ubicación, horario,
// contacto) y los carros que venden (VehicleDealer). Los inactivos no se muestran.
import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { urlImagen } from '@/lib/data/imagen';
import { whatsappDe } from '@/lib/data/vehicles';

const PERFIL = {
  id: true,
  name: true,
  location: true,
  address: true,
  phone: true,
  horario: true,
  lat: true,
  lng: true,
  mapsUrl: true,
} as const;

export const getConcesionario = cache(async (id: string) => {
  const d = await prisma.dealer.findFirst({
    where: { id, status: { not: 'Inactivo' } },
    select: {
      ...PERFIL,
      vehicleDealers: {
        where: { vehicle: { status: 'Disponible' } },
        select: {
          vehicle: {
            select: {
              id: true,
              brand: true,
              model: true,
              year: true,
              price: true,
              fuelType: true,
              type: true,
              specifications: true,
              images: { take: 1, orderBy: { order: 'asc' }, select: { id: true, url: true, type: true, order: true, isThumbnail: true } },
            },
          },
        },
      },
    },
  });
  if (!d) return null;
  const { vehicleDealers, ...perfil } = d;
  const carros = vehicleDealers
    .map(({ vehicle: v }) => ({ ...v, imageUrl: urlImagen(v.id, v.images?.[0]?.url) }))
    .sort((a, b) => a.price - b.price);
  return { ...perfil, whatsapp: whatsappDe(perfil.phone), carros };
});

export async function listarConcesionarios() {
  const ds = await prisma.dealer.findMany({
    where: { status: { not: 'Inactivo' } },
    orderBy: { name: 'asc' },
    select: { ...PERFIL, _count: { select: { vehicleDealers: true } } },
  });
  return ds.map(({ _count, ...d }) => ({ ...d, whatsapp: whatsappDe(d.phone), carros: _count.vehicleDealers }));
}
