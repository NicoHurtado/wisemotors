'use client';

import { useState } from 'react';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Brain, Filter, TrendingUp } from 'lucide-react';
import { FilterButtons } from '@/components/landing/FilterButtons';

interface HybridResultsProps {
  results: any;
  query: string;
  onFilterClick?: (newQuery: string) => void;
}

export function HybridResults({ results, query, onFilterClick }: HybridResultsProps) {
  const [showMore, setShowMore] = useState(false);
  const [sortBy, setSortBy] = useState<'affinity' | 'price-low' | 'price-high' | 'year-new'>('affinity');
  
  const topRecommendations = results.top_recommendations?.vehicles || [];
  const moreOptions = results.all_matches?.vehicles || [];
  const filtersApplied = results.all_matches?.filters_applied || [];
  
  // Sort more options based on selected criteria
  const sortedMoreOptions = [...moreOptions].sort((a, b) => {
    switch (sortBy) {
      case 'affinity':
        return (b.affinity || 0) - (a.affinity || 0);
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'year-new':
        return b.year - a.year;
      default:
        return 0;
    }
  });

  const getMedalStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white';
      case 2:
        return 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-800';
      case 3:
        return 'bg-gradient-to-r from-orange-300 to-orange-500 text-white';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* Query Type Indicator */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <Badge variant="secondary" className="text-sm px-4 py-2">
          <Filter className="w-4 h-4 mr-2" />
          Filtrado específico
        </Badge>
        <Badge variant="secondary" className="text-sm px-4 py-2">
          <Brain className="w-4 h-4 mr-2" />
          Ranking por IA
        </Badge>
      </div>

      {/* Applied Filters */}
      {filtersApplied.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-blue-900">Filtros aplicados:</span>
            {filtersApplied.map((filter, index) => (
              <Badge key={index} variant="outline" className="text-xs border-blue-300 text-blue-700">
                {filter}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Top 3 Recommendations */}
      {topRecommendations.length > 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Top 3 Recomendaciones</h2>
            <p className="text-gray-600">
              Los mejores entre {results.total_matches} vehículos que cumplen tus criterios
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topRecommendations.map((vehicle: any, index: number) => (
              <div key={vehicle.id} className="relative">
                {/* Rank Badge */}
                <div className={`absolute -top-3 left-4 z-10 px-3 py-1 rounded-full text-sm font-bold shadow-lg ${getMedalStyle(index + 1)}`}>
                  #{index + 1}
                </div>
                
                {/* Affinity Badge */}
                <div className="absolute -top-3 right-4 z-10 px-3 py-1 rounded-full text-sm font-bold bg-wise text-white shadow-lg">
                  {vehicle.affinity}% match
                </div>

                <div className="pt-6">
                  <VehicleCard
                    vehicle={vehicle}
                    onExplore={(id) => window.location.href = `/vehicles/${id}`}
                    showAffinity={true}
                    affinityScore={vehicle.affinity}
                    reasons={vehicle.reasons}
                  />
                </div>
              </div>
            ))}
          </div>
        
          {/* Filter Buttons dentro de los resultados */}
          {onFilterClick && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600 mb-4">¿Quieres refinar tu búsqueda?</p>
              </div>
              <FilterButtons currentQuery={query} onFilterClick={onFilterClick} />
            </div>
          )}
        </div>
      )}

      {/* More Options Section */}
      {moreOptions.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-wise" />
              Más opciones ({moreOptions.length})
            </h3>
            
            <div className="flex items-center gap-4">
              {/* Sort Options */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
              >
                <option value="affinity">Por afinidad</option>
                <option value="price-low">Precio: Menor a mayor</option>
                <option value="price-high">Precio: Mayor a menor</option>
                <option value="year-new">Año: Más nuevo</option>
              </select>

              <Button
                variant="outline"
                onClick={() => setShowMore(!showMore)}
                className="flex items-center gap-2"
              >
                {showMore ? (
                  <>
                    Mostrar menos
                    <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Ver todas
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {showMore && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedMoreOptions.map((vehicle: any) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onExplore={(id) => window.location.href = `/vehicles/${id}`}
                  showAffinity={true}
                  affinityScore={vehicle.affinity}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results Summary */}
      <div className="text-center text-sm text-gray-500 border-t pt-4">
        <p>
          {results.total_matches} vehículos encontrados y analizados • 
          Procesado en {results.processing_time_ms}ms • 
          Confianza: {Math.round(results.confidence * 100)}%
        </p>
      </div>
    </div>
  );
}