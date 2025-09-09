'use client';

import { useState, useEffect } from 'react';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { CompareCards } from '@/components/compare/CompareCards';
import { CompareTables } from '@/components/compare/CompareTables';
import { CompareRadar } from '@/components/compare/CompareRadar';
import { CompareIntelligence } from '@/components/compare/CompareIntelligence';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Car, 
  Table, 
  Radar, 
  Brain, 
  AlertCircle, 
  Users, 
  TrendingUp,
  Zap,
  Shield,
  Smartphone,
  X
} from 'lucide-react';
import Link from 'next/link';

type ViewType = 'cards' | 'tables' | 'radar' | 'intelligence';

export default function ComparePage() {
  const { user } = useAuth();
  const { favorites, loading, toggleFavorite } = useFavorites();
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>('cards');

  // Máximo 5 vehículos para comparar
  const MAX_COMPARE_VEHICLES = 5;

  useEffect(() => {
    // Si hay 5 o menos favoritos, seleccionarlos todos automáticamente
    if (favorites.length <= MAX_COMPARE_VEHICLES && favorites.length > 0) {
      setSelectedVehicles(favorites.map(v => v.id));
    }
  }, [favorites]);

  const handleVehicleToggle = (vehicleId: string) => {
    setSelectedVehicles(prev => {
      if (prev.includes(vehicleId)) {
        return prev.filter(id => id !== vehicleId);
      } else if (prev.length < MAX_COMPARE_VEHICLES) {
        return [...prev, vehicleId];
      }
      return prev;
    });
  };


  const getSelectedVehiclesData = () => {
    return favorites.filter(v => selectedVehicles.includes(v.id));
  };

  const selectedVehiclesData = getSelectedVehiclesData();

  // Si no está autenticado
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
            <Car className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Compara tus Favoritos</h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Para comparar tus vehículos favoritos, necesitas crear una cuenta o iniciar sesión.
          </p>
          <div className="space-x-4">
            <Button asChild variant="wise">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/register">Crear Cuenta</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Si está cargando
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wise mx-auto"></div>
            <p className="text-gray-600">Cargando tus favoritos...</p>
          </div>
        </div>
      </div>
    );
  }

  // Si no tiene favoritos
  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
              <Car className="w-12 h-12 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">No tienes favoritos aún</h1>
            <p className="text-gray-600 max-w-md mx-auto">
              Para comparar vehículos, primero añade algunos a tus favoritos haciendo clic en el corazón en las tarjetas de vehículos.
            </p>
            <Button asChild variant="wise">
              <Link href="/vehicles">Explorar Vehículos</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Compara tus Favoritos
          </h1>
          <p className="text-gray-600 text-lg">
            Analiza y compara tus vehículos favoritos en diferentes vistas
          </p>
        </div>

        {/* Selección de vehículos */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Selecciona vehículos para comparar
              <Badge variant="outline" className="ml-2">
                {selectedVehicles.length}/{MAX_COMPARE_VEHICLES}
              </Badge>
            </CardTitle>
            <p className="text-sm text-gray-600">
              Selecciona hasta {MAX_COMPARE_VEHICLES} vehículos para comparar. Puedes tener ilimitados favoritos.
            </p>
          </CardHeader>
          <CardContent>
            {favorites.length > MAX_COMPARE_VEHICLES && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Tienes {favorites.length} favoritos. Selecciona solo {MAX_COMPARE_VEHICLES} para comparar.
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {favorites.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedVehicles.includes(vehicle.id)
                      ? 'border-wise bg-wise/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleVehicleToggle(vehicle.id)}
                >

                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedVehicles.includes(vehicle.id)}
                      onChange={() => handleVehicleToggle(vehicle.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0 pr-8">
                      <div className="font-semibold text-gray-900 truncate">
                        {vehicle.brand} {vehicle.model}
                      </div>
                      <div className="text-sm text-gray-600">
                        {vehicle.year} • {vehicle.fuelType}
                      </div>
                      <div className="text-sm font-medium text-wise">
                        ${vehicle.price.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedVehicles.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Selecciona al menos 2 vehículos para comenzar la comparación
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vistas de comparación */}
        {selectedVehicles.length >= 2 && (
          <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as ViewType)}>
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="cards" className="flex items-center gap-2">
                <Car className="w-4 h-4" />
                Tarjetas
              </TabsTrigger>
              <TabsTrigger value="tables" className="flex items-center gap-2">
                <Table className="w-4 h-4" />
                Tablas
              </TabsTrigger>
              <TabsTrigger value="radar" className="flex items-center gap-2">
                <Radar className="w-4 h-4" />
                Radar
              </TabsTrigger>
              <TabsTrigger value="intelligence" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                IA
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cards">
              <CompareCards vehicles={selectedVehiclesData} />
            </TabsContent>

            <TabsContent value="tables">
              <CompareTables vehicles={selectedVehiclesData} />
            </TabsContent>

            <TabsContent value="radar">
              <CompareRadar vehicles={selectedVehiclesData} />
            </TabsContent>

            <TabsContent value="intelligence">
              <CompareIntelligence vehicles={selectedVehiclesData} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}


