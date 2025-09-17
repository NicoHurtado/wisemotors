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
          power: data.specifications?.combustion?.maxPower || data.specifications?.electric?.maxPower,
          engine: data.specifications?.combustion?.displacement,
          acceleration: data.specifications?.performance?.acceleration0to100,
          cityConsumption: data.specifications?.combustion?.cityConsumption,
          rating: 4.3, // Valor por defecto
          slogan: `${data.brand} ${data.model} - Experiencia de conducción excepcional`,
          reviewVideoUrl: data.reviewVideoUrl,
          dealerships: data.vehicleDealers?.map((vd: any) => ({
            id: vd.dealer.id,
            name: vd.dealer.name,
            location: vd.dealer.location
          })) || [],
          specifications: {
            general: {
              brand: data.brand,
              model: data.model,
              year: data.year,
              category: data.type,
              fuelType: data.fuelType,
              vehicleType: data.vehicleType,
            },
            performance: {
              acceleration0to100: data.specifications?.performance?.acceleration0to100,
              acceleration0to200: data.specifications?.performance?.acceleration0to200,
              quarterMile: data.specifications?.performance?.quarterMile,
              overtaking80to120: data.specifications?.performance?.overtaking80to120,
              maxSpeed: data.specifications?.performance?.maxSpeed,
              powerToWeight: data.specifications?.performance?.powerToWeight,
              launchControl: data.specifications?.performance?.launchControl
            },
            chassis: {
              groundClearance: data.specifications?.chassis?.groundClearance,
              brakingDistance100to0: data.specifications?.chassis?.brakingDistance100to0,
              maxLateralAcceleration: data.specifications?.chassis?.maxLateralAcceleration,
              maxLongitudinalAcceleration: data.specifications?.chassis?.maxLongitudinalAcceleration,
            },
            offRoad: {
              approachAngle: data.specifications?.offRoad?.approachAngle,
              departureAngle: data.specifications?.offRoad?.departureAngle,
              breakoverAngle: data.specifications?.offRoad?.breakoverAngle,
              wadingDepth: data.specifications?.offRoad?.wadingDepth,
              wadingHeight: data.specifications?.offRoad?.wadingHeight,
            },
            weight: {
              grossCombinedWeight: data.specifications?.weight?.grossCombinedWeight,
              payload: data.specifications?.weight?.payload,
              towingCapacity: data.specifications?.weight?.towingCapacity,
              cargoBoxVolume: data.specifications?.weight?.cargoBoxVolume
            },
            dimensions: {
              length: data.specifications?.dimensions?.length,
              width: data.specifications?.dimensions?.width,
              height: data.specifications?.dimensions?.height,
              curbWeight: data.specifications?.dimensions?.curbWeight,
              wheelbase: data.specifications?.dimensions?.wheelbase,
              cargoCapacity: data.specifications?.dimensions?.cargoCapacity
            },

            safety: {
              airbags: data.specifications?.safety?.airbags,
              ncapRating: data.specifications?.safety?.ncapRating,
              adultSafetyScore: data.specifications?.safety?.adultSafetyScore,
              childSafetyScore: data.specifications?.safety?.childSafetyScore,
              assistanceScore: data.specifications?.safety?.assistanceScore,
              brakeType: data.specifications?.safety?.brakeType,
              brakingSystem: data.specifications?.safety?.brakingSystem,
              stabilityControl: data.specifications?.safety?.stabilityControl,
              tractionControl: data.specifications?.safety?.tractionControl,
              autonomousEmergencyBraking: data.specifications?.safety?.autonomousEmergencyBraking,
              forwardCollisionWarning: data.specifications?.safety?.forwardCollisionWarning,
              laneAssist: data.specifications?.safety?.laneAssist,
              adaptiveCruiseControl: data.specifications?.safety?.adaptiveCruiseControl,
              blindSpotDetection: data.specifications?.safety?.blindSpotDetection,
              crossTrafficAlert: data.specifications?.safety?.crossTrafficAlert,
              fatigueMonitor: data.specifications?.safety?.fatigueMonitor,
              tirePressureMonitoring: data.specifications?.safety?.tirePressureMonitoring
            },
            assistance: {
              brakeAssist: data.specifications?.assistance?.brakeAssist,
              hillStartAssist: data.specifications?.assistance?.hillStartAssist,
              reverseCamera: data.specifications?.assistance?.reverseCamera,
              parkingSensors: data.specifications?.assistance?.parkingSensors,
              cameras360: data.specifications?.assistance?.cameras360
            },
            lighting: {
              headlightType: data.specifications?.lighting?.headlightType,
              automaticHighBeam: data.specifications?.lighting?.automaticHighBeam
            },
            comfort: {
              airConditioning: data.specifications?.comfort?.airConditioning,
              automaticClimateControl: data.specifications?.comfort?.automaticClimateControl,
              heatedSeats: data.specifications?.comfort?.heatedSeats,
              ventilatedSeats: data.specifications?.comfort?.ventilatedSeats,
              massageSeats: data.specifications?.comfort?.massageSeats
            },
            technology: {
              bluetooth: data.specifications?.technology?.bluetooth,
              touchscreen: data.specifications?.technology?.touchscreen,
              navigation: data.specifications?.technology?.navigation,
              smartphoneIntegration: data.specifications?.technology?.smartphoneIntegration,
              wirelessCharger: data.specifications?.technology?.wirelessCharger
            },
            interior: {
              trunkCapacitySeatsDown: data.specifications?.interior?.trunkCapacitySeatsDown,
              seatRows: data.specifications?.interior?.seatRows,
              interiorCargoCapacity: data.specifications?.interior?.interiorCargoCapacity
            },
            combustion: {
              displacement: data.specifications?.combustion?.displacement,
              turbo: data.specifications?.combustion?.turbo,
              engineConfiguration: data.specifications?.combustion?.engineConfiguration,
              inductionType: data.specifications?.combustion?.inductionType,
              compressionRatio: data.specifications?.combustion?.compressionRatio,
              maxPower: data.specifications?.combustion?.maxPower,
              maxTorque: data.specifications?.combustion?.maxTorque,
              rpmLimit: data.specifications?.combustion?.rpmLimit,
              transmissionType: data.specifications?.combustion?.transmissionType,
              gears: data.specifications?.combustion?.gears,
              fuelTankCapacity: data.specifications?.combustion?.fuelTankCapacity,
              powerAtRpm: data.specifications?.combustion?.powerAtRpm,
              cityConsumption: data.specifications?.combustion?.cityConsumption,
              highwayConsumption: data.specifications?.combustion?.highwayConsumption,
              emissionStandard: data.specifications?.combustion?.emissionStandard,
              startStop: data.specifications?.combustion?.startStop,
              ecoMode: data.specifications?.combustion?.ecoMode
            },
            hybrid: {
              displacement: data.specifications?.hybrid?.displacement,
              engineConfiguration: data.specifications?.hybrid?.engineConfiguration,
              maxPower: data.specifications?.hybrid?.maxPower,
              maxTorque: data.specifications?.hybrid?.maxTorque,
              transmissionType: data.specifications?.hybrid?.transmissionType,
              gears: data.specifications?.hybrid?.gears,
              fuelTankCapacity: data.specifications?.hybrid?.fuelTankCapacity,
              cityConsumption: data.specifications?.hybrid?.cityConsumption,
              highwayConsumption: data.specifications?.hybrid?.highwayConsumption,
              batteryCapacity: data.specifications?.hybrid?.batteryCapacity,
              regenerativeBraking: data.specifications?.hybrid?.regenerativeBraking,
              startStop: data.specifications?.hybrid?.startStop,
              ecoMode: data.specifications?.hybrid?.ecoMode
            },
            phev: {
              displacement: data.specifications?.phev?.displacement,
              engineConfiguration: data.specifications?.phev?.engineConfiguration,
              maxPower: data.specifications?.phev?.maxPower,
              maxTorque: data.specifications?.phev?.maxTorque,
              transmissionType: data.specifications?.phev?.transmissionType,
              gears: data.specifications?.phev?.gears,
              fuelTankCapacity: data.specifications?.phev?.fuelTankCapacity,
              cityConsumption: data.specifications?.phev?.cityConsumption,
              highwayConsumption: data.specifications?.phev?.highwayConsumption,
              batteryCapacity: data.specifications?.phev?.batteryCapacity,
              electricRange: data.specifications?.phev?.electricRange,
              acChargingTime: data.specifications?.phev?.acChargingTime,
              dcChargingTime: data.specifications?.phev?.dcChargingTime,
              regenerativeBraking: data.specifications?.phev?.regenerativeBraking,
              batteryWeight: data.specifications?.phev?.batteryWeight,
              homeChargerCost: data.specifications?.phev?.homeChargerCost,
              chargingConvenienceIndex: data.specifications?.phev?.chargingConvenienceIndex
            },
            electric: {
              cityElectricConsumption: data.specifications?.electric?.cityElectricConsumption,
              highwayElectricConsumption: data.specifications?.electric?.highwayElectricConsumption,
              mpge: data.specifications?.electric?.mpge,
              electricRange: data.specifications?.electric?.electricRange,
              acChargingTime: data.specifications?.electric?.acChargingTime,
              dcChargingTime: data.specifications?.electric?.dcChargingTime,
              regenerativeBraking: data.specifications?.electric?.regenerativeBraking,
              batteryCapacity: data.specifications?.electric?.batteryCapacity,
              batteryWeight: data.specifications?.electric?.batteryWeight,
              batteryCost: data.specifications?.electric?.batteryCost,
              homeChargerCost: data.specifications?.electric?.homeChargerCost,
              chargingConvenienceIndex: data.specifications?.electric?.chargingConvenienceIndex
            }
          },
                      wisemetrics: data.specifications?.wisemetrics || null,
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
