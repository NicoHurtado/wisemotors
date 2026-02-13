import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No se enviaron archivos' },
        { status: 400 }
      );
    }

    // Validate files
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Tipo de archivo no soportado: ${file.type}` },
          { status: 400 }
        );
      }
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `El archivo ${file.name} excede el tamaño máximo de 10MB` },
          { status: 400 }
        );
      }
    }

    // Upload each file to Cloudinary
    const uploadPromises = files.map(async (file) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;
      
      const result = await uploadToCloudinary(base64, 'wise-vehicles');
      return result;
    });

    const results = await Promise.all(uploadPromises);

    return NextResponse.json({
      urls: results.map((r) => r.url),
      publicIds: results.map((r) => r.publicId),
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return NextResponse.json(
      { error: 'Error al subir las imágenes' },
      { status: 500 }
    );
  }
}
