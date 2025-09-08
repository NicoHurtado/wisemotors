import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dealerSchema } from '@/lib/schemas/dealer';

// GET /api/dealers - Obtener todos los concesionarios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const location = searchParams.get('location');

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (location) {
      where.location = {
        contains: location,
        mode: 'insensitive'
      };
    }

    const dealers = await prisma.dealer.findMany({
      where,
      orderBy: {
        name: 'asc'
      },
      include: {
        _count: {
          select: {
            vehicles: true
          }
        }
      }
    });

    return NextResponse.json(dealers);
  } catch (error) {
    console.error('Error fetching dealers:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/dealers - Crear nuevo concesionario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos de entrada
    const validatedData = dealerSchema.parse(body);
    
    // Crear concesionario
    const dealer = await prisma.dealer.create({
      data: validatedData
    });
    
    return NextResponse.json(dealer, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating dealer:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
