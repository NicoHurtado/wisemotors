'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { VehicleCard as VehicleCardComponent } from '@/components/vehicle/VehicleCard';
import { VehicleCard } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { SORT_OPTIONS } from '@/lib/constants';
import { useFavorites } from '@/hooks/useFavorites';

interface VehicleListProps {
  vehicles: VehicleCard[];
  loading?: boolean;
  error?: string | null;
  sortBy?: string;
  onSortChange?: (sortBy: string) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export function VehicleList({
  vehicles,
  loading = false,
  error = null,
  sortBy: externalSortBy = 'price-high',
  onSortChange,
  hasMore = false,
  onLoadMore
}: VehicleListProps) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState(externalSortBy);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const { isFavorite } = useFavorites();

  // Sincronizar con el sortBy externo
  useEffect(() => {
    setSortBy(externalSortBy);
  }, [externalSortBy]);

  const handleExplore = (id: string) => {
    router.push(`/vehicles/${id}`);
  };

  const getSortedVehicles = () => {
    const sorted = [...vehicles];

    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-high':
        return sorted.sort((a, b) => b.price - a.price);
      default:
        return sorted;
    }
  };

  const sortedVehicles = getSortedVehicles();

  return (
    <div className="space-y-6">
      {/* Header with Title and Sorting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Explora Nuestros Vehículos
        </h1>

        {/* Sort Dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="min-w-[220px] justify-between"
          >
            Ordenar por: {SORT_OPTIONS.find(opt => opt.value === sortBy)?.label}
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>

          {showSortDropdown && (
            <div className="absolute top-full right-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    const newSortBy = option.value;
                    setSortBy(newSortBy);
                    setShowSortDropdown(false);
                    onSortChange?.(newSortBy);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${sortBy === option.value ? 'bg-wise/10 text-wise' : 'text-gray-700'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wise mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando vehículos...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12">
          <div className="text-red-500 text-lg mb-4">
            Error: {error}
          </div>
          <Button
            variant="wise"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </Button>
        </div>
      )}

      {/* Vehicle Grid */}
      {!loading && !error && sortedVehicles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedVehicles.map((vehicle) => (
            <VehicleCardComponent
              key={vehicle.id}
              vehicle={vehicle}
              onExplore={handleExplore}
            />
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && !error && sortedVehicles.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            No se encontraron vehículos con los filtros aplicados.
          </div>
          <Button
            variant="wise"
            className="mt-4"
            onClick={() => {
              // Clear all filters functionality to be implemented
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      )}

      {/* Results Count and Load More */}
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="text-sm text-gray-500">
          Mostrando {vehicles.length} vehículo{vehicles.length !== 1 ? 's' : ''}
        </div>

        {hasMore && (
          <Button
            variant="outline"
            size="lg"
            onClick={onLoadMore}
            disabled={loading}
            className="min-w-[200px] border-wise text-wise hover:bg-wise hover:text-white transition-all transform hover:scale-105 active:scale-95"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Cargando...
              </>
            ) : (
              'Cargar más vehículos'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
