import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/schemas/auth';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos de entrada
    const validatedData = registerSchema.parse(body);
    
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      );
    }
    
    // Encriptar contraseña
    const hashedPassword = await hashPassword(validatedData.password);
    
    // Crear usuario
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: 'user'
      }
    });
    
    // Retornar usuario sin contraseña
    const { password, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      message: 'Usuario registrado exitosamente',
      user: userWithoutPassword
    }, { status: 201 });
    
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error registering user:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

