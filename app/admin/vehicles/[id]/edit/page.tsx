import { EditVehicleForm } from '@/components/admin/EditVehicleForm';

interface EditVehiclePageProps {
  params: {
    id: string;
  };
}

export default function EditVehiclePage({ params }: EditVehiclePageProps) {
  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-10 md:px-8 md:pt-14">
      <div>
        <a href="/admin" className="text-[14px] text-tinta-2 hover:text-tinta">← Panel</a>
        <div className="mb-8">
          <h1 className="t-titulo mt-4 text-[40px] md:text-[64px]">
            Editar vehículo
          </h1>
          <p className="mt-2 text-tinta-2">
            Modifica los campos del vehículo según sea necesario
          </p>
        </div>

        <EditVehicleForm vehicleId={params.id} />
      </div>
    </div>
  );
}
