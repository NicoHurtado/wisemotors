import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/schemas/auth';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos de entrada
    const validatedData = loginSchema.parse(body);
    
    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }
    
    // Verificar contraseña
    const isPasswordValid = await verifyPassword(validatedData.password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }
    
    // Generar token JWT
    const token = generateToken(user.id, user.email, user.role);
    
    // Retornar usuario sin contraseña y token
    const { password, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      message: 'Inicio de sesión exitoso',
      user: userWithoutPassword,
      token
    });
    
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error logging in:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
      );
  }
}

