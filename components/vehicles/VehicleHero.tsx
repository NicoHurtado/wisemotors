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
      <div className="relative h-screen overflow-hidden">
        {(() => {
          // Para el detalle del vehículo, usar la imagen de portada (cover)
          const coverImage = vehicle.images?.find((img: any) => img.type === 'cover')?.url ||
            vehicle.imageUrl;

          return coverImage ? (
            <Image
              src={coverImage}
              alt={`${vehicle.brand} ${vehicle.model}`}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-800">
              <span className="text-gray-400 text-lg">Sin imagen</span>
            </div>
          );
        })()}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/30 to-transparent" />

        {/* Content overlay - Centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-4xl mx-auto text-center">
            {/* Badge and Title */}
            <div className="mb-8">
              <Badge variant="wise" className="mb-4 md:mb-6 text-xs sm:text-sm px-4 py-2 md:px-6 md:py-3 text-sm md:text-base">
                {vehicle.category} • {vehicle.year}
              </Badge>

              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-4 md:mb-6 leading-tight">
                {vehicle.brand} {vehicle.model}
              </h1>
            </div>

            {/* Rating and Action - Centered */}
            <div className="flex flex-col items-center gap-6 md:gap-8 mb-8 md:mb-12">
              {/* Rating */}
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 text-white text-center sm:text-left">
                <div className="flex items-center">
                  <Star className="w-6 h-6 md:w-8 md:h-8 text-yellow-400 fill-current" />
                  <span className="ml-2 md:ml-3 text-2xl md:text-3xl font-bold">{vehicle.rating}</span>
                </div>
                <span className="text-gray-300 text-sm md:text-lg">Calificación WiseMotors</span>
              </div>

              {/* Explore Button */}
              <Button
                size="lg"
                variant="wise"
                className="text-base md:text-xl px-6 py-4 md:px-10 md:py-6 font-semibold"
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

            {/* Simple Scroll Down Arrow */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
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
                <ChevronDown className="w-10 h-10 text-white/80 hover:text-white transition-colors" strokeWidth={2} />
              </div>
            </div>
          </div>
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          disabled={favoriteLoading}
          className="absolute top-4 right-4 md:top-8 md:right-8 p-3 md:p-4 bg-white/90 backdrop-blur-sm rounded-full shadow-soft hover:bg-white transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={isFavorite(vehicle.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <Heart
            className={`w-5 h-5 md:w-6 md:h-6 transition-colors ${isFavorite(vehicle.id) ? 'fill-wise text-wise' : 'text-gray-600'
              }`}
          />
        </button>

      </div>
    </div>
  );
}
