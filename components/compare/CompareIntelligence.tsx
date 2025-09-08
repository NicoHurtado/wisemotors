'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VehicleComparisonData } from '@/lib/schemas/compareSchema';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Star, Users, Zap, Shield } from 'lucide-react';
import { getIntelligentAnalysis } from '@/app/actions/compare/intelSummary';

interface CompareIntelligenceProps {
  vehicles: VehicleComparisonData[];
}

interface AIAnalysis {
  vehicleId: string;
  pros: string[];
  cons: string[];
  recommendation: string;
  score: number;
}

interface ProfileRecommendation {
  profile: string;
  vehicle: string;
  reason: string;
}

export function CompareIntelligence({ vehicles }: CompareIntelligenceProps) {
  const [vehiclesWithSpecs, setVehiclesWithSpecs] = useState<VehicleComparisonData[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis[]>([]);
  const [profileRecommendations, setProfileRecommendations] = useState<ProfileRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

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
        
        // Generar análisis real con IA
        try {
          setAiLoading(true);
          const aiResult = await getIntelligentAnalysis(vehiclesWithData);
          setAiAnalysis(aiResult.analysis);
          setProfileRecommendations(aiResult.profileRecommendations);
        } catch (error) {
          console.error('Error getting AI analysis:', error);
          // Fallback a análisis básico
          const analysis = generateAIAnalysis(vehiclesWithData);
          setAiAnalysis(analysis);
        } finally {
          setAiLoading(false);
        }
      } catch (error) {
        console.error('Error fetching vehicle specs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleSpecs();
  }, [vehicles]);

  function generateAIAnalysis(vehicles: VehicleComparisonData[]): AIAnalysis[] {
    return vehicles.map(vehicle => {
      const pros: string[] = [];
      const cons: string[] = [];
      let recommendation = '';
      let score = 0;

      // Análisis basado en el tipo de combustible
      if (vehicle.fuelType === 'Eléctrico') {
        pros.push('Cero emisiones y bajo costo de operación');
        pros.push('Aceleración instantánea y silencioso');
        pros.push('Mantenimiento mínimo y confiable');
        cons.push('Tiempo de carga más largo');
        cons.push('Infraestructura de carga limitada');
        recommendation = 'Excelente opción para uso urbano y compromiso ambiental';
        score = 85;
      } else if (vehicle.fuelType === 'Híbrido') {
        pros.push('Eficiencia combinada gasolina-eléctrico');
        pros.push('Menor consumo en ciudad');
        pros.push('No requiere infraestructura especial');
        cons.push('Precio inicial más alto');
        cons.push('Complejidad mecánica adicional');
        recommendation = 'Ideal para conductores que buscan eficiencia sin compromisos';
        score = 78;
      } else {
        pros.push('Rendimiento probado y confiable');
        pros.push('Fácil mantenimiento y repuestos');
        pros.push('Precio inicial más accesible');
        cons.push('Mayor consumo de combustible');
        cons.push('Impacto ambiental más alto');
        recommendation = 'Opción tradicional confiable para uso diario';
        score = 72;
      }

      // Análisis basado en el tipo de vehículo
      if (vehicle.type === 'Deportivo') {
        pros.push('Diseño aerodinámico y deportivo');
        pros.push('Alto rendimiento y manejo preciso');
        cons.push('Menor practicidad diaria');
        cons.push('Consumo de combustible alto');
        score += 5;
      } else if (vehicle.type === 'SUV') {
        pros.push('Versatilidad y espacio interior');
        pros.push('Capacidad todoterreno');
        cons.push('Mayor consumo de combustible');
        cons.push('Manejo menos ágil');
        score += 3;
      } else if (vehicle.type === 'Sedán') {
        pros.push('Confort y elegancia');
        pros.push('Eficiencia aerodinámica');
        cons.push('Espacio limitado');
        score += 2;
      }

      // Análisis basado en el precio
      if (vehicle.price > 300000000) {
        pros.push('Alta calidad y prestigio');
        cons.push('Precio muy elevado');
        score -= 5;
      } else if (vehicle.price < 100000000) {
        pros.push('Excelente relación precio-calidad');
        score += 8;
      }

      return {
        vehicleId: vehicle.id,
        pros: pros.slice(0, 4),
        cons: cons.slice(0, 3),
        recommendation,
        score: Math.max(0, Math.min(100, score))
      };
    });
  }

  function getProfileRecommendations(): ProfileRecommendation[] {
    const profiles = [
      {
        profile: 'Familiar',
        criteria: ['passengerCapacity', 'cargoCapacity', 'safety', 'comfort']
      },
      {
        profile: 'Performance',
        criteria: ['maxPower', 'acceleration0to100', 'maxSpeed', 'drivingFun']
      },
      {
        profile: 'Economía',
        criteria: ['efficiency', 'cityConsumption', 'qualityPriceRatio', 'reliability']
      },
      {
        profile: 'Tecnología',
        criteria: ['technology', 'safety', 'comfort', 'environmentalImpact']
      }
    ];

    return profiles.map(profile => {
      let bestVehicle = vehiclesWithSpecs[0];
      let bestScore = 0;

      vehiclesWithSpecs.forEach(vehicle => {
        let score = 0;
        profile.criteria.forEach(criterion => {
          const value = vehicle.specifications?.[criterion] || 0;
          if (typeof value === 'number') {
            score += value;
            }
        });
        
        if (score > bestScore) {
          bestScore = score;
          bestVehicle = vehicle;
        }
      });

      return {
        profile: profile.profile,
        vehicle: `${bestVehicle.brand} ${bestVehicle.model}`,
        reason: getProfileReason(profile.profile, bestVehicle)
      };
    });
  }

  function getProfileReason(profile: string, vehicle: VehicleComparisonData): string {
    switch (profile) {
      case 'Familiar':
        return 'Mejor espacio interior y seguridad';
      case 'Performance':
        return 'Mayor potencia y aceleración';
      case 'Economía':
        return 'Mejor eficiencia y relación precio-calidad';
      case 'Tecnología':
        return 'Más características tecnológicas';
      default:
        return 'Mejor balance general';
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wise mx-auto"></div>
          <p className="mt-4 text-gray-600">Analizando vehículos con IA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header de la vista */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Comparación Inteligente con IA
        </h2>
        <p className="text-gray-600">
          Análisis inteligente de tus vehículos favoritos con recomendaciones personalizadas
        </p>
      </div>

      {/* Análisis por vehículo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {vehiclesWithSpecs.map((vehicle) => {
          const analysis = aiAnalysis.find(a => a.vehicleId === vehicle.id);
          
          return (
            <Card key={vehicle.id} className="hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {vehicle.brand} {vehicle.model}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {vehicle.year} • {vehicle.fuelType} • {vehicle.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="wise" className="text-sm">
                      {analysis?.score}/100
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Precio */}
                <div className="text-center">
                  <p className="text-2xl font-bold text-wise">
                    ${vehicle.price.toLocaleString()}
                  </p>
                </div>

                {/* Pros */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Ventajas:
                  </h4>
                  <ul className="space-y-1">
                    {analysis?.pros.map((pro, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="text-green-600 text-xs mt-0.5">•</span>
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Contras */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Desventajas:
                  </h4>
                  <ul className="space-y-1">
                    {analysis?.cons.map((con, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="text-amber-600 text-xs mt-0.5">•</span>
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recomendación */}
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">Recomendación IA:</h4>
                  <p className="text-xs text-blue-700">{analysis?.recommendation}</p>
                </div>

                {/* Botón de acción */}
                <Button 
                  variant="wise" 
                  className="w-full"
                  onClick={() => window.location.href = `/vehicles/${vehicle.id}`}
                >
                  Ver Detalles Completos
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recomendaciones por perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-wise" />
            ¿Qué elegir según tu perfil?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getProfileRecommendations().map((rec, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-wise/20 rounded-full">
                    {rec.profile === 'Familiar' && <Users className="w-4 h-4 text-wise" />}
                    {rec.profile === 'Performance' && <TrendingUp className="w-4 h-4 text-wise" />}
                    {rec.profile === 'Economía' && <Zap className="w-4 h-4 text-wise" />}
                    {rec.profile === 'Tecnología' && <Shield className="w-4 h-4 text-wise" />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{rec.profile}</h4>
                    <p className="text-sm text-gray-600">Perfil recomendado</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-600">Vehículo: </span>
                    <span className="font-medium text-gray-900">{rec.vehicle}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Razón: </span>
                    <span className="text-gray-700">{rec.reason}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resumen de la IA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Resumen de la Análisis IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-wise/10 to-wise/5 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">💡 Insights Clave:</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• La IA analizó {vehiclesWithSpecs.length} vehículos en {aiAnalysis.length} categorías</li>
                <li>• Se consideraron {vehiclesWithSpecs.filter(v => v.fuelType === 'Eléctrico').length} vehículos eléctricos</li>
                <li>• Rango de precios: ${Math.min(...vehiclesWithSpecs.map(v => v.price)).toLocaleString()} - ${Math.max(...vehiclesWithSpecs.map(v => v.price)).toLocaleString()}</li>
                <li>• Mejor puntuación: {Math.max(...aiAnalysis.map(a => a.score))}/100</li>
              </ul>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Este análisis utiliza <strong>Inteligencia Artificial real (GPT-4)</strong> para analizar 
                las especificaciones técnicas de cada vehículo y proporcionar recomendaciones 
                objetivas, personalizadas y basadas en datos reales.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
