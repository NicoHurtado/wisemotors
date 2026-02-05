
import { prisma } from './lib/prisma';

async function main() {
  const brands = await prisma.vehicle.findMany({
    select: { brand: true },
    distinct: ['brand'],
    orderBy: { brand: 'asc' }
  });
  console.log('Available Brands:', brands.map(b => b.brand));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
