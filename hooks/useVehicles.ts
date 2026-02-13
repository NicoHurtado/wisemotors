'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

export interface VehicleCard {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  fuel: 'GASOLINE' | 'DIESEL' | 'HYBRID' | 'PHEV' | 'EV';
  imageUrl: string | null;
  category?: string;
  status?: 'NUEVO' | 'USADO';
  images?: Array<{
    id?: string;
    url: string;
    type: string;
    order: number;
    isThumbnail?: boolean;
  }>;
}

export interface VehicleDetail extends VehicleCard {
  power?: number;
  engine?: number;
  acceleration?: number;
  cityConsumption?: number;
  rating?: number;
  slogan?: string;
  dealerships: Array<{
    id: string;
    name: string;
    location: string;
  }>;
  specifications: any;
  wisemetrics?: any;
  categories?: Array<{
    id: string;
    label: string;
    description: string;
  }>;
  similarVehicles?: VehicleCard[];
  images?: Array<{
    id: string;
    url: string;
    type: string;
    order: number;
  }>;
  fuelType?: string;
  vehicleType?: string;
  type?: string;
  reviewVideoUrl?: string | null;
}

interface UseVehiclesOptions {
  limit?: number;
  recommended?: boolean;
  dealerId?: string;
  search?: string;
  category?: string | string[];
  fuelType?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
}

// Stable serialization for array/string options
function stableKey(val: string | string[] | undefined): string {
  if (!val) return '';
  if (Array.isArray(val)) return val.slice().sort().join(',');
  return val;
}

export function useVehicles(
  options: UseVehiclesOptions = {},
  initialData: VehicleCard[] | null = null,
  initialTotal: number = 0
) {
  const [vehicles, setVehicles] = useState<VehicleCard[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(
    initialData ? initialData.length < initialTotal : true
  );
  const [totalVehicles, setTotalVehicles] = useState(initialTotal);
  const isFirstRun = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Create stable dependency keys
  const categoryKey = stableKey(options.category);
  const fuelTypeKey = stableKey(options.fuelType);

  // Reset page when filters change
  useEffect(() => {
    if (!isFirstRun.current) {
      setPage(1);
      setVehicles([]);
      setHasMore(true);
    }
  }, [
    options.search,
    categoryKey,
    fuelTypeKey,
    options.minPrice,
    options.maxPrice,
    options.sortBy
  ]);

  useEffect(() => {
    const fetchVehicles = async (signal: AbortSignal) => {
      // Skip initial fetch if initialData provided
      if (isFirstRun.current && initialData && page === 1) {
        isFirstRun.current = false;
        return;
      }
      isFirstRun.current = false;

      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.append('page', page.toString());
        if (options.limit) params.append('limit', options.limit.toString());
        if (options.recommended) params.append('recommended', '1');
        if (options.dealerId) params.append('dealerId', options.dealerId);
        if (options.search) params.append('search', options.search);

        if (options.category) {
          const cats = Array.isArray(options.category) ? options.category : [options.category];
          cats.forEach(cat => params.append('category', cat));
        }

        if (options.fuelType) {
          const fuels = Array.isArray(options.fuelType) ? options.fuelType : [options.fuelType];
          fuels.forEach(fuel => params.append('fuelType', fuel));
        }

        if (options.minPrice) params.append('minPrice', options.minPrice.toString());
        if (options.maxPrice) params.append('maxPrice', options.maxPrice.toString());
        if (options.sortBy) params.append('sortBy', options.sortBy);

        const response = await fetch(`/api/vehicles?${params.toString()}`, { signal });

        if (!response.ok) {
          throw new Error('Error al cargar los vehículos');
        }

        const data = await response.json();

        const transformedVehicles: VehicleCard[] = data.vehicles.map((vehicle: any) => {
          const firstImage = vehicle.images?.[0];
          const imageUrl = firstImage?.url?.startsWith('http')
            ? firstImage.url
            : `/api/vehicles/${vehicle.id}/image?index=0`;

          return {
            id: vehicle.id,
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            price: vehicle.price,
            fuel: vehicle.fuelType.toUpperCase() as any,
            imageUrl,
            category: vehicle.type,
            status: vehicle.status || 'NUEVO',
            images: (vehicle.images || []).map((img: any) => ({
              ...img,
              url: img.url?.startsWith('http') ? img.url : `/api/vehicles/${vehicle.id}/image?index=${img.order}`
            }))
          };
        });

        if (page === 1) {
          setVehicles(transformedVehicles);
        } else {
          setVehicles(prev => [...prev, ...transformedVehicles]);
        }

        setTotalVehicles(data.pagination?.total || data.total || 0);
        const newTotal = page === 1 ? transformedVehicles.length : vehicles.length + transformedVehicles.length;
        setHasMore(transformedVehicles.length >= (options.limit || 9) && newTotal < (data.pagination?.total || data.total || 0));

      } catch (err) {
        if ((err as Error).name === 'AbortError') return; // Cancelled, ignore
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Debounce filter changes (not page changes)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Immediate fetch for page changes, debounced for filter changes
    const delay = page > 1 ? 0 : 150;
    debounceTimerRef.current = setTimeout(() => {
      fetchVehicles(controller.signal);
    }, delay);

    return () => {
      controller.abort();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    page,
    options.limit,
    options.recommended,
    options.dealerId,
    options.search,
    categoryKey,
    fuelTypeKey,
    options.minPrice,
    options.maxPrice,
    options.sortBy
  ]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [loading, hasMore]);

  return { vehicles, loading, error, hasMore, loadMore, totalVehicles };
}


export function useVehicle(id: string) {
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchVehicle = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/vehicles/${id}`, { signal: controller.signal });

        if (!response.ok) {
          throw new Error('Error al cargar el vehículo');
        }

        const data = await response.json();

        let parsedSpecs = data.specifications;
        if (typeof parsedSpecs === 'string') {
          try {
            parsedSpecs = JSON.parse(parsedSpecs);
          } catch (e) {
            parsedSpecs = {};
          }
        }

        const transformedVehicle: VehicleDetail = {
          id: data.id,
          brand: data.brand,
          model: data.model,
          year: data.year,
          price: data.price,
          fuel: data.fuelType.toUpperCase() as any,
          imageUrl: data.images?.[0]?.url || null,
          images: data.images || [],
          category: data.type,
          status: data.status || 'NUEVO',
          power: parsedSpecs?.powertrain?.potenciaMaxMotorTermico || parsedSpecs?.powertrain?.potenciaMaxEV,
          engine: parsedSpecs?.powertrain?.cilindrada,
          acceleration: parsedSpecs?.performance?.acceleration0to100,
          cityConsumption: parsedSpecs?.efficiency?.consumoCiudad,
          rating: 4.3,
          slogan: `${data.brand} ${data.model} - Experiencia de conducción excepcional`,
          dealerships: data.vehicleDealers?.map((vd: any) => ({
            id: vd.dealer.id,
            name: vd.dealer.name,
            location: vd.dealer.location
          })) || [],
          specifications: parsedSpecs || {},
          wisemetrics: parsedSpecs?.wisemetrics || null,
          fuelType: data.fuelType,
          vehicleType: data.vehicleType,
          type: data.type,
          reviewVideoUrl: data.reviewVideoUrl,
          categories: (() => {
            if (data.wiseCategories) {
              return data.wiseCategories.split(',').map((cat: string, index: number) => ({
                id: (index + 1).toString(),
                label: cat.trim(),
                description: `Categoría personalizada: ${cat.trim()}`
              }));
            }
            return [
              { id: '1', label: data.type || 'Automóvil', description: 'Vehículo de alta calidad' },
              { id: '2', label: 'Excelente para diario', description: 'Perfecto para uso diario' },
              { id: '3', label: 'Alto rendimiento', description: 'Rendimiento deportivo excepcional' }
            ];
          })(),
          similarVehicles: []
        };

        if (data.similarVehicles && Array.isArray(data.similarVehicles)) {
          transformedVehicle.similarVehicles = data.similarVehicles.map((vehicle: any) => ({
            id: vehicle.id,
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            price: vehicle.price,
            fuel: vehicle.fuelType?.toUpperCase() || 'GASOLINA',
            imageUrl: vehicle.images?.[0]?.url || null,
            category: vehicle.type,
            status: vehicle.status || 'NUEVO',
            type: vehicle.type,
            specifications: vehicle.specifications
          }));
        }

        setVehicle(transformedVehicle);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVehicle();
    }

    return () => controller.abort();
  }, [id]);

  return { vehicle, loading, error };
}

// Hook para obtener categorías únicas disponibles
export function useCategories() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/vehicles?getCategories=true', { signal: controller.signal });
        if (!response.ok) throw new Error('Error al cargar las categorías');
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    return () => controller.abort();
  }, []);

  return { categories, loading, error };
}

// Hook para obtener tipos de combustible únicos disponibles
export function useFuelTypes() {
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchFuelTypes = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/vehicles?getFuelTypes=true', { signal: controller.signal });
        if (!response.ok) throw new Error('Error al cargar los tipos de combustible');
        const data = await response.json();
        setFuelTypes(data.fuelTypes || []);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchFuelTypes();
    return () => controller.abort();
  }, []);

  return { fuelTypes, loading, error };
}
