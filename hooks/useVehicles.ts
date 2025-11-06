'use client';

import { useState, useEffect } from 'react';

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
  category?: string | string[]; // Ahora soporta múltiples categorías
  fuelType?: string | string[]; // Ahora soporta múltiples tipos de combustible
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
}

export function useVehicles(options: UseVehiclesOptions = {}) {
  const [vehicles, setVehicles] = useState<VehicleCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        setError(null);

        // Construir query params
        const params = new URLSearchParams();
        if (options.limit) params.append('limit', options.limit.toString());
        if (options.recommended) params.append('recommended', '1');
        if (options.dealerId) params.append('dealerId', options.dealerId);
        if (options.search) params.append('search', options.search);
        
        // Agregar múltiples categorías
        if (options.category) {
          if (Array.isArray(options.category)) {
            options.category.forEach(cat => params.append('category', cat));
          } else {
            params.append('category', options.category);
          }
        }
        
        // Agregar múltiples tipos de combustible
        if (options.fuelType) {
          if (Array.isArray(options.fuelType)) {
            options.fuelType.forEach(fuel => params.append('fuelType', fuel));
          } else {
            params.append('fuelType', options.fuelType);
          }
        }
        
        if (options.minPrice) params.append('minPrice', options.minPrice.toString());
        if (options.maxPrice) params.append('maxPrice', options.maxPrice.toString());
        if (options.sortBy) params.append('sortBy', options.sortBy);

        const response = await fetch(`/api/vehicles?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Error al cargar los vehículos');
        }

        const data = await response.json();
        
        // Transformar datos de la API al formato esperado por la UI
        const transformedVehicles: VehicleCard[] = data.vehicles.map((vehicle: any) => {
          // Buscar imagen miniatura, si no existe usar la primera de galería
          const thumbnailImage = vehicle.images?.find((img: any) => img.isThumbnail)?.url ||
                                vehicle.images?.find((img: any) => img.type === 'gallery')?.url ||
                                vehicle.images?.[0]?.url || null;
          
          return {
            id: vehicle.id,
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            price: vehicle.price,
            fuel: vehicle.fuelType.toUpperCase() as any,
            imageUrl: thumbnailImage,
            category: vehicle.type,
            status: vehicle.status || 'NUEVO',
            images: vehicle.images || [] // Pasar todas las imágenes
          };
        });

        setVehicles(transformedVehicles);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error('Error fetching vehicles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [
    options.limit,
    options.recommended,
    options.dealerId,
    options.search,
    options.category,
    options.fuelType,
    options.minPrice,
    options.maxPrice,
    options.sortBy
  ]);

  return { vehicles, loading, error };
}

export function useVehicle(id: string) {
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/vehicles/${id}`);
        
        if (!response.ok) {
          throw new Error('Error al cargar el vehículo');
        }

        const data = await response.json();
        
        // Transformar datos de la API al formato esperado por la UI
        
        // Parsear specifications si es un string (ya viene parseado desde la API, pero asegurarse)
        let parsedSpecs = data.specifications;
        if (typeof parsedSpecs === 'string') {
          try {
            parsedSpecs = JSON.parse(parsedSpecs);
          } catch (e) {
            console.error('Error parsing specifications:', e);
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
          images: data.images || [], // Agregar las imágenes completas
          category: data.type,
          status: data.status || 'NUEVO',
          power: parsedSpecs?.powertrain?.potenciaMaxMotorTermico || parsedSpecs?.powertrain?.potenciaMaxEV,
          engine: parsedSpecs?.powertrain?.cilindrada,
          acceleration: parsedSpecs?.performance?.acceleration0to100,
          cityConsumption: parsedSpecs?.efficiency?.consumoCiudad,
          rating: 4.3, // Valor por defecto
          slogan: `${data.brand} ${data.model} - Experiencia de conducción excepcional`,
          dealerships: data.vehicleDealers?.map((vd: any) => ({
            id: vd.dealer.id,
            name: vd.dealer.name,
            location: vd.dealer.location
          })) || [],
          // Pasar las specifications directamente sin transformar
          specifications: parsedSpecs || {},
          wisemetrics: parsedSpecs?.wisemetrics || null,
          // Pasar también fuelType y vehicleType para uso en el componente
          fuelType: data.fuelType,
          vehicleType: data.vehicleType,
          type: data.type,
          reviewVideoUrl: data.reviewVideoUrl,
          categories: (() => {
            // Si hay categorías personalizadas, usarlas
            if (data.wiseCategories) {
              const customCategories = data.wiseCategories.split(',').map((cat: string, index: number) => ({
                id: (index + 1).toString(),
                label: cat.trim(),
                description: `Categoría personalizada: ${cat.trim()}`
              }));
              return customCategories;
            }
            
            // Categorías por defecto si no hay personalizadas
            return [
              {
                id: '1',
                label: data.type || 'Automóvil',
                description: 'Vehículo de alta calidad'
              },
              {
                id: '2',
                label: 'Excelente para diario',
                description: 'Perfecto para uso diario'
              },
              {
                id: '3',
                label: 'Alto rendimiento',
                description: 'Rendimiento deportivo excepcional'
              }
            ];
          })(),
          similarVehicles: []
        };

        // Usar vehículos similares que ya vienen del API (algoritmo mejorado)
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
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error('Error fetching vehicle:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVehicle();
    }
  }, [id]);

  return { vehicle, loading, error };
}

// Hook para obtener categorías únicas disponibles
export function useCategories() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/vehicles?getCategories=true');
        
        if (!response.ok) {
          throw new Error('Error al cargar las categorías');
        }

        const data = await response.json();
        setCategories(data.categories || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
}

// Hook para obtener tipos de combustible únicos disponibles
export function useFuelTypes() {
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFuelTypes = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/vehicles?getFuelTypes=true');
        
        if (!response.ok) {
          throw new Error('Error al cargar los tipos de combustible');
        }

        const data = await response.json();
        setFuelTypes(data.fuelTypes || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error('Error fetching fuel types:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFuelTypes();
  }, []);

  return { fuelTypes, loading, error };
}
