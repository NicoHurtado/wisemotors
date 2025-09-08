'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { VehicleCard as VehicleCardType } from '@/lib/types';
import { formatPrice, getFuelLabel, getCategoryLabel } from '@/lib/utils';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';

interface VehicleCardProps {
  vehicle: VehicleCardType;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onExplore?: (id: string) => void;
}

export function VehicleCard({ 
  vehicle, 
  isFavorite: externalIsFavorite, 
  onToggleFavorite: externalOnToggleFavorite, 
  onExplore 
}: VehicleCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite, loading: favoriteLoading } = useFavorites();

  // Usar el estado interno de favoritos si no se proporciona externamente
  const isFav = externalIsFavorite !== undefined ? externalIsFavorite : isFavorite(vehicle.id);
  
  const handleFavoriteClick = async () => {
    console.log('VehicleCard: handleFavoriteClick called for vehicle:', vehicle.id);
    console.log('VehicleCard: Current user:', user);
    
    if (!user) {
      console.log('VehicleCard: No user, redirecting to login');
      // Redirigir al login si no está autenticado
      router.push('/login');
      return;
    }

    try {
      console.log('VehicleCard: User authenticated, toggling favorite');
      if (externalOnToggleFavorite) {
        // Si se proporciona un handler externo, usarlo
        console.log('VehicleCard: Using external handler');
        externalOnToggleFavorite(vehicle.id);
      } else {
        // Usar el hook interno
        console.log('VehicleCard: Using internal hook');
        await toggleFavorite(vehicle.id);
        console.log('VehicleCard: Favorite toggled successfully');
      }
    } catch (error) {
      console.error('VehicleCard: Error toggling favorite:', error);
      // Aquí podrías mostrar un toast de error
    }
  };

  const handleExploreClick = () => {
    console.log('VehicleCard: handleExploreClick called with vehicle ID:', vehicle.id);
    if (onExplore) {
      console.log('VehicleCard: Using onExplore prop');
      onExplore(vehicle.id);
    } else {
      console.log('VehicleCard: Using default navigation to:', `/vehicles/${vehicle.id}`);
      // Navegación por defecto si no se proporciona onExplore
      router.push(`/vehicles/${vehicle.id}`);
    }
  };

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-soft hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden">
        {vehicle.imageUrl ? (
          <Image
            src={vehicle.imageUrl}
            alt={`${vehicle.brand} ${vehicle.model}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <span className="text-muted-foreground text-sm">
              Sin imagen
            </span>
          </div>
        )}
        
        {/* Favorite button */}
        <button
          onClick={handleFavoriteClick}
          disabled={favoriteLoading}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-soft transition-all duration-200 hover:bg-white hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFav ? 'fill-wise text-wise' : 'text-gray-400'
            }`}
          />
        </button>
        
        {/* Category badge */}
        {vehicle.category && (
          <div className="absolute bottom-3 left-3">
            <Badge variant="wise" className="text-xs">
              {getCategoryLabel(vehicle.category)}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg text-foreground">
            {vehicle.brand} {vehicle.model}
          </h3>
          
          <p className="text-sm text-muted-foreground">
            {getFuelLabel(vehicle.fuel)} • {vehicle.status || 'Nuevo'} • {vehicle.year}
          </p>
          
          <p className="text-xl font-bold text-foreground">
            {formatPrice(vehicle.price)}
          </p>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button 
          onClick={handleExploreClick}
          className="w-full bg-wise hover:bg-wise-dark transition-colors"
        >
          Explorar Vehículo
        </Button>
      </CardFooter>
    </Card>
  );
}
