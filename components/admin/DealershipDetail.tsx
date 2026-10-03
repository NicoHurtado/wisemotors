'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Edit, ArrowLeft, Trash2, Car, MapPin, Phone, Mail } from 'lucide-react';
import { adminFetch } from '@/lib/admin-fetch';

interface Dealership {
  id: string;
  name: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  status: string;
  _count?: {
    vehicles: number;
  };
}

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  type: string;
  fuelType: string;
}

interface DealershipDetailProps {
  dealershipId: string;
}

export function DealershipDetail({ dealershipId }: DealershipDetailProps) {
  const router = useRouter();
  const [dealership, setDealership] = useState<Dealership | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar concesionario
        const dealershipResponse = await fetch(`/api/dealers/${dealershipId}`);
        if (dealershipResponse.ok) {
          const dealershipData = await dealershipResponse.json();
          setDealership(dealershipData);
        } else {
          alert('Error al cargar el concesionario');
        }

        // Cargar vehículos del concesionario
        const vehiclesResponse = await fetch(`/api/vehicles?dealerId=${dealershipId}`);
        if (vehiclesResponse.ok) {
          const vehiclesData = await vehiclesResponse.json();
          setVehicles(vehiclesData.vehicles || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dealershipId]);

  const handleDelete = async () => {
    if (vehicles.length > 0) {
      alert('No se puede eliminar un concesionario que tiene vehículos asociados. Primero elimina o reasigna los vehículos.');
      return;
    }

    if (confirm('¿Estás seguro de que quieres eliminar este concesionario?')) {
      try {
        const response = await adminFetch(`/api/dealers/${dealershipId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          alert('Concesionario eliminado exitosamente');
          router.push('/admin');
        } else {
          const errorData = await response.json();
          alert(`Error: ${errorData.error || 'Error al eliminar el concesionario'}`);
        }
      } catch (error) {
        console.error('Error deleting dealership:', error);
        alert('Error al eliminar el concesionario');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Activo':
        return 'bg-wise/10 text-wise';
      case 'Inactivo':
        return 'bg-red-100 text-red-800';
      case 'En construcción':
        return 'bg-[#fce7f3] text-[#db2777]';
      default:
        return 'bg-tarjeta text-tinta';
    }
  };

  const getStatusText = (status: string) => {
    return status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wise"></div>
        <span className="ml-2 text-tinta-2">Cargando concesionario...</span>
      </div>
    );
  }

  if (!dealership) {
    return (
      <div className="text-center py-12">
        <Building2 className="mx-auto h-12 w-12 text-tinta-2/70" />
        <h3 className="mt-2 text-sm font-medium text-tinta">Concesionario no encontrado</h3>
        <p className="mt-1 text-sm text-tinta-2">
          El concesionario que buscas no existe o ha sido eliminado.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-blanco rounded-2xl shadow-lg">
      {/* Header */}
      <div className="px-8 py-6 border-b border-linea">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-tinta-2/70 hover:text-tinta-2 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-tinta">
                {dealership.name}
              </h1>
              <p className="text-tinta-2">ID: {dealership.id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <a
              href={`/concesionarios/${dealership.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-linea bg-blanco rounded-2xl hover:border-tinta transition-colors"
            >
              Ver su página
            </a>
            <button
              onClick={() => router.push(`/admin/dealerships/${dealership.id}/edit`)}
              className="inline-flex items-center px-4 py-2 bg-wise text-white rounded-2xl hover:bg-wise-profundo transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Información del Concesionario */}
      <div className="px-8 py-6">
        <h2 className="text-xl font-semibold text-tinta mb-4">Información del Concesionario</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start space-x-3">
            <Building2 className="w-5 h-5 text-tinta-2/70 mt-1" />
            <div>
              <label className="block text-sm font-medium text-tinta-2 mb-1">Nombre</label>
              <p className="text-lg font-medium text-tinta">{dealership.name}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-tinta-2/70 mt-1" />
            <div>
              <label className="block text-sm font-medium text-tinta-2 mb-1">Ubicación</label>
              <p className="text-lg font-medium text-tinta">{dealership.location}</p>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-tinta-2 mb-2">Dirección Completa</label>
            <p className="text-tinta">{dealership.address}</p>
          </div>

          <div className="flex items-start space-x-3">
            <Phone className="w-5 h-5 text-tinta-2/70 mt-1" />
            <div>
              <label className="block text-sm font-medium text-tinta-2 mb-1">Teléfono</label>
              <p className="text-lg font-medium text-tinta">{dealership.phone}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Mail className="w-5 h-5 text-tinta-2/70 mt-1" />
            <div>
              <label className="block text-sm font-medium text-tinta-2 mb-1">Email</label>
              <p className="text-lg font-medium text-tinta">{dealership.email}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-tinta-2 mb-1">Estado</label>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(dealership.status)}`}>
              {getStatusText(dealership.status)}
            </span>
          </div>
        </div>
      </div>

      {/* Vehículos del Concesionario */}
      <div className="px-8 py-6 border-t border-linea">
        <h2 className="text-xl font-semibold text-tinta mb-4">
          Vehículos ({vehicles.length})
        </h2>
        
        {vehicles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-linea">
              <thead className="bg-papel">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-tinta-2 uppercase tracking-wider">
                    Vehículo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-tinta-2 uppercase tracking-wider">
                    Año
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-tinta-2 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-tinta-2 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-tinta-2 uppercase tracking-wider">
                    Combustible
                  </th>
                </tr>
              </thead>
              <tbody className="bg-blanco divide-y divide-linea">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-papel">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-wise/10 rounded-full flex items-center justify-center mr-3">
                          <Car className="w-5 h-5 text-wise" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-tinta">
                            {vehicle.brand} {vehicle.model}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-tinta">
                      {vehicle.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-tinta">
                      ${vehicle.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-tinta">
                      {vehicle.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-tinta">
                      {vehicle.fuelType}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Car className="mx-auto h-12 w-12 text-tinta-2/70" />
            <h3 className="mt-2 text-sm font-medium text-tinta">No hay vehículos</h3>
            <p className="mt-1 text-sm text-tinta-2">
              Este concesionario no tiene vehículos asociados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
