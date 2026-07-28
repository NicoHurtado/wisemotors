import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/** Secretos que alguna vez estuvieron en el código y nunca pueden volver a firmar un token. */
const SECRETOS_PROHIBIDOS = new Set(['your-secret-key', 'secret', 'changeme']);

/**
 * No hay valor por defecto a propósito: si falta JWT_SECRET la app debe romper
 * ruidosamente en la primera operación de auth, no arrancar firmando tokens que
 * cualquiera puede falsificar.
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.trim() === '') {
    throw new Error(
      'JWT_SECRET no está definido. La aplicación no puede firmar ni verificar tokens sin él.'
    );
  }

  if (SECRETOS_PROHIBIDOS.has(secret)) {
    throw new Error(
      `JWT_SECRET tiene un valor inseguro conocido ('${secret}'). Genera uno nuevo con: openssl rand -base64 48`
    );
  }

  return secret;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId: string, email: string, role: string): string {
  return jwt.sign(
    { userId, email, role },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): TokenPayload | null {
  // Fuera del try: si falta el secreto eso debe propagarse como error, no
  // confundirse con un token inválido y devolver un 401 silencioso.
  const secret = getJwtSecret();
  let decoded: unknown;

  try {
    decoded = jwt.verify(token, secret);
  } catch (error) {
    // Token vencido, manipulado o mal formado: no es un fallo del servidor.
    return null;
  }

  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    typeof (decoded as any).userId !== 'string' ||
    typeof (decoded as any).email !== 'string'
  ) {
    return null;
  }

  const payload = decoded as any;

  return {
    userId: payload.userId,
    email: payload.email,
    role: typeof payload.role === 'string' ? payload.role : 'user',
  };
}
