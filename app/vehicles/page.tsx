'use client';

import { VehicleFilters } from '@/components/vehicles/VehicleFilters';
import { VehicleList } from '@/components/vehicles/VehicleList';
import { VehicleSearch } from '@/components/vehicles/VehicleSearch';
import { useVehicles } from '@/hooks/useVehicles';
import { useState } from 'react';

export default function VehiclesPage() {
  const [filters, setFilters] = useState({
    search: '',
    category: [] as string[],
    fuelType: [] as string[],
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    sortBy: 'relevance'
  });

  const { vehicles, loading, error } = useVehicles({
    search: filters.search || undefined,
    category: filters.category.length > 0 ? filters.category : undefined,
    fuelType: filters.fuelType.length > 0 ? filters.fuelType : undefined,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sortBy: filters.sortBy === 'relevance' ? undefined : filters.sortBy
  });

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <VehicleSearch onSearch={(search) => setFilters(prev => ({ ...prev, search }))} />
        
        <div className="flex flex-col lg:flex-row gap-8 mt-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-80">
            <VehicleFilters 
              filters={filters}
              onFiltersChange={setFilters}
            />
          </aside>
          
          {/* Vehicle Listings */}
          <main className="flex-1">
            <VehicleList 
              vehicles={vehicles} 
              loading={loading}
              error={error}
              sortBy={filters.sortBy}
              onSortChange={(sortBy) => setFilters(prev => ({ ...prev, sortBy }))}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
