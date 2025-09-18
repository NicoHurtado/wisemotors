import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET /api/favorites - Obtener favoritos del usuario
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: decoded.userId },
      include: {
        vehicle: {
          include: {
            images: {
              orderBy: { order: 'asc' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/favorites - Añadir vehículo a favoritos
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { vehicleId } = await request.json();
    if (!vehicleId) {
      return NextResponse.json({ error: 'ID del vehículo requerido' }, { status: 400 });
    }

    // Verificar que el vehículo existe
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 });
    }

    // Verificar si ya está en favoritos
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId: decoded.userId,
        vehicleId: vehicleId
      }
    });

    if (existingFavorite) {
      return NextResponse.json({ error: 'Vehículo ya está en favoritos' }, { status: 400 });
    }

    // Crear favorito
    const favorite = await prisma.favorite.create({
      data: {
        userId: decoded.userId,
        vehicleId: vehicleId
      },
      include: {
        vehicle: {
          include: {
            images: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/favorites - Quitar vehículo de favoritos
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { vehicleId } = await request.json();
    if (!vehicleId) {
      return NextResponse.json({ error: 'ID del vehículo requerido' }, { status: 400 });
    }

    // Eliminar favorito
    await prisma.favorite.deleteMany({
      where: {
        userId: decoded.userId,
        vehicleId: vehicleId
      }
    });

    return NextResponse.json({ message: 'Favorito eliminado' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}














