'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VehicleComparisonData } from '@/lib/schemas/compareSchema';
import { TrendingUp, Zap, Shield, Smartphone, Star, Users, Package, Fuel, Battery, Settings, Droplets, Scale } from 'lucide-react';

interface CompareCardsProps {
  vehicles: VehicleComparisonData[];
}

export function CompareCards({ vehicles }: CompareCardsProps) {
  const [vehiclesWithSpecs, setVehiclesWithSpecs] = useState<VehicleComparisonData[]>([]);
  const [loading, setLoading] = useState(true);

  // Función para determinar qué métricas mostrar según el tipo de combustible
  const getRelevantMetrics = (fuelType: string) => {
    const baseMetrics = [
      { key: 'power', label: 'Potencia', icon: TrendingUp, show: true },
      { key: 'acceleration', label: '0-100', icon: Zap, show: true },
      { key: 'torque', label: 'Torque Máximo', icon: TrendingUp, show: fuelType !== 'Eléctrico' },
      { key: 'maxSpeed', label: 'Vel. Máx', icon: Zap, show: true },
      { key: 'passengers', label: 'Pasajeros', icon: Users, show: true },
      { key: 'cargo', label: 'Carga', icon: Package, show: true },
      { key: 'cityConsumption', label: 'Ciudad', icon: Fuel, show: true },
      { key: 'highwayConsumption', label: 'Carretera', icon: Fuel, show: true },
      { key: 'displacement', label: 'Cilindraje', icon: Settings, show: fuelType !== 'Eléctrico' },
      { key: 'fuelTank', label: 'Tanque', icon: Droplets, show: fuelType !== 'Eléctrico' },
      { key: 'weight', label: 'Peso', icon: Scale, show: true },
      { key: 'electricRange', label: 'Autonomía', icon: Battery, show: fuelType === 'Eléctrico' || fuelType === 'Híbrido Enchufable' },
      { key: 'gears', label: 'Marchas', icon: Settings, show: fuelType !== 'Eléctrico' },
      { key: 'value', label: 'Valor', icon: Star, show: true }
    ];

    return baseMetrics.filter(metric => metric.show);
  };

  // Función helper para obtener valor desde una ruta
  const getValueFromPath = (specs: any, path: string): any => {
    if (!specs) return null;
    const keys = path.split('.');
    let value = specs;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return null;
      }
    }
    return value !== null && value !== undefined ? value : null;
  };

  // Función para obtener el valor de una métrica específica según el tipo de combustible
  const getMetricValue = (vehicle: VehicleComparisonData, metricKey: string) => {
    const { specifications, fuelType } = vehicle;
    if (!specifications) return 'N/A';
    
    switch (metricKey) {
      case 'power':
        if (fuelType === 'Eléctrico') {
          let power = getValueFromPath(specifications, 'powertrain.potenciaMaxEV') || 
                     getValueFromPath(specifications, 'powertrain.potenciaMaxMotorTermico');
          // Si la potencia es muy grande (>500), probablemente está en kW, convertir a HP (1 kW ≈ 1.34 HP)
          if (power && power > 500) {
            power = Math.round(power * 1.34);
          }
          return power ? `${Math.round(power)} HP` : 'N/A';
        } else if (fuelType === 'Híbrido' || fuelType === 'Híbrido Enchufable') {
          let power = getValueFromPath(specifications, 'powertrain.potenciaMaxSistemaHibrido') || 
                     getValueFromPath(specifications, 'powertrain.potenciaMaxMotorTermico') ||
                     getValueFromPath(specifications, 'powertrain.potenciaMaxEV');
          // Si la potencia es muy grande (>500), probablemente está en kW, convertir a HP
          if (power && power > 500) {
            power = Math.round(power * 1.34);
          }
          return power ? `${Math.round(power)} HP` : 'N/A';
        } else {
          let power = getValueFromPath(specifications, 'powertrain.potenciaMaxMotorTermico') || 
                     getValueFromPath(specifications, 'powertrain.potenciaMaxEV');
          // Si la potencia es muy grande (>500), probablemente está en kW, convertir a HP
          if (power && power > 500) {
            power = Math.round(power * 1.34);
          }
          return power ? `${Math.round(power)} HP` : 'N/A';
        }
      
      case 'acceleration':
        const acc = getValueFromPath(specifications, 'performance.acceleration0to100');
        return acc ? `${acc.toFixed(1)}s` : 'N/A';
      
      case 'torque':
        if (fuelType === 'Eléctrico') {
          const torque = getValueFromPath(specifications, 'powertrain.torqueMaxEV');
          return torque ? `${Math.round(torque)} Nm` : 'N/A';
        } else if (fuelType === 'Híbrido' || fuelType === 'Híbrido Enchufable') {
          const torque = getValueFromPath(specifications, 'powertrain.torqueMaxSistemaHibrido') || 
                        getValueFromPath(specifications, 'powertrain.torqueMaxMotorTermico') ||
                        getValueFromPath(specifications, 'powertrain.torqueMaxEV');
          return torque ? `${Math.round(torque)} Nm` : 'N/A';
        } else {
          const torque = getValueFromPath(specifications, 'powertrain.torqueMaxMotorTermico') || 
                        getValueFromPath(specifications, 'powertrain.torqueMaxEV');
          return torque ? `${Math.round(torque)} Nm` : 'N/A';
        }
      
      case 'maxSpeed':
        const speed = getValueFromPath(specifications, 'performance.maxSpeed');
        return speed ? `${Math.round(speed)} km/h` : 'N/A';
      
      case 'passengers':
        const passengers = getValueFromPath(specifications, 'interior.passengerCapacity') || 
                          getValueFromPath(specifications, 'identification.plazas');
        return passengers || 'N/A';
      
      case 'cargo':
        const cargo = getValueFromPath(specifications, 'dimensions.cargoCapacity') || 
                     getValueFromPath(specifications, 'interior.trunkCapacitySeatsDown') ||
                     getValueFromPath(specifications, 'dimensions.cargoCapacityMin');
        return cargo ? `${Math.round(cargo)} L` : 'N/A';
      
      case 'cityConsumption':
        const cityConsumption = getValueFromPath(specifications, 'efficiency.consumoCiudad');
        if (fuelType === 'Eléctrico') {
          return cityConsumption ? `${cityConsumption.toFixed(1)} kWh/100km` : 'N/A';
        } else {
          return cityConsumption ? `${cityConsumption.toFixed(1)} L/100km` : 'N/A';
        }
      
      case 'highwayConsumption':
        const highwayConsumption = getValueFromPath(specifications, 'efficiency.consumoCarretera');
        if (fuelType === 'Eléctrico') {
          return highwayConsumption ? `${highwayConsumption.toFixed(1)} kWh/100km` : 'N/A';
        } else {
          return highwayConsumption ? `${highwayConsumption.toFixed(1)} L/100km` : 'N/A';
        }
      
      case 'displacement':
        const displacement = getValueFromPath(specifications, 'powertrain.cilindrada');
        if (!displacement) return 'N/A';
        // Si el valor es menor a 10, asumir que está en litros y convertir a cc
        // Si es mayor a 10, asumir que ya está en cc
        const displacementCc = displacement < 10 ? Math.round(displacement * 1000) : Math.round(displacement);
        return `${displacementCc} cc`;
      
      case 'fuelTank':
        const fuelTank = getValueFromPath(specifications, 'efficiency.capacidadTanque');
        return fuelTank ? `${Math.round(fuelTank)} L` : 'N/A';
      
      case 'weight':
        const weight = getValueFromPath(specifications, 'dimensions.curbWeight');
        return weight ? `${Math.round(weight)} kg` : 'N/A';
      
      case 'electricRange':
        const range = getValueFromPath(specifications, 'efficiency.autonomiaOficial');
        return range ? `${Math.round(range)} km` : 'N/A';
      
      case 'gears':
        const gears = getValueFromPath(specifications, 'transmission.numeroMarchas');
        return gears || 'N/A';
      
      case 'value':
        const value = getValueFromPath(specifications, 'wisemetrics.qualityPriceRatio');
        return value ? `${Math.round(value)}/100` : 'N/A';
      
      default:
        return 'N/A';
    }
  };

  useEffect(() => {
    const fetchVehicleSpecs = async () => {
      try {
        setLoading(true);
        
        // Usar las specifications reales del vehículo
        const vehiclesWithData = vehicles.map(vehicle => {
          // Parsear specifications si viene como string
          let specifications = vehicle.specifications;
          if (typeof specifications === 'string') {
            try {
              specifications = JSON.parse(specifications);
            } catch (parseError) {
              console.error('Error parseando specifications:', parseError);
              specifications = {};
            }
          }
          
          return {
            ...vehicle,
            specifications: specifications || {},
            matchPercentage: vehicle.matchPercentage || undefined
          };
        });

        setVehiclesWithSpecs(vehiclesWithData);
      } catch (error) {
        console.error('Error fetching vehicle specs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleSpecs();
  }, [vehicles]);



  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {vehicles.map((_, index) => (
            <Card key={index} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="h-3 bg-gray-200 rounded w-4/5"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header de la vista */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Vista de Tarjetas
        </h2>
        <p className="text-gray-600">
          Compara tus vehículos favoritos en un formato de tarjetas fácil de leer
        </p>
      </div>

      {/* Grid de tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {vehiclesWithSpecs.map((vehicle) => (
          <Card key={vehicle.id} className="group hover:shadow-lg transition-all duration-300">
            {/* Imagen del vehículo */}
            <div className="relative h-48 overflow-hidden rounded-t-lg">
              {vehicle.imageUrl ? (
                <Image
                  src={vehicle.imageUrl}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-200">
                  <span className="text-gray-500 text-sm">Sin imagen</span>
                </div>
              )}
              
              {/* Badge de match si existe */}
              {vehicle.matchPercentage && (
                <div className="absolute top-3 right-3">
                  <Badge variant="wise" className="text-xs">
                    {vehicle.matchPercentage}% match
                  </Badge>
                </div>
              )}
            </div>

            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {vehicle.brand} {vehicle.model}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {vehicle.year} • {vehicle.fuelType}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {vehicle.type}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Precio */}
              <div className="text-center">
                <p className="text-2xl font-bold text-wise">
                  ${vehicle.price.toLocaleString()}
                </p>
              </div>

              {/* Métricas dinámicas según el tipo de combustible */}
              {(() => {
                const relevantMetrics = getRelevantMetrics(vehicle.fuelType);
                const rows = [];
                
                // Crear filas de 2 métricas
                for (let i = 0; i < relevantMetrics.length; i += 2) {
                  const rowMetrics = relevantMetrics.slice(i, i + 2);
                  rows.push(
                    <div key={i} className={`grid grid-cols-2 gap-3 ${i === 0 ? 'pt-2' : ''}`}>
                      {rowMetrics.map((metric) => {
                        const IconComponent = metric.icon;
                        return (
                          <div key={metric.key} className="text-center p-2 bg-gray-50 rounded">
                            <div className="flex items-center justify-center gap-1 text-xs text-gray-600 mb-1">
                              <IconComponent className="w-3 h-3" />
                              {metric.label}
                            </div>
                            <div className="text-sm font-semibold text-gray-900">
                              {getMetricValue(vehicle, metric.key)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                
                return rows;
              })()}

              {/* Botón de acción */}
              <Button 
                variant="wise" 
                className="w-full mt-4"
                onClick={() => window.location.href = `/vehicles/${vehicle.id}`}
              >
                Ver Detalles
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resumen de comparación */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-wise" />
            Resumen de Comparación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {vehiclesWithSpecs.length}
              </div>
              <div className="text-sm text-blue-800">Vehículos comparando</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ${Math.min(...vehiclesWithSpecs.map(v => v.price)).toLocaleString()}
              </div>
              <div className="text-sm text-green-800">Precio más bajo</div>
            </div>
            
            <div className="text-center p-4 bg-wise/5 rounded-lg">
              <div className="text-2xl font-bold text-wise">
                {vehiclesWithSpecs.filter(v => v.fuelType === 'Eléctrico').length}
              </div>
              <div className="text-sm text-wise/80">Vehículos eléctricos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
