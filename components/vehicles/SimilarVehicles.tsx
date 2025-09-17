'use client';

import { useState } from 'react';
import { Car, BarChart3, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice, getFuelLabel } from '@/lib/utils';
import { VehicleCard } from '@/lib/types';
import { VehicleComparisonModal } from './VehicleComparisonModal';
import { useRouter } from 'next/navigation';

interface SimilarVehiclesProps {
  vehicles: VehicleCard[];
  currentVehicle?: {
    id: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    fuelType: string;
    type: string;
    specifications: any;
  };
}

export function SimilarVehicles({ vehicles, currentVehicle }: SimilarVehiclesProps) {
  const router = useRouter();
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [selectedVehicleToCompare, setSelectedVehicleToCompare] = useState<VehicleCard | null>(null);
  const [scrollIndex, setScrollIndex] = useState(0);

  const handleCompareClick = (vehicle: VehicleCard) => {
    if (currentVehicle) {
      setSelectedVehicleToCompare(vehicle);
      setIsComparisonModalOpen(true);
    }
  };

  const handleExploreClick = (vehicleId: string) => {
    router.push(`/vehicles/${vehicleId}`);
  };

  const canScrollLeft = scrollIndex > 0;
  const canScrollRight = scrollIndex < vehicles.length - 4;

  const scrollLeft = () => {
    if (canScrollLeft) {
      setScrollIndex(scrollIndex - 1);
    }
  };

  const scrollRight = () => {
    if (canScrollRight) {
      setScrollIndex(scrollIndex + 1);
    }
  };

  if (!vehicles || vehicles.length === 0) {
    return null;
  }

  const visibleVehicles = vehicles.slice(scrollIndex, scrollIndex + 4);

  return (
    <>
      {/* Estilos CSS personalizados para animaciones */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(168, 85, 247, 0);
          }
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s infinite;
        }
      `}</style>
      
      <div className="bg-white py-16">
        <div className="w-full max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="flex items-center mr-4">
              <div className="w-8 h-8 bg-wise rounded-full flex items-center justify-center mr-3">
                <Car className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Vehículos Similares
              </h2>
            </div>
            
            <Badge variant="wise" className="text-sm">
              {vehicles[0]?.category || 'Deportivo'}
            </Badge>
            
            {/* Debug info - temporal */}
            <Badge variant="outline" className="text-xs ml-2">
              {vehicles.length} encontrados
            </Badge>
          </div>

          {/* Navigation Controls - diseño premium con animaciones */}
          <div className="flex items-center gap-4">
            {/* Flecha Izquierda */}
            <button
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className={`
                relative group
                w-12 h-12 rounded-full 
                flex items-center justify-center
                transition-all duration-300 ease-in-out
                ${canScrollLeft 
                  ? 'bg-gradient-to-r from-wise to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-110 cursor-pointer' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
                border-2 border-transparent
                ${canScrollLeft ? 'hover:border-white/20' : ''}
              `}
            >
              <ChevronLeft className={`w-6 h-6 transition-transform duration-200 ${canScrollLeft ? 'group-hover:-translate-x-0.5' : ''}`} />
              
              {/* Glow effect */}
              {canScrollLeft && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-wise to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"></div>
              )}
            </button>

            {/* Contador con diseño elegante */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-200">
              <span className="text-sm font-medium text-gray-700">
                {scrollIndex + 1}-{Math.min(scrollIndex + 4, vehicles.length)}
              </span>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <span className="text-sm text-gray-500">
                {vehicles.length}
              </span>
            </div>

            {/* Flecha Derecha */}
            <button
              onClick={scrollRight}
              disabled={!canScrollRight}
              className={`
                relative group
                w-12 h-12 rounded-full 
                flex items-center justify-center
                transition-all duration-300 ease-in-out
                ${canScrollRight 
                  ? 'bg-gradient-to-r from-wise to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-110 cursor-pointer' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
                border-2 border-transparent
                ${canScrollRight ? 'hover:border-white/20' : ''}
              `}
            >
              <ChevronRight className={`w-6 h-6 transition-transform duration-200 ${canScrollRight ? 'group-hover:translate-x-0.5' : ''}`} />
              
              {/* Glow effect */}
              {canScrollRight && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-wise to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"></div>
              )}
            </button>
          </div>
        </div>
        
        {/* Vehicle Grid con animaciones */}
        <div 
          key={scrollIndex} 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {visibleVehicles.map((vehicle, index) => (
            <div
              key={`${vehicle.id}-${scrollIndex}`}
              className="bg-white rounded-2xl shadow-soft overflow-hidden hover:shadow-soft transition-all duration-500 transform hover:-translate-y-1 animate-fade-in group"
              style={{
                animationDelay: `${index * 150}ms`,
                animationFillMode: 'both'
              }}
            >
              {/* Image */}
              {(() => {
                // Buscar imagen miniatura, si no existe usar la primera de galería, NO la portada
                const thumbnailImage = vehicle.images?.find((img: any) => img.isThumbnail)?.url ||
                                      vehicle.images?.find((img: any) => img.type === 'gallery')?.url ||
                                      vehicle.imageUrl;
                
                return thumbnailImage ? (
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={thumbnailImage}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-gradient-to-br from-wise/5 to-wise/10 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-wise/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Car className="w-8 h-8 text-wise" />
                      </div>
                      <p className="text-gray-500 text-sm">Sin imagen</p>
                    </div>
                  </div>
                );
              })()}
              
              {/* Vehicle Details */}
              <div className="p-6 space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">
                  {vehicle.brand} {vehicle.model}
                </h3>
                
                <p className="text-gray-600">
                  {vehicle.year} • {getFuelLabel(vehicle.fuel)}
                </p>
                
                <div className="text-2xl font-bold text-wise">
                  {formatPrice(vehicle.price)}
                </div>
                
                <div className="space-y-2">
                  <Button 
                    variant={currentVehicle ? "wise" : "outline"}
                    className={`w-full ${!currentVehicle ? 'opacity-50 cursor-not-allowed' : ''}`}
                    size="lg"
                    onClick={() => handleCompareClick(vehicle)}
                    disabled={!currentVehicle}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Comparar
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="w-full border-wise text-wise hover:bg-wise hover:text-white"
                    size="lg"
                    onClick={() => handleExploreClick(vehicle.id)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Explorar vehículo
                  </Button>
                </div>
                
                {!currentVehicle && (
                  <p className="text-xs text-gray-500 text-center mt-2">
                    💡 Comparación solo disponible desde página de detalles
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Comparación */}
      {currentVehicle && selectedVehicleToCompare && (
        <VehicleComparisonModal
          isOpen={isComparisonModalOpen}
          onClose={() => setIsComparisonModalOpen(false)}
          currentVehicle={currentVehicle}
          compareVehicle={{
            id: selectedVehicleToCompare.id,
            brand: selectedVehicleToCompare.brand,
            model: selectedVehicleToCompare.model,
            year: selectedVehicleToCompare.year,
            price: selectedVehicleToCompare.price,
            fuelType: selectedVehicleToCompare.fuel,
            type: selectedVehicleToCompare.type || 'Sedán',
            specifications: selectedVehicleToCompare.specifications || {}
          }}
        />
      )}
      </div>
    </>
  );
}
