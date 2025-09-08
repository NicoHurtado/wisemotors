'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  COMPARE_SECTIONS, 
  VehicleComparisonData, 
  getFieldValue, 
  getFieldDisplayValue, 
  getWinnerIndex 
} from '@/lib/schemas/compareSchema';
import { Info, Trophy, Minus } from 'lucide-react';

interface CompareTablesProps {
  vehicles: VehicleComparisonData[];
}

export function CompareTables({ vehicles }: CompareTablesProps) {
  const [vehiclesWithSpecs, setVehiclesWithSpecs] = useState<VehicleComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['general']));

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
            specifications: specifications || {}
          };
        });

        console.log('🚗 Vehículos con specs:', vehiclesWithData);
        console.log('🔍 Primer vehículo specs:', vehiclesWithData[0]?.specifications);
        console.log('🔍 Performance del primer vehículo:', vehiclesWithData[0]?.specifications?.performance);
        setVehiclesWithSpecs(vehiclesWithData);
      } catch (error) {
        console.error('Error fetching vehicle specs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleSpecs();
  }, [vehicles]);

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  };

  const getFieldValueForComparison = (vehicle: VehicleComparisonData, fieldKey: string): any => {
    // Para campos especiales que están en el nivel raíz del vehículo
    if (fieldKey === 'brand') return vehicle.brand;
    if (fieldKey === 'model') return vehicle.model;
    if (fieldKey === 'year') return vehicle.year;
    if (fieldKey === 'price') return vehicle.price;
    if (fieldKey === 'fuelType') return vehicle.fuelType;
    if (fieldKey === 'type') return vehicle.type;
    
    // Para campos en specifications - buscar en múltiples ubicaciones
    const { specifications, fuelType } = vehicle;
    if (!specifications) return null;
    
    // Mapeo de campos a ubicaciones específicas
    const fieldMappings: { [key: string]: string[] } = {
      // Rendimiento
      'maxPower': ['performance.maxPower', 'combustion.maxPower', 'hybrid.maxPower', 'phev.maxPower'],
      'maxTorque': ['combustion.maxTorque', 'hybrid.maxTorque', 'phev.maxTorque'],
      'acceleration0to100': ['performance.acceleration0to100'],
      'maxSpeed': ['performance.maxSpeed'],
      'quarterMile': ['performance.quarterMile'],
      'brakingDistance100to0': ['chassis.brakingDistance100to0'],
      
      // Motor
      'displacement': ['combustion.displacement', 'hybrid.displacement', 'phev.displacement'],
      'inductionType': ['combustion.inductionType'],
      'compressionRatio': ['combustion.compressionRatio'],
      'gears': ['combustion.gears', 'hybrid.gears', 'phev.gears'],
      'transmissionType': ['combustion.transmissionType', 'hybrid.transmissionType', 'phev.transmissionType'],
      'fuelTankCapacity': ['combustion.fuelTankCapacity', 'hybrid.fuelTankCapacity', 'phev.fuelTankCapacity'],
      
      // Consumo
      'cityConsumption': ['combustion.cityConsumption', 'hybrid.cityConsumption', 'phev.cityConsumption'],
      'highwayConsumption': ['combustion.highwayConsumption', 'hybrid.highwayConsumption', 'phev.highwayConsumption'],
      'electricRange': ['electric.electricRange', 'phev.electricRange'],
      'acChargingTime': ['electric.acChargingTime', 'phev.acChargingTime'],
      
      // Dimensiones
      'length': ['dimensions.length'],
      'width': ['dimensions.width'],
      'height': ['dimensions.height'],
      'wheelbase': ['dimensions.wheelbase'],
      'curbWeight': ['dimensions.curbWeight'],
      
      // Capacidades
      'passengerCapacity': ['dimensions.passengerCapacity'],
      'cargoCapacity': ['dimensions.cargoCapacity', 'dimensions.trunkCapacitySeatsDown'],
      'towingCapacity': ['weight.towingCapacity'],
      'payload': ['weight.payload'],
      
      // Seguridad
      'airbags': ['safety.airbags'],
      'ncapRating': ['safety.ncapRating'],
      'stabilityControl': ['safety.stabilityControl'],
      'tractionControl': ['safety.tractionControl'],
      'autonomousEmergencyBraking': ['safety.autonomousEmergencyBraking'],
      'laneAssist': ['safety.laneAssist'],
      
      // Confort
      'airConditioning': ['comfort.airConditioning'],
      'automaticClimateControl': ['comfort.automaticClimateControl'],
      'heatedSeats': ['comfort.heatedSeats'],
      'ventilatedSeats': ['comfort.ventilatedSeats'],
      
      // Tecnología
      'bluetooth': ['technology.bluetooth'],
      'touchscreen': ['technology.touchscreen'],
      'navigation': ['technology.navigation'],
      'smartphoneIntegration': ['technology.smartphoneIntegration'],
      'wirelessCharger': ['technology.wirelessCharger'],
      
      // WiseMetrics
      'drivingFun': ['wisemetrics.drivingFun'],
      'technology': ['wisemetrics.technology'],
      'environmentalImpact': ['wisemetrics.environmentalImpact'],
      'reliability': ['wisemetrics.reliability'],
      'qualityPriceRatio': ['wisemetrics.qualityPriceRatio'],
      'comfort': ['wisemetrics.comfort'],
      'usability': ['wisemetrics.usability'],
      'efficiency': ['wisemetrics.efficiency'],
      'prestige': ['wisemetrics.prestige']
    };
    
    // Buscar el valor en las ubicaciones mapeadas
    const locations = fieldMappings[fieldKey];
    if (locations) {
      for (const location of locations) {
        const keys = location.split('.');
        let value = specifications;
        
        for (const key of keys) {
          if (value && typeof value === 'object' && key in value) {
            value = value[key];
          } else {
            value = null;
            break;
          }
        }
        
        if (value !== null && value !== undefined) {
          return value;
        }
      }
    }
    
    // Si no se encuentra en el mapeo, intentar con la función original
    const fallbackValue = getFieldValue(vehicle, fieldKey);
    console.log(`🔍 Campo ${fieldKey} para ${vehicle.brand} ${vehicle.model}:`, fallbackValue);
    return fallbackValue;
  };

  const getFieldDisplayValueForComparison = (vehicle: VehicleComparisonData, field: any): string => {
    const value = getFieldValueForComparison(vehicle, field.key);
    
    if (value === null || value === undefined) {
      // Mostrar ✗ en lugar de N/A para campos que no tienen valor
      if (field.key.includes('displacement') || field.key.includes('gears') || field.key.includes('inductionType')) {
        return vehicle.fuelType === 'Eléctrico' ? '✗' : '✗';
      }
      if (field.key.includes('electricRange') || field.key.includes('acChargingTime')) {
        return vehicle.fuelType === 'Gasolina' || vehicle.fuelType === 'Diesel' ? '✗' : '✗';
      }
      return '✗';
    }
    
    if (typeof value === 'boolean') {
      return value ? '✓' : '✗';
    }
    
    if (typeof value === 'number') {
      if (field.unit) {
        return `${value} ${field.unit}`;
      }
      return value.toString();
    }
    
    return value.toString();
  };

  const getWinnerIndexForComparison = (vehicles: VehicleComparisonData[], field: any): number | null => {
    const values = vehicles.map(v => getFieldValueForComparison(v, field.key));
    
    // Filtrar valores válidos (no null/undefined/✗)
    const validValues = values.filter(v => v !== null && v !== undefined && v !== '✗');
    if (validValues.length === 0) return null;
    
    let bestValue: any;
    let bestIndex: number = -1;
    
    if (field.better === 'higher') {
      bestValue = Math.max(...validValues);
    } else if (field.better === 'lower') {
      bestValue = Math.min(...validValues);
    } else {
      // Para booleanos, contar cuántos son true
      const trueCount = validValues.filter(v => v === true).length;
      if (trueCount === 0) return null;
      if (trueCount === 1) {
        bestIndex = values.findIndex(v => v === true);
        return bestIndex;
      }
      // Si hay empate, no hay ganador único
      return null;
    }
    
    bestIndex = values.findIndex(v => v === bestValue);
    
    // Verificar si hay empate
    const winners = values.filter(v => v === bestValue);
    if (winners.length > 1) return null; // Empate
    
    return bestIndex;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wise mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando especificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header de la vista */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Vista de Tablas por Categorías
        </h2>
        <p className="text-gray-600">
          Compara detalladamente cada especificación con ganadores resaltados
        </p>
      </div>

      {/* Agrupación por tipo de combustible si es mixto */}
      {vehiclesWithSpecs.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {Array.from(new Set(vehiclesWithSpecs.map(v => v.fuelType))).map(fuelType => (
              <Badge key={fuelType} variant="outline" className="text-sm">
                Grupo: {fuelType}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Tablas por sección */}
      {COMPARE_SECTIONS.map((section) => (
        <Card key={section.key} className="overflow-hidden">
          <CardHeader 
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection(section.key)}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{section.icon}</span>
                <span>{section.label}</span>
              </div>
              <Button variant="ghost" size="sm">
                {expandedSections.has(section.key) ? <Minus className="w-4 h-4" /> : <span>Expandir</span>}
              </Button>
            </CardTitle>
          </CardHeader>

          {expandedSections.has(section.key) && (
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-4 font-semibold text-gray-900 bg-gray-50 min-w-[200px]">
                        Especificación
                      </th>
                      {vehiclesWithSpecs.map((vehicle, index) => (
                        <th key={vehicle.id} className="text-center p-4 font-semibold text-gray-900 bg-gray-50 min-w-[180px]">
                          <div className="text-sm font-bold">{vehicle.brand}</div>
                          <div className="text-xs text-gray-600">{vehicle.model}</div>
                          <div className="text-xs text-gray-500">{vehicle.year}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.fields.map((field) => {
                      const winnerIndex = getWinnerIndexForComparison(vehiclesWithSpecs, field);
                      
                      return (
                        <tr key={field.key} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-4 font-medium text-gray-700">
                            <div className="flex items-center gap-2">
                              <span>{field.label}</span>
                              {field.unit && (
                                <span className="text-xs text-gray-500">({field.unit})</span>
                              )}
                              <div className="relative group">
                                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                  {field.better === 'higher' ? 'Mayor es mejor' : field.better === 'lower' ? 'Menor es mejor' : 'Característica'}
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          {vehiclesWithSpecs.map((vehicle, index) => {
                            const value = getFieldDisplayValueForComparison(vehicle, field);
                            const isWinner = winnerIndex === index;
                            
                            return (
                              <td 
                                key={vehicle.id} 
                                className={`p-4 text-center ${
                                  isWinner 
                                    ? 'bg-wise/10 border-2 border-wise/30 font-semibold' 
                                    : ''
                                }`}
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <span className={value === '✗' ? 'text-gray-400' : ''}>
                                    {value}
                                  </span>
                                  {isWinner && <Trophy className="w-4 h-4 text-wise" />}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {/* Leyenda */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg"></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-wise/10 border-2 border-wise/30 rounded"></div>
              <span>Ganador</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">✗</span>
              <span>No disponible</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
