'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { VehicleCard as VehicleCardType } from '@/lib/types';
import { formatPrice, getFuelLabel, getCategoryLabel } from '@/lib/utils';
import { useVehicleImage } from '@/lib/utils/imageUtils';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PhotoCarousel } from '@/components/ui/PhotoCarousel';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';

interface VehicleCardProps {
  vehicle: VehicleCardType;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onExplore?: (id: string) => void;
  showAffinity?: boolean;
  affinityScore?: number;
  reasons?: string[];
  compact?: boolean;
  matchPercentage?: number;
}

export function VehicleCard({
  vehicle,
  isFavorite: externalIsFavorite,
  onToggleFavorite: externalOnToggleFavorite,
  onExplore,
  showAffinity = false,
  affinityScore,
  reasons,
  compact = false,
  matchPercentage
}: VehicleCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite, loading: favoriteLoading } = useFavorites();

  // Usar el estado interno de favoritos si no se proporciona externamente
  const isFav = externalIsFavorite !== undefined ? externalIsFavorite : isFavorite(vehicle.id);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    // Prevenir que el click en favoritos abra el detalle del vehículo
    e.stopPropagation();

    if (!user) {
      // Redirigir al login si no está autenticado
      router.push('/login');
      return;
    }

    try {
      if (externalOnToggleFavorite) {
        // Si se proporciona un handler externo, usarlo
        externalOnToggleFavorite(vehicle.id);
      } else {
        // Usar el hook interno
        await toggleFavorite(vehicle.id);
      }
    } catch (error) {
      console.error('VehicleCard: Error toggling favorite:', error);
    }
  };

  const handleCardClick = () => {
    if (onExplore) {
      onExplore(vehicle.id);
    } else {
      // Navegación por defecto si no se proporciona onExplore
      router.push(`/vehicles/${vehicle.id}`);
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    // Prevenir que el click en el botón active también el click de la tarjeta
    e.stopPropagation();
    handleCardClick();
  };

  // Obtener solo las imágenes de galería (NO la portada)
  const galleryImages = vehicle.images?.filter((img: any) => img.type === 'gallery') || [];

  // Ordenar todas las imágenes de galería por orden
  const orderedGalleryImages = galleryImages.sort((a: any, b: any) => a.order - b.order);

  // Obtener URLs de las imágenes ordenadas
  const vehicleImages = orderedGalleryImages.map((img: any) => img.url);

  // Para el thumbnail estático, usar siempre la primera imagen de galería
  const displayThumbnailUrl = galleryImages[0]?.url || vehicle.imageUrl;
  const displayThumbnail = useVehicleImage(displayThumbnailUrl, vehicle.brand, vehicle.model);

  // Si hay múltiples imágenes de galería, usar el carrusel, sino usar la imagen estática
  const hasMultipleImages = vehicleImages.length > 1;
  const displayImages = hasMultipleImages ? vehicleImages : [displayThumbnail];

  return (
    <Card
      className="group overflow-hidden transition-all duration-300 hover:shadow-soft hover:-translate-y-1 cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <PhotoCarousel
          images={displayImages}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="w-full h-full"
          showNavigation={hasMultipleImages}
          autoPlay={false}
        />

        {/* Favorite button */}
        <button
          onClick={handleFavoriteClick}
          disabled={favoriteLoading}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-soft transition-all duration-200 hover:bg-white hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${isFav ? 'fill-wise text-wise' : 'text-gray-400'
              }`}
          />
        </button>

        {/* Category badge */}
        {vehicle.category && !showAffinity && (
          <div className="absolute bottom-3 left-3">
            <Badge variant="wise" className="text-xs">
              {getCategoryLabel(vehicle.category)}
            </Badge>
          </div>
        )}

        {/* Affinity badge */}
        {showAffinity && affinityScore !== undefined && (
          <div className="absolute bottom-3 left-3">
            <Badge
              variant="wise"
              className={`text-xs ${affinityScore >= 80
                  ? 'bg-green-500 text-white'
                  : affinityScore >= 60
                    ? 'bg-yellow-500 text-white'
                    : 'bg-red-500 text-white'
                }`}
            >
              {affinityScore}% match
            </Badge>
          </div>
        )}

        {/* Match percentage badge for objective searches */}
        {!showAffinity && matchPercentage !== undefined && matchPercentage < 100 && (
          <div className="absolute bottom-3 left-3">
            <Badge
              variant="wise"
              className={`text-xs ${matchPercentage >= 90
                  ? 'bg-green-500 text-white'
                  : matchPercentage >= 75
                    ? 'bg-blue-500 text-white'
                    : matchPercentage >= 60
                      ? 'bg-yellow-500 text-white'
                      : 'bg-orange-500 text-white'
                }`}
            >
              {matchPercentage}% coincidencia
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

          {/* AI Reasons */}
          {reasons && reasons.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-wise mb-2">¿Por qué te lo recomendamos?</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {reasons.slice(0, 3).map((reason, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-wise mt-0.5">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleButtonClick}
          className="w-full bg-wise hover:bg-wise-dark transition-colors"
        >
          Explorar Vehículo
        </Button>
      </CardFooter>
    </Card>
  );
}
