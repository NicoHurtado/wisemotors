import { AddDealershipForm } from '@/components/admin/AddDealershipForm';

export default function NewDealershipPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Agregar Nuevo Concesionario
          </h1>
          <p className="mt-2 text-gray-600">
            Completa todos los campos para agregar un nuevo concesionario
          </p>
        </div>

        <AddDealershipForm />
      </div>
    </div>
  );
}
