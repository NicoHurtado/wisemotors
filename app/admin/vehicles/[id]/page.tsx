import { VehicleDetail } from '@/components/admin/VehicleDetail';

interface VehicleDetailPageProps {
  params: {
    id: string;
  };
}

export default function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-10 md:px-8 md:pt-14">
      <div>
        <a href="/admin" className="text-[14px] text-tinta-2 hover:text-tinta">← Panel</a>
        <VehicleDetail vehicleId={params.id} />
      </div>
    </div>
  );
}
