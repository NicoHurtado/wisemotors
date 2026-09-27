// ============================================================================
// De dónde sale la conexión a la base.
//
// La integración de Neon en Vercel crea las variables con el prefijo que se
// escriba al conectarla ("WISE", "wise_database"…): WISE_DATABASE_URL,
// wise_database_DATABASE_URL, …_POSTGRES_PRISMA_URL, etc. En vez de adivinar
// el prefijo exacto, se busca por el FINAL del nombre, sin importar
// mayúsculas, en este orden de preferencia:
//   app (con pooler):  WISE_DATABASE_URL → *DATABASE_URL → *POSTGRES_PRISMA_URL → *POSTGRES_URL
//   directa (schema):  *DATABASE_URL_UNPOOLED → *POSTGRES_URL_NON_POOLING → la de la app
// ============================================================================

export const VAR_BD = 'WISE_DATABASE_URL';
export const VAR_BD_DIRECTA = 'WISE_DATABASE_URL_UNPOOLED';

type Env = NodeJS.ProcessEnv;
export interface Hallazgo {
  nombre: string;
  valor: string;
}

function buscar(env: Env, patrones: RegExp[]): Hallazgo | undefined {
  const claves = Object.keys(env).filter(k => env[k] && /^(postgres|postgresql):\/\//.test(env[k]!.trim()));
  for (const p of patrones) {
    const k = claves.find(c => p.test(c));
    if (k) return { nombre: k, valor: env[k]!.trim() };
  }
  return undefined;
}

export function leerVariable(nombre: string, env: Env = process.env): string | undefined {
  if (env[nombre]) return env[nombre];
  const clave = Object.keys(env).find(k => k.toUpperCase() === nombre.toUpperCase());
  return clave ? env[clave] : undefined;
}

/** Variable (nombre y valor) de la conexión con pooler, para la app. */
export function fuenteBaseDatos(env: Env = process.env): Hallazgo | undefined {
  return buscar(env, [/^WISE_DATABASE_URL$/i, /DATABASE_URL$/i, /POSTGRES_PRISMA_URL$/i, /POSTGRES_URL$/i]);
}

/** Variable de la conexión directa (sin pooler), para crear/alterar tablas. */
export function fuenteBaseDatosDirecta(env: Env = process.env): Hallazgo | undefined {
  return buscar(env, [/^WISE_DATABASE_URL_UNPOOLED$/i, /DATABASE_URL_UNPOOLED$/i, /POSTGRES_URL_NON_POOLING$/i]) ?? fuenteBaseDatos(env);
}

export function urlBaseDatos(env: Env = process.env): string | undefined {
  return fuenteBaseDatos(env)?.valor;
}

export function urlBaseDatosDirecta(env: Env = process.env): string | undefined {
  return fuenteBaseDatosDirecta(env)?.valor;
}
