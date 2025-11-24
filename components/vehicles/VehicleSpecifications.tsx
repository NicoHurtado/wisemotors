'use client';

import {
  Heart,
  Zap,
  Car,
  Clock,
  BookOpen,
  MapPin,
  Play,
  Gauge,
  GaugeCircle,
  Users,
  Fuel,
  FileText,
  Wrench,
  Ruler,
  Shield,
  Smartphone,
  Armchair,
  DollarSign,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { Liquid } from '@/components/ui/liquid-button';
import { formatPrice } from '@/lib/utils';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useWhatsAppLeads } from '@/hooks/useWhatsAppLeads';
import { useState } from 'react';

// Colores morados con intensidad media para el efecto líquido de WiseMetrics
const WISE_COLORS = {
  color1: '#FFFFFF',     // Blanco puro
  color2: '#C4B5FD',     // purple-300
  color3: '#DDD6FE',     // purple-200
  color4: '#FEFCFF',     // Casi blanco con tinte morado
  color5: '#F9F7FF',     // Blanco con tinte morado
  color6: '#D8B4FE',     // purple-300
  color7: '#A78BFA',     // purple-400
  color8: '#8B5CF6',     // purple-500
  color9: '#A78BFA',     // purple-400
  color10: '#C4B5FD',    // purple-300
  color11: '#A78BFA',    // purple-400
  color12: '#DDD6FE',    // purple-200
  color13: '#C4B5FD',    // purple-300
  color14: '#D8B4FE',    // purple-300
  color15: '#DDD6FE',    // purple-200
  color16: '#A78BFA',    // purple-400
  color17: '#C4B5FD',    // purple-300
};

// Componente especial para el botón de WiseMetrics
function WiseMetricsButton({ onClick }: { onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full h-12 group mb-2"
    >
      {/* Efecto de blur de fondo */}
      <div className="absolute w-full h-full top-0 left-0 filter blur-[8px] opacity-60">
        <span className="absolute inset-0 rounded-lg bg-purple-200"></span>
        <div className="relative w-full h-full overflow-hidden rounded-lg">
          <Liquid isHovered={isHovered} colors={WISE_COLORS} />
        </div>
      </div>

      {/* Contenedor principal del botón */}
      <div className="relative w-full h-full overflow-hidden rounded-lg">
        <span className="absolute inset-0 rounded-lg bg-white"></span>
        <Liquid isHovered={isHovered} colors={WISE_COLORS} />

        {/* Overlays para el efecto de brillo */}
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`absolute inset-0 rounded-lg border-2 border-transparent bg-gradient-to-b from-transparent to-white mix-blend-overlay filter ${i === 1 ? 'blur-[2px]' : i === 2 ? 'blur-[3px]' : 'blur-[4px]'}`}
          ></span>
        ))}

        {/* Contenido del botón */}
        <div className="absolute inset-0 flex items-center px-4 text-left">
          <BarChart3 className="w-5 h-5 mr-2 text-wise group-hover:text-purple-600 transition-colors" />
          <span className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors flex-1">
            WiseMetrics
          </span>
          <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
        </div>
      </div>
    </button>
  );
}

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

  // Función para scroll suave a secciones
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100; // Offset para el header sticky
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Price and Key Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Price and Favorite Button */}
          <div className="flex items-center justify-between bg-white rounded-2xl p-6 shadow-soft">
            <div>
              <div className="text-sm text-gray-600 mb-1">Precio</div>
              <div className="text-4xl font-bold text-gray-900">
                {formatPrice(vehicle.price)}
              </div>
            </div>
            <button
              onClick={handleFavoriteClick}
              disabled={favoriteLoading}
              className="w-14 h-14 bg-gray-50 rounded-full shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={isFavorite(vehicle.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
              <Heart
                className={`w-7 h-7 transition-colors ${isFavorite(vehicle.id) ? 'fill-wise text-wise' : 'text-gray-600'
                  }`}
              />
            </button>
          </div>

          {/* Key Specifications - Destacadas */}
          <div className="bg-white rounded-2xl p-6 shadow-soft">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Especificaciones Principales</h3>
            <div className="grid grid-cols-1 gap-4">
              {/* Marca y Modelo - Simplificado */}
              <div className="p-5 bg-white rounded-xl border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{vehicle.brand} {vehicle.model}</div>
                <div className="text-base text-gray-600 mt-1">{vehicle.year}</div>
              </div>

              {/* Tipo y Combustible */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-wise/50 transition-colors">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Categoría</div>
                    <div className="text-base font-semibold text-gray-900">{vehicle.vehicleType || vehicle.type || 'N/A'}</div>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-wise/50 transition-colors">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <Zap className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Combustible</div>
                    <div className="text-base font-semibold text-gray-900">
                      {vehicle.fuelType || vehicle.specifications?.powertrain?.combustible || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Motor Info */}
              <div className="flex items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-wise/50 transition-colors">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Motor</div>
                  <div className="text-base font-semibold text-gray-900">
                    {(() => {
                      const powertrain = vehicle.specifications?.powertrain;
                      const fuelType = vehicle.fuelType || vehicle.specifications?.powertrain?.combustible;

                      if (fuelType?.toLowerCase().includes('eléctrico') || fuelType?.toLowerCase().includes('electric')) {
                        const batteryCapacity = vehicle.specifications?.battery?.capacidadBrutaBateria;
                        return batteryCapacity ? `${batteryCapacity} kWh` : fuelType || 'N/A';
                      }

                      if (fuelType?.toLowerCase().includes('híbrido') || fuelType?.toLowerCase().includes('hybrid')) {
                        const displacement = powertrain?.cilindrada;
                        const systemPower = powertrain?.potenciaMaxSistemaHibrido || powertrain?.potenciaMaxMotorTermico;
                        if (displacement) {
                          return `${displacement}L ${systemPower ? `- ${systemPower}kW` : ''}`.trim();
                        }
                        return fuelType || 'N/A';
                      }

                      const displacement = powertrain?.cilindrada;
                      const power = powertrain?.potenciaMaxMotorTermico;
                      if (displacement) {
                        return `${displacement}L ${power ? `- ${power}kW` : ''}`.trim();
                      }

                      return fuelType || powertrain?.combustible || 'N/A';
                    })()}
                  </div>
                </div>
              </div>

              {/* Campos Adicionales - Grid de 2 columnas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Potencia */}
                {(() => {
                  const powertrain = vehicle.specifications?.powertrain;
                  const fuelType = (vehicle.fuelType || powertrain?.combustible)?.toLowerCase();
                  const isElectric = fuelType?.includes('eléctrico') || fuelType?.includes('electric');
                  const isHybrid = fuelType?.includes('híbrido') || fuelType?.includes('hybrid');

                  let powerValue = null;
                  if (isElectric) {
                    powerValue = powertrain?.potenciaMaxEV;
                  } else if (isHybrid) {
                    powerValue = powertrain?.potenciaMaxSistemaHibrido || powertrain?.potenciaMaxMotorTermico;
                  } else {
                    powerValue = powertrain?.potenciaMaxMotorTermico;
                  }

                  if (!powerValue) return null;

                  return (
                    <div className="flex items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-wise/50 transition-colors">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                        <Gauge className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Potencia</div>
                        <div className="text-base font-semibold text-gray-900">{powerValue} kW</div>
                      </div>
                    </div>
                  );
                })()}

                {/* Transmisión */}
                {(() => {
                  const transmission = vehicle.specifications?.transmission;
                  const tipo = transmission?.tipoTransmision;
                  const marchas = transmission?.numeroMarchas;

                  if (!tipo && !marchas) return null;

                  let transmissionText = tipo || '';
                  if (marchas && tipo) {
                    transmissionText += ` (${marchas}${typeof marchas === 'number' ? ' marchas' : ''})`;
                  } else if (marchas) {
                    transmissionText = `${marchas} marchas`;
                  }

                  return (
                    <div className="flex items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-wise/50 transition-colors">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                        <GaugeCircle className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Transmisión</div>
                        <div className="text-base font-semibold text-gray-900">{transmissionText || 'N/A'}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* Aceleración 0-100 km/h */}
                {(() => {
                  const performance = vehicle.specifications?.performance;
                  const acceleration = performance?.acceleration0to100 || performance?.acceleration0100;

                  if (!acceleration) return null;

                  return (
                    <div className="flex items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-wise/50 transition-colors">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                        <Zap className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Aceleración</div>
                        <div className="text-base font-semibold text-gray-900">0-100 km/h en {acceleration}s</div>
                      </div>
                    </div>
                  );
                })()}

                {/* Consumo/Autonomía */}
                {(() => {
                  const efficiency = vehicle.specifications?.efficiency;
                  const fuelType = (vehicle.fuelType || vehicle.specifications?.powertrain?.combustible)?.toLowerCase();
                  const isElectric = fuelType?.includes('eléctrico') || fuelType?.includes('electric');

                  const consumo = efficiency?.consumoMixto;
                  const autonomia = efficiency?.autonomiaOficial;

                  // Para eléctricos, mostrar autonomía; para otros, mostrar consumo
                  if (isElectric && autonomia) {
                    return (
                      <div className="flex items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-wise/50 transition-colors">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                          <Zap className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Autonomía</div>
                          <div className="text-base font-semibold text-gray-900">{autonomia} km</div>
                        </div>
                      </div>
                    );
                  }

                  if (!isElectric && consumo) {
                    return (
                      <div className="flex items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-wise/50 transition-colors">
                        <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mr-4">
                          <Fuel className="w-6 h-6 text-teal-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Consumo Mixto</div>
                          <div className="text-base font-semibold text-gray-900">{consumo} L/100km</div>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })()}

                {/* Plazas y Puertas */}
                {(() => {
                  const identification = vehicle.specifications?.identification;
                  const plazas = identification?.plazas;
                  const puertas = identification?.puertas;

                  if (!plazas && !puertas) return null;

                  let text = '';
                  if (plazas && puertas) {
                    text = `${plazas} plazas • ${puertas} puertas`;
                  } else if (plazas) {
                    text = `${plazas} plazas`;
                  } else if (puertas) {
                    text = `${puertas} puertas`;
                  }

                  return (
                    <div className="flex items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-wise/50 transition-colors">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Capacidad</div>
                        <div className="text-base font-semibold text-gray-900">{text}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* Tipo de Transmisión: Manual/Automático */}
                {(() => {
                  const transmission = vehicle.specifications?.transmission;
                  const tipo = transmission?.tipoTransmision;

                  if (!tipo) return null;

                  // Determinar si es manual o automático basado en el tipo
                  const tipoLower = tipo.toLowerCase();
                  let tipoTexto = 'N/A';
                  let iconoColor = 'bg-gray-100';
                  let iconoTextColor = 'text-gray-600';

                  if (tipoLower.includes('manual')) {
                    tipoTexto = 'Manual';
                    iconoColor = 'bg-yellow-100';
                    iconoTextColor = 'text-yellow-600';
                  } else if (tipoLower.includes('automática') || tipoLower.includes('automatica') ||
                    tipoLower.includes('automático') || tipoLower.includes('automatico') ||
                    tipoLower.includes('cvt') || tipoLower.includes('dct') ||
                    tipoLower.includes('dsg') || tipoLower.includes('tronic') ||
                    tipoLower.includes('tiptronic') || tipoLower.includes('s tronic')) {
                    tipoTexto = 'Automático';
                    iconoColor = 'bg-green-100';
                    iconoTextColor = 'text-green-600';
                  } else {
                    // Si no está claro, mostrar el tipo original
                    tipoTexto = tipo;
                  }

                  return (
                    <div className="flex items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-wise/50 transition-colors">
                      <div className={`w-12 h-12 ${iconoColor} rounded-full flex items-center justify-center mr-4`}>
                        <GaugeCircle className={`w-6 h-6 ${iconoTextColor}`} />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tipo</div>
                        <div className="text-base font-semibold text-gray-900">{tipoTexto}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Video Review Button */}
              {vehicle.reviewVideoUrl && onVideoClick && (
                <button
                  onClick={onVideoClick}
                  className="flex items-center p-5 bg-gradient-to-r from-wise/10 to-wise/20 rounded-xl border border-wise/30 hover:border-wise hover:shadow-lg transition-all duration-300 group"
                  aria-label="Ver video review"
                >
                  <div className="w-14 h-14 bg-wise rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-md">
                    <Play className="w-7 h-7 text-white fill-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-lg font-bold text-wise">Video Review</div>
                    <div className="text-sm text-gray-600">Mira el análisis completo del vehículo</div>
                  </div>
                  <div className="text-wise font-semibold group-hover:translate-x-1 transition-transform">
                    Ver →
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Dealerships */}
        <div className="lg:col-span-1">
          <div className="space-y-6 sticky top-8">
            {/* Dealerships Section */}
            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <MapPin className="w-5 h-5 text-wise mr-2" />
                Disponible en:
              </h3>
              <div className="space-y-3">
                {vehicle.dealerships?.map((dealership: any) => (
                  <div key={dealership.id} className="p-4 border border-gray-200 rounded-xl hover:border-wise/50 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start flex-1">
                        <div className="w-10 h-10 bg-wise/10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                          <MapPin className="w-5 h-5 text-wise" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">{dealership.name}</p>
                          <p className="text-sm text-gray-600">{dealership.location}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      className="w-full px-4 py-2 bg-wise text-white rounded-lg hover:bg-wise-dark transition-colors text-sm font-medium shadow-sm hover:shadow-md"
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
                  className="w-full px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl hover:border-wise hover:text-wise transition-colors text-sm font-semibold flex items-center"
                  onClick={() => handleContactDealership(undefined)}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Cualquier concesionario
                </button>
              </div>
            </div>

            {/* Quick Navigation - Vertical */}
            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Navegación Rápida</h3>
              <div className="flex flex-col gap-2">
                {/* WiseMetrics - Botón Especial con Animación */}
                <WiseMetricsButton onClick={() => {
                  // Buscar el componente WiseMetrics y hacer scroll
                  const wisemetricsSection = document.querySelector('h3')?.textContent?.includes('WiseMetrics')
                    ? document.querySelector('h3')
                    : null;

                  if (wisemetricsSection) {
                    wisemetricsSection.closest('div')?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start'
                    });
                  } else {
                    // Alternativa: buscar por el título "Especificaciones Técnicas" y subir un poco
                    const especificacionesTitle = Array.from(document.querySelectorAll('h2')).find(
                      h2 => h2.textContent?.includes('Especificaciones Técnicas')
                    );
                    if (especificacionesTitle) {
                      const parent = especificacionesTitle.parentElement?.parentElement;
                      if (parent) {
                        parent.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }
                  }
                }} />

                <button
                  onClick={() => scrollToSection('sec-identificacion')}
                  className="w-full px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg hover:border-wise hover:text-wise transition-colors text-sm font-medium text-left flex items-center"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Identificación
                </button>
                <button
                  onClick={() => scrollToSection('sec-powertrain')}
                  className="w-full px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg hover:border-wise hover:text-wise transition-colors text-sm font-medium text-left flex items-center"
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  Motor
                </button>
                <button
                  onClick={() => scrollToSection('sec-consumo')}
                  className="w-full px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg hover:border-wise hover:text-wise transition-colors text-sm font-medium text-left flex items-center"
                >
                  <Fuel className="w-4 h-4 mr-2" />
                  Consumo
                </button>
                <button
                  onClick={() => scrollToSection('sec-dimensiones')}
                  className="w-full px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg hover:border-wise hover:text-wise transition-colors text-sm font-medium text-left flex items-center"
                >
                  <Ruler className="w-4 h-4 mr-2" />
                  Dimensiones
                </button>
                <button
                  onClick={() => scrollToSection('sec-prestaciones')}
                  className="w-full px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg hover:border-wise hover:text-wise transition-colors text-sm font-medium text-left flex items-center"
                >
                  <Gauge className="w-4 h-4 mr-2" />
                  Prestaciones
                </button>
                <button
                  onClick={() => scrollToSection('sec-seguridad')}
                  className="w-full px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg hover:border-wise hover:text-wise transition-colors text-sm font-medium text-left flex items-center"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Seguridad
                </button>
                <button
                  onClick={() => scrollToSection('sec-adas')}
                  className="w-full px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg hover:border-wise hover:text-wise transition-colors text-sm font-medium text-left flex items-center"
                >
                  <Car className="w-4 h-4 mr-2" />
                  ADAS
                </button>
                <button
                  onClick={() => scrollToSection('sec-infotainment')}
                  className="w-full px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg hover:border-wise hover:text-wise transition-colors text-sm font-medium text-left flex items-center"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Conectividad
                </button>
                <button
                  onClick={() => scrollToSection('sec-confort')}
                  className="w-full px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg hover:border-wise hover:text-wise transition-colors text-sm font-medium text-left flex items-center"
                >
                  <Armchair className="w-4 h-4 mr-2" />
                  Confort
                </button>
                <button
                  onClick={() => scrollToSection('sec-comercial')}
                  className="w-full px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg hover:border-wise hover:text-wise transition-colors text-sm font-medium text-left flex items-center"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Comercial
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
