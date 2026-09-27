// ============================================================================
// Prepara la base en cada deploy de PRODUCCIÓN (Vercel), antes del build:
//
//   1. prisma db push: crea las tablas que falten y aplica cambios de schema
//      NO destructivos. Si un cambio borraría datos, Prisma se niega y el
//      deploy falla a propósito (hay que resolverlo a mano, nunca solo).
//   2. Datos base: definiciones de atributos (siempre, es idempotente) y, si
//      la base está vacía, bandas de precio y percepción de marca.
//   3. Cuenta admin inicial: si están ADMIN_EMAIL y ADMIN_PASSWORD y ese
//      correo NO existe, la crea con rol admin. Nunca asciende a un usuario
//      que ya exista (el registro no verifica correos: cualquiera pudo haber
//      usado ese email) ni cambia contraseñas. Corre en el build, antes de que
//      el deploy quede público, así que nadie alcanza a registrarse primero.
//
// En preview/desarrollo no hace nada: una rama de prueba nunca debe alterar
// la base real. Para correrlo a mano en local: npx tsx scripts/preparar-bd.ts --forzar
// ============================================================================

import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { VAR_BD, VAR_BD_DIRECTA, urlBaseDatos, urlBaseDatosDirecta } from '../lib/db/url';
import { sembrarBandas, sembrarDefiniciones, sembrarPercepcion } from '../lib/db/semillas';
import { hashPassword } from '../lib/auth';

async function main() {
  const produccion = process.env.VERCEL_ENV === 'production';
  if (!produccion && !process.argv.includes('--forzar')) {
    console.log(`[preparar-bd] VERCEL_ENV=${process.env.VERCEL_ENV ?? '(local)'}: no se toca la base.`);
    return;
  }

  const url = urlBaseDatos();
  const directa = urlBaseDatosDirecta();
  if (!url || !directa) {
    console.warn(`[preparar-bd] ⚠ No hay ${VAR_BD}: se omite. La app no tendrá base hasta configurarla en Vercel.`);
    return;
  }

  // El CLI de Prisma lee los nombres exactos del schema: se normalizan aquí
  // por si Vercel los creó con el prefijo en minúscula.
  const env = { ...process.env, [VAR_BD]: url, [VAR_BD_DIRECTA]: directa };

  console.log('[preparar-bd] Aplicando schema (prisma db push)…');
  execSync('npx prisma db push --skip-generate', { stdio: 'inherit', env });

  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const n = await sembrarDefiniciones(prisma);
    console.log(`[preparar-bd] ✓ ${n} definiciones de atributos al día`);

    if ((await prisma.priceBand.count()) === 0) {
      console.log(`[preparar-bd] ✓ ${await sembrarBandas(prisma)} bandas de precio sembradas (base nueva)`);
    }
    if ((await prisma.brandPerception.count()) === 0) {
      console.log(`[preparar-bd] ✓ ${await sembrarPercepcion(prisma)} marcas sembradas (base nueva)`);
    }

    await adminInicial(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

async function adminInicial(prisma: PrismaClient) {
  const email = process.env.ADMIN_EMAIL?.trim();
  const clave = process.env.ADMIN_PASSWORD;
  if (!email) return;

  const existe = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
  if (existe) {
    if (existe.role !== 'admin') {
      console.warn(`[preparar-bd] ⚠ ${email} ya existe y NO es admin. No se asciende automáticamente: usar scripts/set-admin.js.`);
    }
    return;
  }
  if (!clave || clave.length < 10) {
    console.warn('[preparar-bd] ⚠ ADMIN_PASSWORD falta o tiene menos de 10 caracteres: no se crea la cuenta admin.');
    return;
  }

  // Nombre de usuario a partir del correo, sin chocar con uno existente.
  const base = email.split('@')[0].replace(/[^a-zA-Z0-9_.-]/g, '') || 'admin';
  let username = base;
  for (let i = 2; await prisma.user.findFirst({ where: { username } }); i++) username = `${base}${i}`;

  await prisma.user.create({
    data: { email, username, password: await hashPassword(clave), role: 'admin' },
  });
  console.log(`[preparar-bd] ✓ cuenta admin creada: ${email} (usuario ${username})`);
}

main().catch(e => {
  console.error('[preparar-bd] ✗', e);
  process.exit(1);
});
