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
  
  // Buscar imagen miniatura entre las de galería
  const thumbnailImage = galleryImages.find((img: any) => img.isThumbnail);
  const otherGalleryImages = galleryImages.filter((img: any) => !img.isThumbnail);
  
  // Ordenar: miniatura primero, luego el resto por orden
  const orderedGalleryImages = [
    ...(thumbnailImage ? [thumbnailImage] : []),
    ...otherGalleryImages.sort((a: any, b: any) => a.order - b.order)
  ];
  
  // Obtener URLs de las imágenes ordenadas
  const vehicleImages = orderedGalleryImages.map((img: any) => img.url);
  
  // Para el thumbnail estático, usar la miniatura o la primera de galería
  const displayThumbnailUrl = thumbnailImage?.url || galleryImages[0]?.url || vehicle.imageUrl;
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
          onClick={handleButtonClick}
          className="w-full bg-wise hover:bg-wise-dark transition-colors"
        >
          Explorar Vehículo
        </Button>
      </CardFooter>
    </Card>
  );
}
