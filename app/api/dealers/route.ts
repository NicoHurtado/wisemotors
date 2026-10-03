import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dealerSchema } from '@/lib/schemas/dealer';
import { requireAdmin } from '@/lib/api-auth';
import { sincronizarCarros } from '@/lib/concesionarios';

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
      // Los carros que vende viven en VehicleDealer (no en la relación vieja `vehicles`)
      include: { _count: { select: { vehicleDealers: true } } },
    });

    return NextResponse.json(dealers.map(({ _count, ...d }) => ({ ...d, _count: { vehicles: _count.vehicleDealers } })));
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
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    
    // Validar datos de entrada
    const { vehicleIds, ...datos } = dealerSchema.parse(body);

    // Crear concesionario y, en la misma transacción, asociarle sus carros
    const dealer = await prisma.$transaction(async tx => {
      const d = await tx.dealer.create({ data: datos });
      if (vehicleIds?.length) await sincronizarCarros(tx, d.id, vehicleIds);
      return d;
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
