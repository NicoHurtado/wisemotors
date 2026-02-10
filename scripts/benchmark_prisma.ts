import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function benchmark() {
  console.log('--- Starting Prisma Benchmark ---');

  for (let i = 1; i <= 3; i++) {
    const start = performance.now();
    const vehicles = await prisma.vehicle.findMany({
      take: 12,
      select: {
        id: true,
        brand: true,
        model: true,
        images: {
          take: 1,
          select: { url: true }
        }
      }
    });
    const end = performance.now();
    console.log(`Run ${i}: ${(end - start).toFixed(2)}ms, Count: ${vehicles.length}`);
  }

  await prisma.$disconnect();
}

benchmark().catch(console.error);
