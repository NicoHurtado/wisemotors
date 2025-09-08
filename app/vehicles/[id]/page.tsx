'use client';

import { VehicleDetail } from '@/components/vehicles/VehicleDetail';
import { useVehicle } from '@/hooks/useVehicles';
import { useParams } from 'next/navigation';

export default function VehicleDetailPage() {
  const params = useParams();
  const vehicleId = params.id as string;
  const { vehicle, loading, error } = useVehicle(vehicleId);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wise mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando vehículo...</p>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">
            {error || 'Vehículo no encontrado'}
          </div>
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-wise text-white rounded-lg hover:bg-wise-dark"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <VehicleDetail vehicle={vehicle} />
    </div>
  );
}
