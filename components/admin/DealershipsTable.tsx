'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, Eye, Building2, MapPin } from 'lucide-react';
import { adminFetch } from '@/lib/admin-fetch';

// Tipos para los datos de la API
interface Dealer {
  id: string;
  name: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  status: string;
  _count: {
    vehicles: number;
  };
}

export function DealershipsTable() {
  const router = useRouter();
  const [dealerships, setDealerships] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar concesionarios desde la API
  useEffect(() => {
    const fetchDealerships = async () => {
      try {
        const response = await fetch('/api/dealers');
        if (response.ok) {
          const data = await response.json();
          setDealerships(data || []);
        }
      } catch (error) {
        console.error('Error fetching dealerships:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDealerships();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este concesionario?')) {
      try {
        const response = await adminFetch(`/api/dealers/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setDealerships(dealerships.filter(d => d.id !== id));
        } else {
          const errorData = await response.json();
          alert(errorData.error || 'Error al eliminar el concesionario');
        }
      } catch (error) {
        console.error('Error deleting dealership:', error);
        alert('Error al eliminar el concesionario');
      }
    }
  };

  const filteredDealerships = dealerships.filter(dealership =>
    dealership.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dealership.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dealership.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-tinta">
          Concesionarios ({filteredDealerships.length})
        </h2>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Buscar concesionarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
          />
        </div>
      </div>

              {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
            <span className="ml-2 text-tinta-2">Cargando concesionarios...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-linea">
          <thead className="bg-papel">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-tinta-2 uppercase tracking-wider">
                Concesionario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-tinta-2 uppercase tracking-wider">
                Ubicación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-tinta-2 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-tinta-2 uppercase tracking-wider">
                Vehículos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-tinta-2 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-tinta-2 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-blanco divide-y divide-linea">
            {filteredDealerships.map((dealership) => (
              <tr key={dealership.id} className="hover:bg-papel">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-wise/10 rounded-full flex items-center justify-center mr-3">
                      <Building2 className="w-5 h-5 text-wise" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-tinta">
                        {dealership.name}
                      </div>
                      <div className="text-sm text-tinta-2">
                        {dealership.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 text-tinta-2/70 mr-2" />
                    <div>
                      <div className="text-sm text-tinta">
                        {dealership.location}
                      </div>
                      <div className="text-sm text-tinta-2">
                        {dealership.address}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-tinta">
                    {dealership.phone}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-tinta">
                  {dealership._count.vehicles} vehículos
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    dealership.status === 'Activo' 
                      ? 'bg-wise/10 text-wise' 
                      : dealership.status === 'Inactivo'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-[#fce7f3] text-[#db2777]'
                  }`}>
                    {dealership.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => router.push(`/admin/dealerships/${dealership.id}`)}
                      className="text-wise hover:text-wise"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => router.push(`/admin/dealerships/${dealership.id}/edit`)}
                      className="text-wise hover:text-wise"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(dealership.id)}
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

      {filteredDealerships.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-tinta-2/70" />
          <h3 className="mt-2 text-sm font-medium text-tinta">No hay concesionarios</h3>
          <p className="mt-1 text-sm text-tinta-2">
            {searchTerm ? 'No se encontraron concesionarios con esa búsqueda.' : 'Comienza agregando tu primer concesionario.'}
          </p>
        </div>
      )}
    </div>
  );
}
