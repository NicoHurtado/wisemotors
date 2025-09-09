import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// GET - Obtener vehículos trending
export async function GET() {
  try {
    const trendingVehicles = await prisma.vehicle.findMany({
      where: {
        isTrending: true,
        status: 'Disponible'
      },
      orderBy: {
        trendingOrder: 'asc'
      },
      include: {
        images: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      vehicles: trendingVehicles
    });
  } catch (error) {
    console.error('Error fetching trending vehicles:', error);
    return NextResponse.json(
      { error: 'Error al obtener vehículos trending' },
      { status: 500 }
    );
  }
}

// POST - Actualizar vehículos trending (solo admin)
export async function POST(request: NextRequest) {
  try {
    const { vehicleIds } = await request.json();
    
    if (!Array.isArray(vehicleIds) || vehicleIds.length > 6) {
      return NextResponse.json(
        { error: 'Máximo 6 vehículos trending permitidos' },
        { status: 400 }
      );
    }

    // Primero, quitar trending a todos los vehículos
    await prisma.vehicle.updateMany({
      where: {
        isTrending: true
      },
      data: {
        isTrending: false,
        trendingOrder: null
      }
    });

    // Luego, agregar trending a los vehículos seleccionados
    if (vehicleIds.length > 0) {
      const updatePromises = vehicleIds.map((vehicleId, index) => 
        prisma.vehicle.update({
          where: { id: vehicleId },
          data: {
            isTrending: true,
            trendingOrder: index + 1
          }
        })
      );

      await Promise.all(updatePromises);
    }

    return NextResponse.json({
      success: true,
      message: 'Vehículos trending actualizados correctamente'
    });
  } catch (error) {
    console.error('Error updating trending vehicles:', error);
    return NextResponse.json(
      { error: 'Error al actualizar vehículos trending' },
      { status: 500 }
    );
  }
}
