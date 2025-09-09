'use client';

import { useState } from 'react';
import { Car, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice, getFuelLabel } from '@/lib/utils';
import { VehicleCard } from '@/lib/types';
import { VehicleComparisonModal } from './VehicleComparisonModal';

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
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [selectedVehicleToCompare, setSelectedVehicleToCompare] = useState<VehicleCard | null>(null);

  const handleCompareClick = (vehicle: VehicleCard) => {
    if (currentVehicle) {
      setSelectedVehicleToCompare(vehicle);
      setIsComparisonModalOpen(true);
    }
  };

  if (!vehicles || vehicles.length === 0) {
    return null;
  }

  return (
    <div className="bg-white py-16">
      <div className="w-full max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center mb-8">
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
        </div>
        
        {/* Vehicle Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white rounded-2xl shadow-soft overflow-hidden hover:shadow-soft transition-shadow duration-300"
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
                
                {!currentVehicle && (
                  <p className="text-xs text-gray-500 text-center mt-2">
                    💡 Solo disponible desde la página de detalles
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
  );
}
