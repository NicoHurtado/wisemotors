import { IngestStudio } from '@/components/admin/IngestStudio';

export default function IngestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-wise/5 to-wise/10 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Subir vehículo con IA</h1>
          <p className="text-gray-600">Marca, modelo, país y año — el sistema trae los datos; tú decides cuáles se publican.</p>
        </div>
        <IngestStudio />
      </div>
    </div>
  );
}
