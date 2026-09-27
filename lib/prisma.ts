import { PrismaClient } from '@prisma/client';
import { urlBaseDatos } from '@/lib/db/url';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// La URL se pasa explícita: así funciona aunque la variable venga con el
// prefijo en minúscula (ver lib/db/url.ts). Sin URL, Prisma usa la del schema.
const url = urlBaseDatos();

export const prisma = globalForPrisma.prisma ?? new PrismaClient(url ? { datasources: { db: { url } } } : undefined);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
