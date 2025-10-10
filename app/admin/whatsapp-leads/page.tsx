import { WhatsAppLeadsTable } from '@/components/admin/WhatsAppLeadsTable';

export default function WhatsAppLeadsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-wise/5 to-wise/10 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Leads de WhatsApp
          </h1>
          <p className="text-xl text-gray-600">
            Gestiona todos los leads generados desde los enlaces de WhatsApp
          </p>
          <div className="mt-4 p-4 bg-blue-100 border border-blue-300 rounded-lg">
            <p className="text-blue-800 font-medium">
              📊 Aquí puedes ver todos los leads, cambiar su estado y exportar la información a Excel
            </p>
          </div>
        </div>
        
        <WhatsAppLeadsTable />
      </div>
    </div>
  );
}
