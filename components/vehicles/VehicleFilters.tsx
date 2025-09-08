'use client';

import { useState, useEffect } from 'react';
import { X, ChevronUp, ChevronDown, Check, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCategories, useFuelTypes } from '@/hooks/useVehicles';

interface FilterState {
  priceRange: {
    min: string;
    max: string;
  };
  categories: string[];
  engineTypes: string[];
}

interface VehicleFiltersProps {
  filters: {
    search: string;
    category: string | string[];
    fuelType: string | string[];
    minPrice: number | undefined;
    maxPrice: number | undefined;
    sortBy: string;
  };
  onFiltersChange: (filters: any) => void;
}

export function VehicleFilters({ filters, onFiltersChange }: VehicleFiltersProps) {
  const { categories: availableCategories, loading: categoriesLoading } = useCategories();
  const { fuelTypes: availableFuelTypes, loading: fuelTypesLoading } = useFuelTypes();
  
  const [localFilters, setLocalFilters] = useState<FilterState>({
    priceRange: { 
      min: filters.minPrice?.toString() || '', 
      max: filters.maxPrice?.toString() || '' 
    },
    categories: Array.isArray(filters.category) ? filters.category : (filters.category ? [filters.category] : []),
    engineTypes: Array.isArray(filters.fuelType) ? filters.fuelType : (filters.fuelType ? [filters.fuelType] : []),
  });

  // Sincronizar con los filtros externos
  useEffect(() => {
    setLocalFilters({
      priceRange: { 
        min: filters.minPrice?.toString() || '', 
        max: filters.maxPrice?.toString() || '' 
      },
      categories: Array.isArray(filters.category) ? filters.category : (filters.category ? [filters.category] : []),
      engineTypes: Array.isArray(filters.fuelType) ? filters.fuelType : (filters.fuelType ? [filters.fuelType] : []),
    });
  }, [filters]);

  const clearFilters = () => {
    const newLocalFilters = {
      priceRange: { min: '', max: '' },
      categories: [],
      engineTypes: [],
    };
    setLocalFilters(newLocalFilters);
    
    // Notificar al componente padre
    onFiltersChange({
      ...filters,
      category: [],
      fuelType: [],
      minPrice: undefined,
      maxPrice: undefined
    });
  };

  const toggleCategory = (categoryId: string) => {
    const newCategories = localFilters.categories.includes(categoryId)
      ? localFilters.categories.filter(id => id !== categoryId)
      : [...localFilters.categories, categoryId]; // Permitir múltiples categorías
    
    setLocalFilters(prev => ({
      ...prev,
      categories: newCategories
    }));
    
    // Notificar al componente padre
    onFiltersChange({
      ...filters,
      category: newCategories
    });
  };

  const toggleEngineType = (engineTypeId: string) => {
    const newEngineTypes = localFilters.engineTypes.includes(engineTypeId)
      ? localFilters.engineTypes.filter(id => id !== engineTypeId)
      : [...localFilters.engineTypes, engineTypeId]; // Permitir múltiples tipos de motor
    
    setLocalFilters(prev => ({
      ...prev,
      engineTypes: newEngineTypes
    }));
    
    // Notificar al componente padre
    onFiltersChange({
      ...filters,
      fuelType: newEngineTypes
    });
  };

  const removeSelected = (type: 'category' | 'engine', id: string) => {
    if (type === 'category') {
      toggleCategory(id);
    } else {
      toggleEngineType(id);
    }
  };

  const updatePriceRange = (field: 'min' | 'max', value: string) => {
    const newPriceRange = {
      ...localFilters.priceRange,
      [field]: value
    };
    
    setLocalFilters(prev => ({
      ...prev,
      priceRange: newPriceRange
    }));
    
    // Notificar al componente padre
    onFiltersChange({
      ...filters,
      minPrice: newPriceRange.min ? parseInt(newPriceRange.min) : undefined,
      maxPrice: newPriceRange.max ? parseInt(newPriceRange.max) : undefined
    });
  };

  // Función para incrementar/decrementar precio
  const adjustPrice = (field: 'min' | 'max', direction: 'up' | 'down') => {
    const currentValue = parseInt(localFilters.priceRange[field]) || 0;
    const step = field === 'min' ? 10000000 : 50000000; // 10M para min, 50M para max
    
    let newValue = currentValue;
    if (direction === 'up') {
      newValue += step;
    } else {
      newValue = Math.max(0, currentValue - step);
    }
    
    updatePriceRange(field, newValue.toString());
  };

  const hasSelections = localFilters.categories.length + localFilters.engineTypes.length > 0 || !!localFilters.priceRange.min || !!localFilters.priceRange.max;

  return (
    <Card className="shadow-soft lg:sticky lg:top-24 border-gray-100/70">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-wise/10 text-wise flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <CardTitle className="text-lg font-semibold">Filtros</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-wise hover:text-wise-dark hover:bg-wise/10"
        >
          <X className="w-4 h-4 mr-1" />
          Limpiar
        </Button>
      </CardHeader>
      
      {/* Resumen de seleccionados */}
      {hasSelections && (
        <div className="px-6 pb-2 -mt-2">
          <div className="flex flex-wrap gap-2">
            {localFilters.priceRange.min && (
              <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700">
                Min: ${localFilters.priceRange.min}
              </Badge>
            )}
            {localFilters.priceRange.max && (
              <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700">
                Max: ${localFilters.priceRange.max}
              </Badge>
            )}
            {localFilters.categories.map(cat => (
              <Badge key={`sel-cat-${cat}`} variant="wise" className="group">
                {cat}
                <button className="ml-2 opacity-80 group-hover:opacity-100" onClick={() => removeSelected('category', cat)}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {localFilters.engineTypes.map(ft => (
              <Badge key={`sel-ft-${ft}`} variant="wise" className="group">
                {ft}
                <button className="ml-2 opacity-80 group-hover:opacity-100" onClick={() => removeSelected('engine', ft)}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="h-px bg-gray-100" />

      <CardContent className="space-y-6">
        {/* Price Range */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Precio</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <input
                type="number"
                placeholder="Mínimo"
                value={localFilters.priceRange.min}
                onChange={(e) => updatePriceRange('min', e.target.value)}
                className="w-full px-3 py-2 bg-white/70 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wise focus:border-wise placeholder:text-gray-400"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col">
                <button 
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => adjustPrice('min', 'up')}
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button 
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => adjustPrice('min', 'down')}
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="relative">
              <input
                type="number"
                placeholder="Máximo"
                value={localFilters.priceRange.max}
                onChange={(e) => updatePriceRange('max', e.target.value)}
                className="w-full px-3 py-2 bg-white/70 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wise focus:border-wise placeholder:text-gray-400"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col">
                <button 
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => adjustPrice('max', 'up')}
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button 
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => adjustPrice('max', 'down')}
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        {/* Categories - Dinámicas desde la base de datos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Categoría <span className="text-gray-400">({localFilters.categories.length})</span></h3>
          </div>
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-wise"></div>
            </div>
          ) : availableCategories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((category) => {
                const selected = localFilters.categories.includes(category);
                return (
                  <Badge
                    key={category}
                    variant={selected ? 'wise' : 'outline'}
                    className={`cursor-pointer transition-colors ${selected ? 'shadow-sm' : 'hover:bg-wise/10'}`}
                    onClick={() => toggleCategory(category)}
                  >
                    {selected && <Check className="w-3 h-3 mr-1" />}
                    {category}
                  </Badge>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No hay categorías disponibles</p>
          )}
        </div>

        <div className="h-px bg-gray-100" />

        {/* Engine Types - Dinámicos desde la base de datos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Tipo de motor <span className="text-gray-400">({localFilters.engineTypes.length})</span></h3>
          </div>
          {fuelTypesLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-wise"></div>
            </div>
          ) : availableFuelTypes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {availableFuelTypes.map((fuelType) => {
                const selected = localFilters.engineTypes.includes(fuelType);
                return (
                  <Badge
                    key={fuelType}
                    variant={selected ? 'wise' : 'outline'}
                    className={`cursor-pointer transition-colors ${selected ? 'shadow-sm' : 'hover:bg-wise/10'}`}
                    onClick={() => toggleEngineType(fuelType)}
                  >
                    {selected && <Check className="w-3 h-3 mr-1" />}
                    {fuelType}
                  </Badge>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No hay tipos de motor disponibles</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
