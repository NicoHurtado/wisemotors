import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dealerUpdateSchema } from '@/lib/schemas/dealer';

// GET /api/dealers/[id] - Obtener concesionario por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dealer = await prisma.dealer.findUnique({
      where: { id: params.id },
      include: {
        vehicles: {
          include: {
            images: true
          }
        },
        _count: {
          select: {
            vehicles: true
          }
        }
      }
    });

    if (!dealer) {
      return NextResponse.json(
        { error: 'Concesionario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(dealer);
  } catch (error) {
    console.error('Error fetching dealer:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/dealers/[id] - Actualizar concesionario
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validar datos de entrada
    const validatedData = dealerUpdateSchema.parse(body);
    
    // Verificar que el concesionario existe
    const existingDealer = await prisma.dealer.findUnique({
      where: { id: params.id }
    });

    if (!existingDealer) {
      return NextResponse.json(
        { error: 'Concesionario no encontrado' },
        { status: 404 }
      );
    }
    
    // Actualizar concesionario
    const dealer = await prisma.dealer.update({
      where: { id: params.id },
      data: validatedData
    });
    
    return NextResponse.json(dealer);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating dealer:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/dealers/[id] - Eliminar concesionario
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar que el concesionario existe
    const existingDealer = await prisma.dealer.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            vehicles: true
          }
        }
      }
    });

    if (!existingDealer) {
      return NextResponse.json(
        { error: 'Concesionario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si tiene vehículos asociados
    if (existingDealer._count.vehicles > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un concesionario con vehículos asociados' },
        { status: 400 }
      );
    }
    
    // Eliminar concesionario
    await prisma.dealer.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json(
      { message: 'Concesionario eliminado exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting dealer:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
