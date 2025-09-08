'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VehicleComparisonData } from '@/lib/schemas/compareSchema';
import { TrendingUp, Zap, Shield, Smartphone, Star, Target } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip, ResponsiveContainer } from 'recharts';

interface CompareRadarProps {
  vehicles: VehicleComparisonData[];
}

interface RadarMetric {
  axis: string;
  [key: string]: number | string;
}

export function CompareRadar({ vehicles }: CompareRadarProps) {
  const [vehiclesWithSpecs, setVehiclesWithSpecs] = useState<VehicleComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [radarData, setRadarData] = useState<RadarMetric[]>([]);

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

        setVehiclesWithSpecs(vehiclesWithData);
        
        // Generar datos del radar
        const radarMetrics = generateRadarData(vehiclesWithData);
        setRadarData(radarMetrics);
      } catch (error) {
        console.error('Error fetching vehicle specs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleSpecs();
  }, [vehicles]);

  function generateRadarData(vehicles: VehicleComparisonData[]): RadarMetric[] {
    const metrics = [
      { key: 'performance', label: 'Rendimiento', icon: TrendingUp },
      { key: 'technology', label: 'Tecnología', icon: Smartphone },
      { key: 'safety', label: 'Seguridad', icon: Shield },
      { key: 'comfort', label: 'Confort', icon: Star },
      { key: 'efficiency', label: 'Eficiencia', icon: Zap },
      { key: 'value', label: 'Valor', icon: Target },
    ];

    return metrics.map(metric => {
      const radarMetric: RadarMetric = { axis: metric.label };
      
      vehicles.forEach(vehicle => {
        let value = 0;
        
        switch (metric.key) {
          case 'performance':
            // Obtener potencia desde diferentes ubicaciones según el tipo de combustible
            let power = 0;
            if (vehicle.fuelType === 'Eléctrico') {
              power = vehicle.specifications?.performance?.maxPower || 0;
            } else {
              power = vehicle.specifications?.combustion?.maxPower || 
                     vehicle.specifications?.hybrid?.maxPower || 
                     vehicle.specifications?.phev?.maxPower || 0;
            }
            
            const acceleration = vehicle.specifications?.performance?.acceleration0to100 || 15;
            const speed = vehicle.specifications?.performance?.maxSpeed || 150;
            
            // Normalizar rendimiento (0-100)
            value = Math.min(100, Math.max(0, (
              (power / 800) * 40 + 
              ((20 - acceleration) / 20) * 35 + 
              (speed / 300) * 25
            )));
            break;
            
          case 'technology':
            // Usar WiseMetrics si está disponible, sino calcular basado en features
            const techScore = vehicle.specifications?.wisemetrics?.technology;
            if (techScore) {
              value = techScore;
            } else {
              // Calcular score basado en features de tecnología
              const techFeatures = [
                vehicle.specifications?.technology?.bluetooth,
                vehicle.specifications?.technology?.touchscreen,
                vehicle.specifications?.technology?.navigation,
                vehicle.specifications?.technology?.smartphoneIntegration,
                vehicle.specifications?.technology?.wirelessCharger
              ].filter(Boolean).length;
              value = Math.min(100, (techFeatures / 5) * 100);
            }
            break;
            
          case 'safety':
            // Usar WiseMetrics si está disponible, sino calcular basado en features de seguridad
            const safetyScore = vehicle.specifications?.wisemetrics?.safety;
            if (safetyScore) {
              value = safetyScore;
            } else {
              const safetyFeatures = [
                vehicle.specifications?.safety?.airbags,
                vehicle.specifications?.safety?.stabilityControl,
                vehicle.specifications?.safety?.tractionControl,
                vehicle.specifications?.safety?.autonomousEmergencyBraking,
                vehicle.specifications?.safety?.laneAssist
              ].filter(Boolean).length;
              value = Math.min(100, (safetyFeatures / 5) * 100);
            }
            break;
            
          case 'comfort':
            // Usar WiseMetrics si está disponible, sino calcular basado en features de confort
            const comfortScore = vehicle.specifications?.wisemetrics?.comfort;
            if (comfortScore) {
              value = comfortScore;
            } else {
              const comfortFeatures = [
                vehicle.specifications?.comfort?.airConditioning,
                vehicle.specifications?.comfort?.automaticClimateControl,
                vehicle.specifications?.comfort?.heatedSeats,
                vehicle.specifications?.comfort?.ventilatedSeats
              ].filter(Boolean).length;
              value = Math.min(100, (comfortFeatures / 4) * 100);
            }
            break;
            
          case 'efficiency':
            // Calcular eficiencia basada en consumo y tipo de combustible
            let consumption = 0;
            if (vehicle.fuelType === 'Eléctrico') {
              const cityConsumption = vehicle.specifications?.electric?.cityElectricConsumption || 20;
              const highwayConsumption = vehicle.specifications?.electric?.highwayElectricConsumption || 25;
              consumption = (cityConsumption + highwayConsumption) / 2;
              // Para eléctricos, menor consumo = mayor eficiencia
              value = Math.max(0, 100 - (consumption / 30) * 100);
            } else {
              const cityConsumption = vehicle.specifications?.combustion?.cityConsumption || 
                                    vehicle.specifications?.hybrid?.cityConsumption || 
                                    vehicle.specifications?.phev?.cityConsumption || 10;
              const highwayConsumption = vehicle.specifications?.combustion?.highwayConsumption || 
                                       vehicle.specifications?.hybrid?.highwayConsumption || 
                                       vehicle.specifications?.phev?.highwayConsumption || 10;
              consumption = (cityConsumption + highwayConsumption) / 2;
              // Para combustión, menor consumo = mayor eficiencia
              value = Math.max(0, 100 - (consumption / 15) * 100);
            }
            break;
            
          case 'value':
            // Calcular valor basado en precio y características
            const basePrice = vehicle.price || 100000000;
            const priceScore = Math.max(0, 100 - (basePrice / 10000000));
            
            // Ajustar por características disponibles
            const totalFeatures = [
              vehicle.specifications?.technology?.bluetooth,
              vehicle.specifications?.safety?.airbags,
              vehicle.specifications?.comfort?.airConditioning
            ].filter(Boolean).length;
            
            const featureBonus = Math.min(20, totalFeatures * 4);
            value = Math.min(100, priceScore + featureBonus);
            break;
        }
        
        radarMetric[vehicle.id] = Math.round(value);
      });
      
      return radarMetric;
    });
  }

  function getVehicleColor(index: number): string {
    const colors = [
      'rgb(136, 28, 183)', // Wise Purple
      'rgb(239, 68, 68)',  // Red
      'rgb(34, 197, 94)',  // Green
      'rgb(245, 158, 11)', // Yellow
      'rgb(136, 28, 183)', // Wise Purple
    ];
    return colors[index % colors.length];
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wise mx-auto"></div>
          <p className="mt-4 text-gray-600">Generando gráfico de radar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header de la vista */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Vista de Radar Comparativo
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Visualiza el rendimiento de tus vehículos en diferentes métricas con un análisis gráfico detallado
        </p>
      </div>

      {/* Gráfico de radar */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-wise" />
            Análisis de Métricas
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-8">
          <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 50, right: 60, left: 50, bottom: 60 }}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis 
                  dataKey="axis" 
                  tick={{ fontSize: 14, fill: '#374151', fontWeight: '500' }}
                  tickLine={false}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tick={{ fontSize: 12, fill: '#6b7280', fontWeight: '500' }}
                  tickLine={false}
                  axisLine={false}
                />
                
                {vehiclesWithSpecs.map((vehicle, index) => {
                  const colors = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981'];
                  const color = colors[index % colors.length];
                  
                  return (
                    <Radar
                      key={vehicle.id}
                      name={`${vehicle.brand} ${vehicle.model}`}
                      dataKey={vehicle.id}
                      stroke={color}
                      fill={color}
                      fillOpacity={0.1}
                      strokeWidth={3}
                      dot={{ fill: color, strokeWidth: 3, r: 6 }}
                      activeDot={{ r: 8, stroke: color, strokeWidth: 3 }}
                    />
                  );
                })}
                
                <Legend 
                  verticalAlign="top" 
                  height={60}
                  wrapperStyle={{ paddingBottom: '40px' }}
                  iconSize={18}
                  iconType="circle"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: any, name: string) => [`${value}/100`, name]}
                  labelFormatter={(label) => `${label}`}
                />
              </RadarChart>
            </ResponsiveContainer>


          </div>
        </CardContent>
      </Card>

      {/* Métricas detalladas */}
      <Card className="mt-20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-wise" />
            Métricas por Vehículo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left p-4 font-semibold text-gray-900 min-w-[120px]">Métrica</th>
                  {vehiclesWithSpecs.map((vehicle, index) => (
                    <th key={vehicle.id} className="text-center p-4 font-semibold text-gray-900 min-w-[150px]">
                      <div className="text-sm font-bold">{vehicle.brand}</div>
                      <div className="text-xs text-gray-600 mt-1">{vehicle.model}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {radarData.map((metric, metricIndex) => (
                  <tr key={metricIndex} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-700">
                      <div className="flex items-center gap-2">
                        <span>{metric.axis}</span>
                      </div>
                    </td>
                    {vehiclesWithSpecs.map((vehicle, vehicleIndex) => {
                      const value = metric[vehicle.id] as number;
                      const color = getVehicleColor(vehicleIndex);
                      
                      return (
                        <td key={vehicle.id} className="p-4 text-center">
                          <div className="flex items-center justify-center gap-3 mb-3">
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: color }}
                            ></div>
                            <span className="font-bold text-lg">{value}/100</span>
                          </div>
                          {/* Barra de progreso visual */}
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="h-3 rounded-full transition-all duration-300 shadow-sm"
                              style={{ 
                                width: `${value}%`, 
                                backgroundColor: color 
                              }}
                            ></div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>


    </div>
  );
}

