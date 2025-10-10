import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener un lead específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await prisma.whatsAppLead.findUnique({
      where: { id: params.id },
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

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error fetching WhatsApp lead:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un lead
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, email, phone, notes } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;

    const lead = await prisma.whatsAppLead.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error updating WhatsApp lead:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.whatsAppLead.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Lead eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting WhatsApp lead:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
