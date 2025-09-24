import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    if (status) where.status = status;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const leads = await prisma.whatsAppLead.findMany({
      where,
      include: {
        vehicle: {
          select: {
            brand: true,
            model: true,
            year: true,
            price: true
          }
        },
        dealership: {
          select: {
            name: true,
            location: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Crear CSV content
    const headers = [
      'Fecha',
      'Nombre',
      'Username',
      'Email',
      'Teléfono',
      'Vehículo',
      'Marca',
      'Modelo',
      'Año',
      'Precio',
      'Concesionario',
      'Ubicación Concesionario',
      'Estado',
      'Origen',
      'Mensaje'
    ];

    const csvContent = [
      headers.join(','),
      ...leads.map(lead => [
        new Date(lead.createdAt).toLocaleDateString('es-CO'),
        `"${lead.name || ''}"`,
        `"${lead.username || ''}"`,
        `"${lead.email || ''}"`,
        `"${lead.phone || ''}"`,
        `"${lead.vehicleBrand || ''} ${lead.vehicleModel || ''}"`.trim(),
        `"${lead.vehicle?.brand || lead.vehicleBrand || ''}"`,
        `"${lead.vehicle?.model || lead.vehicleModel || ''}"`,
        lead.vehicle?.year || '',
        lead.vehicle?.price || '',
        `"${lead.dealership?.name || lead.dealershipName || ''}"`,
        `"${lead.dealership?.location || ''}"`,
        `"${lead.status}"`,
        `"${lead.source}"`,
        `"${lead.message || ''}"`
      ].join(','))
    ].join('\n');

    // Crear respuesta con archivo CSV
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="whatsapp-leads-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

    return response;
  } catch (error) {
    console.error('Error exporting WhatsApp leads:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
