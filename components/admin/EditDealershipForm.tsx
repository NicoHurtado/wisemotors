'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, Loader2, Building2 } from 'lucide-react';

interface Dealership {
  id: string;
  name: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  status: string;
}

interface EditDealershipFormProps {
  dealershipId: string;
}

export function EditDealershipForm({ dealershipId }: EditDealershipFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dealership, setDealership] = useState<Dealership | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    phone: '',
    email: '',
    status: 'active'
  });

  // Cargar concesionario
  useEffect(() => {
    const fetchDealership = async () => {
      try {
        const response = await fetch(`/api/dealers/${dealershipId}`);
        if (response.ok) {
          const data = await response.json();
          setDealership(data);
          
          // Llenar formulario con datos del concesionario
          setFormData({
            name: data.name || '',
            location: data.location || '',
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            status: data.status || 'active'
          });
        } else {
          alert('Error al cargar el concesionario');
        }
      } catch (error) {
        console.error('Error fetching dealership:', error);
        alert('Error al cargar el concesionario');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchDealership();
  }, [dealershipId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/dealers/${dealershipId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Concesionario actualizado exitosamente!');
        router.push('/admin');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Error al actualizar el concesionario'}`);
      }
    } catch (error) {
      console.error('Error updating dealership:', error);
      alert('Error al actualizar el concesionario');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-wise mr-3" />
        <span className="text-gray-600">Cargando concesionario...</span>
      </div>
    );
  }

  if (!dealership) {
    return (
      <div className="text-center py-12">
        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Concesionario no encontrado</h3>
        <p className="mt-1 text-sm text-gray-500">
          El concesionario que buscas no existe o ha sido eliminado.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Concesionario *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
            placeholder="Nombre del concesionario"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ubicación *
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
            placeholder="Ciudad, País"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dirección Completa *
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
            placeholder="Dirección completa del concesionario"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono *
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
            placeholder="+1 234 567 8900"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
            placeholder="email@concesionario.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado *
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
            required
          >
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="pending">Pendiente</option>
          </select>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex items-center justify-end space-x-4 pt-8 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
        >
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </button>
        
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-wise text-white rounded-lg hover:bg-wise-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {loading ? 'Actualizando...' : 'Actualizar Concesionario'}
        </button>
      </div>
    </form>
  );
}
