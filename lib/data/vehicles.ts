import { prisma } from '@/lib/prisma';
import { cache } from 'react';

// Cachear la obtención de un vehículo para evitar dupicados en generateMetadata y page
export const getVehicle = cache(async (id: string) => {
  const startTotal = performance.now();
  console.log(`[Perf] getVehicle(${id}) started`);

  // 1. Fetch main vehicle with related data
  const vehiclePromise = prisma.vehicle.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: { order: 'asc' }
      },
      vehicleDealers: {
        include: {
          dealer: true
        }
      }
    }
  });

  // Wait for vehicle first to get type/price for similar vehicles query logic
  // Optimizing strictly parallel is hard if similar depends on main vehicle data.
  // BUT, we can at least measure the main vehicle fetch time.
  const startMain = performance.now();
  const vehicle = await vehiclePromise;
  console.log(`[Perf] Main vehicle query took ${(performance.now() - startMain).toFixed(2)}ms`);

  if (!vehicle) {
    console.log(`[Perf] Vehicle not found. Total time: ${(performance.now() - startTotal).toFixed(2)}ms`);
    return null;
  }

  // Parse specifications safely
  let parsedSpecs = vehicle.specifications as any;
  if (typeof parsedSpecs === 'string') {
    try {
      parsedSpecs = JSON.parse(parsedSpecs);
    } catch (e) {
      parsedSpecs = {};
    }
  }

  // 2. Fetch similar vehicles efficiently
  const minPrice = vehicle.price * 0.7;
  const maxPrice = vehicle.price * 1.3;

  console.log(`[Perf] Fetching similar vehicles...`);
  const simStart = performance.now();

  // Queries optimized with indexes [status, price] and [type]
  const similarVehicles = await prisma.vehicle.findMany({
    where: {
      type: vehicle.type,
      id: { not: vehicle.id },
      price: { gte: minPrice, lte: maxPrice },
      status: 'NUEVO'
    },
    select: {
      id: true,
      brand: true,
      model: true,
      year: true,
      price: true,
      fuelType: true, // Use raw field
      type: true,
      status: true,
      specifications: true,
      images: {
        take: 1,
        orderBy: { order: 'asc' },
        select: { url: true }
      }
    },
    orderBy: {
      price: 'asc' // Use index
    },
    take: 1
  });
  console.log(`[Perf] Similar vehicles query took ${(performance.now() - simStart).toFixed(2)}ms`);


  const transformedSimilar = similarVehicles.map(v => {
    let vSpecs = v.specifications as any;
    if (typeof vSpecs === 'string') {
      try { vSpecs = JSON.parse(vSpecs); } catch (e) { vSpecs = {}; }
    }
    return {
      id: v.id,
      brand: v.brand,
      model: v.model,
      year: v.year,
      price: v.price,
      fuel: v.fuelType?.toUpperCase() || 'GASOLINA',
      imageUrl: v.images?.[0]?.url || null,
      category: v.type,
      status: v.status || 'NUEVO',
      type: v.type,
      specifications: vSpecs
    };
  });

  const result = {
    ...vehicle,
    fuel: vehicle.fuelType.toUpperCase(),
    imageUrl: vehicle.images?.[0]?.url || null,
    category: vehicle.type,
    status: vehicle.status || 'NUEVO',
    power: parsedSpecs?.powertrain?.potenciaMaxMotorTermico || parsedSpecs?.powertrain?.potenciaMaxEV,
    engine: parsedSpecs?.powertrain?.cilindrada,
    acceleration: parsedSpecs?.performance?.acceleration0to100,
    cityConsumption: parsedSpecs?.efficiency?.consumoCiudad,
    rating: 4.3,
    slogan: `${vehicle.brand} ${vehicle.model} - Experiencia de conducción excepcional`,
    dealerships: vehicle.vehicleDealers?.map((vd: any) => ({
      id: vd.dealer.id,
      name: vd.dealer.name,
      location: vd.dealer.location
    })) || [],
    specifications: parsedSpecs || {},
    wisemetrics: parsedSpecs?.wisemetrics || null,
    fuelType: vehicle.fuelType, // Raw string
    vehicleType: vehicle.vehicleType,
    type: vehicle.type,
    reviewVideoUrl: vehicle.reviewVideoUrl,
    similarVehicles: transformedSimilar,
    categories: vehicle.wiseCategories
      ? vehicle.wiseCategories.split(',').map((cat: string, index: number) => ({
        id: (index + 1).toString(),
        label: cat.trim(),
        description: `Categoría personalizada: ${cat.trim()}`
      }))
      : [
        { id: '1', label: vehicle.type || 'Automóvil', description: 'Vehículo de alta calidad' },
        { id: '2', label: 'Excelente para diario', description: 'Perfecto para uso diario' },
        { id: '3', label: 'Alto rendimiento', description: 'Rendimiento deportivo excepcional' }
      ]
  };

  console.log(`[Perf] getVehicle total time: ${(performance.now() - startTotal).toFixed(2)}ms`);
  return result;
});

export interface GetVehiclesOptions {
  search?: string;
  category?: string | string[];
  fuelType?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  dealerId?: string;
  limit?: number;
  page?: number;
  sortBy?: string;
  recommended?: boolean;
}

export const getVehicles = cache(async (options: GetVehiclesOptions = {}) => {
  console.log('[Perf] Fetching vehicle list...', options);
  const start = performance.now();
  const {
    search,
    category,
    fuelType,
    minPrice,
    maxPrice,
    dealerId,
    limit = 12,
    page = 1,
    sortBy = 'createdAt',
    recommended
  } = options;

  // Build filters
  const where: any = {};

  if (search) {
    where.OR = [
      { brand: { contains: search, mode: 'insensitive' } }, // Add mode insensitive for better UX
      { model: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (category) {
    const categories = Array.isArray(category) ? category : [category];
    if (categories.length > 0) where.type = { in: categories };
  }

  if (fuelType) {
    const types = Array.isArray(fuelType) ? fuelType : [fuelType];
    if (types.length > 0) where.fuelType = { in: types };
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = minPrice;
    if (maxPrice) where.price.lte = maxPrice;
  }

  if (dealerId) {
    where.vehicleDealers = {
      some: { dealerId: dealerId }
    };
  }

  // Pagination
  const pageSize = limit;
  const skip = (page - 1) * pageSize;

  // Sort
  const orderBy: any = {};
  switch (sortBy) {
    case 'price-low': orderBy.price = 'asc'; break;
    case 'price-high': orderBy.price = 'desc'; break;
    case 'year-new': orderBy.year = 'desc'; break;
    case 'year-old': orderBy.year = 'asc'; break;
    case 'brand': orderBy.brand = 'asc'; break;
    case 'relevance':
    default: orderBy.createdAt = 'desc'; break;
  }

  // Consulta principal - SPLIT FOR DEBUGGING
  console.log(`[Perf] API getVehicles: Starting findMany...`);
  const startFind = performance.now();
  const vehicles = await prisma.vehicle.findMany({
    where,
    skip,
    take: pageSize,
    orderBy,
    select: {
      id: true,
      brand: true,
      model: true,
      year: true,
      price: true,
      fuelType: true,
      type: true,
      status: true,
      images: {
        orderBy: { order: 'asc' },
        take: 1,
        select: {
          url: true,
          type: true,
          isThumbnail: true
        }
      }
    }
  });
  console.log(`[Perf] API getVehicles: findMany took ${(performance.now() - startFind).toFixed(2)}ms`);

  console.log(`[Perf] API getVehicles: Starting count...`);
  const startCount = performance.now();
  const total = await prisma.vehicle.count({ where });
  console.log(`[Perf] API getVehicles: count took ${(performance.now() - startCount).toFixed(2)}ms`);


  console.log(`[Perf] API getVehicles Total query time: ${(performance.now() - start).toFixed(2)}ms. Found ${total} vehicles.`);

  // If recommended, limit (Note: original API sliced array AFTER query, which is inefficient but consistent)
  // Better to use 'take' in query, but logic depends on 'recommended' flag being just a filter or a sort?
  // Original code: if (recommended === '1') vehicles.splice(3);
  // We will keep behavior but maybe optimize query later.
  let resultVehicles = vehicles;
  if (recommended) {
    resultVehicles = vehicles.slice(0, 3);
  }

  // Transform to match UI expectation (VehicleCard interface)
  const transformedVehicles = resultVehicles.map((vehicle: any) => {
    const thumbnailImage = vehicle.images?.find((img: any) => img.isThumbnail)?.url ||
      vehicle.images?.find((img: any) => img.type === 'gallery')?.url ||
      vehicle.images?.[0]?.url || null;

    return {
      id: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      price: vehicle.price,
      fuel: vehicle.fuelType.toUpperCase(),
      imageUrl: thumbnailImage,
      category: vehicle.type,
      status: vehicle.status || 'NUEVO',
      images: vehicle.images || []
    };
  });

  return {
    vehicles: transformedVehicles,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
});

