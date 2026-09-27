// ============================================================================
// Cuenta admin inicial a partir de ADMIN_EMAIL + ADMIN_PASSWORD (Vercel).
//
// Solo CREA la cuenta si ese correo no existe. Nunca asciende una cuenta que
// ya exista ni cambia contraseñas: el registro no verifica correos, así que
// alguien pudo haberse registrado con ese email.
//
// La usan el deploy (scripts/preparar-bd.ts) y el login: si alguien entra con
// exactamente ADMIN_EMAIL y ADMIN_PASSWORD y la cuenta aún no existe, se crea
// en ese momento. Sin conocer ADMIN_PASSWORD nadie puede dispararlo.
// ============================================================================

import { timingSafeEqual } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/auth';

export function adminConfigurado() {
  const email = process.env.ADMIN_EMAIL?.trim();
  const clave = process.env.ADMIN_PASSWORD;
  return email && clave && clave.length >= 10 ? { email, clave } : null;
}

function iguales(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** ¿Estas credenciales son exactamente las del admin inicial? */
export function esAdminInicial(email: string, clave: string) {
  const cfg = adminConfigurado();
  return !!cfg && email.trim().toLowerCase() === cfg.email.toLowerCase() && iguales(clave, cfg.clave);
}

export type ResultadoAdmin = 'creada' | 'ya_existe_admin' | 'existe_no_admin' | 'sin_configurar';

export async function crearAdminInicial(prisma: PrismaClient): Promise<ResultadoAdmin> {
  const cfg = adminConfigurado();
  if (!cfg) return 'sin_configurar';

  const existe = await prisma.user.findFirst({ where: { email: { equals: cfg.email, mode: 'insensitive' } } });
  if (existe) return existe.role === 'admin' ? 'ya_existe_admin' : 'existe_no_admin';

  const base = cfg.email.split('@')[0].replace(/[^a-zA-Z0-9_.-]/g, '') || 'admin';
  let username = base;
  for (let i = 2; await prisma.user.findFirst({ where: { username } }); i++) username = `${base}${i}`;

  await prisma.user.create({
    data: { email: cfg.email, username, password: await hashPassword(cfg.clave), role: 'admin' },
  });
  return 'creada';
}
