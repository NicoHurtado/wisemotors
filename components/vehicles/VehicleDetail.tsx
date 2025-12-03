'use client';

import { useState, useEffect } from 'react';
import { VehicleHero } from './VehicleHero';
import { VehicleSpecifications } from './VehicleSpecifications';
import { VehicleMetrics } from './VehicleMetrics';
import { VehicleGallery } from './VehicleGallery';
import { SimilarVehicles } from './SimilarVehicles';
import { ScrollToTop } from '@/components/ui/ScrollToTop';
import { VideoModal } from '@/components/ui/VideoModal';
import { useWhatsAppLeads } from '@/hooks/useWhatsAppLeads';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { VehicleSpecsBento } from './VehicleSpecsBento';
import {
  ChevronDown,
  FileText,
  Zap,
  Battery,
  Wrench,
  Settings,
  Ruler,
  Fuel,
  Gauge,
  Shield,
  Car,
  BatteryCharging,
  Cog,
  Mountain,
  Lightbulb,
  Smartphone,
  Armchair,
  DollarSign,
  Pin,
  type LucideIcon
} from 'lucide-react';

interface VehicleDetailProps {
  vehicle: any; // Using any for now due to complex type
}

// Tipos para las tarjetas
interface SpecificationCardProps {
  title: string;
  icon: LucideIcon;
  colorScheme: {
    bgFrom: string; // Tailwind class like "from-blue-50"
    bgTo: string;   // Tailwind class like "to-blue-100"
    iconBgFrom: string; // Tailwind class like "from-blue-500"
    iconBgTo: string;   // Tailwind class like "to-blue-600"
    circleBg: string;   // Tailwind class like "bg-blue-500/10"
  };
  fields: Array<{
    label: string;
    value: string | number | boolean | undefined | null;
    formatter?: (val: any) => string | undefined;
  }>;
  id?: string;
  defaultExpanded?: boolean;
  isPinned?: boolean; // Added for pin functionality
  onPin?: () => void; // Added for pin functionality
}

// Componente reutilizable para tarjetas de especificaciones - Diseño simplificado con pin
function SpecificationCard({ title, icon: Icon, colorScheme, fields, id, defaultExpanded = false, isPinned, onPin }: SpecificationCardProps) {
  const [isHighlighted, setIsHighlighted] = useState(false);

  // Filtrar campos que tienen valores válidos y procesar formatters
  type ProcessedField = {
    label: string;
    displayValue: string;
  };

  const validFields: ProcessedField[] = fields
    .map(field => {
      const val = field.value;
      // Si el campo no tiene valor válido, excluirlo
      if (val === undefined || val === null || val === '' || val === false) {
        return null;
      }

      // Si tiene formatter, verificar que devuelva un valor válido
      if (field.formatter) {
        const formatted = field.formatter(val);
        if (formatted === undefined || formatted === null) {
          return null;
        }
        return { label: field.label, displayValue: formatted };
      }

      // Sin formatter, usar el valor directamente
      return {
        label: field.label,
        displayValue: typeof val === 'boolean'
          ? (val ? '✓ Sí' : '✗ No')
          : String(val)
      };
    })
    .filter((field): field is ProcessedField => field !== null);

  // Si no hay campos válidos, no renderizar la tarjeta
  if (validFields.length === 0) return null;

  // Escuchar eventos de highlight
  useEffect(() => {
    if (!id) return;

    const handleHighlight = (event: CustomEvent) => {
      console.log('Highlight event received:', event.detail.sectionId, 'Current card id:', id);
      if (event.detail.sectionId === id) {
        console.log('Match! Highlighting card:', id);
        setIsHighlighted(true);
        // Remover la clase después de la animación
        setTimeout(() => {
          setIsHighlighted(false);
        }, 2000); // Duración de la animación
      }
    };

    window.addEventListener('highlightSpecCard', handleHighlight as EventListener);
    return () => {
      window.removeEventListener('highlightSpecCard', handleHighlight as EventListener);
    };
  }, [id]);

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPin) {
      onPin();
    }
  };

  // Todos los colores en morado WiseMotors (color wise: #881cb7)
  const wiseColor = '#881cb7'; // Color principal wise
  const wiseColorLight = '#a855f7'; // wise.light
  const wiseColorDark = '#6b21a8'; // wise.dark
  const purpleColors = {
    border: wiseColor,
    borderLight: wiseColorLight,
    borderDark: wiseColorDark,
    bgLight: 'rgba(136, 28, 183, 0.05)', // wise con 5% opacidad
    bgDark: 'rgba(136, 28, 183, 0.1)', // wise con 10% opacidad
    iconGradient: `linear-gradient(135deg, ${wiseColor} 0%, ${wiseColorDark} 100%)`,
    shadow: `0 4px 6px -1px rgba(136, 28, 183, 0.2), 0 2px 4px -1px rgba(136, 28, 183, 0.1)`,
    shadowHover: `0 10px 15px -3px rgba(136, 28, 183, 0.3), 0 4px 6px -2px rgba(136, 28, 183, 0.2)`,
  };

  return (
    <div
      id={id}
      className={`w-full bg-white rounded-xl border-2 ${isPinned ? 'border-wise' : ''} transition-all duration-200 mb-4 break-inside-avoid relative overflow-hidden group ${isHighlighted ? 'highlight-animation' : ''}`}
      style={{
        borderColor: isPinned ? '#8B5CF6' : purpleColors.border,
        borderLeftWidth: '6px',
        boxShadow: isPinned
          ? purpleColors.shadowHover
          : purpleColors.shadow,
      }}
      onMouseEnter={(e) => {
        if (!isPinned) {
          e.currentTarget.style.boxShadow = purpleColors.shadowHover;
          e.currentTarget.style.borderColor = purpleColors.borderDark;
        }
      }}
      onMouseLeave={(e) => {
        if (!isPinned) {
          e.currentTarget.style.boxShadow = purpleColors.shadow;
          e.currentTarget.style.borderColor = purpleColors.border;
        }
      }}
    >
      {/* Efecto de brillo sutil (metalizado) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${purpleColors.bgLight} 0%, ${purpleColors.bgDark} 50%, ${purpleColors.bgLight} 100%)`
        }}
      ></div>

      {/* Borde interno con gradiente para efecto metalizado */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: `linear-gradient(135deg, rgba(136, 28, 183, 0.05) 0%, transparent 50%, rgba(136, 28, 183, 0.03) 100%)`,
          border: '1px solid rgba(136, 28, 183, 0.1)',
        }}
      ></div>

      {/* Animación de brillo metálico en morado */}
      {isHighlighted && (
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl"
          style={{ zIndex: 20 }}
        >
          <div
            className="shine-overlay"
            style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: `linear-gradient(45deg, transparent 30%, rgba(136, 28, 183, 0.6) 50%, transparent 70%)`,
              animation: 'shine 2s ease-in-out',
            }}
          ></div>
        </div>
      )}

      <div className="p-5 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center flex-1 gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md"
              style={{
                background: purpleColors.iconGradient,
                boxShadow: '0 2px 8px rgba(136, 28, 183, 0.3)'
              }}
            >
              <Icon className="text-white" strokeWidth={2} size={24} />
            </div>
            <div className="flex items-center gap-2">
              <h3 className={`text-base font-semibold ${isPinned ? 'text-wise' : 'text-gray-900'}`}>{title}</h3>
              {isPinned && (
                <span className="px-2 py-0.5 bg-wise/10 text-wise text-xs font-medium rounded">
                  Fijada
                </span>
              )}
            </div>
          </div>
          {onPin && (
            <button
              onClick={handlePinClick}
              className={`p-1.5 rounded-lg transition-colors ${isPinned
                ? 'bg-wise text-white hover:bg-wise-dark'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              title={isPinned ? 'Desfijar' : 'Fijar'}
            >
              <Pin className="w-4 h-4" fill={isPinned ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>

        {/* Content - Always visible, vertical layout */}
        <div className="space-y-3 pt-3 border-t border-gray-200">
          {validFields.map((field, index) => (
            <div key={index} className="flex flex-col">
              <span className="text-gray-600 text-xs mb-1 font-medium">{field.label}</span>
              <span className="font-semibold text-gray-900 text-sm">{field.displayValue}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function VehicleDetail({ vehicle }: VehicleDetailProps) {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const { createLead } = useWhatsAppLeads();
  const { user } = useAuth();

  // Estado para tarjetas fijadas - persistido en localStorage
  const [pinnedCards, setPinnedCards] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`pinnedCards_${vehicle.id}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });

  // Guardar en localStorage cuando cambie
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`pinnedCards_${vehicle.id}`, JSON.stringify(Array.from(pinnedCards)));
    }
  }, [pinnedCards, vehicle.id]);

  // Función para fijar/desfijar tarjeta
  const togglePin = (cardId: string) => {
    setPinnedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  // Utilidad: verifica si un objeto tiene al menos un valor significativo
  const hasAnyValue = (obj: any) => {
    if (!obj || typeof obj !== 'object') return false;
    return Object.values(obj).some((v) => v !== undefined && v !== null && v !== '' && v !== false);
  };

  // Preparar datos para las tarjetas de especificaciones
  const specs = vehicle.specifications || {};
  const powertrain = specs.powertrain || {};
  const combustion = specs.combustion || {}; // Campos adicionales de combustión (RPM, etc.)
  const transmission = specs.transmission || {};
  const battery = specs.battery || {};
  const dimensions = specs.dimensions || {};
  const efficiency = specs.efficiency || {};
  const performance = specs.performance || {};
  const safety = specs.safety || {};
  const adas = specs.adas || {};
  const infotainment = specs.infotainment || {};
  const comfort = specs.comfort || {};
  const lighting = specs.lighting || {};
  const chassis = specs.chassis || {};
  const identification = specs.identification || {};
  const commercial = specs.commercial || {};
  const offRoad = specs.offRoad || {};
  const weight = specs.weight || {};
  const interior = specs.interior || {};

  // Obtener fuelType de múltiples fuentes posibles
  const fuelTypeRaw = vehicle.fuelType || powertrain.combustible || '';
  const fuelTypeStr = String(fuelTypeRaw || '').trim();
  const fuelTypeLower = fuelTypeStr.toLowerCase();

  // Detectar eléctricos
  const isElectric = fuelTypeLower.includes('eléctrico') ||
    fuelTypeLower.includes('electric') ||
    fuelTypeStr === 'Eléctrico';

  // Detectar híbridos: DEBE funcionar para "Híbrido" y "Híbrido Enchufable"
  // Verificar de todas las formas posibles
  const isHybrid = fuelTypeLower.includes('híbrido') ||
    fuelTypeLower.includes('hybrid') ||
    fuelTypeStr === 'Híbrido' ||
    fuelTypeStr === 'Híbrido Enchufable' ||
    fuelTypeLower === 'híbrido' ||
    fuelTypeLower === 'híbrido enchufable';

  // Debug temporal - remover después de verificar
  console.log('🔍 DEBUG Batería y Carga:', {
    fuelTypeRaw,
    fuelTypeStr,
    fuelTypeLower,
    isElectric,
    isHybrid,
    shouldShow: isElectric || isHybrid,
    vehicleFuelType: vehicle.fuelType,
    powertrainCombustible: powertrain.combustible
  });

  // Helper para convertir valores antiguos de transmisión a nuevos
  const getTipoTransmision = () => {
    const tipo = transmission.tipoTransmision;
    if (!tipo) return undefined;
    if (tipo === 'Manual' || tipo === 'Automático') return tipo;
    if (tipo === 'MT') return 'Manual';
    if (['AT', 'CVT', 'DCT', 'AMT'].includes(tipo)) return 'Automático';
    return tipo;
  };

  const getSistemaTransmision = () => {
    if (transmission.sistemaTransmision) return transmission.sistemaTransmision;
    const tipo = transmission.tipoTransmision;
    if (tipo === 'AT') return 'Convertidor de torque';
    if (tipo === 'DCT') return 'DualClutch';
    if (tipo === 'CVT') return 'CVT';
    if (tipo === 'AMT') return 'AMT';
    return undefined;
  };

  const tipoTransmisionNormalizado = getTipoTransmision();
  const esAutomatico = tipoTransmisionNormalizado === 'Automático';

  return (
    <div className="min-h-screen relative">
      {/* Hero Section */}
      <VehicleHero
        vehicle={vehicle}
        onVideoClick={() => setIsVideoModalOpen(true)}
      />

      {/* Gallery Section - Just below Hero */}
      <section className="w-full px-4 py-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <VehicleGallery vehicle={vehicle} />
        </div>
      </section>

      {/* Main Content */}
      <div className="w-full px-4 py-8">

        {/* Section 1: Main Content - Specifications and Dealerships */}
        <section className="mb-16">
          <div className="max-w-7xl mx-auto">
            <VehicleSpecifications
              vehicle={vehicle}
              onVideoClick={() => setIsVideoModalOpen(true)}
            />
          </div>
        </section>

        {/* Section 2: Home Delivery Button */}
        <section className="mb-16">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-12">
              {/* Test Drive Button */}
              <div className="flex justify-center">
                <Button
                  onClick={async () => {
                    const getEffectiveUserName = (): string | null => {
                      if (user?.username) return user.username;
                      const name = window.prompt('Para continuar, por favor ingresa tu nombre');
                      if (name === null) return null; // cancel
                      const trimmed = name.trim();
                      return trimmed.length > 0 ? trimmed : 'Cliente';
                    };

                    const name = getEffectiveUserName();
                    if (!name) return; // user cancelled

                    const vehicleLabel = `${vehicle.brand || ''} ${vehicle.model || ''}`.trim();
                    const message = `Hola, me interesa el vehículo ${vehicleLabel}. Mi nombre es ${name} y quiero agendar un testdrive.`;

                    // Crear el lead en la base de datos
                    try {
                      await createLead({
                        name,
                        username: user?.username || undefined,
                        email: user?.email || undefined,
                        vehicleId: vehicle.id,
                        vehicleBrand: vehicle.brand,
                        vehicleModel: vehicle.model,
                        message,
                        source: 'home_delivery'
                      });
                    } catch (error) {
                      console.error('Error creating WhatsApp lead:', error);
                      // Continuar con WhatsApp aunque falle el guardado del lead
                    }

                    const encoded = encodeURIComponent(message);
                    const url = `https://wa.me/573103818615?text=${encoded}`;
                    window.open(url, '_blank');
                  }}
                  variant="wise"
                  size="lg"
                  className="px-8 py-6 text-lg font-semibold shadow-soft"
                >
                  Agendar testdrive
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Bento Grid Specifications */}
        <VehicleSpecsBento vehicle={vehicle} />

        {/* Test Drive Button */}
        <section className="mb-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center">
              <button
                onClick={async () => {
                  const getEffectiveUserName = (): string | null => {
                    // Try to get user from auth context if available, otherwise prompt
                    const name = window.prompt('Para continuar, por favor ingresa tu nombre');
                    if (name === null) return null; // cancel
                    const trimmed = name.trim();
                    return trimmed.length > 0 ? trimmed : 'Cliente';
                  };

                  const name = getEffectiveUserName();
                  if (!name) return; // user cancelled

                  const vehicleLabel = `${vehicle.brand || ''} ${vehicle.model || ''}`.trim();
                  const message = `Hola, me interesa el vehículo ${vehicleLabel}. Mi nombre es ${name} y quiero agendar un test drive.`;

                  try {
                    await createLead({
                      name,
                      username: user?.username || undefined,
                      email: user?.email || undefined,
                      vehicleId: vehicle.id,
                      vehicleBrand: vehicle.brand,
                      vehicleModel: vehicle.model,
                      message,
                      source: 'home_delivery'
                    });
                  } catch (error) {
                    console.error('Error creating WhatsApp lead:', error);
                    // Continuar con WhatsApp aunque falle el guardado del lead
                  }

                  const encoded = encodeURIComponent(message);
                  const url = `https://wa.me/573103818615?text=${encoded}`;
                  window.open(url, '_blank');
                }}
                className="px-6 py-3 bg-wise text-white rounded-lg hover:bg-wise-dark transition-colors text-base font-medium shadow-soft"
              >
                Agendar test drive
              </button>
            </div>
          </div>
        </section>



        {/* Section 8: Similar Vehicles */}
        <section className="mb-16">
          <div className="max-w-7xl mx-auto">
            <SimilarVehicles
              vehicles={vehicle.similarVehicles || []}
              currentVehicle={{
                id: vehicle.id,
                brand: vehicle.brand,
                model: vehicle.model,
                year: vehicle.year,
                price: vehicle.price,
                fuelType: vehicle.fuelType || vehicle.specifications?.general?.fuelType,
                type: vehicle.type || vehicle.vehicleType || vehicle.specifications?.general?.vehicleType,
                specifications: vehicle.specifications
              }}
            />
          </div>
        </section>
      </div>

      {/* Scroll to top button */}
      <ScrollToTop />

      {/* Video Modal */}
      {vehicle.reviewVideoUrl && (
        <VideoModal
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          videoUrl={vehicle.reviewVideoUrl}
          vehicleTitle={`${vehicle.brand} ${vehicle.model}`}
        />
      )}
    </div>
  );
}
