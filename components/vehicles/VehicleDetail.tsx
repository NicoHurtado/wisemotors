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

        {/* Section 3: Detailed Specifications - Organized by Sections */}
        <section className="mb-16">
          <div className="max-w-7xl mx-auto">
            {/* WiseMetrics - Destacado al inicio */}
            <div className="mb-12">
              <VehicleMetrics metrics={vehicle.wisemetrics} />
            </div>

            {/* Título de Especificaciones Técnicas */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Especificaciones Técnicas
              </h2>
              <p className="text-gray-600">Toda la información detallada del vehículo</p>
            </div>

            {/* Mosaico de Especificaciones Técnicas */}
            <div className="columns-1 md:columns-3 gap-4">
              {/* Tarjetas Fijadas primero */}
              {pinnedCards.has('sec-identificacion') && (
                <SpecificationCard
                  id="sec-identificacion-pinned"
                  title="Identificación"
                  icon={FileText}
                  colorScheme={{
                    bgFrom: "from-blue-50",
                    bgTo: "to-blue-100",
                    iconBgFrom: "from-blue-500",
                    iconBgTo: "to-blue-600",
                    circleBg: "bg-blue-500/10"
                  }}
                  fields={[
                    { label: "Año modelo", value: identification.añoModelo },
                    { label: "Carrocería", value: identification.carrocería },
                    { label: "Versión/Trim", value: identification.versionTrim },
                  ]}
                  isPinned={true}
                  onPin={() => togglePin('sec-identificacion')}
                />
              )}

              {/* Sección 1: Identificación y Básicos */}
              {!pinnedCards.has('sec-identificacion') && (
                <SpecificationCard
                  id="sec-identificacion"
                  title="Identificación"
                  icon={FileText}
                  colorScheme={{
                    bgFrom: "from-blue-50",
                    bgTo: "to-blue-100",
                    iconBgFrom: "from-blue-500",
                    iconBgTo: "to-blue-600",
                    circleBg: "bg-blue-500/10"
                  }}
                  fields={[
                    { label: "Año modelo", value: identification.añoModelo },
                    { label: "Carrocería", value: identification.carrocería },
                    { label: "Versión/Trim", value: identification.versionTrim },
                  ]}
                  isPinned={false}
                  onPin={() => togglePin('sec-identificacion')}
                />
              )}

              {/* Sección 2: Motorización */}
              {isElectric && (
                <SpecificationCard
                  id="sec-powertrain"
                  title="Motorización Eléctrica"
                  icon={Zap}
                  colorScheme={{
                    bgFrom: "from-green-50",
                    bgTo: "to-emerald-100",
                    iconBgFrom: "from-green-500",
                    iconBgTo: "to-emerald-600",
                    circleBg: "bg-green-500/10"
                  }}
                  fields={[
                    { label: "Potencia Máxima (EV)", value: powertrain.potenciaMaxEV, formatter: (v) => v ? `${v} kW` : undefined },
                    { label: "Torque Máximo (EV)", value: powertrain.torqueMaxEV, formatter: (v) => v ? `${v} Nm` : undefined },
                    { label: "Capacidad de Batería", value: battery.capacidadBrutaBateria, formatter: (v) => v ? `${v} kWh` : undefined },
                  ]}
                />
              )}

              {isHybrid && !isElectric && (
                <SpecificationCard
                  id="sec-powertrain"
                  title="Motorización Híbrida"
                  icon={Battery}
                  colorScheme={{
                    bgFrom: "from-emerald-50",
                    bgTo: "to-teal-100",
                    iconBgFrom: "from-emerald-500",
                    iconBgTo: "to-teal-600",
                    circleBg: "bg-emerald-500/10"
                  }}
                  fields={[
                    { label: "Alimentación", value: powertrain.alimentacion },
                    { label: "Arquitectura motor térmico", value: powertrain.arquitecturaMotorTermico },
                    { label: "Cilindrada", value: powertrain.cilindrada, formatter: (v) => v ? `${v} L` : undefined },
                    { label: "Número de cilindros", value: powertrain.numeroCilindros },
                    { label: "Combustible", value: powertrain.combustible },
                    { label: "Octanaje recomendado", value: powertrain.octanajeRecomendado, formatter: (v) => v ? `${v} RON` : undefined },
                    { label: "Potencia máx. (motor térmico)", value: powertrain.potenciaMaxMotorTermico, formatter: (v) => v ? `${v} kW` : undefined },
                    { label: "Potencia máx. (sistema híbrido)", value: powertrain.potenciaMaxSistemaHibrido, formatter: (v) => v ? `${v} kW` : undefined },
                    { label: "Torque máx. (motor térmico)", value: powertrain.torqueMaxMotorTermico, formatter: (v) => v ? `${v} Nm` : undefined },
                    { label: "Torque máx. (sistema híbrido)", value: powertrain.torqueMaxSistemaHibrido, formatter: (v) => v ? `${v} Nm` : undefined },
                    { label: "Launch control", value: powertrain.launchControl },
                    { label: "Capacidad de Batería", value: battery.capacidadBrutaBateria, formatter: (v) => v ? `${v} kWh` : undefined },
                    { label: "Regeneración (niveles)", value: battery.regeneracionNiveles },
                  ]}
                />
              )}

              {!isElectric && !isHybrid && (() => {
                // Preparar campos de potencia y torque con unidades correctas
                const potenciaMaxValue = powertrain.potenciaMaxMotorTermico || combustion.maxPower;
                const potenciaMaxUnit = powertrain.potenciaMaxMotorTermico ? 'kW' : (combustion.maxPower ? 'HP' : '');
                const potenciaMax = potenciaMaxValue ? {
                  label: "Potencia máx.",
                  value: potenciaMaxValue,
                  formatter: (v: any) => v ? `${v} ${potenciaMaxUnit}` : undefined
                } : null;

                return (
                  <SpecificationCard
                    id="sec-powertrain"
                    title="Motorización"
                    icon={Wrench}
                    colorScheme={{
                      bgFrom: "from-orange-50",
                      bgTo: "to-red-100",
                      iconBgFrom: "from-orange-500",
                      iconBgTo: "to-red-600",
                      circleBg: "bg-orange-500/10"
                    }}
                    fields={[
                      { label: "Alimentación", value: powertrain.alimentacion },
                      { label: "Arquitectura motor térmico", value: powertrain.arquitecturaMotorTermico },
                      { label: "Cilindrada", value: powertrain.cilindrada, formatter: (v: any) => v ? `${v} L` : undefined },
                      { label: "Número de cilindros", value: powertrain.numeroCilindros },
                      { label: "Combustible", value: powertrain.combustible },
                      { label: "Octanaje recomendado", value: powertrain.octanajeRecomendado, formatter: (v: any) => v ? `${v} RON` : undefined },
                      potenciaMax,
                      { label: "Torque máx.", value: powertrain.torqueMaxMotorTermico || combustion.maxTorque, formatter: (v: any) => v ? `${v} Nm` : undefined },
                      { label: "Límite de RPM", value: combustion.rpmLimit, formatter: (v: any) => v ? `${v} RPM` : undefined },
                      { label: "Potencia a RPM", value: combustion.powerAtRpm, formatter: (v: any) => v ? `${v} RPM` : undefined },
                      { label: "Relación de compresión", value: combustion.compressionRatio, formatter: (v: any) => v ? `${v}:1` : undefined },
                      { label: "Configuración del motor", value: combustion.engineConfiguration },
                      { label: "Tipo de inducción", value: combustion.inductionType },
                      { label: "Turbo", value: combustion.turbo },
                      { label: "Supercargador", value: combustion.supercharger },
                      { label: "Modo ECO", value: combustion.ecoMode },
                      { label: "Launch control", value: powertrain.launchControl },
                      { label: "Estándar de emisiones", value: combustion.emissionStandard },
                    ].filter((field): field is NonNullable<typeof field> => field !== null)}
                  />
                );
              })()}

              {/* Sección 2b: Transmisión */}
              {(hasAnyValue(transmission) || powertrain.traccion) && (
                <SpecificationCard
                  id="sec-transmission"
                  title="Transmisión"
                  icon={Settings}
                  colorScheme={{
                    bgFrom: "from-indigo-50",
                    bgTo: "to-blue-100",
                    iconBgFrom: "from-indigo-500",
                    iconBgTo: "to-blue-600",
                    circleBg: "bg-indigo-500/10"
                  }}
                  fields={[
                    { label: "Tracción", value: transmission.traccion || powertrain.traccion },
                    { label: "Tipo de Transmisión", value: tipoTransmisionNormalizado },
                    { label: "Número de marchas", value: transmission.numeroMarchas },
                    ...(esAutomatico ? [
                      { label: "Sistema de Transmisión", value: getSistemaTransmision() },
                      { label: "Modo remolque/arrastre", value: transmission.modoRemolque },
                      { label: "Paddle shifters", value: transmission.paddleShifters },
                      { label: "Torque Vectoring", value: transmission.torqueVectoring },
                      { label: "Tracción inteligente On-Demand", value: transmission.traccionInteligenteOnDemand },
                    ] : []),
                  ]}
                />
              )}

              {/* Sección 3: Dimensiones y Capacidades */}
              <SpecificationCard
                id="sec-dimensiones"
                title="Dimensiones y Capacidades"
                icon={Ruler}
                colorScheme={{
                  bgFrom: "from-amber-50",
                  bgTo: "to-yellow-100",
                  iconBgFrom: "from-amber-500",
                  iconBgTo: "to-yellow-600",
                  circleBg: "bg-amber-500/10"
                }}
                fields={[
                  { label: "Largo", value: dimensions.length, formatter: (v) => v ? `${v} mm` : undefined },
                  { label: "Ancho (sin espejos)", value: dimensions.width, formatter: (v) => v ? `${v} mm` : undefined },
                  { label: "Alto", value: dimensions.height, formatter: (v) => v ? `${v} mm` : undefined },
                  { label: "Distancia entre ejes", value: dimensions.wheelbase, formatter: (v) => v ? `${v} mm` : undefined },
                  { label: "Radio de giro", value: dimensions.turningRadius, formatter: (v) => v ? `${v} m` : undefined },
                  { label: "Peso en orden de marcha", value: dimensions.curbWeight, formatter: (v) => v ? `${v} kg` : undefined },
                  { label: "Plazas", value: identification.plazas },
                  { label: "Puertas", value: identification.puertas },
                  { label: "Carga útil (payload)", value: weight.payload, formatter: (v) => v ? `${v} kg` : undefined },
                  { label: "Capacidad de baúl (máxima)", value: dimensions.cargoCapacity, formatter: (v) => v ? `${v} L` : undefined },
                  { label: "Capacidad de baúl (mínima)", value: dimensions.cargoCapacityMin, formatter: (v) => v ? `${v} L` : undefined },
                  { label: "Capacidad de techo/barras", value: dimensions.roofCapacity, formatter: (v) => v ? `${v} kg` : undefined },
                ]}
              />

              {/* Sección 4: Consumo y Eficiencia */}
              <SpecificationCard
                id="sec-consumo"
                title="Consumo y Eficiencia"
                icon={isElectric ? Zap : Fuel}
                colorScheme={{
                  bgFrom: "from-teal-50",
                  bgTo: "to-emerald-100",
                  iconBgFrom: "from-teal-500",
                  iconBgTo: "to-emerald-600",
                  circleBg: "bg-teal-500/10"
                }}
                fields={[
                  { label: "Consumo Mixto", value: efficiency.consumoMixto, formatter: (v) => v ? `${v} ${isElectric ? 'kWh/100km' : 'L/100km'}` : undefined },
                  { label: "Autonomía oficial", value: efficiency.autonomiaOficial, formatter: (v) => v ? `${v} km` : undefined },
                  { label: "Capacidad de tanque", value: efficiency.capacidadTanque, formatter: (v) => v ? `${v} L` : undefined },
                  { label: "KMGe combinado", value: efficiency.mpgeCombinado, formatter: (v) => v ? `${v} KMGe` : undefined },
                  { label: "Ahorro a 3 años", value: efficiency.ahorro5Anos, formatter: (v) => v ? `$${new Intl.NumberFormat('es-CO').format(v)}` : undefined },
                  { label: "Costo de energía por 100 km", value: efficiency.costoEnergia100km, formatter: (v) => v ? `$${new Intl.NumberFormat('es-CO').format(v)}` : undefined },
                  { label: "Motor autostop", value: efficiency.motorAutostop },
                ]}
              />

              {/* Sección 5: Prestaciones */}
              <SpecificationCard
                id="sec-prestaciones"
                title="Prestaciones"
                icon={Gauge}
                colorScheme={{
                  bgFrom: "from-rose-50",
                  bgTo: "to-pink-100",
                  iconBgFrom: "from-rose-500",
                  iconBgTo: "to-pink-600",
                  circleBg: "bg-rose-500/10"
                }}
                fields={[
                  { label: "0-100 km/h", value: performance.acceleration0to100 || performance.acceleration0100, formatter: (v) => v ? `${v} s` : undefined },
                  { label: "0-200 km/h", value: performance.acceleration0to200, formatter: (v) => v ? `${v} s` : undefined },
                  { label: "1/4 de milla", value: performance.quarterMile, formatter: (v) => v ? `${v} s` : undefined },
                  { label: "50-80 km/h", value: performance.acceleration50to80, formatter: (v) => v ? `${v} s` : undefined },
                  { label: "80-120 km/h", value: performance.overtaking80to120, formatter: (v) => v ? `${v} s` : undefined },
                  { label: "Velocidad máxima", value: performance.topSpeed || performance.maxSpeed, formatter: (v) => v ? `${v} km/h` : undefined },
                  { label: "Relación peso/potencia", value: performance.powerToWeight, formatter: (v) => v ? `${v} HP/ton` : undefined },
                  { label: "Aceleración lateral máxima", value: performance.maxLateralAcceleration, formatter: (v) => v ? `${v} g` : undefined },
                  { label: "Aceleración longitudinal máxima", value: performance.maxLongitudinalAcceleration, formatter: (v) => v ? `${v} g` : undefined },
                  { label: "Frenado 160-0 km/h", value: performance.brakingDistance100to0, formatter: (v) => v ? `${v} m` : undefined },
                  { label: "Launch control", value: performance.launchControl },
                ]}
              />

              {/* Sección 6: Seguridad */}
              <SpecificationCard
                id="sec-seguridad"
                title="Seguridad"
                icon={Shield}
                colorScheme={{
                  bgFrom: "from-red-50",
                  bgTo: "to-orange-100",
                  iconBgFrom: "from-red-500",
                  iconBgTo: "to-orange-600",
                  circleBg: "bg-red-500/10"
                }}
                fields={[
                  { label: "Número total de airbags", value: safety.airbags },
                  { label: "ISOFIX y Top Tether", value: safety.isofixTopTether },
                  { label: "Agencia que certifica", value: safety.agenciaCertifica },
                  ...(safety.agenciaCertifica && safety.agenciaCertifica !== 'Ninguna' ? [
                    { label: "Puntaje de agencia", value: safety.puntajeAgencia, formatter: (v) => v ? String(v) : undefined }
                  ] : []),
                ]}
              />

              {/* Sección 7: ADAS */}
              {hasAnyValue(adas) && (
                <SpecificationCard
                  id="sec-adas"
                  title="Sistemas de Asistencia (ADAS)"
                  icon={Car}
                  colorScheme={{
                    bgFrom: "from-indigo-50",
                    bgTo: "to-violet-100",
                    iconBgFrom: "from-indigo-500",
                    iconBgTo: "to-violet-600",
                    circleBg: "bg-indigo-500/10"
                  }}
                  fields={[
                    { label: "ACC (crucero adaptativo)", value: adas.acc || adas.adaptiveCruiseControl },
                    { label: "AEB (frenado autónomo)", value: adas.aeb },
                    { label: "BSM (punto ciego)", value: adas.bsm || adas.blindSpotMonitoring },
                    { label: "Cámara 360°", value: adas.camara360 },
                    { label: "Faros adaptativos (ADB)", value: adas.farosAdaptativos },
                    { label: "LKA (asistente carril)", value: adas.lka || adas.laneKeepingAssist },
                    { label: "Luces altas automáticas", value: adas.lucesAltasAutomaticas },
                    { label: "Parqueado Autónomo", value: adas.parkAssist },
                    { label: "Sensores estacionamiento delantero", value: adas.sensoresEstacionamientoDelantero },
                  ]}
                />
              )}

              {/* Sección 8: Batería y Carga (solo para eléctricos/híbridos) */}
              {(isElectric || isHybrid) && (
                <SpecificationCard
                  id="sec-bateria"
                  title="Batería y Carga"
                  icon={BatteryCharging}
                  colorScheme={{
                    bgFrom: "from-green-50",
                    bgTo: "to-emerald-100",
                    iconBgFrom: "from-green-500",
                    iconBgTo: "to-emerald-600",
                    circleBg: "bg-green-500/10"
                  }}
                  fields={
                    // Para híbridos, solo mostrar capacidad de batería y regeneración
                    isHybrid && !isElectric ? [
                      { label: "Capacidad bruta batería (kWh)", value: battery.capacidadBrutaBateria, formatter: (v) => v ? `${v} kWh` : undefined },
                      { label: "Regeneración (niveles)", value: battery.regeneracionNiveles, formatter: (v) => v !== undefined && v !== null ? String(v) : undefined },
                    ] : [
                      // Para eléctricos, mostrar todos los campos
                      { label: "Capacidad bruta batería", value: battery.capacidadBrutaBateria, formatter: (v) => v ? `${v} kWh` : undefined },
                      { label: "Cargador a bordo (OBC) AC", value: battery.cargadorOBCAC, formatter: (v) => v ? `${v} kW` : undefined },
                      { label: "Tipo de entrada", value: battery.tipoEntrada },
                      { label: "Conducción One-Pedal", value: battery.conduccionOnePedal, formatter: (v) => v === true ? "Sí" : v === false ? "No" : undefined },
                      { label: "Regeneración (niveles)", value: battery.regeneracionNiveles, formatter: (v) => v !== undefined && v !== null ? String(v) : undefined },
                      { label: "Tiempo 20-80% AC 110V (Enchufe doméstico)", value: battery.tiempo2080AC110V, formatter: (v) => v ? `${v} min` : undefined },
                      { label: "Tiempo 20-80% AC 7KW (Instalación doméstica)", value: battery.tiempo2080AC7KW, formatter: (v) => v ? `${v} min` : undefined },
                      { label: "Tiempo 20-80% AC 22KW (Cargador empresarial)", value: battery.tiempo2080AC22KW, formatter: (v) => v ? `${v} min` : undefined },
                      { label: "Tiempo 20-80% DC 50KW (Carga rápida)", value: battery.tiempo2080DC50KW, formatter: (v) => v ? `${v} min` : undefined },
                      { label: "Tiempo 20-80% DC 150KW (Carga ultrarápida)", value: battery.tiempo2080DC150KW, formatter: (v) => v ? `${v} min` : undefined },
                      { label: "Carga bidireccional", value: battery.v2hV2g, formatter: (v) => v === true ? "Sí" : v === false ? "No" : undefined },
                      { label: "Potencia Carga bidireccional", value: battery.potenciaV2hV2g, formatter: (v) => v ? `${v} kW` : undefined },
                    ]
                  }
                />
              )}

              {/* Sección 9: Chasis, Frenos y Dirección */}
              {hasAnyValue(chassis) && (
                <SpecificationCard
                  id="sec-chasis"
                  title="Chasis, Frenos y Dirección"
                  icon={Cog}
                  colorScheme={{
                    bgFrom: "from-gray-50",
                    bgTo: "to-slate-100",
                    iconBgFrom: "from-gray-500",
                    iconBgTo: "to-slate-600",
                    circleBg: "bg-gray-500/10"
                  }}
                  fields={[
                    { label: "Amortiguación adaptativa", value: chassis.amortiguacionAdaptativa },
                    { label: "Tipos de freno", value: chassis.materialDiscos },
                    { label: "Suspensión delantera", value: chassis.suspensionDelantera },
                    { label: "Suspensión trasera", value: chassis.suspensionTrasera },
                    { label: "Tipo de pistones de freno", value: chassis.tipoPinzasFreno },
                    { label: "Despeje al suelo", value: chassis.groundClearance, formatter: (v) => v ? `${v} mm` : undefined },
                  ]}
                />
              )}

              {/* Sección 10: Off-road y 4x4 */}
              {(offRoad.esOffroad || offRoad.controlDescenso || offRoad.controlTraccionOffRoad ||
                offRoad.cajaTransferenciaLow || offRoad.ganchosArrastre || offRoad.modosTerreno ||
                offRoad.pendienteMaximaSuperable || offRoad.profundidadVadeo || offRoad.anguloAtaque ||
                offRoad.anguloSalida || offRoad.anguloVentral) && (
                  <SpecificationCard
                    id="sec-offroad"
                    title="Off-road y 4x4"
                    icon={Mountain}
                    colorScheme={{
                      bgFrom: "from-orange-50",
                      bgTo: "to-amber-100",
                      iconBgFrom: "from-orange-500",
                      iconBgTo: "to-amber-600",
                      circleBg: "bg-orange-500/10"
                    }}
                    fields={[
                      { label: "Vehículo Off-road", value: offRoad.esOffroad },
                      { label: "Control de descenso", value: offRoad.controlDescenso },
                      { label: "Control de tracción off-road", value: offRoad.controlTraccionOffRoad },
                      { label: "Caja de transferencia (low)", value: offRoad.cajaTransferenciaLow, formatter: (v) => v ? `ratio ${v}` : undefined },
                      { label: "Ganchos de arrastre", value: offRoad.ganchosArrastre, formatter: (v) => v ? `${v} puntos de anclaje` : undefined },
                      { label: "Modos de terreno", value: offRoad.modosTerreno },
                      { label: "Pendiente máxima superable", value: offRoad.pendienteMaximaSuperable, formatter: (v) => v ? `${v}%` : undefined },
                      { label: "Profundidad de vadeo", value: offRoad.profundidadVadeo, formatter: (v) => v ? `${v} mm` : undefined },
                      { label: "Ángulo de ataque", value: offRoad.anguloAtaque, formatter: (v) => v ? `${v}°` : undefined },
                      { label: "Ángulo de salida", value: offRoad.anguloSalida, formatter: (v) => v ? `${v}°` : undefined },
                      { label: "Ángulo ventral (quiebre)", value: offRoad.anguloVentral, formatter: (v) => v ? `${v}°` : undefined },
                    ]}
                  />
                )}

              {/* Sección 11: Iluminación */}
              {hasAnyValue(lighting) && (
                <SpecificationCard
                  id="sec-iluminacion"
                  title="Iluminación y Visibilidad"
                  icon={Lightbulb}
                  colorScheme={{
                    bgFrom: "from-yellow-50",
                    bgTo: "to-amber-100",
                    iconBgFrom: "from-yellow-500",
                    iconBgTo: "to-amber-600",
                    circleBg: "bg-yellow-500/10"
                  }}
                  fields={[
                    { label: "Antiniebla delantero", value: lighting.antinieblaDelantero },
                    { label: "Faros (tecnología)", value: lighting.headlightType },
                    { label: "Intermitentes dinámicos", value: lighting.intermitentesDinamicos },
                    { label: "Lavafaros", value: lighting.lavafaros },
                  ]}
                />
              )}

              {/* Sección 12: Conectividad e Infoentretenimiento */}
              {hasAnyValue(infotainment) && (
                <SpecificationCard
                  id="sec-infotainment"
                  title="Conectividad e Infoentretenimiento"
                  icon={Smartphone}
                  colorScheme={{
                    bgFrom: "from-sky-50",
                    bgTo: "to-cyan-100",
                    iconBgFrom: "from-sky-500",
                    iconBgTo: "to-cyan-600",
                    circleBg: "bg-sky-500/10"
                  }}
                  fields={[
                    { label: "Pantalla central", value: infotainment.screenSize || infotainment.pantallaCentralTamano, formatter: (v) => v ? `${v}"` : undefined },
                    { label: "Pantalla de cuadro", value: infotainment.pantallaCuadroTamano, formatter: (v) => v ? `${v} in` : undefined },
                    { label: "Android Auto", value: infotainment.androidAuto },
                    { label: "Apple CarPlay", value: infotainment.appleCarplay || infotainment.appleCarPlay },
                    { label: "Bluetooth", value: infotainment.bluetooth },
                    { label: "Wi-Fi a bordo", value: infotainment.wifiBordo },
                    { label: "App remota / OTA", value: infotainment.appRemotaOTA },
                    { label: "Navegación integrada", value: infotainment.navegacionIntegrada },
                    { label: "Cargador inalámbrico", value: infotainment.cargadorInalambrico },
                    { label: "Audio (marca)", value: infotainment.audioMarca },
                    { label: "Audio (número de bocinas)", value: infotainment.audioNumeroBocinas },
                    { label: "Potencia de amplificador", value: infotainment.potenciaAmplificador },
                    { label: "Puertos USB-A", value: infotainment.puertosUSBA },
                    { label: "Puertos USB-C", value: infotainment.puertosUSBC },
                  ]}
                />
              )}

              {/* Sección 13: Confort e Interior */}
              {hasAnyValue(comfort) && (
                <SpecificationCard
                  id="sec-confort"
                  title="Confort e Interior"
                  icon={Armchair}
                  colorScheme={{
                    bgFrom: "from-violet-50",
                    bgTo: "to-purple-100",
                    iconBgFrom: "from-violet-500",
                    iconBgTo: "to-purple-600",
                    circleBg: "bg-violet-500/10"
                  }}
                  fields={[
                    {
                      label: "Ajuste eléctrico conductor", value: comfort.ajusteElectricoConductor, formatter: (v) => {
                        if (typeof v === 'boolean') return v ? 'Sí' : 'No';
                        if (typeof v === 'number') return v > 0 ? 'Sí' : 'No';
                        return undefined;
                      }
                    },
                    {
                      label: "Ajuste eléctrico pasajero", value: comfort.ajusteElectricoPasajero, formatter: (v) => {
                        if (typeof v === 'boolean') return v ? 'Sí' : 'No';
                        if (typeof v === 'number') return v > 0 ? 'Sí' : 'No';
                        return undefined;
                      }
                    },
                    { label: "Calefacción de asientos", value: comfort.calefaccionAsientos || comfort.heatedSeats },
                    { label: "Ventilación de asientos", value: comfort.ventilacionAsientos },
                    { label: "Masaje en asientos", value: comfort.masajeAsientos },
                    { label: "Memoria de asientos", value: comfort.memoriaAsientos },
                    { label: "Material de asientos", value: comfort.materialAsientos },
                    { label: "Climatizador (zonas)", value: comfort.climatizadorZonas },
                    { label: "Aire acondicionado", value: comfort.airConditioning },
                    { label: "Cristales acústicos", value: comfort.cristalesAcusticos },
                    { label: "Parabrisas calefactable", value: comfort.parabrisasCalefactable },
                    { label: "Iluminación ambiental", value: comfort.iluminacionAmbiental },
                    { label: "Techo panorámico", value: comfort.techoPanoramico || comfort.sunroof },
                    { label: "Segunda fila corrediza", value: comfort.segundaFilaCorrediza },
                    { label: "Tercera fila de asientos", value: comfort.terceraFilaAsientos },
                    { label: "Vidrios automáticos", value: comfort.vidriosElectricos },
                    { label: "Espejo interior electrocrómico", value: comfort.espejoInteriorElectrocromico },
                    { label: "Volante (material y ajustes)", value: comfort.volanteMaterialAjustes },
                    { label: "Volante calefactable", value: comfort.volanteCalefactable },
                    { label: "Cantidad de tomas 12V", value: comfort.tomas12V },
                    { label: "Cantidad de tomas 120V", value: comfort.tomas120V },
                    { label: "Tomacorriente en caja", value: comfort.tomacorrienteEnCaja },
                    { label: "Tecnología Keyless", value: comfort.startStop || powertrain.startStop },
                    { label: "Modos de conducción", value: comfort.modosConduccion || powertrain.modosConduccion },
                    { label: "Sensor de lluvia", value: comfort.sensorLluvia || lighting.sensorLluvia },
                  ]}
                />
              )}

              {/* Sección 13: Información Comercial */}
              {hasAnyValue(commercial) && (
                <SpecificationCard
                  id="sec-comercial"
                  title="Información Comercial"
                  icon={DollarSign}
                  colorScheme={{
                    bgFrom: "from-amber-50",
                    bgTo: "to-yellow-100",
                    iconBgFrom: "from-amber-500",
                    iconBgTo: "to-yellow-600",
                    circleBg: "bg-amber-500/10"
                  }}
                  fields={[
                    { label: "Precio de lista", value: commercial.precioLista, formatter: (v) => v && v > 0 ? `$${new Intl.NumberFormat('es-CO').format(v)}` : undefined },
                    { label: "Garantía vehículo", value: commercial.garantiaVehiculo },
                    { label: "Garantía batería", value: commercial.garantiaBateria },
                    { label: "Asistencia en carretera", value: commercial.asistenciaCarretera, formatter: (v) => v && v > 0 ? `${v} años` : undefined },
                    { label: "Intervalo de mantenimiento", value: commercial.intervaloMantenimiento },
                    { label: "Costo mantenimiento (3 primeros)", value: commercial.costoMantenimiento3Primeros, formatter: (v) => v && v > 0 ? `$${new Intl.NumberFormat('es-CO').format(v)}` : undefined },
                    { label: "Financiación (cuota estimada) 12 meses", value: commercial.financiacionCuotaEstimada12Meses, formatter: (v) => v && v > 0 ? `$${new Intl.NumberFormat('es-CO').format(v)}` : undefined },
                    { label: "Financiación (cuota estimada) 36 meses", value: commercial.financiacionCuotaEstimada36Meses, formatter: (v) => v && v > 0 ? `$${new Intl.NumberFormat('es-CO').format(v)}` : undefined },
                    { label: "Financiación (cuota estimada) 72 meses", value: commercial.financiacionCuotaEstimada72Meses, formatter: (v) => v && v > 0 ? `$${new Intl.NumberFormat('es-CO').format(v)}` : undefined },
                    { label: "Origen (país/planta)", value: commercial.origenPaisPlanta },
                  ]}
                />
              )}
            </div>
          </div>
        </section>

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
