'use client';

import { useState } from 'react';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Brain, TrendingUp } from 'lucide-react';
import { FilterButtons } from '@/components/landing/FilterButtons';
import { PodiumResults } from './PodiumResults';

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

  return (
    <div className="w-full space-y-8">
      {/* Top 3: podio con jerarquía real (el #1 no es una tarjeta más) */}
      <div className="space-y-6">
        {results.top_recommendations?.fallback_applied && (
          <div className="mx-auto max-w-2xl rounded-2xl bg-blue-50 p-3 ring-1 ring-blue-200">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Recomendaciones ampliadas:</span>{' '}
              incluimos vehículos que coinciden parcialmente con tus preferencias para darte más opciones.
            </p>
          </div>
        )}

        <PodiumResults
          vehicles={topRecommendations}
          subtitulo={`De ${results.total_matches} vehículos analizados, estos tres son los que mejor se adaptan a lo que buscas.`}
        />

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
                {paginatedOptions.map((vehicle: any, index: number) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    onExplore={(id) => window.location.href = `/vehicles/${id}`}
                    showAffinity={true}
                    affinityScore={vehicle.matchPercentage}
                    index={index}
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
