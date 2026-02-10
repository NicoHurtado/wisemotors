import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const index = parseInt(searchParams.get('index') || '0');

    const image = await prisma.vehicleImage.findFirst({
      where: {
        vehicleId: params.id,
      },
      orderBy: { order: 'asc' },
      skip: index,
      take: 1
    });

    if (!image || !image.url) {
      return new NextResponse('Not Found', { status: 404 });
    }

    return serveBase64(image.url);
  } catch (error) {
    console.error('Error serving vehicle image:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

function serveBase64(dataUrl: string) {
  const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': buffer.length.toString(),
      },
    });
  }

  // Si no es base64 pero es una URL externa, redirigir
  if (dataUrl.startsWith('http')) {
    return NextResponse.redirect(dataUrl);
  }

  return new NextResponse('Invalid Image Data', { status: 500 });
}
