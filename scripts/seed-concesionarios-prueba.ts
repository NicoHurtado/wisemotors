// ============================================================================
// Concesionarios de PRUEBA para ver el contacto (lista por distancia, perfil
// con mapa, página del concesionario).
//
// - Todos llevan "(PRUEBA)" en el nombre y el correo @prueba.wisemotors.co:
//   así se reconocen y se borran sin tocar los reales.
// - Teléfonos FIJOS a propósito: sin celular, el WhatsApp va al de WiseMotors
//   (nunca a un número de un desconocido).
// - Tres en Medellín (para ver el orden por distancia) y uno en Bogotá.
// - Cada carro queda en 1 a 4 concesionarios: hay carros con uno solo (contacto
//   directo) y carros con varios (sale la lista).
//
// Por defecto solo corre contra una base local; contra otra pide --produccion.
//
// Uso:  npx tsx scripts/seed-concesionarios-prueba.ts                (base local)
//       npx tsx scripts/seed-concesionarios-prueba.ts --borrar
//       npx tsx --env-file=.env.local scripts/seed-concesionarios-prueba.ts --produccion
// ============================================================================

import { prisma } from '../lib/prisma';
import { urlBaseDatos } from '../lib/db/url';

const CORREO = '@prueba.wisemotors.co';

const CONCESIONARIOS = [
  {
    name: 'Autos del Poblado (PRUEBA)',
    location: 'Medellín',
    address: 'Cra. 43A #7-50, El Poblado',
    phone: '6044440101',
    horario: 'L–V 8:00–18:00 · Sáb 9:00–14:00',
    lat: 6.2087,
    lng: -75.5679,
  },
  {
    name: 'Motores Laureles (PRUEBA)',
    location: 'Medellín',
    address: 'Cq. 74B #39B-20, Laureles',
    phone: '6044440202',
    horario: 'L–Sáb 9:00–19:00',
    lat: 6.2445,
    lng: -75.5946,
  },
  {
    name: 'Envigado Motor (PRUEBA)',
    location: 'Envigado',
    address: 'Cl. 37 Sur #43A-15',
    phone: '6044440303',
    horario: 'L–V 8:30–18:30',
    lat: 6.1705,
    lng: -75.5862,
  },
  {
    name: 'Bogotá Autos Norte (PRUEBA)',
    location: 'Bogotá',
    address: 'Av. Cra. 15 #100-30, Chicó',
    phone: '6016010404',
    horario: 'L–V 8:00–18:00 · Sáb 9:00–13:00',
    lat: 4.6826,
    lng: -74.0495,
  },
];

function esLocal(url: string | undefined) {
  try {
    const h = new URL(url ?? '').hostname;
    return h === 'localhost' || h === '127.0.0.1';
  } catch {
    return false;
  }
}

async function borrar() {
  const r = await prisma.dealer.deleteMany({ where: { email: { endsWith: CORREO } } });
  console.log(`Borrados ${r.count} concesionarios de prueba (y sus carros vinculados).`);
}

async function main() {
  const args = process.argv.slice(2);
  if (!esLocal(urlBaseDatos()) && !args.includes('--produccion')) {
    console.error('La base no es local. Si de verdad es para producción, agrega --produccion.');
    process.exit(1);
  }
  await borrar();
  if (args.includes('--borrar')) return;

  const carros = await prisma.vehicle.findMany({ select: { id: true, brand: true, model: true }, orderBy: [{ brand: 'asc' }, { model: 'asc' }] });
  if (!carros.length) throw new Error('No hay carros en la base.');

  const creados: { id: string }[] = [];
  for (const c of CONCESIONARIOS) {
    const slug = c.name.toLowerCase().normalize('NFD').replace(/[^a-z]+/g, '');
    creados.push(
      await prisma.dealer.create({
        data: { ...c, email: `${slug}${CORREO}`, mapsUrl: `https://www.google.com/maps/@${c.lat},${c.lng},17z`, status: 'Activo' },
      }),
    );
  }

  // Carro i → concesionarios: el 1.º en los 4, luego 3, 2, 1 y vuelve a empezar.
  const vinculos: { vehicleId: string; dealerId: string }[] = [];
  carros.forEach((v, i) => {
    const cuantos = 4 - (i % 4);
    for (let k = 0; k < cuantos; k++) vinculos.push({ vehicleId: v.id, dealerId: creados[k].id });
  });
  await prisma.vehicleDealer.createMany({ data: vinculos, skipDuplicates: true });

  console.log(`Creados ${creados.length} concesionarios de prueba.`);
  carros.forEach((v, i) => console.log(`  ${v.brand} ${v.model}: ${4 - (i % 4)} concesionario(s)`));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
