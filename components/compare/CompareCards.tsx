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

  // Función para obtener el valor de una métrica específica según el tipo de combustible
  const getMetricValue = (vehicle: VehicleComparisonData, metricKey: string) => {
    const { specifications, fuelType } = vehicle;
    
    switch (metricKey) {
      case 'power':
        if (fuelType === 'Eléctrico') {
          // Para vehículos eléctricos, obtener la potencia desde performance
          return specifications?.performance?.maxPower ? 
                 `${Math.round(specifications.performance.maxPower)} HP` : 'N/A';
        } else {
          // Para vehículos de combustión, híbridos y PHEV
          return specifications?.combustion?.maxPower || 
                 specifications?.hybrid?.maxPower || 
                 specifications?.phev?.maxPower ? 
                 `${specifications.combustion?.maxPower || specifications.hybrid?.maxPower || specifications.phev?.maxPower} HP` : 'N/A';
        }
      
      case 'acceleration':
        return specifications?.performance?.acceleration0to100 ? 
               `${specifications.performance.acceleration0to100}s` : 'N/A';
      
      case 'torque':
        return specifications?.combustion?.maxTorque || 
               specifications?.hybrid?.maxTorque || 
               specifications?.phev?.maxTorque || 'N/A';
      
      case 'maxSpeed':
        return specifications?.performance?.maxSpeed ? 
               `${specifications.performance.maxSpeed} km/h` : 'N/A';
      
      case 'passengers':
        return specifications?.dimensions?.passengerCapacity || 'N/A';
      
      case 'cargo':
        const cargoCapacity = specifications?.dimensions?.cargoCapacity || 
                             specifications?.dimensions?.trunkCapacitySeatsDown;
        return cargoCapacity ? `${Math.round(cargoCapacity)} L` : 'N/A';
      
      case 'cityConsumption':
        if (fuelType === 'Eléctrico') {
          return specifications?.electric?.cityElectricConsumption ? 
                 `${specifications.electric.cityElectricConsumption} kWh/100km` : 'N/A';
        } else {
          const consumption = specifications?.combustion?.cityConsumption || 
                            specifications?.hybrid?.cityConsumption || 
                            specifications?.phev?.cityConsumption;
          return consumption ? `${consumption.toFixed(1)} L/100km` : 'N/A';
        }
      
      case 'highwayConsumption':
        if (fuelType === 'Eléctrico') {
          return specifications?.electric?.highwayElectricConsumption ? 
                 `${specifications.electric.highwayElectricConsumption} kWh/100km` : 'N/A';
        } else {
          const consumption = specifications?.combustion?.highwayConsumption || 
                            specifications?.hybrid?.highwayConsumption || 
                            specifications?.phev?.highwayConsumption;
          return consumption ? `${consumption.toFixed(1)} L/100km` : 'N/A';
        }
      
      case 'displacement':
        return specifications?.combustion?.displacement || 
               specifications?.hybrid?.displacement || 
               specifications?.phev?.displacement ? 
               `${specifications.combustion?.displacement || specifications.hybrid?.displacement || specifications.phev?.displacement} cc` : 'N/A';
      
      case 'fuelTank':
        return specifications?.combustion?.fuelTankCapacity || 
               specifications?.hybrid?.fuelTankCapacity || 
               specifications?.phev?.fuelTankCapacity ? 
               `${Math.round(specifications.combustion?.fuelTankCapacity || specifications.hybrid?.fuelTankCapacity || specifications.phev?.fuelTankCapacity)} L` : 'N/A';
      
      case 'weight':
        return specifications?.dimensions?.curbWeight ? 
               `${Math.round(specifications.dimensions.curbWeight)} kg` : 'N/A';
      
      case 'electricRange':
        return specifications?.electric?.electricRange || 
               specifications?.phev?.electricRange ? 
               `${Math.round(specifications.electric?.electricRange || specifications.phev?.electricRange)} km` : 'N/A';
      
      case 'gears':
        return specifications?.combustion?.gears || 
               specifications?.hybrid?.gears || 
               specifications?.phev?.gears || 'N/A';
      
      case 'value':
        return specifications?.wisemetrics?.qualityPriceRatio ? 
               `${Math.round(specifications.wisemetrics.qualityPriceRatio)}/100` : 'N/A';
      
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
