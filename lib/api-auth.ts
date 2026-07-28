import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, type TokenPayload } from '@/lib/auth';

/**
 * Guardias de autenticación para route handlers.
 *
 * `AdminGuard` es un componente de React: no protege nada. La única frontera real
 * es esta, en el servidor. Uso:
 *
 *   const auth = await requireAdmin(request);
 *   if (auth instanceof NextResponse) return auth;
 *   // a partir de aquí auth.userId / auth.role son confiables
 */

function extraerToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (!header) return null;

  const [esquema, valor] = header.split(' ');
  if (esquema?.toLowerCase() !== 'bearer' || !valor) return null;

  return valor.trim() || null;
}

/** Exige un usuario autenticado. Devuelve el payload del token o la respuesta 401. */
export function requireUser(request: NextRequest): TokenPayload | NextResponse {
  const token = extraerToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  return payload;
}

/**
 * Exige un administrador. El rol se relee de la base de datos en vez de confiar
 * en el claim del token: así, quitarle el rol a alguien surte efecto de una y no
 * dentro de 7 días, cuando venza su token.
 */
export async function requireAdmin(
  request: NextRequest
): Promise<TokenPayload | NextResponse> {
  const auth = requireUser(request);
  if (auth instanceof NextResponse) return auth;

  const usuario = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true },
  });

  if (!usuario || usuario.role !== 'admin') {
    return NextResponse.json(
      { error: 'No tienes permisos para esta operación' },
      { status: 403 }
    );
  }

  return { ...auth, role: usuario.role };
}
