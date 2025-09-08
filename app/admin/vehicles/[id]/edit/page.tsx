import { EditVehicleForm } from '@/components/admin/EditVehicleForm';

interface EditVehiclePageProps {
  params: {
    id: string;
  };
}

export default function EditVehiclePage({ params }: EditVehiclePageProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Editar Vehículo
          </h1>
          <p className="mt-2 text-gray-600">
            Modifica los campos del vehículo según sea necesario
          </p>
        </div>

        <EditVehicleForm vehicleId={params.id} />
      </div>
    </div>
  );
}
