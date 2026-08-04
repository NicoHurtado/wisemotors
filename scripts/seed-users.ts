// ============================================================================
// USUARIOS DE PRUEBA.
//
// Crea (o resetea la contraseña de) la cuenta de administración y una cuenta
// normal para probar favoritos, comparación y el flujo de compra sin permisos.
//
// Uso:
//   npx tsx scripts/seed-users.ts            # crea los que falten
//   npx tsx scripts/seed-users.ts --reset    # además, resetea contraseñas
//
// Las contraseñas se generan aleatorias y se imprimen UNA sola vez: no quedan
// en el código ni en el repo. Si se pierden, se corre otra vez con --reset.
//
// El rol vive en User.role, no en el email ni en una contraseña del bundle
// (ver lib/api-auth.ts). Un usuario normal creado aquí NO puede publicar
// vehículos, y eso es justamente lo que se quiere poder probar.
// ============================================================================

import { randomBytes } from 'crypto';
import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/auth';

const RESET = process.argv.includes('--reset');

const CUENTAS = [
  {
    email: 'adminwise@wisemotors.co',
    username: 'adminwise',
    role: 'admin',
    para: 'panel de administración, ingesta y publicación de vehículos',
  },
  {
    email: 'prueba@wisemotors.co',
    username: 'prueba',
    role: 'user',
    para: 'favoritos, comparación y búsqueda como comprador (sin permisos de admin)',
  },
];

/** Contraseña legible pero no adivinable: 18 caracteres base64url. */
function generarPassword(): string {
  return randomBytes(14).toString('base64url');
}

async function main() {
  const creadas: { email: string; password: string; role: string; nota: string }[] = [];

  for (const cuenta of CUENTAS) {
    const existente = await prisma.user.findUnique({
      where: { email: cuenta.email },
      select: { id: true, role: true },
    });

    if (existente && !RESET) {
      // El rol sí se corrige siempre: es lo único que puede haber quedado mal.
      if (existente.role !== cuenta.role) {
        await prisma.user.update({ where: { id: existente.id }, data: { role: cuenta.role } });
        console.log(`· ${cuenta.email}: ya existía, rol corregido a "${cuenta.role}".`);
      } else {
        console.log(`· ${cuenta.email}: ya existe con rol "${cuenta.role}". Usa --reset para cambiar la contraseña.`);
      }
      continue;
    }

    const password = generarPassword();
    const hash = await hashPassword(password);

    if (existente) {
      await prisma.user.update({
        where: { id: existente.id },
        data: { password: hash, role: cuenta.role },
      });
      creadas.push({ ...cuenta, password, nota: 'contraseña reseteada' });
    } else {
      await prisma.user.create({
        data: {
          email: cuenta.email,
          username: cuenta.username,
          password: hash,
          role: cuenta.role,
        },
      });
      creadas.push({ ...cuenta, password, nota: 'cuenta creada' });
    }
  }

  if (creadas.length === 0) {
    console.log('\nNada que hacer.\n');
  } else {
    console.log('\n' + '─'.repeat(64));
    console.log('CREDENCIALES — se muestran una sola vez, cámbialas al entrar');
    console.log('─'.repeat(64));
    for (const c of creadas) {
      console.log(`\n  ${c.role === 'admin' ? 'ADMIN' : 'USUARIO'}  (${c.nota})`);
      console.log(`  email:      ${c.email}`);
      console.log(`  contraseña: ${c.password}`);
      console.log(`  sirve para: ${c.para}`);
    }
    console.log('\n' + '─'.repeat(64) + '\n');
  }

  const todos = await prisma.user.findMany({ select: { email: true, username: true, role: true } });
  console.table(todos);

  await prisma.$disconnect();
}

main().catch(async e => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
