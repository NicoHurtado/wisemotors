import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { vehicleUpdateSchema } from '@/lib/schemas/vehicle';

// GET /api/vehicles/[id] - Obtener vehículo por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: params.id },
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

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehículo no encontrado' },
        { status: 404 }
      );
    }

    // Parsear specifications si es un string
    let vehicleData = { ...vehicle };
    if (typeof vehicleData.specifications === 'string') {
      try {
        vehicleData.specifications = JSON.parse(vehicleData.specifications);
      } catch (parseError) {
        console.error('Error parseando specifications:', parseError);
        vehicleData.specifications = {};
      }
    }

    // Obtener vehículos similares con algoritmo mejorado
    const allSimilarVehicles = await prisma.vehicle.findMany({
      where: {
        type: vehicle.type, // Solo mismo tipo
        NOT: {
          id: vehicle.id
        }
      },
      include: {
        images: {
          take: 1
        }
      }
    });

    // Filtrar y ordenar por similaridad inteligente
    const vehiclePrice = vehicle.price;
    const priceRange = vehiclePrice * 0.5; // Rango del 50% del precio base
    
    const similarVehicles = allSimilarVehicles
      .map(v => {
        const priceDifference = Math.abs(v.price - vehiclePrice);
        const priceRatio = priceDifference / vehiclePrice;
        
        // Penalizar mucho los precios muy diferentes (más del 100% de diferencia)
        const priceScore = priceRatio > 1.0 ? 1000 + priceDifference : priceDifference;
        
        // Bonus por misma marca
        const brandBonus = v.brand === vehicle.brand ? -50000 : 0;
        
        return {
          ...v,
          similarityScore: priceScore + brandBonus
        };
      })
      .sort((a, b) => a.similarityScore - b.similarityScore)
      .slice(0, 8) // Aumentar a 8 vehículos para permitir navegación
      .map(({ similarityScore, ...v }) => v);

    // Parsear specifications de vehículos similares también
    const similarVehiclesWithParsedSpecs = similarVehicles.map(v => {
      let vData = { ...v };
      if (typeof vData.specifications === 'string') {
        try {
          vData.specifications = JSON.parse(vData.specifications);
        } catch (parseError) {
          vData.specifications = {};
        }
      }
      return vData;
    });

    return NextResponse.json({
      ...vehicleData,
      similarVehicles: similarVehiclesWithParsedSpecs
    });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/vehicles/[id] - Actualizar vehículo
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validar datos de entrada
    const validatedData = vehicleUpdateSchema.parse(body);
    
    // Verificar que el vehículo existe
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id: params.id }
    });

    if (!existingVehicle) {
      return NextResponse.json(
        { error: 'Vehículo no encontrado' },
        { status: 404 }
      );
    }
    
    // Extraer dealerIds e imágenes si están presentes
    const { dealerIds, coverImage, galleryImages, thumbnailIndex, ...vehicleData } = validatedData;
    
    // Asegurar que specifications se guarde como string
    if (vehicleData.specifications && typeof vehicleData.specifications === 'object') {
      vehicleData.specifications = JSON.stringify(vehicleData.specifications);
    } else if (vehicleData.specifications && typeof vehicleData.specifications === 'string') {
      // Si ya es string, verificar que sea JSON válido
      try {
        JSON.parse(vehicleData.specifications);
      } catch (parseError) {
        console.error('❌ Specifications no es JSON válido:', parseError);
        return NextResponse.json(
          { error: 'Formato inválido de specifications' },
          { status: 400 }
        );
      }
    }
    
    
    // Actualizar vehículo con transacción
    await prisma.$transaction(async (tx) => {
      // 1. Actualizar vehículo
      await tx.vehicle.update({
        where: { id: params.id },
        data: vehicleData
      });
      
      // 2. Manejar relaciones con dealers si están presentes
      if (dealerIds !== undefined) {
        // Eliminar relaciones existentes
        await tx.vehicleDealer.deleteMany({
          where: { vehicleId: params.id }
        });
        
        // Crear nuevas relaciones
        if (dealerIds.length > 0) {
          const vehicleDealers = dealerIds.map(dealerId => ({
            vehicleId: params.id,
            dealerId: dealerId
          }));
          
          await tx.vehicleDealer.createMany({
            data: vehicleDealers
          });
        }
      }
      
      // 3. Manejar imágenes si están presentes
      if (coverImage !== undefined || galleryImages !== undefined) {
        // Eliminar imágenes existentes
        await tx.vehicleImage.deleteMany({
          where: { vehicleId: params.id }
        });
        
        // Crear nuevas imágenes
        const imagesToCreate = [];
        
        // Imagen de portada
        if (coverImage) {
          imagesToCreate.push({
            vehicleId: params.id,
            url: coverImage,
            type: 'cover',
            order: 0
          });
        }
        
        // Imágenes de galería
        if (galleryImages && galleryImages.length > 0) {
          galleryImages.forEach((imageUrl, index) => {
            imagesToCreate.push({
              vehicleId: params.id,
              url: imageUrl,
              type: 'gallery',
              order: index + 1,
              isThumbnail: thumbnailIndex === index
            });
          });
        }
        
        if (imagesToCreate.length > 0) {
          await tx.vehicleImage.createMany({
            data: imagesToCreate
          });
        }
      }
    });
    
    // Retornar vehículo actualizado
    const updatedVehicle = await prisma.vehicle.findUnique({
      where: { id: params.id },
      include: {
        images: true,
        vehicleDealers: {
          include: {
            dealer: true
          }
        }
      }
    });
    
    return NextResponse.json(updatedVehicle);
  } catch (error: any) {
    console.error('❌ Error completo:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    if (error.name === 'ZodError') {
      console.error('❌ Error de validación Zod:', error.errors);
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error.code) {
      console.error('❌ Error de Prisma:', error.code);
    }
    
    console.error('Error updating vehicle:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/vehicles/[id] - Eliminar vehículo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar que el vehículo existe
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id: params.id }
    });

    if (!existingVehicle) {
      return NextResponse.json(
        { error: 'Vehículo no encontrado' },
        { status: 404 }
      );
    }
    
    // Eliminar vehículo (las imágenes y relaciones se eliminan en cascada)
    await prisma.vehicle.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json(
      { message: 'Vehículo eliminado exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
