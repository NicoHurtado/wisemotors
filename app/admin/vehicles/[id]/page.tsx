import { VehicleDetail } from '@/components/admin/VehicleDetail';

interface VehicleDetailPageProps {
  params: {
    id: string;
  };
}

export default function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <VehicleDetail vehicleId={params.id} />
      </div>
    </div>
  );
}
