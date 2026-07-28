'use client';

import React, { useCallback, useMemo, useRef } from 'react';
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
  /** Posición en la grilla: controla el retraso de la cascada de entrada (40ms por tarjeta). */
  index?: number;
}

export const VehicleCard = React.memo(function VehicleCard({
  vehicle,
  isFavorite: externalIsFavorite,
  onToggleFavorite: externalOnToggleFavorite,
  onExplore,
  showAffinity = false,
  affinityScore,
  reasons,
  compact = false,
  matchPercentage,
  index
}: VehicleCardProps) {
  const router = useRouter();
  const glowFrame = useRef<number | null>(null);

  // Spotlight que sigue al cursor: actualiza --mx/--my con rAF para no
  // disparar más de un cálculo por frame. El pintado es solo opacity (CSS).
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (glowFrame.current !== null) return;
    glowFrame.current = requestAnimationFrame(() => {
      el.style.setProperty('--mx', `${x}px`);
      el.style.setProperty('--my', `${y}px`);
      glowFrame.current = null;
    });
  }, []);
  const { user } = useAuth();
  const { isFavorite, toggleFavorite, loading: favoriteLoading } = useFavorites();

  // Usar el estado interno de favoritos si no se proporciona externamente
  const isFav = externalIsFavorite !== undefined ? externalIsFavorite : isFavorite(vehicle.id);

  const handleFavoriteClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      if (externalOnToggleFavorite) {
        externalOnToggleFavorite(vehicle.id);
      } else {
        await toggleFavorite(vehicle.id);
      }
    } catch (error) {
      // silently handle
    }
  }, [user, router, vehicle.id, externalOnToggleFavorite, toggleFavorite]);

  const handleCardClick = useCallback(() => {
    if (onExplore) {
      onExplore(vehicle.id);
    } else {
      router.push(`/vehicles/${vehicle.id}`);
    }
  }, [onExplore, vehicle.id, router]);

  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    handleCardClick();
  }, [handleCardClick]);

  // Memoize image computations
  const { vehicleImages, displayThumbnailUrl, hasMultipleImages } = useMemo(() => {
    const allImages = (vehicle.images || []).sort((a: any, b: any) => a.order - b.order);
    const cover = allImages.find((img: any) => img.type === 'cover');
    const gallery = allImages.filter((img: any) => img.type === 'gallery');

    const images = [
      ...(cover ? [cover.url] : []),
      ...gallery.map((img: any) => img.url)
    ].filter(Boolean);

    return {
      vehicleImages: images,
      displayThumbnailUrl: cover?.url || gallery[0]?.url || vehicle.imageUrl,
      hasMultipleImages: images.length > 1
    };
  }, [vehicle.images, vehicle.imageUrl]);

  const displayThumbnail = useVehicleImage(displayThumbnailUrl, vehicle.brand, vehicle.model);

  return (
    <Card
      className="group overflow-hidden card-glow card-enter transition-transform duration-300 hover:-translate-y-1 cursor-pointer"
      onClick={handleCardClick}
      onMouseMove={handleMouseMove}
      style={index !== undefined
        ? ({ '--enter-delay': `${Math.min(index, 12) * 40}ms` } as React.CSSProperties)
        : undefined}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <PhotoCarousel
          images={hasMultipleImages
            ? vehicleImages.slice(0, 5)
            : [displayThumbnail]}
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
});
