'use client';

import { useState } from 'react';
import { VehicleHero } from './VehicleHero';
import { VehicleSpecifications } from './VehicleSpecifications';
import { VehicleCategories } from './VehicleCategories';
import { VehicleMetrics } from './VehicleMetrics';
import { VehicleGallery } from './VehicleGallery';
import { SimilarVehicles } from './SimilarVehicles';
import { ScrollToTop } from '@/components/ui/ScrollToTop';
import { VideoModal } from '@/components/ui/VideoModal';
import { useWhatsAppLeads } from '@/hooks/useWhatsAppLeads';
import { useAuth } from '@/contexts/AuthContext';

interface VehicleDetailProps {
  vehicle: any; // Using any for now due to complex type
}

// Tipos para las tarjetas
interface SpecificationCardProps {
  title: string;
  icon: string;
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
}

// Componente reutilizable para tarjetas de especificaciones
function SpecificationCard({ title, icon, colorScheme, fields, id }: SpecificationCardProps) {
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

  // Determinar clases de grid según cantidad de campos (usando clases estáticas de Tailwind)
  const getGridClasses = () => {
    if (validFields.length <= 4) {
      return "grid-cols-2";
    } else if (validFields.length <= 8) {
      return "grid-cols-2 md:grid-cols-3";
    } else {
      return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
    }
  };

  return (
    <div 
      id={id}
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorScheme.bgFrom} ${colorScheme.bgTo} p-8 shadow-lg hover:shadow-2xl transition-all duration-300 w-full`}
    >
      <div className={`absolute top-0 right-0 w-48 h-48 ${colorScheme.circleBg} rounded-full -mr-24 -mt-24 opacity-50`}></div>
      <div className="relative">
        <div className="flex items-center mb-6">
          <div className={`w-16 h-16 bg-gradient-to-br ${colorScheme.iconBgFrom} ${colorScheme.iconBgTo} rounded-2xl flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 transition-transform flex-shrink-0`}>
            <span className="text-white text-3xl">{icon}</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
        </div>
        <div className={`grid ${getGridClasses()} gap-x-8 gap-y-4`}>
          {validFields.map((field, index) => (
            <div key={index} className="flex flex-col">
              <span className="text-gray-600 text-sm mb-1 font-medium">{field.label}</span>
              <span className="font-semibold text-gray-900 text-base">{field.displayValue}</span>
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


        {/* Section 2: Gallery and Categories (Full Width) */}
        <section className="mb-16">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-12">
              {/* Gallery */}
              <VehicleGallery vehicle={vehicle} />
              
              {/* Categories */}
              <VehicleCategories categories={vehicle.categories} />
              
              {/* Home Delivery Button */}
              <div className="flex justify-center">
                <button
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
                    const message = `Hola, me interesa el vehículo ${vehicleLabel}. Mi nombre es ${name} y quiero hacer el testdrive desde mi casa.`;

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
                  className="px-8 py-4 bg-wise text-white rounded-2xl hover:bg-wise-dark transition-colors text-lg font-semibold shadow-soft"
                >
                  Haz el testdrive desde tu casa
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Detailed Specifications - Organized by Sections */}
        <section className="mb-16">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Especificaciones Técnicas
              </h2>
              <p className="text-gray-600">Toda la información detallada del vehículo</p>
            </div>
            
            {/* Sección 1: Identificación y Básicos */}
            <div className="mb-8">
              <SpecificationCard
                id="sec-identificacion"
                title="Identificación"
                icon="📋"
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
              />
            </div>

            {/* Sección 2: Motorización */}
            <div className="mb-8">
              {isElectric && (
                <SpecificationCard
                  id="sec-powertrain"
                  title="Motorización Eléctrica"
                  icon="⚡"
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
                  icon="🔋"
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
                    icon="🔧"
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
            </div>

            {/* Sección 2b: Transmisión */}
            {(hasAnyValue(transmission) || powertrain.traccion) && (
              <div className="mb-8">
                <SpecificationCard
                  id="sec-transmission"
                  title="Transmisión"
                  icon="⚙️"
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
              </div>
            )}

            {/* Sección 3: Dimensiones y Capacidades */}
            <div className="mb-8">
              <SpecificationCard
                id="sec-dimensiones"
                title="Dimensiones y Capacidades"
                icon="📏"
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
            </div>

            {/* Sección 4: Consumo y Eficiencia */}
            <div className="mb-8">
              <SpecificationCard
                id="sec-consumo"
                title="Consumo y Eficiencia"
                icon={isElectric ? "⚡" : "⛽"}
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
            </div>

            {/* Sección 5: Prestaciones */}
            <div className="mb-8">
              <SpecificationCard
                id="sec-prestaciones"
                title="Prestaciones"
                icon="⚡"
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
            </div>

            {/* Sección 6: Seguridad */}
            <div className="mb-8">
              <SpecificationCard
                id="sec-seguridad"
                title="Seguridad"
                icon="🛡️"
                colorScheme={{
                  bgFrom: "from-red-50",
                  bgTo: "to-orange-100",
                  iconBgFrom: "from-red-500",
                  iconBgTo: "to-orange-600",
                  circleBg: "bg-red-500/10"
                }}
                fields={[
                  { label: "Número total de airbags", value: safety.airbags },
                  { label: "ABS", value: safety.abs },
                  { label: "ESP", value: safety.esp },
                  { label: "Euro NCAP (estrellas)", value: safety.ncapRating, formatter: (v) => v ? `${v} ⭐` : undefined },
                  { label: "Euro NCAP (Adulto %)", value: safety.adultSafetyScore, formatter: (v) => v ? `${v}%` : undefined },
                  { label: "Euro NCAP (Peatón %)", value: safety.pedestrianScore, formatter: (v) => v ? `${v}%` : undefined },
                  { label: "Euro NCAP (Asistencias %)", value: safety.assistanceScore, formatter: (v) => v ? `${v}%` : undefined },
                  { label: "Latin NCAP (estrellas)", value: safety.latinNCAPRating, formatter: (v) => v ? `${v} ⭐` : undefined },
                ]}
              />
            </div>

            {/* Sección 7: ADAS */}
            {hasAnyValue(adas) && (
              <div className="mb-8">
                <SpecificationCard
                  id="sec-adas"
                  title="Sistemas de Asistencia (ADAS)"
                  icon="🚗"
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
                    { label: "Park Assist (autónomo)", value: adas.parkAssist },
                    { label: "Sensores estacionamiento delantero", value: adas.sensoresEstacionamientoDelantero },
                  ]}
                />
              </div>
            )}

            {/* Sección 8: Batería y Carga (solo para eléctricos/híbridos) */}
            {(isElectric || isHybrid) && (
              <div className="mb-8">
                <SpecificationCard
                  id="sec-bateria"
                  title="Batería y Carga"
                  icon="🔋"
                  colorScheme={{
                    bgFrom: "from-green-50",
                    bgTo: "to-emerald-100",
                    iconBgFrom: "from-green-500",
                    iconBgTo: "to-emerald-600",
                    circleBg: "bg-green-500/10"
                  }}
                  fields={[
                    { label: "Capacidad bruta batería", value: battery.capacidadBrutaBateria, formatter: (v) => v ? `${v} kWh` : undefined },
                    { label: "Cargador a bordo (OBC) AC", value: battery.cargadorOBCAC, formatter: (v) => v ? `${v} kW` : undefined },
                    { label: "Conducción One-Pedal", value: battery.conduccionOnePedal },
                    { label: "High Power Charging times", value: battery.highPowerChargingTimes },
                    { label: "Regeneración (niveles)", value: battery.regeneracionNiveles },
                    { label: "Tiempo 0-100% (AC)", value: battery.tiempo0100AC, formatter: (v) => v ? `${v} h` : undefined },
                    { label: "Tiempo 10-80% (DC)", value: battery.tiempo1080DC, formatter: (v) => v ? `${v} min` : undefined },
                    { label: "V2H/V2G (bidireccional)", value: battery.v2hV2g },
                    { label: "V2H/V2G Potencia", value: battery.potenciaV2hV2g, formatter: (v) => v ? `${v} kW` : undefined },
                  ]}
                />
              </div>
            )}

            {/* Sección 9: Chasis, Frenos y Dirección */}
            {hasAnyValue(chassis) && (
              <div className="mb-8">
                <SpecificationCard
                  id="sec-chasis"
                  title="Chasis, Frenos y Dirección"
                  icon="🔧"
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
                    { label: "Control de descenso", value: offRoad.controlDescenso },
                    { label: "Control de tracción off-road", value: offRoad.controlTraccionOffRoad },
                  ]}
                />
              </div>
            )}

            {/* Sección 10: Iluminación */}
            {hasAnyValue(lighting) && (
              <div className="mb-8">
                <SpecificationCard
                  id="sec-iluminacion"
                  title="Iluminación y Visibilidad"
                  icon="💡"
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
              </div>
            )}

            {/* Sección 11: Conectividad e Infoentretenimiento */}
            {hasAnyValue(infotainment) && (
              <div className="mb-8">
                <SpecificationCard
                  id="sec-infotainment"
                  title="Conectividad e Infoentretenimiento"
                  icon="📱"
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
              </div>
            )}

            {/* Sección 12: Confort e Interior */}
            {hasAnyValue(comfort) && (
              <div className="mb-8">
                <SpecificationCard
                  id="sec-confort"
                  title="Confort e Interior"
                  icon="🛋️"
                  colorScheme={{
                    bgFrom: "from-violet-50",
                    bgTo: "to-purple-100",
                    iconBgFrom: "from-violet-500",
                    iconBgTo: "to-purple-600",
                    circleBg: "bg-violet-500/10"
                  }}
                  fields={[
                    { label: "Ajuste eléctrico conductor", value: comfort.ajusteElectricoConductor },
                    { label: "Ajuste eléctrico pasajero", value: comfort.ajusteElectricoPasajero },
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
                    { label: "Tomas 12 V/120 V", value: comfort.tomas12V120V },
                    { label: "Tomacorriente en caja", value: comfort.tomacorrienteEnCaja },
                    { label: "Tecnología Keyless", value: comfort.startStop || powertrain.startStop },
                    { label: "Modos de conducción", value: comfort.modosConduccion || powertrain.modosConduccion },
                    { label: "Sensor de lluvia", value: comfort.sensorLluvia || lighting.sensorLluvia },
                  ]}
                />
              </div>
            )}

            {/* Sección 13: Información Comercial */}
            {hasAnyValue(commercial) && (
              <div className="mb-8">
                <SpecificationCard
                  id="sec-comercial"
                  title="Información Comercial"
                  icon="💰"
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
                    { label: "Financiación (cuota estimada)", value: commercial.financiacionCuotaEstimada, formatter: (v) => v && v > 0 ? `$${new Intl.NumberFormat('es-CO').format(v)}` : undefined },
                    { label: "Origen (país/planta)", value: commercial.origenPaisPlanta },
                  ]}
                />
              </div>
            )}
          </div>
        </section>

        {/* Section 7: WiseMetrics */}
        <section className="mb-16">
          <div className="max-w-7xl mx-auto">
            <VehicleMetrics metrics={vehicle.wisemetrics} />
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
