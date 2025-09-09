'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Check, X, Star, StarOff, Search, Filter } from 'lucide-react';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  type: string;
  fuelType: string;
  isTrending: boolean;
  trendingOrder?: number;
  images?: Array<{
    url: string;
    alt?: string;
  }>;
}

interface TrendingManagementProps {
  onClose: () => void;
}

export function TrendingManagement({ onClose }: TrendingManagementProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trendingVehicles, setTrendingVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterFuel, setFilterFuel] = useState<string>('all');

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles');
      const data = await response.json();
      setVehicles(data.vehicles || []);
      
      // Obtener vehículos trending actuales
      const trendingResponse = await fetch('/api/trending');
      const trendingData = await trendingResponse.json();
      setTrendingVehicles(trendingData.vehicles || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTrending = (vehicle: Vehicle) => {
    if (vehicle.isTrending) {
      // Quitar de trending
      setTrendingVehicles(prev => prev.filter(v => v.id !== vehicle.id));
    } else {
      // Agregar a trending (máximo 6)
      if (trendingVehicles.length < 6) {
        setTrendingVehicles(prev => [...prev, { ...vehicle, isTrending: true }]);
      }
    }
  };

  const reorderTrending = (fromIndex: number, toIndex: number) => {
    const newTrending = [...trendingVehicles];
    const [moved] = newTrending.splice(fromIndex, 1);
    newTrending.splice(toIndex, 0, moved);
    setTrendingVehicles(newTrending);
  };

  const saveTrending = async () => {
    setSaving(true);
    try {
      const vehicleIds = trendingVehicles.map(v => v.id);
      
      const response = await fetch('/api/trending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vehicleIds }),
      });

      if (response.ok) {
        alert('Vehículos trending actualizados correctamente');
        onClose();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving trending vehicles:', error);
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Filtrar vehículos basado en búsqueda y filtros
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = searchTerm === '' || 
      `${vehicle.brand} ${vehicle.model}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || vehicle.type === filterType;
    const matchesFuel = filterFuel === 'all' || vehicle.fuelType === filterFuel;
    
    return matchesSearch && matchesType && matchesFuel;
  });

  // Obtener tipos únicos para el filtro
  const uniqueTypes = [...new Set(vehicles.map(v => v.type))].sort();
  const uniqueFuels = [...new Set(vehicles.map(v => v.fuelType))].sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wise mx-auto mb-4"></div>
          <p>Cargando vehículos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vehículos Trending</h2>
          <p className="text-gray-600">Selecciona hasta 6 vehículos para mostrar en la página principal</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          <X className="w-4 h-4 mr-2" />
          Cerrar
        </Button>
      </div>

      {/* Vehículos Trending Actuales */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Star className="w-5 h-5 mr-2 text-yellow-500" />
          Trending Actual ({trendingVehicles.length}/6)
        </h3>
        
        {trendingVehicles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <StarOff className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No hay vehículos trending seleccionados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingVehicles.map((vehicle, index) => (
              <Card key={vehicle.id} className="p-4 border-2 border-yellow-200 bg-yellow-50">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    #{index + 1}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleTrending(vehicle)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">
                    {vehicle.brand} {vehicle.model}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {vehicle.year} • {vehicle.fuelType} • {vehicle.type}
                  </p>
                  <p className="font-bold text-wise">
                    {formatPrice(vehicle.price)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Todos los Vehículos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Todos los Vehículos</h3>
          <div className="text-sm text-gray-500">
            {filteredVehicles.length} de {vehicles.length} vehículos
          </div>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="mb-6 space-y-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar por marca, modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Todos los tipos</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={filterFuel}
                onChange={(e) => setFilterFuel(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Todos los combustibles</option>
                {uniqueFuels.map(fuel => (
                  <option key={fuel} value={fuel}>{fuel}</option>
                ))}
              </select>
            </div>

            {/* Botón para limpiar filtros */}
            {(searchTerm || filterType !== 'all' || filterFuel !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setFilterFuel('all');
                }}
                className="text-xs"
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>

        {filteredVehicles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No se encontraron vehículos con los filtros aplicados</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterFuel('all');
              }}
              className="mt-2"
            >
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
            {filteredVehicles.map((vehicle) => (
            <Card 
              key={vehicle.id} 
              className={`p-4 cursor-pointer transition-all ${
                vehicle.isTrending 
                  ? 'border-yellow-300 bg-yellow-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => toggleTrending(vehicle)}
            >
              <div className="flex items-start justify-between mb-3">
                <Badge variant="outline" className="text-xs">
                  {vehicle.type}
                </Badge>
                {vehicle.isTrending ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <StarOff className="w-5 h-5 text-gray-400" />
                )}
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 text-sm">
                  {vehicle.brand} {vehicle.model}
                </h4>
                <p className="text-xs text-gray-600">
                  {vehicle.year} • {vehicle.fuelType}
                </p>
                <p className="font-bold text-wise text-sm">
                  {formatPrice(vehicle.price)}
                </p>
              </div>
            </Card>
          ))}
          </div>
        )}
      </div>

      {/* Botones de Acción */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          onClick={saveTrending} 
          disabled={saving || trendingVehicles.length === 0}
          className="bg-wise hover:bg-wise/90"
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </div>
  );
}
