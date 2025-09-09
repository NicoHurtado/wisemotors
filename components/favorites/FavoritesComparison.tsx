'use client';

import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { Button } from '@/components/ui/button';
import { Heart, Plus } from 'lucide-react';
import Link from 'next/link';

export function FavoritesComparison() {
  const { user } = useAuth();
  const { favorites, loading, error, removeFromFavorites } = useFavorites();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
            <Heart className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Compara tus Favoritos</h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Para guardar y comparar tus vehículos favoritos, necesitas crear una cuenta o iniciar sesión.
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wise mx-auto"></div>
          <p className="text-gray-600">Cargando tus favoritos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <Heart className="w-12 h-12 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Error al cargar favoritos</h1>
          <p className="text-gray-600">{error}</p>
          <Button onClick={() => window.location.reload()} variant="wise">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
            <Plus className="w-12 h-12 text-gray-400" />
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
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Compara tus Favoritos</h1>
          <p className="text-gray-600 mt-2">
            Tienes {favorites.length} vehículo{favorites.length !== 1 ? 's' : ''} en favoritos
          </p>
        </div>

        {/* Grid de favoritos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={{
                id: vehicle.id,
                brand: vehicle.brand,
                model: vehicle.model,
                year: vehicle.year,
                price: vehicle.price,
                fuel: vehicle.fuelType.toUpperCase() as any,
                imageUrl: vehicle.imageUrl,
                category: vehicle.type,
                status: 'Disponible'
              }}
              isFavorite={true}
              onExplore={(id) => window.location.href = `/vehicles/${id}`}
              onToggleFavorite={removeFromFavorites}
            />
          ))}
        </div>

        {/* Acciones */}
        <div className="text-center mt-8 space-y-4">
          <p className="text-gray-600">
            Haz clic en "Explorar Vehículo" para ver detalles completos de cada favorito
          </p>
          <Button asChild variant="outline">
            <Link href="/vehicles">Añadir más favoritos</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}


