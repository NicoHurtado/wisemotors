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

    // If it's a Cloudinary URL or any external URL, redirect to it
    if (image.url.startsWith('http')) {
      return NextResponse.redirect(image.url);
    }

    // Legacy support: serve base64 images stored in the database
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

  return new NextResponse('Invalid Image Data', { status: 500 });
}
