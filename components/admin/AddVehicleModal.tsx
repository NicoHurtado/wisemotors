'use client';

import { useState } from 'react';
import { X, Car } from 'lucide-react';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddVehicleModal({ isOpen, onClose }: AddVehicleModalProps) {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: '',
    price: '',
    type: '',
    fuelType: '',
    power: '',
    engine: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para agregar el vehículo
    console.log('Adding vehicle:', formData);
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
            <div className="w-10 h-10 bg-wise/10 rounded-full flex items-center justify-center mr-3">
              <Car className="w-5 h-5 text-wise" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Agregar Nuevo Vehículo
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
            {/* Marca */}
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                Marca *
              </label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
                required
              />
            </div>

            {/* Modelo */}
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
                Modelo *
              </label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
                required
              />
            </div>

            {/* Año */}
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                Año *
              </label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                min="1900"
                max="2030"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
                required
              />
            </div>

            {/* Precio */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Precio *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="1000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
                placeholder="280000000"
                required
              />
            </div>

            {/* Tipo */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Vehículo *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
                required
              >
                <option value="">Seleccionar tipo</option>
                <option value="Sedán">Sedán</option>
                <option value="SUV">SUV</option>
                <option value="Pickup">Pickup</option>
                <option value="Deportivo">Deportivo</option>
                <option value="Wagon">Wagon</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Convertible">Convertible</option>
              </select>
            </div>

            {/* Tipo de Combustible */}
            <div>
              <label htmlFor="fuelType" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Combustible *
              </label>
              <select
                id="fuelType"
                name="fuelType"
                value={formData.fuelType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
                required
              >
                <option value="">Seleccionar combustible</option>
                <option value="Gasolina">Gasolina</option>
                <option value="Diesel">Diesel</option>
                <option value="Eléctrico">Eléctrico</option>
                <option value="Híbrido">Híbrido</option>
                <option value="Híbrido Enchufable">Híbrido Enchufable</option>
              </select>
            </div>

            {/* Potencia */}
            <div>
              <label htmlFor="power" className="block text-sm font-medium text-gray-700 mb-2">
                Potencia *
              </label>
              <input
                type="text"
                id="power"
                name="power"
                value={formData.power}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
                placeholder="510 HP"
                required
              />
            </div>

            {/* Motor */}
            <div>
              <label htmlFor="engine" className="block text-sm font-medium text-gray-700 mb-2">
                Motor *
              </label>
              <input
                type="text"
                id="engine"
                name="engine"
                value={formData.engine}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
                placeholder="3000 cc"
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
              className="px-6 py-2 bg-wise text-white rounded-lg hover:bg-wise-dark transition-colors"
            >
              Agregar Vehículo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
