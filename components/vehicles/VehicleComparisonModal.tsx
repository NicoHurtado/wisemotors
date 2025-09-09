'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Star } from 'lucide-react';
import { getIntelligentAnalysis } from '@/app/actions/compare/intelSummary';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';

interface VehicleComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVehicle: {
    id: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    fuelType: string;
    type: string;
    specifications: any;
  };
  compareVehicle: {
    id: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    fuelType: string;
    type: string;
    specifications: any;
  };
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

export function VehicleComparisonModal({ 
  isOpen, 
  onClose, 
  currentVehicle, 
  compareVehicle 
}: VehicleComparisonModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis[]>([]);
  const [profileRecommendations, setProfileRecommendations] = useState<ProfileRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentVehicle && compareVehicle) {
      generateComparison();
    }
  }, [isOpen, currentVehicle, compareVehicle]);

  const generateComparison = async () => {
    try {
      setLoading(true);
      setError(null);

      // Preparar datos para la IA
      const vehiclesForAnalysis = [
        {
          id: currentVehicle.id,
          brand: currentVehicle.brand,
          model: currentVehicle.model,
          year: currentVehicle.year,
          price: currentVehicle.price,
          fuelType: currentVehicle.fuelType,
          type: currentVehicle.type,
          specifications: currentVehicle.specifications
        },
        {
          id: compareVehicle.id,
          brand: compareVehicle.brand,
          model: compareVehicle.model,
          year: compareVehicle.year,
          price: compareVehicle.price,
          fuelType: compareVehicle.fuelType,
          type: compareVehicle.type,
          specifications: compareVehicle.specifications
        }
      ];

      // Llamar a la IA para análisis
      const aiResult = await getIntelligentAnalysis(vehiclesForAnalysis);
      setAiAnalysis(aiResult.analysis);
      setProfileRecommendations(aiResult.profileRecommendations);

    } catch (error) {
      console.error('Error generating comparison:', error);
      setError('Error al generar la comparación. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const getVehicleAnalysis = (vehicleId: string) => {
    return aiAnalysis.find(analysis => analysis.vehicleId === vehicleId);
  };

  const getVehicleDisplayName = (vehicle: any) => {
    return `${vehicle.brand} ${vehicle.model}`;
  };

  const handleFullComparison = async () => {
    if (!user) {
      // Si no está autenticado, redirigir al login
      router.push('/login');
      return;
    }

    try {
      // Agregar ambos vehículos a favoritos si no están ya
      const isCurrentFavorite = isFavorite(currentVehicle.id);
      const isCompareFavorite = isFavorite(compareVehicle.id);

      if (!isCurrentFavorite) {
        await toggleFavorite(currentVehicle.id);
      }
      
      if (!isCompareFavorite) {
        await toggleFavorite(compareVehicle.id);
      }

      // Cerrar el modal
      onClose();

      // Redirigir a la página de comparación con un pequeño delay para que se actualicen los favoritos
      setTimeout(() => {
        router.push('/compare');
      }, 500);

    } catch (error) {
      console.error('Error adding vehicles to favorites:', error);
      // Si hay error, al menos redirigir a comparación
      router.push('/compare');
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Brain className="w-6 h-6 text-wise" />
            Comparación Inteligente: {getVehicleDisplayName(currentVehicle)} vs {getVehicleDisplayName(compareVehicle)}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-wise mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">IA Analizando Vehículos</h3>
            <p className="text-gray-500">Generando comparación inteligente entre los dos vehículos...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <div className="text-red-500 text-lg mb-4">{error}</div>
            <Button onClick={generateComparison} variant="wise">
              Reintentar
            </Button>
          </div>
        )}

        {!loading && !error && aiAnalysis.length > 0 && (
          <div className="space-y-6">
            {/* Análisis Individual de Cada Vehículo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Vehículo Actual */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-wise rounded-full"></div>
                    {getVehicleDisplayName(currentVehicle)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const analysis = getVehicleAnalysis(currentVehicle.id);
                    if (!analysis) return <div>Análisis no disponible</div>;

                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Score IA:</span>
                          <Badge variant="outline" className="text-lg font-bold">
                            {analysis.score}/100
                          </Badge>
                        </div>

                        {/* Ventajas */}
                        <div>
                          <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Ventajas
                          </h4>
                          <ul className="space-y-1">
                            {analysis.pros.map((pro, index) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-green-600 text-xs mt-1">•</span>
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Desventajas */}
                        <div>
                          <h4 className="font-semibold text-amber-700 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Desventajas
                          </h4>
                          <ul className="space-y-1">
                            {analysis.cons.map((con, index) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-amber-600 text-xs mt-1">•</span>
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Recomendación */}
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-800 mb-1">Recomendación IA:</h4>
                          <p className="text-sm text-blue-700">{analysis.recommendation}</p>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Vehículo a Comparar */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    {getVehicleDisplayName(compareVehicle)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const analysis = getVehicleAnalysis(compareVehicle.id);
                    if (!analysis) return <div>Análisis no disponible</div>;

                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Score IA:</span>
                          <Badge variant="outline" className="text-lg font-bold">
                            {analysis.score}/100
                          </Badge>
                        </div>

                        {/* Ventajas */}
                        <div>
                          <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Ventajas
                          </h4>
                          <ul className="space-y-1">
                            {analysis.pros.map((pro, index) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-green-600 text-xs mt-1">•</span>
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Desventajas */}
                        <div>
                          <h4 className="font-semibold text-amber-700 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Desventajas
                          </h4>
                          <ul className="space-y-1">
                            {analysis.cons.map((con, index) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-amber-600 text-xs mt-1">•</span>
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Recomendación */}
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-800 mb-1">Recomendación IA:</h4>
                          <p className="text-sm text-blue-700">{analysis.recommendation}</p>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>

            {/* Recomendaciones por Perfil */}
            {profileRecommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    ¿Cuál elegir según tu perfil?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profileRecommendations.map((rec, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-wise/20 rounded-full flex items-center justify-center">
                            {rec.profile === 'Familiar' && <span className="text-wise text-sm">👥</span>}
                            {rec.profile === 'Performance' && <TrendingUp className="w-4 h-4 text-wise" />}
                            {rec.profile === 'Economía' && <span className="text-wise text-sm">💰</span>}
                            {rec.profile === 'Tecnología' && <Brain className="w-4 h-4 text-wise" />}
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
            )}

            {/* Resumen de la Comparación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-wise" />
                  Resumen de la Comparación IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gradient-to-r from-wise/10 to-wise/5 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">💡 Insights Clave:</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• La IA analizó 2 vehículos en detalle</li>
                    <li>• Se consideraron especificaciones técnicas reales</li>
                    <li>• Diferencia de precio: ${Math.abs(currentVehicle.price - compareVehicle.price).toLocaleString()}</li>
                    <li>• Mejor puntuación: {Math.max(...aiAnalysis.map(a => a.score))}/100</li>
                  </ul>
                </div>

                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">
                    Esta comparación utiliza <strong>Inteligencia Artificial real (GPT-4)</strong> para analizar 
                    las especificaciones técnicas de ambos vehículos y proporcionar recomendaciones 
                    objetivas y personalizadas.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Botones de Acción - Solo se muestran cuando la comparación está lista */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              <Button 
                variant="wise" 
                onClick={handleFullComparison}
              >
                Comparación Completa
              </Button>
            </div>
          </div>
        )}

        {/* Botón de Cerrar - Solo se muestra durante loading o error */}
        {(loading || error) && (
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}










