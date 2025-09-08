'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Car, Edit, ArrowLeft, Trash2 } from 'lucide-react';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  type: string;
  vehicleType: string;
  fuelType: string;
  history: string;
  specifications: any;
  vehicleDealers: Array<{
    dealer: {
      id: string;
      name: string;
      location: string;
    };
  }>;
}

interface VehicleDetailProps {
  vehicleId: string;
}

export function VehicleDetail({ vehicleId }: VehicleDetailProps) {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const response = await fetch(`/api/vehicles/${vehicleId}`);
        if (response.ok) {
          const data = await response.json();
          setVehicle(data);
        } else {
          alert('Error al cargar el vehículo');
        }
      } catch (error) {
        console.error('Error fetching vehicle:', error);
        alert('Error al cargar el vehículo');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [vehicleId]);

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de que quieres eliminar este vehículo?')) {
      try {
        const response = await fetch(`/api/vehicles/${vehicleId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          alert('Vehículo eliminado exitosamente');
          router.push('/admin');
        } else {
          alert('Error al eliminar el vehículo');
        }
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        alert('Error al eliminar el vehículo');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wise"></div>
        <span className="ml-2 text-gray-600">Cargando vehículo...</span>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <Car className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Vehículo no encontrado</h3>
        <p className="mt-1 text-sm text-gray-500">
          El vehículo que buscas no existe o ha sido eliminado.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {vehicle.brand} {vehicle.model}
              </h1>
              <p className="text-gray-600">ID: {vehicle.id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push(`/admin/vehicles/${vehicle.id}/edit`)}
              className="inline-flex items-center px-4 py-2 bg-wise text-white rounded-lg hover:bg-wise-dark transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Información Básica */}
      <div className="px-8 py-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Información Básica</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Marca</label>
            <p className="text-lg font-medium text-gray-900">{vehicle.brand}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Modelo</label>
            <p className="text-lg font-medium text-gray-900">{vehicle.model}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Año</label>
            <p className="text-lg font-medium text-gray-900">{vehicle.year}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Precio</label>
            <p className="text-lg font-medium text-gray-900">${vehicle.price.toLocaleString()}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Tipo Básico</label>
            <p className="text-lg font-medium text-gray-900">{vehicle.type}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Tipo de Vehículo</label>
            <p className="text-lg font-medium text-gray-900">{vehicle.vehicleType}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Combustible</label>
            <p className="text-lg font-medium text-gray-900">{vehicle.fuelType}</p>
          </div>
        </div>

        {vehicle.history && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-500 mb-2">Historial</label>
            <p className="text-gray-900">{vehicle.history}</p>
          </div>
        )}
      </div>

      {/* Concesionarios */}
      <div className="px-8 py-6 border-t border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Concesionarios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicle.vehicleDealers.map((vd, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900">{vd.dealer.name}</h3>
              <p className="text-sm text-gray-600">{vd.dealer.location}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Especificaciones */}
      <div className="px-8 py-6 border-t border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Especificaciones</h2>
        <div className="space-y-6">
          {Object.entries(vehicle.specifications).map(([section, specs]) => {
            if (!specs || Object.keys(specs).length === 0) return null;
            
            return (
              <div key={section} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3 capitalize">
                  {section.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(specs).map(([key, value]) => {
                    if (value === '' || value === null || value === undefined) return null;
                    
                    return (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <p className="text-gray-900">
                          {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
