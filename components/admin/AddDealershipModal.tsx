'use client';

import { useState } from 'react';
import { X, Building2 } from 'lucide-react';

interface AddDealershipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddDealershipModal({ isOpen, onClose }: AddDealershipModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    phone: '',
    email: '',
    status: 'Activo'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para agregar el concesionario
    console.log('Adding dealership:', formData);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-600/10 rounded-full flex items-center justify-center mr-3">
              <Building2 className="w-5 h-5 text-gray-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Agregar Nuevo Concesionario
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Concesionario *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                placeholder="WiseMotors Centro"
                required
              />
            </div>

            {/* Ubicación */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Ciudad/Zona *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                placeholder="Medellín Centro"
                required
              />
            </div>

            {/* Estado */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Estado *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                required
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
                <option value="En construcción">En construcción</option>
              </select>
            </div>

            {/* Dirección */}
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Dirección Completa *
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                placeholder="Calle 50 #45-67, Medellín"
                required
              />
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                placeholder="+57 300 123 4567"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                placeholder="centro@wisemotors.com"
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Agregar Concesionario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
