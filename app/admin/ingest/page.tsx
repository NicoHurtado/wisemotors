import { IngestStudio } from '@/components/admin/IngestStudio';

export default function IngestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-wise/5 to-wise/10 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Subir vehículos con IA</h1>
          <p className="text-gray-600">Escribe el nombre del carro: la IA trae los datos para Colombia y tú solo verificas.</p>
        </div>
        <IngestStudio />
      </div>
    </div>
  );
}
