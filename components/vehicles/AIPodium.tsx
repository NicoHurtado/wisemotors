'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { routes } from '@/lib/urls';

interface PodiumItem {
  rank: number; // 1,2,3
  match: number; // 0-100
  reasons: string[];
  vehicle: {
    id: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    fuelType: string;
    type: string;
    imageUrl: string | null;
  };
}

interface AIPodiumProps {
  results: PodiumItem[];
}

export function AIPodium({ results }: AIPodiumProps) {
  const ordered = [...results].sort((a, b) => a.rank - b.rank);

  const getMedal = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-lg font-bold px-4 py-2';
    if (rank === 2) return 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-800 text-lg font-bold px-4 py-2';
    return 'bg-gradient-to-r from-orange-300 to-orange-500 text-white text-lg font-bold px-4 py-2';
  };

  const rankLabel = (rank: number) => `${rank}° Puesto`;

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold">Top 3 recomendados</h3>
        <p className="text-gray-500">Basado en tu solicitud y datos reales de los vehículos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {ordered.map((item) => (
          <a
            key={item.vehicle.id}
            href={`/vehicles/${item.vehicle.id}`}
            className="group block transform transition-all duration-300 hover:-translate-y-1 cursor-pointer w-full h-full"
          >
            <div className="rounded-xl border bg-white shadow-md hover:shadow-xl overflow-hidden h-full group-hover:border-wise/30 group-hover:bg-gray-50/50 transition-all duration-300">
              <div className="relative h-48 bg-gray-50">
                {item.vehicle.imageUrl ? (
                  <img
                    src={item.vehicle.imageUrl}
                    alt={`${item.vehicle.brand} ${item.vehicle.model}`}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">Sin imagen</div>
                )}
                <div className={`absolute left-4 top-3 px-3 py-1 rounded-full text-sm font-semibold shadow ${getMedal(item.rank)}`}>
                  {rankLabel(item.rank)}
                </div>
                <div className="absolute right-4 top-3 px-3 py-1 rounded-full text-sm font-semibold bg-white text-gray-800 shadow text-lg font-bold">
                  {item.match}% match
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="font-semibold text-gray-900 text-lg">
                  {item.vehicle.brand} {item.vehicle.model}
                </div>
                <div className="text-sm text-gray-500">
                  {item.vehicle.year} • {item.vehicle.fuelType} • {item.vehicle.type}
                </div>
                <div className="text-wise font-semibold">$ {item.vehicle.price.toLocaleString('es-CO')}</div>
                {item.reasons && item.reasons.length > 0 && (
                  <ul className="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
                    {item.reasons.slice(0, 3).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Botón para ver más vehículos */}
      <div className="text-center mt-8">
        <Button 
          asChild 
          size="lg" 
          variant="outline" 
          className="text-lg px-8 py-4 border-2 border-wise text-wise hover:bg-wise hover:text-white transition-all duration-300"
        >
          <a href={routes.vehicles} className="flex items-center gap-2">
            ¿Quieres ver más carros? Mira todos los vehículos
            <ArrowRight className="w-5 h-5" />
          </a>
        </Button>
      </div>
    </div>
  );
}


