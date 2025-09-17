'use client';

import { useState } from 'react';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, Search } from 'lucide-react';

interface ObjectiveResultsProps {
  results: any;
  query: string;
}

export function ObjectiveResults({ results, query }: ObjectiveResultsProps) {
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'year-new' | 'year-old' | 'brand'>('price-low');
  
  const vehicles = results.all_matches?.vehicles || [];
  const filtersApplied = results.all_matches?.filters_applied || [];
  const categoryCount = results.all_matches?.count_by_category || {};
  
  // Sort vehicles based on selected option
  const sortedVehicles = [...vehicles].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'year-new':
        return b.year - a.year;
      case 'year-old':
        return a.year - b.year;
      case 'brand':
        return a.brand.localeCompare(b.brand);
      default:
        return 0;
    }
  });

  // Get category summaries for display
  const brandCounts = Object.entries(categoryCount)
    .filter(([key]) => key.startsWith('brand_'))
    .map(([key, count]) => ({ name: key.replace('brand_', ''), count }))
    .sort((a, b) => b.count - a.count);

  const typeCounts = Object.entries(categoryCount)
    .filter(([key]) => key.startsWith('type_'))
    .map(([key, count]) => ({ name: key.replace('type_', ''), count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="w-full space-y-6">
      {/* Query Type Indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <Badge variant="secondary" className="text-sm px-4 py-2">
          <Search className="w-4 h-4 mr-2" />
          Resultados de búsqueda específica
        </Badge>
      </div>

      {/* Results Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {vehicles.length} vehículos encontrados
            </h2>
            {filtersApplied.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-gray-600">Filtros aplicados:</span>
                {filtersApplied.map((filter, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    <Filter className="w-3 h-3 mr-1" />
                    {filter}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
            >
              <option value="price-low">Precio: Menor a mayor</option>
              <option value="price-high">Precio: Mayor a menor</option>
              <option value="year-new">Año: Más nuevo</option>
              <option value="year-old">Año: Más antiguo</option>
              <option value="brand">Marca: A-Z</option>
            </select>
          </div>
        </div>

        {/* Category Summary */}
        {(brandCounts.length > 0 || typeCounts.length > 0) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {brandCounts.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">Por marca: </span>
                  {brandCounts.slice(0, 5).map((brand, index) => (
                    <span key={brand.name} className="text-gray-600">
                      {index > 0 && ', '}
                      {brand.name} ({brand.count})
                    </span>
                  ))}
                  {brandCounts.length > 5 && <span className="text-gray-500"> y más...</span>}
                </div>
              )}
              {typeCounts.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">Por tipo: </span>
                  {typeCounts.map((type, index) => (
                    <span key={type.name} className="text-gray-600">
                      {index > 0 && ', '}
                      {type.name} ({type.count})
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mensaje de fallback aplicado */}
      {results.all_matches.fallback_applied && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <span className="font-medium">💡 Búsqueda ampliada:</span> {' '}
            Hemos incluido vehículos que coinciden parcialmente con tus criterios para darte más opciones.
            Los porcentajes de coincidencia aparecen en cada tarjeta.
          </p>
        </div>
      )}

      {/* Results Grid */}
      {sortedVehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedVehicles.map((vehicle: any) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onExplore={(id) => window.location.href = `/vehicles/${id}`}
              matchPercentage={vehicle.matchPercentage}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            No se encontraron vehículos con los criterios especificados
          </div>
          <Button
            variant="wise"
            onClick={() => window.location.href = '/vehicles'}
          >
            Ver todos los vehículos
          </Button>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-center text-sm text-gray-500 border-t pt-4">
        <p>
          {sortedVehicles.length} resultados • 
          Procesado en {results.processing_time_ms}ms • 
          Confianza: {Math.round(results.confidence * 100)}%
        </p>
      </div>
    </div>
  );
}
