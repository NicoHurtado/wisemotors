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
import InteractiveShowcase from './InteractiveShowcase';

interface VehicleDetailProps {
  vehicle: any; // Using any for now due to complex type
}

export function VehicleDetail({ vehicle }: VehicleDetailProps) {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const { createLead } = useWhatsAppLeads();
  const { user } = useAuth();

  // Función para renderizar la sección de motor según el tipo de combustible
  const renderEngineSection = () => {
    const fuelType = (vehicle.fuelType || vehicle.specifications?.powertrain?.combustible)?.toLowerCase();
    const powertrain = vehicle.specifications?.powertrain || {};
    const transmission = vehicle.specifications?.transmission || {};
    const battery = vehicle.specifications?.battery || {};
    
    if (fuelType === 'eléctrico' || fuelType === 'electric') {
      return (
        <div className="rounded-2xl shadow-soft p-6 bg-white">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-xl">⚡</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Motor Eléctrico</h3>
          </div>
          <div className="space-y-2">
            {powertrain.potenciaMaxEV && (
              <div className="flex justify-between">
                <span className="text-gray-600">Potencia Máxima (EV):</span>
                <span className="font-medium">{powertrain.potenciaMaxEV} kW</span>
              </div>
            )}
            {powertrain.torqueMaxEV && (
              <div className="flex justify-between">
                <span className="text-gray-600">Torque Máximo (EV):</span>
                <span className="font-medium">{powertrain.torqueMaxEV} Nm</span>
              </div>
            )}
            {battery.capacidadBrutaBateria && (
            <div className="flex justify-between">
              <span className="text-gray-600">Capacidad de Batería:</span>
                <span className="font-medium">{battery.capacidadBrutaBateria} kWh</span>
            </div>
            )}
            {battery.cargadorOBCAC && (
            <div className="flex justify-between">
                <span className="text-gray-600">Cargador a bordo (OBC) AC:</span>
                <span className="font-medium">{battery.cargadorOBCAC} kW</span>
            </div>
            )}
            {battery.conduccionOnePedal !== undefined && (
            <div className="flex justify-between">
                <span className="text-gray-600">Conducción One-Pedal:</span>
                <span className="font-medium">{battery.conduccionOnePedal ? '✓ Sí' : '✗ No'}</span>
            </div>
            )}
            {battery.regeneracionNiveles && (
            <div className="flex justify-between">
                <span className="text-gray-600">Regeneración (niveles):</span>
                <span className="font-medium">{battery.regeneracionNiveles}</span>
            </div>
            )}
            {battery.tiempo0100AC && (
            <div className="flex justify-between">
                <span className="text-gray-600">Tiempo 0-100% (AC):</span>
                <span className="font-medium">{battery.tiempo0100AC} h</span>
            </div>
            )}
            {battery.tiempo1080DC && (
            <div className="flex justify-between">
                <span className="text-gray-600">Tiempo 10-80% (DC):</span>
                <span className="font-medium">{battery.tiempo1080DC} min</span>
            </div>
            )}
            {battery.highPowerChargingTimes && (
              <div className="flex justify-between">
                <span className="text-gray-600">High Power Charging times:</span>
                <span className="font-medium">{battery.highPowerChargingTimes}</span>
              </div>
            )}
            {battery.v2hV2g !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">V2H/V2G (bidireccional):</span>
                <span className="font-medium">{battery.v2hV2g ? '✓ Sí' : '✗ No'}</span>
              </div>
            )}
            {battery.potenciaV2hV2g && (
              <div className="flex justify-between">
                <span className="text-gray-600">V2H/V2G Potencia:</span>
                <span className="font-medium">{battery.potenciaV2hV2g} kW</span>
              </div>
            )}
          </div>
        </div>
      );
    } else if (fuelType === 'híbrido' || fuelType === 'hybrid' || fuelType === 'híbrido enchufable' || fuelType === 'híbrido enchufable') {
      return (
        <div className="rounded-2xl shadow-soft p-6 bg-white">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-xl">🔋</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Motor Híbrido</h3>
          </div>
          <div className="space-y-2">
            {powertrain.alimentacion !== undefined && powertrain.alimentacion !== null && powertrain.alimentacion !== '' && (
            <div className="flex justify-between">
                <span className="text-gray-600">Alimentación:</span>
                <span className="font-medium">{powertrain.alimentacion}</span>
            </div>
            )}
            {powertrain.cicloTrabajo !== undefined && powertrain.cicloTrabajo !== null && powertrain.cicloTrabajo !== '' && (
            <div className="flex justify-between">
                <span className="text-gray-600">Ciclo de trabajo:</span>
                <span className="font-medium">{powertrain.cicloTrabajo}</span>
            </div>
            )}
            {powertrain.cilindrada !== undefined && powertrain.cilindrada !== null && (
            <div className="flex justify-between">
                <span className="text-gray-600">Cilindrada:</span>
                <span className="font-medium">{powertrain.cilindrada} L</span>
            </div>
            )}
            {powertrain.combustible !== undefined && powertrain.combustible !== null && powertrain.combustible !== '' && (
            <div className="flex justify-between">
                <span className="text-gray-600">Combustible:</span>
                <span className="font-medium">{powertrain.combustible}</span>
            </div>
            )}
            {powertrain.modosConduccion !== undefined && powertrain.modosConduccion !== null && powertrain.modosConduccion !== '' && (
            <div className="flex justify-between">
                <span className="text-gray-600">Modos de conducción:</span>
                <span className="font-medium">{powertrain.modosConduccion}</span>
            </div>
            )}
            {powertrain.octanajeRecomendado !== undefined && powertrain.octanajeRecomendado !== null && (
            <div className="flex justify-between">
                <span className="text-gray-600">Octanaje recomendado:</span>
                <span className="font-medium">{powertrain.octanajeRecomendado} RON</span>
            </div>
            )}
            {powertrain.potenciaMaxMotorTermico !== undefined && powertrain.potenciaMaxMotorTermico !== null && (
            <div className="flex justify-between">
                <span className="text-gray-600">Potencia máx. (motor térmico):</span>
                <span className="font-medium">{powertrain.potenciaMaxMotorTermico} kW</span>
            </div>
            )}
            {powertrain.potenciaMaxSistemaHibrido !== undefined && powertrain.potenciaMaxSistemaHibrido !== null && (
            <div className="flex justify-between">
                <span className="text-gray-600">Potencia máx. (sistema híbrido):</span>
                <span className="font-medium">{powertrain.potenciaMaxSistemaHibrido} kW</span>
            </div>
            )}
            {powertrain.torqueMaxMotorTermico !== undefined && powertrain.torqueMaxMotorTermico !== null && (
            <div className="flex justify-between">
                <span className="text-gray-600">Torque máx. (motor térmico):</span>
                <span className="font-medium">{powertrain.torqueMaxMotorTermico} Nm</span>
            </div>
            )}
            {powertrain.torqueMaxSistemaHibrido !== undefined && powertrain.torqueMaxSistemaHibrido !== null && (
            <div className="flex justify-between">
                <span className="text-gray-600">Torque máx. (sistema híbrido):</span>
                <span className="font-medium">{powertrain.torqueMaxSistemaHibrido} Nm</span>
            </div>
            )}
            {powertrain.traccion !== undefined && powertrain.traccion !== null && powertrain.traccion !== '' && (
            <div className="flex justify-between">
                <span className="text-gray-600">Tracción:</span>
                <span className="font-medium">{powertrain.traccion}</span>
            </div>
            )}
            {transmission.tipoTransmision !== undefined && transmission.tipoTransmision !== null && transmission.tipoTransmision !== '' && (
            <div className="flex justify-between">
                <span className="text-gray-600">Tipo de Transmisión:</span>
                <span className="font-medium">{transmission.tipoTransmision}</span>
            </div>
            )}
            {transmission.numeroMarchas !== undefined && transmission.numeroMarchas !== null && (
            <div className="flex justify-between">
                <span className="text-gray-600">Número de Marchas:</span>
                <span className="font-medium">{transmission.numeroMarchas}</span>
            </div>
            )}
            {powertrain.startStop !== undefined && (
            <div className="flex justify-between">
                <span className="text-gray-600">Sistema Start-Stop:</span>
                <span className="font-medium">{powertrain.startStop ? '✓ Sí' : '✗ No'}</span>
            </div>
            )}
            {powertrain.launchControl !== undefined && (
            <div className="flex justify-between">
                <span className="text-gray-600">Launch control:</span>
                <span className="font-medium">{powertrain.launchControl ? '✓ Sí' : '✗ No'}</span>
            </div>
            )}
            {battery.capacidadBrutaBateria !== undefined && battery.capacidadBrutaBateria !== null && (
            <div className="flex justify-between">
              <span className="text-gray-600">Capacidad de Batería:</span>
                <span className="font-medium">{battery.capacidadBrutaBateria} kWh</span>
            </div>
            )}
            {battery.regeneracionNiveles !== undefined && battery.regeneracionNiveles !== null && (
            <div className="flex justify-between">
                <span className="text-gray-600">Regeneración (niveles):</span>
                <span className="font-medium">{battery.regeneracionNiveles}</span>
            </div>
            )}
            {battery.v2hV2g !== undefined && (
            <div className="flex justify-between">
                <span className="text-gray-600">V2H/V2G (bidireccional):</span>
                <span className="font-medium">{battery.v2hV2g ? '✓ Sí' : '✗ No'}</span>
            </div>
            )}
          </div>
        </div>
      );
    } else {
      // Motor de combustión tradicional
      return (
        <div className="rounded-2xl shadow-soft p-6 bg-white">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-xl">🔧</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Motor</h3>
          </div>
          <div className="space-y-2">
            {powertrain.alimentacion && (
            <div className="flex justify-between">
                <span className="text-gray-600">Alimentación:</span>
                <span className="font-medium">{powertrain.alimentacion}</span>
            </div>
            )}
            {powertrain.cilindrada && (
            <div className="flex justify-between">
                <span className="text-gray-600">Cilindrada:</span>
                <span className="font-medium">{powertrain.cilindrada} L</span>
            </div>
            )}
            {powertrain.combustible && (
            <div className="flex justify-between">
                <span className="text-gray-600">Combustible:</span>
                <span className="font-medium">{powertrain.combustible}</span>
            </div>
            )}
            {powertrain.octanajeRecomendado && (
            <div className="flex justify-between">
                <span className="text-gray-600">Octanaje recomendado:</span>
                <span className="font-medium">{powertrain.octanajeRecomendado} RON</span>
            </div>
            )}
            {powertrain.potenciaMaxMotorTermico && (
            <div className="flex justify-between">
                <span className="text-gray-600">Potencia máx. (motor térmico):</span>
                <span className="font-medium">{powertrain.potenciaMaxMotorTermico} kW</span>
            </div>
            )}
            {powertrain.torqueMaxMotorTermico && (
            <div className="flex justify-between">
                <span className="text-gray-600">Torque máx. (motor térmico):</span>
                <span className="font-medium">{powertrain.torqueMaxMotorTermico} Nm</span>
            </div>
            )}
            {transmission.tipoTransmision && (
            <div className="flex justify-between">
                <span className="text-gray-600">Tipo de transmisión:</span>
                <span className="font-medium">{transmission.tipoTransmision}</span>
            </div>
            )}
            {transmission.numeroMarchas !== undefined && (
            <div className="flex justify-between">
                <span className="text-gray-600">Número de marchas:</span>
                <span className="font-medium">{transmission.numeroMarchas}</span>
            </div>
            )}
            {powertrain.startStop !== undefined && (
            <div className="flex justify-between">
                <span className="text-gray-600">Sistema start-stop:</span>
                <span className="font-medium">{powertrain.startStop ? '✓ Sí' : '✗ No'}</span>
            </div>
            )}
          </div>
        </div>
      );
    }
  };

  // Función para renderizar la sección de consumo según el tipo de combustible
  const renderConsumptionSection = () => {
    const fuelType = (vehicle.fuelType || vehicle.specifications?.powertrain?.combustible)?.toLowerCase();
    const efficiency = vehicle.specifications?.efficiency || {};
    const battery = vehicle.specifications?.battery || {};
    
    if (fuelType === 'eléctrico' || fuelType === 'electric') {
      return (
        <div className="rounded-2xl shadow-soft p-6 bg-white">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-xl">⚡</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Consumo Eléctrico</h3>
          </div>
          <div className="space-y-2">
            {efficiency.consumoCiudad && (
            <div className="flex justify-between">
              <span className="text-gray-600">Consumo Ciudad:</span>
                <span className="font-medium">{efficiency.consumoCiudad} kWh/100km</span>
            </div>
            )}
            {efficiency.consumoCarretera && (
            <div className="flex justify-between">
              <span className="text-gray-600">Consumo Carretera:</span>
                <span className="font-medium">{efficiency.consumoCarretera} kWh/100km</span>
            </div>
            )}
            {efficiency.consumoMixto && (
            <div className="flex justify-between">
                <span className="text-gray-600">Consumo Mixto:</span>
                <span className="font-medium">{efficiency.consumoMixto} kWh/100km</span>
            </div>
            )}
            {efficiency.mpgeCiudad && (
            <div className="flex justify-between">
                <span className="text-gray-600">MPGe Ciudad:</span>
                <span className="font-medium">{efficiency.mpgeCiudad} mpge</span>
            </div>
            )}
            {efficiency.mpgeCarretera && (
            <div className="flex justify-between">
                <span className="text-gray-600">MPGe Carretera:</span>
                <span className="font-medium">{efficiency.mpgeCarretera} mpge</span>
            </div>
            )}
            {efficiency.mpgeCombinado && (
            <div className="flex justify-between">
                <span className="text-gray-600">MPGe Combinado:</span>
                <span className="font-medium">{efficiency.mpgeCombinado} mpge</span>
            </div>
            )}
            {efficiency.autonomiaOficial && (
              <div className="flex justify-between">
                <span className="text-gray-600">Autonomía Oficial:</span>
                <span className="font-medium">{efficiency.autonomiaOficial} km</span>
              </div>
            )}
            {battery.tiempo0100AC && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tiempo Carga AC (0-100%):</span>
                <span className="font-medium">{battery.tiempo0100AC} h</span>
              </div>
            )}
            {battery.tiempo1080DC && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tiempo Carga DC (10-80%):</span>
                <span className="font-medium">{battery.tiempo1080DC} min</span>
              </div>
            )}
            {efficiency.costoEnergia100km && (
              <div className="flex justify-between">
                <span className="text-gray-600">Costo energía por 100 km:</span>
                <span className="font-medium">${efficiency.costoEnergia100km.toLocaleString()} COP</span>
              </div>
            )}
            {efficiency.ahorro5Anos && (
              <div className="flex justify-between">
                <span className="text-gray-600">Ahorro a 5 años:</span>
                <span className="font-medium">${efficiency.ahorro5Anos.toLocaleString()} COP</span>
              </div>
            )}
          </div>
        </div>
      );
    } else if (fuelType === 'híbrido' || fuelType === 'hybrid' || fuelType === 'híbrido enchufable' || fuelType === 'híbrido enchufable') {
      return (
        <div className="rounded-2xl shadow-soft p-6 bg-white">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-xl">🔋</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Consumo Híbrido</h3>
          </div>
          <div className="space-y-2">
            {efficiency.consumoCiudad !== undefined && efficiency.consumoCiudad !== null && (
            <div className="flex justify-between">
              <span className="text-gray-600">Consumo Ciudad:</span>
                <span className="font-medium">{efficiency.consumoCiudad} L/100km</span>
            </div>
            )}
            {efficiency.consumoCarretera !== undefined && efficiency.consumoCarretera !== null && (
            <div className="flex justify-between">
              <span className="text-gray-600">Consumo Carretera:</span>
                <span className="font-medium">{efficiency.consumoCarretera} L/100km</span>
            </div>
            )}
            {efficiency.consumoMixto !== undefined && efficiency.consumoMixto !== null && (
            <div className="flex justify-between">
                <span className="text-gray-600">Consumo Mixto:</span>
                <span className="font-medium">{efficiency.consumoMixto} L/100km</span>
            </div>
            )}
            {efficiency.capacidadTanque !== undefined && efficiency.capacidadTanque !== null && (
              <div className="flex justify-between">
                <span className="text-gray-600">Capacidad de Tanque:</span>
                <span className="font-medium">{efficiency.capacidadTanque} L</span>
          </div>
            )}
            {efficiency.costoEnergia100km !== undefined && efficiency.costoEnergia100km !== null && (
              <div className="flex justify-between">
                <span className="text-gray-600">Costo energía por 100 km:</span>
                <span className="font-medium">${efficiency.costoEnergia100km.toLocaleString()} COP</span>
        </div>
            )}
            {efficiency.ahorro5Anos !== undefined && efficiency.ahorro5Anos !== null && (
              <div className="flex justify-between">
                <span className="text-gray-600">Ahorro a 5 años:</span>
                <span className="font-medium">${efficiency.ahorro5Anos.toLocaleString()} COP</span>
            </div>
            )}
            {efficiency.autonomiaOficial && (
            <div className="flex justify-between">
                <span className="text-gray-600">Autonomía Oficial:</span>
                <span className="font-medium">{efficiency.autonomiaOficial} km</span>
            </div>
            )}
            {efficiency.mpgeCiudad && (
            <div className="flex justify-between">
                <span className="text-gray-600">MPGe Ciudad:</span>
                <span className="font-medium">{efficiency.mpgeCiudad} mpge</span>
            </div>
            )}
            {efficiency.mpgeCarretera && (
            <div className="flex justify-between">
                <span className="text-gray-600">MPGe Carretera:</span>
                <span className="font-medium">{efficiency.mpgeCarretera} mpge</span>
            </div>
            )}
            {efficiency.mpgeCombinado && (
            <div className="flex justify-between">
                <span className="text-gray-600">MPGe Combinado:</span>
                <span className="font-medium">{efficiency.mpgeCombinado} mpge</span>
            </div>
            )}
            {efficiency.costoEnergia100km && (
            <div className="flex justify-between">
                <span className="text-gray-600">Costo energía por 100 km:</span>
                <span className="font-medium">${efficiency.costoEnergia100km.toLocaleString()} COP</span>
            </div>
            )}
            {efficiency.ahorro5Anos && (
            <div className="flex justify-between">
                <span className="text-gray-600">Ahorro a 5 años:</span>
                <span className="font-medium">${efficiency.ahorro5Anos.toLocaleString()} COP</span>
            </div>
            )}
          </div>
        </div>
      );
    } else {
      // Consumo de combustión tradicional
      return (
        <div className="rounded-2xl shadow-soft p-6 bg-white">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-xl">⛽</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Consumo</h3>
          </div>
          <div className="space-y-2">
            {efficiency.consumoCiudad && (
            <div className="flex justify-between">
              <span className="text-gray-600">Ciudad:</span>
                <span className="font-medium">{efficiency.consumoCiudad} L/100km</span>
            </div>
            )}
            {efficiency.consumoCarretera && (
            <div className="flex justify-between">
              <span className="text-gray-600">Carretera:</span>
                <span className="font-medium">{efficiency.consumoCarretera} L/100km</span>
            </div>
            )}
            {efficiency.consumoMixto && (
            <div className="flex justify-between">
              <span className="text-gray-600">Consumo mixto:</span>
                <span className="font-medium">{efficiency.consumoMixto} L/100km</span>
            </div>
            )}
            {efficiency.capacidadTanque && (
            <div className="flex justify-between">
                <span className="text-gray-600">Capacidad de Tanque:</span>
                <span className="font-medium">{efficiency.capacidadTanque} L</span>
            </div>
            )}
          </div>
        </div>
      );
    }
  };

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
        
        {/* Interactive Showcase - inmediatamente debajo del CTA de testdrive en casa */}
        <section className="mb-20">
          <div className="max-w-7xl mx-auto">
            <InteractiveShowcase imageSrc="/images/rav4-removebg-preview.png" vehicle={vehicle} />
          </div>
        </section>

        {/* Section 3: Detailed Specifications - Organizadas según campos_seleccionados.md - ORDEN EXACTO */}
        <section className="mb-16">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Especificaciones y Valoraciones
                </h2>
              </div>
              
              {/* 1. Identificación */}
              {(vehicle.specifications?.identification?.marca ||
                vehicle.specifications?.identification?.modelo ||
                vehicle.specifications?.identification?.añoModelo !== undefined ||
                vehicle.specifications?.identification?.carrocería ||
                vehicle.specifications?.identification?.plazas !== undefined ||
                vehicle.specifications?.identification?.puertas !== undefined ||
                vehicle.specifications?.identification?.versionTrim ||
                vehicle.price !== undefined ||
                vehicle.status) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="sec-identificacion">
                <div className="rounded-2xl shadow-soft p-6 bg-white">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-lg">i</span>
                    </div>
                      <h3 className="text-lg font-semibold text-gray-900">Identificación</h3>
                  </div>
                  <div className="space-y-2">
                      {vehicle.specifications?.identification?.añoModelo !== undefined && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">Año modelo:</span>
                          <span className="font-medium">{vehicle.specifications.identification.añoModelo}</span>
                    </div>
                      )}
                      {vehicle.specifications?.identification?.carrocería && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">Carrocería:</span>
                          <span className="font-medium">{vehicle.specifications.identification.carrocería}</span>
                    </div>
                      )}
                      {vehicle.specifications?.identification?.marca && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">Marca:</span>
                          <span className="font-medium">{vehicle.specifications.identification.marca}</span>
                    </div>
                      )}
                      {vehicle.specifications?.identification?.modelo && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">Modelo:</span>
                          <span className="font-medium">{vehicle.specifications.identification.modelo}</span>
                    </div>
                      )}
                      {vehicle.specifications?.identification?.plazas !== undefined && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">Plazas:</span>
                          <span className="font-medium">{vehicle.specifications.identification.plazas}</span>
                    </div>
                      )}
                      {vehicle.specifications?.identification?.puertas !== undefined && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">Puertas:</span>
                          <span className="font-medium">{vehicle.specifications.identification.puertas}</span>
                    </div>
                      )}
                      {vehicle.specifications?.identification?.versionTrim && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">Versión/Trim:</span>
                          <span className="font-medium">{vehicle.specifications.identification.versionTrim}</span>
                    </div>
                      )}
                      {vehicle.price !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Precio:</span>
                          <span className="font-medium">${vehicle.price?.toLocaleString()}</span>
                        </div>
                      )}
                      {vehicle.status && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estado:</span>
                      <span className="font-medium">{vehicle.status}</span>
                    </div>
                      )}
                  </div>
                </div>
                </div>
              )}

              {/* 2. Motorización y tren motriz */}
              {(vehicle.specifications?.powertrain || vehicle.specifications?.battery || vehicle.fuelType) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="sec-powertrain">
                  {renderEngineSection()}
                </div>
              )}

              {/* 3. Transmisión */}
              {(vehicle.specifications?.transmission?.tipoTransmision || 
                vehicle.specifications?.transmission?.numeroMarchas !== undefined ||
                vehicle.specifications?.transmission?.modoRemolque !== undefined ||
                vehicle.specifications?.transmission?.paddleShifters !== undefined ||
                vehicle.specifications?.transmission?.torqueVectoring !== undefined ||
                vehicle.specifications?.transmission?.traccionInteligenteOnDemand !== undefined) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="sec-transmision">
                <div className="rounded-2xl shadow-soft p-6 bg-white">
                  <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-xl">⚙️</span>
                    </div>
                      <h3 className="text-lg font-semibold text-gray-900">Transmisión</h3>
                  </div>
                  <div className="space-y-2">
                      {vehicle.specifications?.transmission?.tipoTransmision && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">Tipo de transmisión:</span>
                          <span className="font-medium">{vehicle.specifications.transmission.tipoTransmision}</span>
                    </div>
                      )}
                      {vehicle.specifications?.transmission?.numeroMarchas !== undefined && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">Número de marchas:</span>
                          <span className="font-medium">{vehicle.specifications.transmission.numeroMarchas}</span>
                    </div>
                      )}
                      {vehicle.specifications?.transmission?.modoRemolque !== undefined && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">Modo remolque/arrastre:</span>
                          <span className="font-medium">{vehicle.specifications.transmission.modoRemolque ? '✓ Sí' : '✗ No'}</span>
                    </div>
                      )}
                      {vehicle.specifications?.transmission?.paddleShifters !== undefined && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">Paddle shifters:</span>
                          <span className="font-medium">{vehicle.specifications.transmission.paddleShifters ? '✓ Sí' : '✗ No'}</span>
                    </div>
                      )}
                      {vehicle.specifications?.transmission?.torqueVectoring !== undefined && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">Torque Vectoring:</span>
                          <span className="font-medium">{vehicle.specifications.transmission.torqueVectoring ? '✓ Sí' : '✗ No'}</span>
                    </div>
                      )}
                      {vehicle.specifications?.transmission?.traccionInteligenteOnDemand !== undefined && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">Tracción inteligente On-Demand:</span>
                          <span className="font-medium">{vehicle.specifications.transmission.traccionInteligenteOnDemand ? '✓ Sí' : '✗ No'}</span>
                    </div>
                      )}
                    </div>
                    </div>
                    </div>
              )}

              {/* 4. Dimensiones y pesos */}
              {(vehicle.specifications?.dimensions?.length !== undefined ||
                vehicle.specifications?.dimensions?.width !== undefined ||
                vehicle.specifications?.dimensions?.height !== undefined ||
                vehicle.specifications?.dimensions?.curbWeight !== undefined ||
                vehicle.specifications?.dimensions?.wheelbase !== undefined ||
                vehicle.specifications?.dimensions?.cargoCapacity !== undefined ||
                vehicle.specifications?.weight?.payload !== undefined) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="sec-dimensiones">
              <div className="rounded-2xl shadow-soft p-6 bg-white">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-wise rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xl">📏</span>
                  </div>
                      <h3 className="text-lg font-semibold text-gray-900">Dimensiones y pesos</h3>
                </div>
                <div className="space-y-2">
                      {vehicle.specifications?.dimensions?.height !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Alto:</span>
                          <span className="font-medium">{vehicle.specifications.dimensions.height} mm</span>
                  </div>
                      )}
                      {vehicle.specifications?.dimensions?.width !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Ancho (sin espejos):</span>
                          <span className="font-medium">{vehicle.specifications.dimensions.width} mm</span>
                  </div>
                      )}
                      {vehicle.specifications?.dimensions?.cargoCapacity !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Capacidad de baúl (máxima):</span>
                          <span className="font-medium">{vehicle.specifications.dimensions.cargoCapacity} L</span>
                  </div>
                      )}
                      {vehicle.specifications?.weight?.payload !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Carga útil (payload):</span>
                          <span className="font-medium">{vehicle.specifications.weight.payload} kg</span>
                  </div>
                      )}
                      {vehicle.specifications?.dimensions?.length !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Largo:</span>
                          <span className="font-medium">{vehicle.specifications.dimensions.length} mm</span>
                  </div>
                      )}
                      {vehicle.specifications?.dimensions?.curbWeight !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Peso en orden de marcha:</span>
                          <span className="font-medium">{vehicle.specifications.dimensions.curbWeight} kg</span>
                  </div>
                      )}
                      {vehicle.specifications?.dimensions?.wheelbase !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Distancia entre ejes:</span>
                          <span className="font-medium">{vehicle.specifications.dimensions.wheelbase} mm</span>
                </div>
                      )}
              </div>
                  </div>
                </div>
              )}

              {/* 5. Eficiencia y consumo */}
              {(vehicle.specifications?.efficiency || vehicle.specifications?.battery) && (
                <div id="sec-consumo">
                  {renderConsumptionSection()}
                </div>
              )}

              {/* 6. Batería y carga */}
              {(vehicle.specifications?.battery?.capacidadBrutaBateria !== undefined ||
                vehicle.specifications?.battery?.cargadorOBCAC !== undefined ||
                vehicle.specifications?.battery?.conduccionOnePedal !== undefined ||
                vehicle.specifications?.battery?.regeneracionNiveles !== undefined ||
                vehicle.specifications?.battery?.tiempo0100AC !== undefined ||
                vehicle.specifications?.battery?.tiempo1080DC !== undefined ||
                vehicle.specifications?.battery?.highPowerChargingTimes ||
                vehicle.specifications?.battery?.v2hV2g !== undefined ||
                vehicle.specifications?.battery?.potenciaV2hV2g !== undefined) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl shadow-soft p-6 bg-white">
                <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-xl">🔋</span>
                  </div>
                      <h3 className="text-lg font-semibold text-gray-900">Batería y carga</h3>
                </div>
                <div className="space-y-2">
                      {vehicle.specifications?.battery?.capacidadBrutaBateria !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Capacidad bruta batería:</span>
                          <span className="font-medium">{vehicle.specifications.battery.capacidadBrutaBateria} kWh</span>
                  </div>
                      )}
                      {vehicle.specifications?.battery?.cargadorOBCAC !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Cargador a bordo (OBC) AC:</span>
                          <span className="font-medium">{vehicle.specifications.battery.cargadorOBCAC} kW</span>
                  </div>
                      )}
                      {vehicle.specifications?.battery?.conduccionOnePedal !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Conducción One-Pedal:</span>
                          <span className="font-medium">{vehicle.specifications.battery.conduccionOnePedal ? '✓ Sí' : '✗ No'}</span>
                  </div>
                      )}
                      {vehicle.specifications?.battery?.highPowerChargingTimes && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">High Power Charging times:</span>
                          <span className="font-medium">{vehicle.specifications.battery.highPowerChargingTimes}</span>
                  </div>
                      )}
                      {vehicle.specifications?.battery?.regeneracionNiveles !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Regeneración (niveles):</span>
                          <span className="font-medium">{vehicle.specifications.battery.regeneracionNiveles}</span>
                </div>
                      )}
                      {vehicle.specifications?.battery?.tiempo0100AC !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Tiempo 0-100% (AC):</span>
                          <span className="font-medium">{vehicle.specifications.battery.tiempo0100AC} h</span>
                  </div>
                      )}
                      {vehicle.specifications?.battery?.tiempo1080DC !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Tiempo 10-80% (DC):</span>
                          <span className="font-medium">{vehicle.specifications.battery.tiempo1080DC} min</span>
                  </div>
                      )}
                      {vehicle.specifications?.battery?.v2hV2g !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">V2H/V2G (bidireccional):</span>
                          <span className="font-medium">{vehicle.specifications.battery.v2hV2g ? '✓ Sí' : '✗ No'}</span>
                  </div>
                      )}
                      {vehicle.specifications?.battery?.potenciaV2hV2g !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">V2H/V2G Potencia:</span>
                          <span className="font-medium">{vehicle.specifications.battery.potenciaV2hV2g} kW</span>
                  </div>
                      )}
                </div>
              </div>
                </div>
              )}

              {/* 7. Chasis, frenos y dirección */}
              {(vehicle.specifications?.chassis?.groundClearance !== undefined ||
                vehicle.specifications?.chassis?.suspensionDelantera ||
                vehicle.specifications?.chassis?.suspensionTrasera ||
                vehicle.specifications?.chassis?.amortiguacionAdaptativa !== undefined ||
                vehicle.specifications?.chassis?.materialDiscos ||
                vehicle.specifications?.chassis?.materialMuelles ||
                vehicle.specifications?.chassis?.tipoPinzasFreno) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl shadow-soft p-6 bg-white">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xl">🔧</span>
                  </div>
                      <h3 className="text-lg font-semibold text-gray-900">Chasis, frenos y dirección</h3>
                </div>
                <div className="space-y-2">
                      {vehicle.specifications?.chassis?.amortiguacionAdaptativa !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Amortiguación adaptativa:</span>
                          <span className="font-medium">{vehicle.specifications.chassis.amortiguacionAdaptativa ? '✓ Sí' : '✗ No'}</span>
                  </div>
                      )}
                      {vehicle.specifications?.chassis?.materialDiscos && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Material de discos:</span>
                          <span className="font-medium">{vehicle.specifications.chassis.materialDiscos}</span>
                  </div>
                      )}
                      {vehicle.specifications?.chassis?.materialMuelles && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Material de muelles:</span>
                          <span className="font-medium">{vehicle.specifications.chassis.materialMuelles}</span>
                  </div>
                      )}
                      {vehicle.specifications?.chassis?.suspensionDelantera && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Suspensión delantera:</span>
                          <span className="font-medium">{vehicle.specifications.chassis.suspensionDelantera}</span>
                  </div>
                      )}
                      {vehicle.specifications?.chassis?.suspensionTrasera && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Suspensión trasera:</span>
                          <span className="font-medium">{vehicle.specifications.chassis.suspensionTrasera}</span>
                  </div>
                      )}
                      {vehicle.specifications?.chassis?.tipoPinzasFreno && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tipo de pinzas de freno:</span>
                          <span className="font-medium">{vehicle.specifications.chassis.tipoPinzasFreno}</span>
                </div>
                      )}
                      {vehicle.specifications?.chassis?.groundClearance !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Despeje al suelo:</span>
                          <span className="font-medium">{vehicle.specifications.chassis.groundClearance} mm</span>
              </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 8. Prestaciones */}
              {(vehicle.specifications?.performance?.acceleration0to100 !== undefined ||
                vehicle.specifications?.performance?.acceleration0to200 !== undefined ||
                vehicle.specifications?.performance?.acceleration0to60 !== undefined ||
                vehicle.specifications?.performance?.acceleration50to80 !== undefined ||
                vehicle.specifications?.performance?.overtaking80to120 !== undefined ||
                vehicle.specifications?.performance?.maxLateralAcceleration !== undefined ||
                vehicle.specifications?.performance?.maxLongitudinalAcceleration !== undefined ||
                vehicle.specifications?.performance?.brakingDistance100to0 !== undefined ||
                vehicle.specifications?.performance?.maxSpeed !== undefined ||
                vehicle.specifications?.performance?.powerToWeight !== undefined ||
                vehicle.specifications?.performance?.quarterMile !== undefined ||
                vehicle.specifications?.performance?.launchControl !== undefined) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl shadow-soft p-6 bg-white">
                  <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-xl">⚡</span>
                    </div>
                      <h3 className="text-lg font-semibold text-gray-900">Prestaciones</h3>
                  </div>
                  <div className="space-y-2">
                      {vehicle.specifications?.performance?.acceleration0to100 !== undefined && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">0-100 km/h:</span>
                          <span className="font-medium">{vehicle.specifications.performance.acceleration0to100} s</span>
                    </div>
                      )}
                      {vehicle.specifications?.performance?.acceleration0to200 !== undefined && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">0-200 km/h:</span>
                          <span className="font-medium">{vehicle.specifications.performance.acceleration0to200} s</span>
                    </div>
                      )}
                      {vehicle.specifications?.performance?.acceleration0to60 !== undefined && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">0-60 mph:</span>
                          <span className="font-medium">{vehicle.specifications.performance.acceleration0to60} s</span>
                    </div>
                      )}
                      {vehicle.specifications?.performance?.quarterMile !== undefined && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">1/4 de milla (tiempo):</span>
                          <span className="font-medium">{vehicle.specifications.performance.quarterMile} s</span>
                    </div>
                      )}
                      {vehicle.specifications?.performance?.acceleration50to80 !== undefined && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">50-80 km/h (recuperación):</span>
                          <span className="font-medium">{vehicle.specifications.performance.acceleration50to80} s</span>
                    </div>
                      )}
                      {vehicle.specifications?.performance?.overtaking80to120 !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">80-120 km/h (adelantamiento):</span>
                          <span className="font-medium">{vehicle.specifications.performance.overtaking80to120} s</span>
                  </div>
                      )}
                      {vehicle.specifications?.performance?.maxLateralAcceleration !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Aceleración lateral máxima:</span>
                          <span className="font-medium">{vehicle.specifications.performance.maxLateralAcceleration} g</span>
                </div>
              )}
                      {vehicle.specifications?.performance?.maxLongitudinalAcceleration !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Aceleración longitudinal máxima:</span>
                          <span className="font-medium">{vehicle.specifications.performance.maxLongitudinalAcceleration} g</span>
            </div>
                      )}
                      {vehicle.specifications?.performance?.brakingDistance100to0 !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Frenado 100-0 km/h:</span>
                          <span className="font-medium">{vehicle.specifications.performance.brakingDistance100to0} m</span>
          </div>
                      )}
                      {vehicle.specifications?.performance?.maxSpeed !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Velocidad máxima:</span>
                          <span className="font-medium">{vehicle.specifications.performance.maxSpeed} km/h</span>
                        </div>
                      )}
                      {vehicle.specifications?.performance?.powerToWeight !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Relación peso/potencia:</span>
                          <span className="font-medium">{vehicle.specifications.performance.powerToWeight} HP/ton</span>
                        </div>
                      )}
                      {vehicle.specifications?.performance?.launchControl !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Launch control:</span>
                          <span className="font-medium">{vehicle.specifications.performance.launchControl ? '✓ Sí' : '✗ No'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 9. Seguridad pasiva y estructural */}
              {(vehicle.specifications?.safety?.airbags !== undefined ||
                vehicle.specifications?.safety?.ncapRating !== undefined ||
                vehicle.specifications?.safety?.adultSafetyScore !== undefined ||
                vehicle.specifications?.safety?.childSafetyScore !== undefined ||
                vehicle.specifications?.safety?.assistanceScore !== undefined) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="sec-bateria">
              <div className="rounded-2xl shadow-soft p-6 bg-white">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xl">🛡️</span>
                  </div>
                      <h3 className="text-lg font-semibold text-gray-900">Seguridad pasiva y estructural</h3>
                </div>
                <div className="space-y-2">
                      {vehicle.specifications?.safety?.airbags !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Número total de airbags:</span>
                          <span className="font-medium">{vehicle.specifications.safety.airbags}</span>
                  </div>
                      )}
                      {vehicle.specifications?.safety?.ncapRating !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Euro NCAP (estrellas):</span>
                          <span className="font-medium">{vehicle.specifications.safety.ncapRating} ⭐</span>
                  </div>
                      )}
                      {vehicle.specifications?.safety?.adultSafetyScore !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Euro NCAP (Adulto %):</span>
                          <span className="font-medium">{vehicle.specifications.safety.adultSafetyScore}%</span>
                  </div>
                      )}
                      {vehicle.specifications?.safety?.childSafetyScore !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Euro NCAP (Niño %):</span>
                          <span className="font-medium">{vehicle.specifications.safety.childSafetyScore}%</span>
                  </div>
                      )}
                      {vehicle.specifications?.safety?.assistanceScore !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Euro NCAP (Asistencias %):</span>
                          <span className="font-medium">{vehicle.specifications.safety.assistanceScore}%</span>
                  </div>
                      )}
                  </div>
                  </div>
                  </div>
              )}

              {/* 10. ADAS (Asistencias Activas) */}
              {(vehicle.specifications?.adas?.acc !== undefined ||
                vehicle.specifications?.adas?.aeb !== undefined ||
                vehicle.specifications?.adas?.bsm !== undefined ||
                vehicle.specifications?.adas?.camara360 !== undefined ||
                vehicle.specifications?.adas?.farosAdaptativos !== undefined ||
                vehicle.specifications?.adas?.lka !== undefined ||
                vehicle.specifications?.adas?.lucesAltasAutomaticas !== undefined ||
                vehicle.specifications?.adas?.parkAssist !== undefined ||
                vehicle.specifications?.adas?.sensoresEstacionamientoDelantero !== undefined) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="sec-chasis">
              <div className="rounded-2xl shadow-soft p-6 bg-white">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-xl">🚗</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">ADAS (Asistencias Activas)</h3>
                    </div>
                    <div className="space-y-2">
                      {vehicle.specifications?.adas?.acc !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">ACC (crucero adaptativo):</span>
                          <span className="font-medium">{vehicle.specifications.adas.acc ? '✓ Sí' : '✗ No'}</span>
                  </div>
                      )}
                      {vehicle.specifications?.adas?.aeb !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">AEB (frenado autónomo):</span>
                          <span className="font-medium">{vehicle.specifications.adas.aeb ? '✓ Sí' : '✗ No'}</span>
                  </div>
                      )}
                      {vehicle.specifications?.adas?.bsm !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">BSM (punto ciego):</span>
                          <span className="font-medium">{vehicle.specifications.adas.bsm ? '✓ Sí' : '✗ No'}</span>
                  </div>
                      )}
                      {vehicle.specifications?.adas?.camara360 !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Cámara 360°:</span>
                          <span className="font-medium">{vehicle.specifications.adas.camara360 ? '✓ Sí' : '✗ No'}</span>
                  </div>
                      )}
                      {vehicle.specifications?.adas?.farosAdaptativos !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Faros adaptativos (ADB):</span>
                          <span className="font-medium">{vehicle.specifications.adas.farosAdaptativos ? '✓ Sí' : '✗ No'}</span>
                  </div>
                      )}
                      {vehicle.specifications?.adas?.lka !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">LKA (asistente carril):</span>
                          <span className="font-medium">{vehicle.specifications.adas.lka ? '✓ Sí' : '✗ No'}</span>
                  </div>
                      )}
                      {vehicle.specifications?.adas?.lucesAltasAutomaticas !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Luces altas automáticas:</span>
                          <span className="font-medium">{vehicle.specifications.adas.lucesAltasAutomaticas ? '✓ Sí' : '✗ No'}</span>
                  </div>
                      )}
                      {vehicle.specifications?.adas?.parkAssist !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Park Assist (autónomo):</span>
                          <span className="font-medium">{vehicle.specifications.adas.parkAssist ? '✓ Sí' : '✗ No'}</span>
                  </div>
                      )}
                      {vehicle.specifications?.adas?.sensoresEstacionamientoDelantero !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Sensores estacionamiento delantero:</span>
                          <span className="font-medium">{vehicle.specifications.adas.sensoresEstacionamientoDelantero}</span>
                  </div>
                      )}
                </div>
              </div>
                </div>
              )}

              {/* 11. Iluminación y visibilidad */}
              {(vehicle.specifications?.lighting?.headlightType ||
                vehicle.specifications?.lighting?.antinieblaDelantero !== undefined ||
                vehicle.specifications?.lighting?.intermitentesDinamicos !== undefined ||
                vehicle.specifications?.lighting?.lavafaros !== undefined ||
                vehicle.specifications?.lighting?.sensorLluvia !== undefined) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="sec-prestaciones">
              <div className="rounded-2xl shadow-soft p-6 bg-white">
                <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-xl">💡</span>
                  </div>
                      <h3 className="text-lg font-semibold text-gray-900">Iluminación y visibilidad</h3>
                  </div>
                  <div className="space-y-2">
                      {vehicle.specifications?.lighting?.antinieblaDelantero !== undefined && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">Antiniebla delantero:</span>
                          <span className="font-medium">{vehicle.specifications.lighting.antinieblaDelantero ? '✓ Sí' : '✗ No'}</span>
                    </div>
                      )}
                      {vehicle.specifications?.lighting?.headlightType && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">Faros (tecnología):</span>
                          <span className="font-medium">{vehicle.specifications.lighting.headlightType}</span>
                    </div>
                      )}
                      {vehicle.specifications?.lighting?.intermitentesDinamicos !== undefined && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">Intermitentes dinámicos:</span>
                          <span className="font-medium">{vehicle.specifications.lighting.intermitentesDinamicos ? '✓ Sí' : '✗ No'}</span>
                    </div>
                      )}
                      {vehicle.specifications?.lighting?.lavafaros !== undefined && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">Lavafaros:</span>
                          <span className="font-medium">{vehicle.specifications.lighting.lavafaros ? '✓ Sí' : '✗ No'}</span>
                    </div>
                      )}
                      {vehicle.specifications?.lighting?.sensorLluvia !== undefined && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">Sensor de lluvia:</span>
                          <span className="font-medium">{vehicle.specifications.lighting.sensorLluvia ? '✓ Sí' : '✗ No'}</span>
                    </div>
                      )}
                  </div>
              </div>
                </div>
              )}

              {/* 12. Infoentretenimiento y Conectividad */}
              {(vehicle.specifications?.infotainment?.androidAuto ||
                vehicle.specifications?.infotainment?.appleCarPlay ||
                vehicle.specifications?.infotainment?.appRemotaOTA !== undefined ||
                vehicle.specifications?.infotainment?.audioMarca ||
                vehicle.specifications?.infotainment?.audioNumeroBocinas !== undefined ||
                vehicle.specifications?.infotainment?.bluetooth !== undefined ||
                vehicle.specifications?.infotainment?.cargadorInalambrico !== undefined ||
                vehicle.specifications?.infotainment?.navegacionIntegrada !== undefined ||
                vehicle.specifications?.infotainment?.pantallaCentralTamano !== undefined ||
                vehicle.specifications?.infotainment?.pantallaCuadroTamano !== undefined ||
                vehicle.specifications?.infotainment?.potenciaAmplificador !== undefined ||
                vehicle.specifications?.infotainment?.puertosUSBA !== undefined ||
                vehicle.specifications?.infotainment?.puertosUSBC !== undefined ||
                vehicle.specifications?.infotainment?.wifiBordo !== undefined) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="sec-seguridad-adas">
              <div className="rounded-2xl shadow-soft p-6 bg-white">
                <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-xl">📱</span>
                  </div>
                      <h3 className="text-lg font-semibold text-gray-900">Infoentretenimiento y Conectividad</h3>
                  </div>
                  <div className="space-y-2">
                      {vehicle.specifications?.infotainment?.androidAuto && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Android Auto:</span>
                          <span className="font-medium">{vehicle.specifications.infotainment.androidAuto}</span>
                        </div>
                      )}
                      {vehicle.specifications?.infotainment?.appleCarPlay && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Apple CarPlay:</span>
                          <span className="font-medium">{vehicle.specifications.infotainment.appleCarPlay}</span>
                        </div>
                      )}
                      {vehicle.specifications?.infotainment?.appRemotaOTA !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">App remota / OTA:</span>
                          <span className="font-medium">{vehicle.specifications.infotainment.appRemotaOTA ? '✓ Sí' : '✗ No'}</span>
                        </div>
                      )}
                      {vehicle.specifications?.infotainment?.audioMarca && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Audio (marca):</span>
                          <span className="font-medium">{vehicle.specifications.infotainment.audioMarca}</span>
                        </div>
                      )}
                      {vehicle.specifications?.infotainment?.audioNumeroBocinas !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Audio (número de bocinas):</span>
                          <span className="font-medium">{vehicle.specifications.infotainment.audioNumeroBocinas}</span>
                        </div>
                      )}
                      {vehicle.specifications?.infotainment?.bluetooth !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bluetooth:</span>
                          <span className="font-medium">{vehicle.specifications.infotainment.bluetooth ? '✓ Sí' : '✗ No'}</span>
                    </div>
                      )}
                      {vehicle.specifications?.infotainment?.cargadorInalambrico !== undefined && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">Cargador inalámbrico:</span>
                          <span className="font-medium">{vehicle.specifications.infotainment.cargadorInalambrico ? '✓ Sí' : '✗ No'}</span>
                    </div>
                      )}
                      {vehicle.specifications?.infotainment?.navegacionIntegrada !== undefined && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">Navegación integrada:</span>
                          <span className="font-medium">{vehicle.specifications.infotainment.navegacionIntegrada ? '✓ Sí' : '✗ No'}</span>
                    </div>
                      )}
                      {vehicle.specifications?.infotainment?.pantallaCentralTamano !== undefined && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">Pantalla central (tamaño):</span>
                          <span className="font-medium">{vehicle.specifications.infotainment.pantallaCentralTamano} in</span>
                    </div>
                      )}
                      {vehicle.specifications?.infotainment?.pantallaCuadroTamano !== undefined && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">Pantalla de cuadro (tamaño):</span>
                          <span className="font-medium">{vehicle.specifications.infotainment.pantallaCuadroTamano} in</span>
                    </div>
                      )}
                      {vehicle.specifications?.infotainment?.potenciaAmplificador !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Potencia de amplificador:</span>
                          <span className="font-medium">{vehicle.specifications.infotainment.potenciaAmplificador} W</span>
                  </div>
                      )}
                      {vehicle.specifications?.infotainment?.puertosUSBA !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Puertos USB-A (cantidad):</span>
                          <span className="font-medium">{vehicle.specifications.infotainment.puertosUSBA}</span>
              </div>
                      )}
                      {vehicle.specifications?.infotainment?.puertosUSBC !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Puertos USB-C (cantidad):</span>
                          <span className="font-medium">{vehicle.specifications.infotainment.puertosUSBC}</span>
            </div>
                      )}
                      {vehicle.specifications?.infotainment?.wifiBordo !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Wi-Fi a bordo:</span>
                          <span className="font-medium">{vehicle.specifications.infotainment.wifiBordo ? '✓ Sí' : '✗ No'}</span>
          </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 13. Interior y confort */}
              {(vehicle.specifications?.comfort?.ajusteElectricoConductor !== undefined ||
                vehicle.specifications?.comfort?.ajusteElectricoPasajero !== undefined ||
                vehicle.specifications?.comfort?.calefaccionAsientos !== undefined ||
                vehicle.specifications?.comfort?.climatizadorZonas !== undefined ||
                vehicle.specifications?.comfort?.cristalesAcusticos !== undefined ||
                vehicle.specifications?.comfort?.iluminacionAmbiental !== undefined ||
                vehicle.specifications?.comfort?.masajeAsientos !== undefined ||
                vehicle.specifications?.comfort?.materialAsientos ||
                vehicle.specifications?.comfort?.memoriaAsientos !== undefined ||
                vehicle.specifications?.comfort?.parabrisasCalefactable !== undefined ||
                vehicle.specifications?.comfort?.segundaFilaCorrediza !== undefined ||
                vehicle.specifications?.comfort?.techoPanoramico !== undefined ||
                vehicle.specifications?.comfort?.terceraFilaAsientos !== undefined ||
                vehicle.specifications?.comfort?.tomas12V120V !== undefined ||
                vehicle.specifications?.comfort?.tomacorrienteEnCaja !== undefined ||
                vehicle.specifications?.comfort?.ventilacionAsientos !== undefined ||
                vehicle.specifications?.comfort?.vidriosElectricos !== undefined ||
                vehicle.specifications?.comfort?.volanteMaterialAjustes ||
                vehicle.specifications?.comfort?.volanteCalefactable !== undefined) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl shadow-soft p-6 bg-white">
                <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-xl">🛋️</span>
                  </div>
                      <h3 className="text-lg font-semibold text-gray-900">Interior y confort</h3>
                </div>
                <div className="space-y-2">
                      {vehicle.specifications?.comfort?.ajusteElectricoConductor !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Ajuste eléctrico conductor (vías):</span>
                          <span className="font-medium">{vehicle.specifications.comfort.ajusteElectricoConductor}</span>
                  </div>
                      )}
                      {vehicle.specifications?.comfort?.ajusteElectricoPasajero !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Ajuste eléctrico pasajero (vías):</span>
                          <span className="font-medium">{vehicle.specifications.comfort.ajusteElectricoPasajero}</span>
                  </div>
                      )}
                      {vehicle.specifications?.comfort?.calefaccionAsientos !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Calefacción de asientos:</span>
                          <span className="font-medium">{vehicle.specifications.comfort.calefaccionAsientos ? '✓ Sí' : '✗ No'}</span>
                </div>
                      )}
                      {vehicle.specifications?.comfort?.climatizadorZonas !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Climatizador (zonas):</span>
                          <span className="font-medium">{vehicle.specifications.comfort.climatizadorZonas}</span>
              </div>
                      )}
                      {vehicle.specifications?.comfort?.cristalesAcusticos !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cristales acústicos:</span>
                          <span className="font-medium">{vehicle.specifications.comfort.cristalesAcusticos ? '✓ Sí' : '✗ No'}</span>
                  </div>
                      )}
                      {vehicle.specifications?.comfort?.iluminacionAmbiental !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Iluminación ambiental:</span>
                          <span className="font-medium">{vehicle.specifications.comfort.iluminacionAmbiental ? '✓ Sí' : '✗ No'}</span>
                </div>
                      )}
                      {vehicle.specifications?.comfort?.masajeAsientos !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Masaje en asientos:</span>
                          <span className="font-medium">{vehicle.specifications.comfort.masajeAsientos ? '✓ Sí' : '✗ No'}</span>
                  </div>
                      )}
                      {vehicle.specifications?.comfort?.materialAsientos && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Material de asientos:</span>
                          <span className="font-medium">{vehicle.specifications.comfort.materialAsientos}</span>
                  </div>
                      )}
                      {vehicle.specifications?.comfort?.memoriaAsientos !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Memoria de asientos:</span>
                          <span className="font-medium">{vehicle.specifications.comfort.memoriaAsientos ? '✓ Sí' : '✗ No'}</span>
                  </div>
                      )}
                      {vehicle.specifications?.comfort?.parabrisasCalefactable !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Parabrisas calefactable:</span>
                          <span className="font-medium">{vehicle.specifications.comfort.parabrisasCalefactable ? '✓ Sí' : '✗ No'}</span>
                  </div>
                      )}
                      {vehicle.specifications?.comfort?.segundaFilaCorrediza !== undefined && (
                  <div className="flex justify-between">
                          <span className="text-gray-600">Segunda fila corrediza:</span>
                          <span className="font-medium">{vehicle.specifications.comfort.segundaFilaCorrediza ? '✓ Sí' : '✗ No'}</span>
                  </div>
                      )}
                      {vehicle.specifications?.comfort?.techoPanoramico !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Techo panorámico:</span>
                          <span className="font-medium">{vehicle.specifications.comfort.techoPanoramico ? '✓ Sí' : '✗ No'}</span>
                </div>
                      )}
                      {vehicle.specifications?.comfort?.terceraFilaAsientos !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tercera fila de asientos:</span>
                          <span className="font-medium">{vehicle.specifications.comfort.terceraFilaAsientos ? '✓ Sí' : '✗ No'}</span>
              </div>
                      )}
                      {vehicle.specifications?.comfort?.tomas12V120V !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tomas 12 V/120 V:</span>
                          <span className="font-medium">{vehicle.specifications.comfort.tomas12V120V}</span>
                        </div>
                      )}
                      {vehicle.specifications?.comfort?.tomacorrienteEnCaja !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tomacorriente en caja (pick-up):</span>
                          <span className="font-medium">{vehicle.specifications.comfort.tomacorrienteEnCaja ? '✓ Sí' : '✗ No'}</span>
                        </div>
                      )}
                      {vehicle.specifications?.comfort?.ventilacionAsientos !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ventilación de asientos:</span>
                          <span className="font-medium">{vehicle.specifications.comfort.ventilacionAsientos ? '✓ Sí' : '✗ No'}</span>
                        </div>
                      )}
                      {vehicle.specifications?.comfort?.vidriosElectricos !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Vidrios eléctricos (del/tras):</span>
                          <span className="font-medium">{vehicle.specifications.comfort.vidriosElectricos ? '✓ Sí' : '✗ No'}</span>
                        </div>
                      )}
                      {vehicle.specifications?.comfort?.volanteMaterialAjustes && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Volante (material y ajustes):</span>
                          <span className="font-medium">{vehicle.specifications.comfort.volanteMaterialAjustes}</span>
                        </div>
                      )}
                      {vehicle.specifications?.comfort?.volanteCalefactable !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Volante calefactable:</span>
                          <span className="font-medium">{vehicle.specifications.comfort.volanteCalefactable ? '✓ Sí' : '✗ No'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
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
