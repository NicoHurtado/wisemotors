import { getVehicles } from '@/lib/data/vehicles';
import VehiclesClient from '@/components/vehicles/VehiclesClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Vehículos | WiseMotors',
  description: 'Explora nuestra selección de vehículos de alta gama, deportivos y exclusivos. Encuentra tu próximo auto con WiseMotors.',
};

export default async function VehiclesPage() {
  // Fetch initial data on the server
  // Note: We don't pass searchParams here yet because the filter logic is client-side in the original implementation.
  // The original page initializes with empty filters.
  // So we fetch the default list (relevance/latest).

  const { vehicles } = await getVehicles({
    limit: 12,
    sortBy: 'createdAt' // 'relevance' maps to createdAt desc in API/lib
  });

  return <VehiclesClient initialVehicles={vehicles} />;
}
