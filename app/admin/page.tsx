import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-wise/5 to-wise/10 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Panel de Administración
          </h1>
          <p className="text-xl text-gray-600">
            Bienvenido al panel de administración de WiseMotors
          </p>
        </div>
        
        <AdminDashboard />
      </div>
    </div>
  );
}
