'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PhotoCarousel } from '@/components/ui/PhotoCarousel';
import { Heart, Star } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { routes } from '@/lib/urls';

interface TrendingVehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  type: string;
  fuelType: string;
  images?: Array<{
    url: string;
    alt?: string;
    type?: string;
    isThumbnail?: boolean;
  }>;
}

interface TrendingVehiclesProps {
  loading?: boolean;
  error?: string | null;
}

export function TrendingVehicles({ loading, error }: TrendingVehiclesProps) {
  const [vehicles, setVehicles] = useState<TrendingVehicle[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const { isFavorite, toggleFavorite } = useFavorites();
  const router = useRouter();

  useEffect(() => {
    fetchTrendingVehicles();
  }, []);

  const fetchTrendingVehicles = async () => {
    try {
      const response = await fetch('/api/trending');
      const data = await response.json();
      if (data.success) {
        setVehicles(data.vehicles || []);
      }
    } catch (error) {
      console.error('Error fetching trending vehicles:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getVehicleImages = (vehicle: TrendingVehicle) => {
    if (vehicle.images && vehicle.images.length > 0) {
      // Obtener solo las imágenes de galería (NO la portada)
      const galleryImages = vehicle.images.filter(img => img.type === 'gallery');
      
      if (galleryImages.length > 0) {
        // Buscar imagen miniatura entre las de galería
        const thumbnailImage = galleryImages.find(img => img.isThumbnail);
        const otherGalleryImages = galleryImages.filter(img => !img.isThumbnail);
        
        // Ordenar: miniatura primero, luego el resto por orden
        const orderedGalleryImages = [
          ...(thumbnailImage ? [thumbnailImage] : []),
          ...otherGalleryImages.sort((a, b) => (a as any).order - (b as any).order)
        ];
        
        // Devolver URLs de las imágenes ordenadas
        return orderedGalleryImages.map(img => img.url);
      }
    }
    // Imagen por defecto basada en el tipo de vehículo
    return [`/api/placeholder/400/300?text=${encodeURIComponent(vehicle.brand + ' ' + vehicle.model)}`];
  };

  const getGridLayout = (count: number) => {
    switch (count) {
      case 1:
        return 'grid-cols-1 max-w-md mx-auto';
      case 2:
        return 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto';
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto';
      case 4:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto';
      case 5:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 max-w-7xl mx-auto';
      case 6:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 max-w-7xl mx-auto';
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto';
    }
  };

  if (loading || loadingData) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trending de la Semana
            </h2>
            <p className="text-gray-600 text-lg">
              Vehículos seleccionados especialmente para ti
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wise"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error || vehicles.length === 0) {
    return null; // No mostrar la sección si hay error o no hay vehículos
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Star className="w-8 h-8 text-yellow-500 mr-3" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Trending de la Semana
            </h2>
          </div>
          <p className="text-gray-600 text-lg">
            Vehículos seleccionados especialmente para ti
          </p>
        </div>

        <div className={`grid ${getGridLayout(vehicles.length)} gap-6`}>
          {vehicles.map((vehicle) => (
            <Card 
              key={vehicle.id} 
              className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
              onClick={() => router.push(`${routes.vehicles}/${vehicle.id}`)}
            >
              {/* Imagen del vehículo */}
              <div className="relative h-64 bg-gradient-to-br from-purple-100 to-purple-200 overflow-hidden">
                <PhotoCarousel
                  images={getVehicleImages(vehicle)}
                  alt={vehicle.brand + ' ' + vehicle.model}
                  className="w-full h-full"
                  showNavigation={getVehicleImages(vehicle).length > 1}
                  autoPlay={false}
                />
                
                {/* Badge de tipo */}
                <div className="absolute bottom-3 left-3">
                  <Badge className="bg-purple-600 text-white">
                    {vehicle.type}
                  </Badge>
                </div>

                {/* Botón de favorito */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(vehicle.id); }}
                  className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                >
                  <Heart 
                    className={`w-5 h-5 transition-colors ${
                      isFavorite(vehicle.id) 
                        ? 'text-purple-600 fill-purple-600' 
                        : 'text-gray-400 hover:text-purple-600'
                    }`}
                  />
                </button>
              </div>

              {/* Información del vehículo */}
              <div className="p-6">
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                    {vehicle.brand} {vehicle.model}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {vehicle.fuelType.toUpperCase()} • Disponible • {vehicle.year}
                  </p>
                </div>

                <div className="mb-4">
                  <p className="text-2xl font-bold text-purple-600">
                    {formatPrice(vehicle.price)}
                  </p>
                </div>

                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={(e) => { e.stopPropagation(); router.push(`${routes.vehicles}/${vehicle.id}`); }}
                >
                  Explorar Vehículo
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Botón para ver todos los vehículos */}
        <div className="text-center mt-12">
          <Button 
            asChild 
            variant="outline" 
            size="lg" 
            className="px-8 py-3 text-lg"
          >
            <a href={routes.vehicles}>
              Ver todos los vehículos
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
