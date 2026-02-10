'use client';

import Image from 'next/image';
import { Heart, Star, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface VehicleHeroProps {
  vehicle: any;
  onVideoClick?: () => void;
}

export function VehicleHero({ vehicle, onVideoClick }: VehicleHeroProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite, loading: favoriteLoading } = useFavorites();

  const handleFavoriteClick = async () => {
    if (!user) {
      // Redirigir al login si no está autenticado
      router.push('/login');
      return;
    }

    try {
      console.log('VehicleHero: Toggling favorite for vehicle:', vehicle.id);
      console.log('VehicleHero: User:', user);
      console.log('VehicleHero: Token exists:', !!localStorage.getItem('token'));
      await toggleFavorite(vehicle.id);
      console.log('VehicleHero: Favorite toggled successfully');
    } catch (error) {
      console.error('VehicleHero: Error toggling favorite:', error);
      // Mostrar error al usuario
      alert(error instanceof Error ? error.message : 'Error al agregar/quitar de favoritos');
    }
  };

  return (
    <div className="relative bg-gray-900">
      {/* Hero Image */}
      <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-screen overflow-hidden bg-gray-800">
        {(() => {
          // Para el detalle del vehículo, usar la imagen de portada (cover)
          const coverImage = `/api/vehicles/${vehicle.id}/image?index=0`;

          return coverImage ? (
            <Image
              src={coverImage}
              alt={`${vehicle.brand} ${vehicle.model}`}
              fill
              className="object-contain sm:object-contain md:object-cover"
              priority
              quality={100}
              unoptimized={true}
              sizes="100vw"
              style={{
                objectPosition: 'center center',
                imageRendering: '-webkit-optimize-contrast'
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-800">
              <span className="text-gray-400 text-lg">Sin imagen</span>
            </div>
          );
        })()}

        {/* Overlay gradient - Mejorado para mejor contraste y legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 sm:from-black/70 sm:via-black/35 sm:to-transparent" />

        {/* Subtle backdrop blur for depth - only on text area */}
        <div className="absolute inset-0 backdrop-blur-[0.5px]" />

        {/* Content overlay - Centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
          <div className="w-full max-w-4xl mx-auto text-center">
            {/* Badge and Title */}
            <div className="mb-4 sm:mb-6 md:mb-8">
              <Badge variant="wise" className="mb-3 sm:mb-4 md:mb-6 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-3">
                {vehicle.type || vehicle.specifications?.identification?.carrocería || vehicle.category} • {vehicle.year}
              </Badge>

              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-3 sm:mb-4 md:mb-6 leading-tight px-2" style={{ textShadow: '0 4px 12px rgba(0, 0, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.6)' }}>
                {vehicle.brand} {vehicle.model}
              </h1>
            </div>

            {/* Rating and Action - Centered */}
            <div className="flex flex-col items-center gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8 md:mb-12">
              {/* Rating */}
              <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-3 text-white text-center sm:text-left">
                <div className="flex items-center">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-yellow-400 fill-current" />
                  <span className="ml-2 sm:ml-3 text-xl sm:text-2xl md:text-3xl font-bold">{vehicle.rating}</span>
                </div>
                <span className="text-gray-300 text-xs sm:text-sm md:text-lg">Calificación WiseMotors</span>
              </div>

              {/* Explore Button */}
              <Button
                size="lg"
                variant="wise"
                className="text-sm sm:text-base md:text-xl px-5 py-3 sm:px-6 sm:py-4 md:px-10 md:py-6 font-semibold w-full sm:w-auto"
                onClick={() => {
                  const nextSection = document.querySelector('section');
                  if (nextSection) {
                    nextSection.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start'
                    });
                  }
                }}
              >
                Explorar Vehículo
              </Button>
            </div>

            {/* Simple Scroll Down Arrow - Oculto en móvil muy pequeño */}
            <div className="hidden sm:flex absolute bottom-4 sm:bottom-8 left-0 right-0 justify-center">
              <div
                className="animate-bounce cursor-pointer p-2"
                onClick={() => {
                  const nextSection = document.querySelector('section');
                  if (nextSection) {
                    nextSection.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start'
                    });
                  }
                }}
              >
                <ChevronDown className="w-8 h-8 sm:w-10 sm:h-10 text-white/80 hover:text-white transition-colors" strokeWidth={2} />
              </div>
            </div>
          </div>
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          disabled={favoriteLoading}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-8 md:right-8 p-2.5 sm:p-3 md:p-4 bg-white/90 backdrop-blur-sm rounded-full shadow-soft hover:bg-white transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed z-10"
          aria-label={isFavorite(vehicle.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <Heart
            className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 transition-colors ${isFavorite(vehicle.id) ? 'fill-wise text-wise' : 'text-gray-600'
              }`}
          />
        </button>

      </div>
    </div>
  );
}
