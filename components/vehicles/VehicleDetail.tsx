'use client';

import { useState } from 'react';
import { VehicleHero } from './VehicleHero';
import { VehicleSpecifications } from './VehicleSpecifications';
import { VehicleCategories } from './VehicleCategories';
import { VehicleMetrics } from './VehicleMetrics';
import { VehicleGallery } from './VehicleGallery';
import { SimilarVehicles } from './SimilarVehicles';
import { ScrollToTop } from '@/components/ui/ScrollToTop';

interface VehicleDetailProps {
  vehicle: any; // Using any for now due to complex type
}

export function VehicleDetail({ vehicle }: VehicleDetailProps) {
  // Función para renderizar la sección de motor según el tipo de combustible
  const renderEngineSection = () => {
    const fuelType = (vehicle.specifications?.general?.fuelType || vehicle.fuelType)?.toLowerCase();
    
    
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
            {/* Campos básicos - siempre visibles */}
            <div className="flex justify-between">
              <span className="text-gray-600">Capacidad de Batería:</span>
              <span className="font-medium">{vehicle.specifications?.electric?.batteryCapacity || 'N/A'} kWh</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Índice Conveniencia Carga:</span>
              <span className="font-medium">{vehicle.specifications?.electric?.chargingConvenienceIndex || 'N/A'}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Frenado Regenerativo:</span>
              <span className="font-medium">{vehicle.specifications?.electric?.regenerativeBraking ? '✓ Sí' : '✗ No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Peso de Batería:</span>
              <span className="font-medium">{vehicle.specifications?.electric?.batteryWeight || 'N/A'} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Costo de Batería:</span>
              <span className="font-medium">${vehicle.specifications?.electric?.batteryCost?.toLocaleString() || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Costo Cargador Hogar:</span>
              <span className="font-medium">${vehicle.specifications?.electric?.homeChargerCost?.toLocaleString() || 'N/A'}</span>
            </div>
          </div>
        </div>
      );
    } else if (fuelType === 'híbrido' || fuelType === 'hybrid' || fuelType === 'hev') {
      return (
        <div className="rounded-2xl shadow-soft p-6 bg-white">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-xl">🔋</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Motor Híbrido</h3>
          </div>
          <div className="space-y-2">
            {/* Campos básicos - siempre visibles */}
            <div className="flex justify-between">
              <span className="text-gray-600">Potencia Máxima:</span>
              <span className="font-medium">{vehicle.specifications?.hybrid?.maxPower || 'N/A'} HP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tipo de Transmisión:</span>
              <span className="font-medium">{vehicle.specifications?.hybrid?.transmissionType || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Capacidad del Tanque:</span>
              <span className="font-medium">{vehicle.specifications?.hybrid?.fuelTankCapacity || 'N/A'} L</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Frenado Regenerativo:</span>
              <span className="font-medium">{vehicle.specifications?.hybrid?.regenerativeBraking ? '✓ Sí' : '✗ No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sistema Start-Stop:</span>
              <span className="font-medium">{vehicle.specifications?.hybrid?.startStop ? '✓ Sí' : '✗ No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Modo Ecológico:</span>
              <span className="font-medium">{vehicle.specifications?.hybrid?.ecoMode ? '✓ Sí' : '✗ No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cilindraje:</span>
              <span className="font-medium">{vehicle.specifications?.hybrid?.displacement || 'N/A'} cc</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Configuración:</span>
              <span className="font-medium">{vehicle.specifications?.hybrid?.engineConfiguration || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Torque Máximo:</span>
              <span className="font-medium">{vehicle.specifications?.hybrid?.maxTorque || 'N/A'} Nm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Número de Marchas:</span>
              <span className="font-medium">{vehicle.specifications?.hybrid?.gears || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Capacidad de Batería:</span>
              <span className="font-medium">{vehicle.specifications?.hybrid?.batteryCapacity || 'N/A'} kWh</span>
            </div>
          </div>
        </div>
      );
    } else if (fuelType === 'phev' || fuelType === 'plug-in hybrid') {
      return (
        <div className="rounded-2xl shadow-soft p-6 bg-white">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-xl">🔌</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Motor PHEV</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Cilindraje:</span>
              <span className="font-medium">{vehicle.specifications?.phev?.displacement || 'N/A'} cc</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Configuración:</span>
              <span className="font-medium">{vehicle.specifications?.phev?.engineConfiguration || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Potencia Máxima:</span>
              <span className="font-medium">{vehicle.specifications?.phev?.maxPower || 'N/A'} HP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Torque Máximo:</span>
              <span className="font-medium">{vehicle.specifications?.phev?.maxTorque || 'N/A'} Nm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tipo de Transmisión:</span>
              <span className="font-medium">{vehicle.specifications?.phev?.transmissionType || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Capacidad del Tanque:</span>
              <span className="font-medium">{vehicle.specifications?.phev?.fuelTankCapacity || 'N/A'} L</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Capacidad de Batería:</span>
              <span className="font-medium">{vehicle.specifications?.phev?.batteryCapacity || 'N/A'} kWh</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Autonomía Eléctrica:</span>
              <span className="font-medium">{vehicle.specifications?.phev?.electricRange || 'N/A'} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tiempo Carga AC:</span>
              <span className="font-medium">{vehicle.specifications?.phev?.acChargingTime || 'N/A'} h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tiempo Carga DC:</span>
              <span className="font-medium">{vehicle.specifications?.phev?.dcChargingTime || 'N/A'} h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Frenado Regenerativo:</span>
              <span className="font-medium">{vehicle.specifications?.phev?.regenerativeBraking ? '✓ Sí' : '✗ No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Peso de Batería:</span>
              <span className="font-medium">{vehicle.specifications?.phev?.batteryWeight || 'N/A'} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Costo Cargador Hogar:</span>
              <span className="font-medium">${vehicle.specifications?.phev?.homeChargerCost?.toLocaleString() || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Índice Conveniencia Carga:</span>
              <span className="font-medium">{vehicle.specifications?.phev?.chargingConvenienceIndex || 'N/A'}/100</span>
            </div>
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
            {/* Campos básicos - siempre visibles */}
            <div className="flex justify-between">
              <span className="text-gray-600">Tipo de transmisión:</span>
              <span className="font-medium">{vehicle.specifications?.combustion?.transmissionType || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Número de marchas:</span>
              <span className="font-medium">{vehicle.specifications?.combustion?.gears || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Capacidad del tanque:</span>
              <span className="font-medium">{vehicle.specifications?.combustion?.fuelTankCapacity || 'N/A'} L</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sistema start-stop:</span>
              <span className="font-medium">{vehicle.specifications?.combustion?.startStop ? '✓ Sí' : '✗ No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Modo ecológico:</span>
              <span className="font-medium">{vehicle.specifications?.combustion?.ecoMode ? '✓ Sí' : '✗ No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cilindraje:</span>
              <span className="font-medium">{vehicle.specifications?.combustion?.displacement || 'N/A'} cc</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Configuración:</span>
              <span className="font-medium">{vehicle.specifications?.combustion?.engineConfiguration || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tipo de inducción:</span>
              <span className="font-medium">{vehicle.specifications?.combustion?.inductionType || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Relación de compresión:</span>
              <span className="font-medium">{vehicle.specifications?.combustion?.compressionRatio || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Límite de RPM:</span>
              <span className="font-medium">{vehicle.specifications?.combustion?.rpmLimit || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Turbo:</span>
              <span className="font-medium">{vehicle.specifications?.combustion?.turbo ? '✓ Sí' : '✗ No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Supercargador:</span>
              <span className="font-medium">{vehicle.specifications?.combustion?.supercharger ? '✓ Sí' : '✗ No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Potencia a RPM:</span>
              <span className="font-medium">{vehicle.specifications?.combustion?.powerAtRpm || 'N/A'} HP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estándar de Emisiones:</span>
              <span className="font-medium">{vehicle.specifications?.combustion?.emissionStandard || 'N/A'}</span>
            </div>
          </div>
        </div>
      );
    }
  };

  // Función para renderizar la sección de consumo según el tipo de combustible
  const renderConsumptionSection = () => {
    const fuelType = (vehicle.specifications?.general?.fuelType || vehicle.fuelType)?.toLowerCase();
    
    
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
            <div className="flex justify-between">
              <span className="text-gray-600">Consumo Ciudad:</span>
              <span className="font-medium">{vehicle.specifications?.electric?.cityElectricConsumption || 'N/A'} kWh/100km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Consumo Carretera:</span>
              <span className="font-medium">{vehicle.specifications?.electric?.highwayElectricConsumption || 'N/A'} kWh/100km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">MPGe:</span>
              <span className="font-medium">{vehicle.specifications?.electric?.mpge || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Autonomía Eléctrica:</span>
              <span className="font-medium">{vehicle.specifications?.electric?.electricRange || 'N/A'} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tiempo Carga AC:</span>
              <span className="font-medium">{vehicle.specifications?.electric?.acChargingTime || 'N/A'} h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tiempo Carga DC:</span>
              <span className="font-medium">{vehicle.specifications?.electric?.dcChargingTime || 'N/A'} h</span>
            </div>
          </div>
        </div>
      );
    } else if (fuelType === 'híbrido' || fuelType === 'hybrid' || fuelType === 'hev') {
      return (
        <div className="rounded-2xl shadow-soft p-6 bg-white">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-xl">🔋</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Consumo Híbrido</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Consumo Ciudad:</span>
              <span className="font-medium">{vehicle.specifications?.hybrid?.cityConsumption || 'N/A'} L/100km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Consumo Carretera:</span>
              <span className="font-medium">{vehicle.specifications?.hybrid?.highwayConsumption || 'N/A'} L/100km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Autonomía:</span>
              <span className="font-medium">
                {vehicle.specifications?.hybrid?.fuelTankCapacity ? 
                  Math.round((vehicle.specifications.hybrid.fuelTankCapacity * 100) / (vehicle.specifications.hybrid.cityConsumption || 10)) : 
                  'N/A'} km
              </span>
            </div>
          </div>
        </div>
      );
    } else if (fuelType === 'phev' || fuelType === 'plug-in hybrid') {
      return (
        <div className="rounded-2xl shadow-soft p-6 bg-white">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-xl">🔌</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Consumo PHEV</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Consumo Ciudad:</span>
              <span className="font-medium">{vehicle.specifications?.phev?.cityConsumption || 'N/A'} L/100km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Consumo Carretera:</span>
              <span className="font-medium">{vehicle.specifications?.phev?.highwayConsumption || 'N/A'} L/100km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Autonomía Combustible:</span>
              <span className="font-medium">
                {vehicle.specifications?.phev?.fuelTankCapacity ? 
                  Math.round((vehicle.specifications.phev.fuelTankCapacity * 100) / (vehicle.specifications.phev.cityConsumption || 10)) : 
                  'N/A'} km
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Autonomía Eléctrica:</span>
              <span className="font-medium">{vehicle.specifications?.phev?.electricRange || 'N/A'} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tiempo Carga AC:</span>
              <span className="font-medium">{vehicle.specifications?.phev?.acChargingTime || 'N/A'} h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tiempo Carga DC:</span>
              <span className="font-medium">{vehicle.specifications?.phev?.dcChargingTime || 'N/A'} h</span>
            </div>
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
            <div className="flex justify-between">
              <span className="text-gray-600">Ciudad:</span>
              <span className="font-medium">{vehicle.specifications?.combustion?.cityConsumption || 'N/A'} L/100km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Carretera:</span>
              <span className="font-medium">{vehicle.specifications?.combustion?.highwayConsumption || 'N/A'} L/100km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Consumo mixto:</span>
              <span className="font-medium">{vehicle.specifications?.combustion?.mixedConsumption || 'N/A'} L/100km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Autonomía:</span>
              <span className="font-medium">
                {vehicle.specifications?.combustion?.fuelTankCapacity ? 
                  Math.round((vehicle.specifications.combustion.fuelTankCapacity * 100) / (vehicle.specifications.combustion.cityConsumption || 10)) : 
                  'N/A'} km
              </span>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Hero Section */}
      <VehicleHero vehicle={vehicle} />
      
      {/* Main Content */}
      <div className="w-full px-4 py-8">
        
        {/* Section 1: Main Content - Specifications and Dealerships */}
        <section className="mb-16">
          <div className="max-w-7xl mx-auto">
            <VehicleSpecifications vehicle={vehicle} />
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
                  onClick={() => {
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
                    const message = `Hola, me interesa el vehículo ${vehicleLabel}. Mi nombre es ${name} y quiero hacer el testdrive desde mi casa.`;
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
        
        {/* Section 3: Detailed Specifications */}
        <section className="mb-16">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Especificaciones y Valoraciones
                </h2>
              </div>
              
              {/* Specifications Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* General Information */}
                <div className="rounded-2xl shadow-soft p-6 bg-white">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-lg">i</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Información General</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Marca:</span>
                      <span className="font-medium">{vehicle.specifications?.general?.brand || vehicle.brand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Modelo:</span>
                      <span className="font-medium">{vehicle.specifications?.general?.model || vehicle.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Año:</span>
                      <span className="font-medium">{vehicle.specifications?.general?.year || vehicle.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Precio:</span>
                      <span className="font-medium">${vehicle.price?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo de Combustible:</span>
                      <span className="font-medium">{vehicle.specifications?.general?.fuelType || vehicle.fuelType || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo de Vehículo:</span>
                      <span className="font-medium">{vehicle.specifications?.general?.vehicleType || vehicle.vehicleType || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Categoría:</span>
                      <span className="font-medium">{vehicle.specifications?.general?.category || vehicle.type || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estado:</span>
                      <span className="font-medium">{vehicle.status}</span>
                    </div>
                  </div>
                </div>

                {/* Performance */}
                <div className="rounded-2xl shadow-soft p-6 bg-white">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xl">⚡</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Rendimiento</h3>
                  </div>
                  <div className="space-y-2">
                    {/* Campos básicos - siempre visibles */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">0-100 km/h:</span>
                      <span className="font-medium">{vehicle.specifications?.performance?.acceleration0to100 || 'N/A'} seg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Velocidad Máxima:</span>
                      <span className="font-medium">{vehicle.specifications?.performance?.maxSpeed || 'N/A'} km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">0-200 km/h:</span>
                      <span className="font-medium">{vehicle.specifications?.performance?.acceleration0to200 || 'N/A'} seg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cuarto de milla:</span>
                      <span className="font-medium">{vehicle.specifications?.performance?.quarterMile || 'N/A'} seg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Adelantamiento 80-120:</span>
                      <span className="font-medium">{vehicle.specifications?.performance?.overtaking80to120 || 'N/A'} seg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Potencia-peso:</span>
                      <span className="font-medium">{vehicle.specifications?.performance?.powerToWeight || 'N/A'} HP/ton</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Control de lanzamiento:</span>
                      <span className="font-medium">{vehicle.specifications?.performance?.launchControl ? '✓ Sí' : '✗ No'}</span>
                    </div>
                    
                    {/* Campos de potencia y torque - siempre visibles */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Potencia:</span>
                      <span className="font-medium">{vehicle.specifications?.combustion?.maxPower || vehicle.specifications?.hybrid?.maxPower || vehicle.specifications?.phev?.maxPower || 'N/A'} HP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Torque:</span>
                      <span className="font-medium">{vehicle.specifications?.combustion?.maxTorque || vehicle.specifications?.hybrid?.maxTorque || vehicle.specifications?.phev?.maxTorque || 'N/A'} Nm</span>
                    </div>
                  </div>
                </div>

                {/* Engine - Renderizado dinámico según tipo de combustible */}
                {renderEngineSection()}
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Additional Specifications */}
        <section className="mb-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Consumption - Renderizado dinámico según tipo de combustible */}
              {renderConsumptionSection()}

              {/* Dimensions */}
              <div className="rounded-2xl shadow-soft p-6 bg-white">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-wise rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xl">📏</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Dimensiones</h3>
                </div>
                <div className="space-y-2">
                  {/* Campos básicos - siempre visibles */}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Longitud:</span>
                    <span className="font-medium">{vehicle.specifications?.dimensions?.length || 'N/A'} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ancho:</span>
                    <span className="font-medium">{vehicle.specifications?.dimensions?.width || 'N/A'} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Altura:</span>
                    <span className="font-medium">{vehicle.specifications?.dimensions?.height || 'N/A'} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Peso:</span>
                    <span className="font-medium">{vehicle.specifications?.dimensions?.curbWeight || 'N/A'} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Distancia entre Ejes:</span>
                    <span className="font-medium">{vehicle.specifications?.dimensions?.wheelbase || 'N/A'} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacidad de carga:</span>
                    <span className="font-medium">{vehicle.specifications?.dimensions?.cargoCapacity || 'N/A'} L</span>
                  </div>
                </div>
              </div>

              {/* Weight & Capacities */}
              <div className="rounded-2xl shadow-soft p-6 bg-white">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xl">⚖️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Peso y Capacidades</h3>
                </div>
                <div className="space-y-2">
                  {/* Campos básicos - siempre visibles */}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Carga útil:</span>
                    <span className="font-medium">{vehicle.specifications?.weight?.payload || 'N/A'} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Volumen caja carga:</span>
                    <span className="font-medium">{vehicle.specifications?.weight?.cargoBoxVolume || 'N/A'} L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Peso bruto combinado:</span>
                    <span className="font-medium">{vehicle.specifications?.weight?.grossCombinedWeight || 'N/A'} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacidad de remolque:</span>
                    <span className="font-medium">{vehicle.specifications?.weight?.towingCapacity || 'N/A'} kg</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Interior & Chassis */}
        <section className="mb-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Interior */}
              <div className="rounded-2xl shadow-soft p-6 bg-white">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-wise rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xl">🚪</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Interior</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Maletero asientos abajo:</span>
                    <span className="font-medium">{vehicle.specifications?.interior?.trunkCapacitySeatsDown || 'N/A'} L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Filas de asientos:</span>
                    <span className="font-medium">{vehicle.specifications?.interior?.seatRows || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacidad cargo interior:</span>
                    <span className="font-medium">{vehicle.specifications?.interior?.interiorCargoCapacity || 'N/A'} L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacidad de pasajeros:</span>
                    <span className="font-medium">{vehicle.specifications?.interior?.passengerCapacity || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Chassis */}
              <div className="rounded-2xl shadow-soft p-6 bg-white">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xl">🔧</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Chasis</h3>
                </div>
                <div className="space-y-2">
                  {/* Campos básicos - siempre visibles */}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Distancia al suelo:</span>
                    <span className="font-medium">{vehicle.specifications?.chassis?.groundClearance || 'N/A'} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frenado 100-0 km/h:</span>
                    <span className="font-medium">{vehicle.specifications?.chassis?.brakingDistance100to0 || 'N/A'} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Aceleración lateral máx:</span>
                    <span className="font-medium">{vehicle.specifications?.chassis?.maxLateralAcceleration || 'N/A'} g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Aceleración longitudinal máx:</span>
                    <span className="font-medium">{vehicle.specifications?.chassis?.maxLongitudinalAcceleration || 'N/A'} g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo de setup de suspensión:</span>
                    <span className="font-medium">{vehicle.specifications?.chassis?.suspensionSetup || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Off-Road - Solo se muestra si el vehículo es tipo Todoterreno y tiene datos */}
              {vehicle.vehicleType === 'Todoterreno' && vehicle.specifications?.offRoad && (
                <div className="rounded-2xl shadow-soft p-6 bg-white">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xl">🏔️</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Off-Road</h3>
                  </div>
                  <div className="space-y-2">
                    {/* Campos básicos - siempre visibles */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ángulo de aproximación:</span>
                      <span className="font-medium">{vehicle.specifications?.offRoad?.approachAngle || 'N/A'}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ángulo de salida:</span>
                      <span className="font-medium">{vehicle.specifications?.offRoad?.departureAngle || 'N/A'}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Profundidad de vadeo:</span>
                      <span className="font-medium">{vehicle.specifications?.offRoad?.wadingDepth || 'N/A'} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Altura de vadeo:</span>
                      <span className="font-medium">{vehicle.specifications?.offRoad?.wadingHeight || 'N/A'} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ángulo de ruptura:</span>
                      <span className="font-medium">{vehicle.specifications?.offRoad?.breakoverAngle || 'N/A'}°</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 6: Safety, Comfort & Technology */}
        <section className="mb-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Safety */}
              <div className="rounded-2xl shadow-soft p-6 bg-white">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xl">🛡️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Seguridad</h3>
                </div>
                <div className="space-y-2">
                  {/* Campos básicos - siempre visibles */}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Airbags:</span>
                    <span className="font-medium">{vehicle.specifications?.safety?.airbags || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Calificación NCAP:</span>
                    <span className="font-medium">{vehicle.specifications?.safety?.ncapRating || 'N/A'} ⭐</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo de frenos:</span>
                    <span className="font-medium">{vehicle.specifications?.safety?.brakeType || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sistema de frenado:</span>
                    <span className="font-medium">
                      {vehicle.specifications?.safety?.brakingSystem?.join(', ') || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Control de Estabilidad:</span>
                    <span className="font-medium">{vehicle.specifications?.safety?.stabilityControl ? '✓ Sí' : '✗ No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Control de Tracción:</span>
                    <span className="font-medium">{vehicle.specifications?.safety?.tractionControl ? '✓ Sí' : '✗ No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frenado de Emergencia:</span>
                    <span className="font-medium">{vehicle.specifications?.safety?.autonomousEmergencyBraking ? '✓ Sí' : '✗ No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Advertencia Colisión:</span>
                    <span className="font-medium">{vehicle.specifications?.safety?.forwardCollisionWarning ? '✓ Sí' : '✗ No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Asistente de Carril:</span>
                    <span className="font-medium">{vehicle.specifications?.safety?.laneAssist ? '✓ Sí' : '✗ No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Control de Crucero:</span>
                    <span className="font-medium">{vehicle.specifications?.safety?.adaptiveCruiseControl ? '✓ Sí' : '✗ No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Detección Punto Ciego:</span>
                    <span className="font-medium">{vehicle.specifications?.safety?.blindSpotDetection ? '✓ Sí' : '✗ No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Alerta Tráfico Cruzado:</span>
                    <span className="font-medium">{vehicle.specifications?.safety?.crossTrafficAlert ? '✓ Sí' : '✗ No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monitor de Fatiga:</span>
                    <span className="font-medium">{vehicle.specifications?.safety?.fatigueMonitor ? '✓ Sí' : '✗ No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monitoreo Presión:</span>
                    <span className="font-medium">{vehicle.specifications?.safety?.tirePressureMonitoring ? '✓ Sí' : '✗ No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Puntuación Adultos:</span>
                    <span className="font-medium">{vehicle.specifications?.safety?.adultSafetyScore || 'N/A'}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Puntuación Niños:</span>
                    <span className="font-medium">{vehicle.specifications?.safety?.childSafetyScore || 'N/A'}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Puntuación Asistencia:</span>
                    <span className="font-medium">{vehicle.specifications?.safety?.assistanceScore || 'N/A'}/100</span>
                  </div>
                </div>
              </div>

              {/* Comfort */}
              <div className="rounded-2xl shadow-soft p-6 bg-white">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xl">🛋️</span>
                  </div>
                                      <h3 className="text-lg font-semibold text-gray-900">Confort</h3>
                  </div>
                  <div className="space-y-2">
                    {/* Campos básicos - siempre visibles */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Aire Acondicionado:</span>
                      <span className="font-medium">{vehicle.specifications?.comfort?.airConditioning ? '✓ Sí' : '✗ No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Control de Clima:</span>
                      <span className="font-medium">{vehicle.specifications?.comfort?.automaticClimateControl ? '✓ Sí' : '✗ No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Asientos Calefaccionados:</span>
                      <span className="font-medium">{vehicle.specifications?.comfort?.heatedSeats ? '✓ Sí' : '✗ No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Asientos Ventilados:</span>
                      <span className="font-medium">{vehicle.specifications?.comfort?.ventilatedSeats ? '✓ Sí' : '✗ No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Asientos con Masaje:</span>
                      <span className="font-medium">{vehicle.specifications?.comfort?.massageSeats ? '✓ Sí' : '✗ No'}</span>
                    </div>
                  </div>
              </div>

              {/* Technology */}
              <div className="rounded-2xl shadow-soft p-6 bg-white">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xl">💻</span>
                  </div>
                                      <h3 className="text-lg font-semibold text-gray-900">Tecnología</h3>
                  </div>
                  <div className="space-y-2">
                    {/* Campos básicos - siempre visibles */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bluetooth:</span>
                      <span className="font-medium">{vehicle.specifications?.technology?.bluetooth ? '✓ Sí' : '✗ No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pantalla Táctil:</span>
                      <span className="font-medium">{vehicle.specifications?.technology?.touchscreen ? '✓ Sí' : '✗ No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Integración Smartphone:</span>
                      <span className="font-medium">
                        {vehicle.specifications?.technology?.smartphoneIntegration?.join(', ') || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sistema de Navegación:</span>
                      <span className="font-medium">{vehicle.specifications?.technology?.navigation ? '✓ Sí' : '✗ No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cargador Inalámbrico:</span>
                      <span className="font-medium">{vehicle.specifications?.technology?.wirelessCharger ? '✓ Sí' : '✗ No'}</span>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: Lighting & Assistance */}
        <section className="mb-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Lighting */}
              <div className="rounded-2xl shadow-soft p-6 bg-white">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xl">💡</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Iluminación</h3>
                </div>
                <div className="space-y-2">
                  {/* Campos básicos - siempre visibles */}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo de Faros:</span>
                    <span className="font-medium">{vehicle.specifications?.lighting?.headlightType || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Luz Alta Automática:</span>
                    <span className="font-medium">{vehicle.specifications?.lighting?.automaticHighBeam ? '✓ Sí' : '✗ No'}</span>
                  </div>
                </div>
              </div>

              {/* Assistance */}
              <div className="rounded-2xl shadow-soft p-6 bg-white">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xl">🤝</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Asistencia</h3>
                </div>
                <div className="space-y-2">
                  {/* Campos básicos - siempre visibles */}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Asistencia de Frenado:</span>
                    <span className="font-medium">{vehicle.specifications?.assistance?.brakeAssist ? '✓ Sí' : '✗ No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cámara de Reversa:</span>
                    <span className="font-medium">{vehicle.specifications?.assistance?.reverseCamera ? '✓ Sí' : '✗ No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Asistente en Pendiente:</span>
                    <span className="font-medium">{vehicle.specifications?.assistance?.hillStartAssist ? '✓ Sí' : '✗ No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sensores de Estacionamiento:</span>
                    <span className="font-medium">{vehicle.specifications?.assistance?.parkingSensors ? '✓ Sí' : '✗ No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cámaras 360°:</span>
                    <span className="font-medium">{vehicle.specifications?.assistance?.cameras360 ? '✓ Sí' : '✗ No'}</span>
                  </div>
                </div>
              </div>
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
                onClick={() => {
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
          vehicles={vehicle.similarVehicles} 
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
    </div>
  );
}

