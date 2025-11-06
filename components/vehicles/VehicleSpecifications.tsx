'use client';

import { Heart, Zap, Car, Clock, BookOpen, MapPin, Play } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useWhatsAppLeads } from '@/hooks/useWhatsAppLeads';

interface VehicleSpecificationsProps {
  vehicle: any;
  onVideoClick?: () => void;
}

export function VehicleSpecifications({ vehicle, onVideoClick }: VehicleSpecificationsProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite, loading: favoriteLoading } = useFavorites();
  const { createLead } = useWhatsAppLeads();

  const handleFavoriteClick = async () => {
    if (!user) {
      // Redirigir al login si no está autenticado
      router.push('/login');
      return;
    }

    try {
      await toggleFavorite(vehicle.id);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Aquí podrías mostrar un toast de error
    }
  };

  // WhatsApp helpers
  const WHATSAPP_PHONE = '573103818615';

  const buildWhatsAppUrl = (message: string) => {
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${WHATSAPP_PHONE}?text=${encoded}`;
  };

  const getEffectiveUserName = (): string | null => {
    if (user?.username) return user.username;
    const name = window.prompt('Para continuar, por favor ingresa tu nombre');
    if (name === null) return null; // cancel
    const trimmed = name.trim();
    return trimmed.length > 0 ? trimmed : 'Cliente';
  };

  const handleContactDealership = async (dealership?: { name: string; location?: string; id?: string }) => {
    const name = getEffectiveUserName();
    if (!name) return; // user cancelled
    
    const vehicleLabel = `${vehicle.brand || ''} ${vehicle.model || ''}`.trim();
    let message = '';
    let source = 'website';
    
    if (dealership) {
      const locationSuffix = dealership.location ? ` (${dealership.location})` : '';
      message = `Hola, me interesa el vehículo ${vehicleLabel}. Mi nombre es ${name} y quiero atención en el concesionario ${dealership.name}${locationSuffix}.`;
      source = 'specific_dealership';
    } else {
      message = `Hola, me interesa el vehículo ${vehicleLabel}. Mi nombre es ${name} y no tengo preferencia de concesionario, ayúdame a escoger uno.`;
    }

    // Crear el lead en la base de datos
    try {
      await createLead({
        name,
        username: user?.username || undefined,
        email: user?.email || undefined,
        vehicleId: vehicle.id,
        vehicleBrand: vehicle.brand,
        vehicleModel: vehicle.model,
        dealershipId: dealership?.id || undefined,
        dealershipName: dealership?.name || undefined,
        message,
        source
      });
    } catch (error) {
      console.error('Error creating WhatsApp lead:', error);
      // Continuar con WhatsApp aunque falle el guardado del lead
    }

    const url = buildWhatsAppUrl(message);
    window.open(url, '_blank');
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Price and Specifications */}
        <div className="lg:col-span-2">
          {/* Price and Favorite Button */}
          <div className="flex items-center justify-between mb-8">
            <div className="text-4xl font-bold text-gray-900">
              {formatPrice(vehicle.price)}
            </div>
            <button 
              onClick={handleFavoriteClick}
              disabled={favoriteLoading}
              className="w-12 h-12 bg-white rounded-full shadow-soft flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={isFavorite(vehicle.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
              <Heart 
                className={`w-6 h-6 transition-colors ${
                  isFavorite(vehicle.id) ? 'fill-wise text-wise' : 'text-gray-600'
                }`}
              />
            </button>
          </div>
          
          {/* Vehicle Specifications - Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Brand Row */}
            <div className="flex items-center p-4 bg-white rounded-2xl border border-gray-200">
              <div className="w-12 h-12 bg-wise/20 rounded-full flex items-center justify-center mr-4">
                <BookOpen className="w-6 h-6 text-wise" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-600">Marca</div>
                <div className="text-lg font-semibold text-gray-900">{vehicle.brand || 'N/A'}</div>
              </div>
            </div>
            
            {/* Vehicle Type Row */}
            <div className="flex items-center p-4 bg-white rounded-2xl border border-gray-200">
              <div className="w-12 h-12 bg-wise/20 rounded-full flex items-center justify-center mr-4">
                <Car className="w-6 h-6 text-wise" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-600">Tipo de vehículo</div>
                <div className="text-lg font-semibold text-gray-900">{vehicle.vehicleType || vehicle.type || 'N/A'}</div>
              </div>
            </div>
            
            {/* Year Row */}
            <div className="flex items-center p-4 bg-white rounded-2xl border border-gray-200">
              <div className="w-12 h-12 bg-wise/20 rounded-full flex items-center justify-center mr-4">
                <Clock className="w-6 h-6 text-wise" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-600">Año</div>
                <div className="text-lg font-semibold text-gray-900">{vehicle.year || 'N/A'}</div>
              </div>
            </div>
            
            {/* Engine Row */}
            <div className="flex items-center p-4 bg-white rounded-2xl border border-gray-200">
              <div className="w-12 h-12 bg-wise/20 rounded-full flex items-center justify-center mr-4">
                <Zap className="w-6 h-6 text-wise" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-600">Motor</div>
                <div className="text-lg font-semibold text-gray-900">
                  {(() => {
                    // Intentar obtener información del motor desde diferentes fuentes
                    const powertrain = vehicle.specifications?.powertrain;
                    const fuelType = vehicle.fuelType || vehicle.specifications?.powertrain?.combustible;
                    
                    // Para vehículos eléctricos
                    if (fuelType?.toLowerCase().includes('eléctrico') || fuelType?.toLowerCase().includes('electric')) {
                      const batteryCapacity = vehicle.specifications?.battery?.capacidadBrutaBateria || 
                                             vehicle.specifications?.electric?.batteryCapacity;
                      return batteryCapacity ? `${batteryCapacity} kWh` : fuelType || 'N/A';
                    }
                    
                    // Para vehículos híbridos
                    if (fuelType?.toLowerCase().includes('híbrido') || fuelType?.toLowerCase().includes('hybrid')) {
                      const displacement = powertrain?.cilindrada || 
                                          vehicle.specifications?.hybrid?.displacement ||
                                          vehicle.specifications?.phev?.displacement;
                      const systemPower = powertrain?.potenciaMaxSistemaHibrido || 
                                         powertrain?.potenciaMaxMotorTermico;
                      if (displacement) {
                        return `${displacement}L ${systemPower ? `${systemPower}kW` : ''}`.trim();
                      }
                      return fuelType || 'N/A';
                    }
                    
                    // Para vehículos de combustión
                    const displacement = powertrain?.cilindrada || 
                                        vehicle.specifications?.combustion?.displacement;
                    const power = powertrain?.potenciaMaxMotorTermico || 
                                 vehicle.specifications?.combustion?.maxPower;
                    if (displacement) {
                      return `${displacement}L ${power ? `${power}kW` : ''}`.trim();
                    }
                    
                    // Fallback: mostrar tipo de combustible
                    return fuelType || powertrain?.combustible || 'N/A';
                  })()}
                </div>
              </div>
            </div>

            {/* Video Review Button */}
            {vehicle.reviewVideoUrl && onVideoClick && (
              <div className="md:col-span-2 flex justify-center">
                <button 
                  onClick={onVideoClick}
                  className="flex items-center p-3 bg-white rounded-2xl border border-wise/30 hover:border-wise hover:bg-wise/5 transition-all duration-300 group w-fit"
                  aria-label="Ver video review"
                >
                  <div className="w-10 h-10 bg-wise/20 rounded-full flex items-center justify-center mr-3 group-hover:bg-wise/30 transition-colors">
                    <Play className="w-5 h-5 text-wise fill-wise" />
                  </div>
                  <div className="text-left">
                    <div className="text-base font-semibold text-wise">Video Review</div>
                  </div>
                  <div className="text-wise opacity-70 group-hover:opacity-100 transition-opacity text-sm ml-3">
                    Ver ahora →
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column - Dealerships */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-soft p-6 sticky top-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Disponible en:
            </h3>
            <div className="space-y-4">
              {vehicle.dealerships?.map((dealership: any) => (
                <div key={dealership.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-wise rounded-full flex items-center justify-center mr-3">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{dealership.name}</p>
                      <p className="text-sm text-gray-600">{dealership.location}</p>
                    </div>
                  </div>
                  <button
                    className="px-4 py-2 bg-wise text-white rounded-lg hover:bg-wise-dark transition-colors text-sm"
                    onClick={() => handleContactDealership({ 
                      name: dealership.name, 
                      location: dealership.location,
                      id: dealership.id 
                    })}
                  >
                    Agendar aquí
                  </button>
                </div>
              ))}
              <button
                className="w-full px-4 py-2 bg-wise/10 text-wise border border-wise/30 rounded-lg hover:bg-wise/20 transition-colors text-sm"
                onClick={() => handleContactDealership(undefined)}
              >
                Cualquier concesionario
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
