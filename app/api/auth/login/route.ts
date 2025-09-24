import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/schemas/auth';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'JSON inválido' },
        { status: 400 }
      );
    }
    
    // Validar datos de entrada
    const validatedData = loginSchema.parse(body);
    
    // Buscar usuario por email o username (name en la base de datos)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.emailOrUsername },
          { username: validatedData.emailOrUsername }
        ]
      },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        username: true,
      }
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
    // Prisma error por columna no encontrada u otros
    if (error.code === 'P2022') {
      return NextResponse.json(
        { error: 'Error de base de datos', details: error.meta },
        { status: 500 }
      );
    }

    console.error('Error logging in:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
      );
  }
}

