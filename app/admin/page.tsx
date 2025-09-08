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
          <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg">
            <p className="text-green-800 font-medium">
              ✅ Acceso autorizado - Solo usuarios con email: adminwise@wisemotors.co
            </p>
          </div>
          <div className="mt-4 p-4 bg-blue-100 border border-blue-300 rounded-lg">
            <p className="text-blue-800 font-medium">
              ℹ️ Este usuario tiene acceso completo a la aplicación + Dashboard Admin
            </p>
          </div>
          <div className="mt-4 p-4 bg-purple-100 border border-purple-300 rounded-lg">
            <p className="text-purple-800 font-medium">
              🔒 Solo usuarios con email: adminwise@wisemotors.co y contraseña correcta pueden acceder aquí
            </p>
          </div>
        </div>
        
        <AdminDashboard />
      </div>
    </div>
  );
}
