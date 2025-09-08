'use client';

import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { Button } from '@/components/ui/button';
import { VehicleCard as VehicleCardType } from '@/lib/types';
import { routes } from '@/lib/urls';
import { useFavorites } from '@/hooks/useFavorites';

interface RecommendationsProps {
  vehicles: VehicleCardType[];
  loading?: boolean;
  error?: string | null;
}

export function Recommendations({ vehicles, loading = false, error = null }: RecommendationsProps) {
  const { isFavorite, toggleFavorite } = useFavorites();

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Recomendaciones <span className="text-wise">Wise</span>
            </h2>
            
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wise mx-auto"></div>
            <p className="text-muted-foreground text-lg">
              Cargando recomendaciones...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Recomendaciones <span className="text-wise">Wise</span>
            </h2>
            
            <div className="text-red-500 text-lg mb-4">
              Error: {error}
            </div>
            <Button asChild size="lg" variant="wise">
              <a href={routes.vehicles}>
                Ver todos los vehículos
              </a>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Recomendaciones <span className="text-wise">Wise</span>
            </h2>
            
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              No hay recomendaciones disponibles en este momento. Explora nuestro catálogo completo de vehículos.
            </p>
            
            <Button asChild size="lg" variant="wise">
              <a href={routes.vehicles}>
                Ver todos los vehículos
              </a>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Recomendaciones <span className="text-wise">Wise</span>
          </h2>
          <p className="text-muted-foreground text-lg mt-2">
            Vehículos seleccionados especialmente para ti
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onExplore={(id) => {
                // Navegar al detalle del vehículo
                window.location.href = `/vehicles/${id}`;
              }}
            />
          ))}
        </div>

        <div className="text-center">
          <Button asChild size="lg" variant="wise">
            <a href={routes.vehicles}>
              Ver todos los vehículos
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
