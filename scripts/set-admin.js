/**
 * Otorga o quita el rol de administrador.
 *
 * El acceso al panel y a las rutas protegidas ahora depende de User.role, no de
 * una contraseña en el bundle ni del email. Este script es la única forma
 * prevista de nombrar un admin.
 *
 * Uso:
 *   node --env-file=.env.local scripts/set-admin.js <email>
 *   node --env-file=.env.local scripts/set-admin.js <email> --quitar
 *
 * Está en JavaScript a propósito: `tsx` no corre en este repo hasta que se
 * repare el binario de esbuild (ver README de scripts).
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const quitar = process.argv.includes('--quitar');

  if (!email) {
    console.error('Falta el email.\n  node --env-file=.env.local scripts/set-admin.js <email> [--quitar]');
    process.exit(1);
  }

  const usuario = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (!usuario) {
    console.error(`No existe ningún usuario con el email ${email}.`);
    process.exit(1);
  }

  const nuevoRol = quitar ? 'user' : 'admin';

  if (usuario.role === nuevoRol) {
    console.log(`${email} ya tiene el rol '${nuevoRol}'. Sin cambios.`);
    return;
  }

  await prisma.user.update({
    where: { email },
    data: { role: nuevoRol },
  });

  console.log(`${email}: '${usuario.role}' → '${nuevoRol}'`);
  console.log('El usuario debe cerrar sesión y volver a entrar para que su token refleje el cambio.');
}

main()
  .catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
