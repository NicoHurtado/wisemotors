'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, Eye, Car } from 'lucide-react';

// Tipos para los datos de la API
interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  type: string;
  fuelType: string;
  specifications: any;
  dealers: Array<{
    dealer: {
      name: string;
    };
  }>;
}

export function VehiclesTable() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar vehículos desde la API
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch('/api/vehicles');
        if (response.ok) {
          const data = await response.json();
          setVehicles(data.vehicles || []);
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este vehículo?')) {
      try {
        const response = await fetch(`/api/vehicles/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setVehicles(vehicles.filter(v => v.id !== id));
        } else {
          alert('Error al eliminar el vehículo');
        }
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        alert('Error al eliminar el vehículo');
      }
    }
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Vehículos ({filteredVehicles.length})
        </h2>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Buscar vehículos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
          />
        </div>
      </div>

              {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wise"></div>
            <span className="ml-2 text-gray-600">Cargando vehículos...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vehículo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Año
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Combustible
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredVehicles.map((vehicle) => (
              <tr key={vehicle.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-wise/10 rounded-full flex items-center justify-center mr-3">
                      <Car className="w-5 h-5 text-wise" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {vehicle.brand} {vehicle.model}
                      </div>
                      <div className="text-sm text-gray-500">
                        {vehicle.specifications?.combustion?.displacement || vehicle.specifications?.electric?.batteryCapacity || 'N/A'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {vehicle.year}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${vehicle.price.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {vehicle.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {vehicle.fuelType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => router.push(`/admin/vehicles/${vehicle.id}`)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => router.push(`/admin/vehicles/${vehicle.id}/edit`)}
                      className="text-green-600 hover:text-green-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(vehicle.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </div>
        )}

      {filteredVehicles.length === 0 && (
        <div className="text-center py-12">
          <Car className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay vehículos</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No se encontraron vehículos con esa búsqueda.' : 'Comienza agregando tu primer vehículo.'}
          </p>
        </div>
      )}
    </div>
  );
}
