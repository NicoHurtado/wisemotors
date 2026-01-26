import { Metadata, ResolvingMetadata } from 'next'
import { prisma } from '@/lib/prisma'
import { VehicleDetail } from '@/components/vehicles/VehicleDetail'
import { notFound } from 'next/navigation'
import Script from 'next/script'

interface Props {
  params: { id: string }
}

async function getVehicle(id: string) {
  const vehicle = await prisma.vehicle.findUnique({
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

  if (!vehicle) return null;

  // Parse specifications
  let parsedSpecs = vehicle.specifications as any;
  if (typeof parsedSpecs === 'string') {
    try {
      parsedSpecs = JSON.parse(parsedSpecs);
    } catch (e) {
      parsedSpecs = {};
    }
  }

  // Fetch similar vehicles
  const minPrice = vehicle.price * 0.7;
  const maxPrice = vehicle.price * 1.3;
  const similarVehicles = await prisma.vehicle.findMany({
    where: {
      type: vehicle.type,
      id: { not: vehicle.id },
      price: { gte: minPrice, lte: maxPrice },
      status: 'NUEVO'
    },
    include: {
      images: {
        take: 1,
        orderBy: { order: 'asc' }
      }
    },
    take: 6
  });

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

  return {
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
    fuelType: vehicle.fuelType,
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
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const vehicle = await getVehicle(params.id);

  if (!vehicle) {
    return {
      title: 'Vehículo no encontrado',
    }
  }

  const title = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`;
  const description = `Conoce todo sobre el ${vehicle.brand} ${vehicle.model} ${vehicle.year}. Precio: $${vehicle.price.toLocaleString()}. Especificaciones, rendimiento y más en WiseMotors.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | WiseMotors`,
      description,
      images: vehicle.imageUrl ? [vehicle.imageUrl] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | WiseMotors`,
      description,
      images: vehicle.imageUrl ? [vehicle.imageUrl] : [],
    },
  }
}

export default async function VehicleDetailPage({ params }: Props) {
  const vehicle = await getVehicle(params.id);

  if (!vehicle) {
    notFound();
  }

  // JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
    description: vehicle.slogan,
    brand: {
      '@type': 'Brand',
      name: vehicle.brand,
    },
    model: vehicle.model,
    modelDate: vehicle.year,
    vehicleEngine: {
      '@type': 'EngineSpecification',
      engineDisplacement: vehicle.engine ? `${vehicle.engine} cc` : undefined,
      enginePower: vehicle.power ? `${vehicle.power} HP` : undefined,
    },
    fuelType: vehicle.fuelType,
    offers: {
      '@type': 'Offer',
      price: vehicle.price,
      priceCurrency: 'COP',
      availability: 'https://schema.org/InStock',
    },
    image: vehicle.imageUrl,
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Script
        id="vehicle-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <VehicleDetail vehicle={vehicle} />
    </div>
  );
}
