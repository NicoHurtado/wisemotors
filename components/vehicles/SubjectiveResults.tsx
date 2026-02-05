'use client';

import { useState } from 'react';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Brain, TrendingUp } from 'lucide-react';
import { FilterButtons } from '@/components/landing/FilterButtons';

interface SubjectiveResultsProps {
  results: any;
  query: string;
  onFilterClick?: (newQuery: string) => void;
}

export function SubjectiveResults({ results, query, onFilterClick }: SubjectiveResultsProps) {
  const [showMore, setShowMore] = useState(true); // Mostrar desplegado por defecto
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 3 filas x 3 columnas

  const topRecommendations = results.top_recommendations?.vehicles || [];
  const moreOptions = results.all_matches?.vehicles || [];

  // Paginación para más opciones
  const totalPages = Math.ceil(moreOptions.length / itemsPerPage);
  const paginatedOptions = moreOptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
      {/* Top 3 Recommendations with Podium Style */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Top 3 Recomendaciones</h2>
          <p className="text-gray-600">Los vehículos que mejor se adaptan a lo que buscas</p>

          {/* Mensaje de fallback aplicado */}
          {results.top_recommendations?.fallback_applied && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-2xl mx-auto">
              <p className="text-sm text-blue-800">
                <span className="font-medium">🎯 Recomendaciones ampliadas:</span> {' '}
                Hemos incluido vehículos que pueden coincidir parcialmente con tus preferencias para darte más opciones.
              </p>
            </div>
          )}
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
                {vehicle.matchPercentage}% match
              </div>

              <div className="pt-6">
                <VehicleCard
                  vehicle={vehicle}
                  onExplore={(id) => window.location.href = `/vehicles/${id}`}
                  showAffinity={true}
                  affinityScore={vehicle.matchPercentage}
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

      {/* More Options Section */}
      {moreOptions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-wise" />
              Más opciones ({moreOptions.length})
            </h3>
            <Button
              variant="outline"
              onClick={() => setShowMore(!showMore)}
              className="flex items-center gap-2"
            >
              {showMore ? (
                <>
                  Ocultar opciones
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Ver más opciones
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>

          {showMore && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedOptions.map((vehicle: any) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    onExplore={(id) => window.location.href = `/vehicles/${id}`}
                    showAffinity={true}
                    affinityScore={vehicle.matchPercentage}
                  />
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={page === currentPage ? "wise" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Results Summary */}
      <div className="text-center text-sm text-gray-500 border-t pt-4">
        <p>
          {results.total_matches} vehículos analizados •
          Procesado en {results.processing_time_ms}ms •
          Confianza: {Math.round(results.confidence * 100)}%
        </p>
      </div>
    </div>
  );
}
