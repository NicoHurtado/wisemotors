import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener todos los leads
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const dealershipId = searchParams.get('dealershipId');

    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (dealershipId) where.dealershipId = dealershipId;

    const [leads, total] = await Promise.all([
      prisma.whatsAppLead.findMany({
        where,
        include: {
          vehicle: {
            select: {
              id: true,
              brand: true,
              model: true,
              year: true,
              price: true
            }
          },
          dealership: {
            select: {
              id: true,
              name: true,
              location: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.whatsAppLead.count({ where })
    ]);

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching WhatsApp leads:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      username,
      email,
      phone,
      vehicleId,
      vehicleBrand,
      vehicleModel,
      dealershipId,
      dealershipName,
      message,
      source = 'website'
    } = body;

    // Validar campos requeridos
    if (!name) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    const lead = await prisma.whatsAppLead.create({
      data: {
        name,
        username,
        email,
        phone,
        vehicleId,
        vehicleBrand,
        vehicleModel,
        dealershipId,
        dealershipName,
        message,
        source,
        status: 'Nuevo'
      },
      include: {
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            year: true,
            price: true
          }
        },
        dealership: {
          select: {
            id: true,
            name: true,
            location: true
          }
        }
      }
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Error creating WhatsApp lead:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
