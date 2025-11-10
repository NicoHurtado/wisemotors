import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/schemas/auth';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos de entrada
    const validatedData = registerSchema.parse(body);
    
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { username: validatedData.username }
        ]
      }
    });
    
    if (existingUser) {
      const errorMessage = existingUser.email === validatedData.email 
        ? 'El email ya está registrado' 
        : 'El nombre de usuario ya está en uso';
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }
    
    // Encriptar contraseña
    const hashedPassword = await hashPassword(validatedData.password);
    
    // Crear usuario
    const user = await prisma.user.create({
      data: {
        username: validatedData.username,
        email: validatedData.email,
        password: hashedPassword,
        role: 'user'
      }
    });
    
    // Generar token JWT
    const token = generateToken(user.id, user.email, user.role);
    
    // Retornar usuario sin contraseña y token
    const { password, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      message: 'Usuario registrado exitosamente',
      user: userWithoutPassword,
      token
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

