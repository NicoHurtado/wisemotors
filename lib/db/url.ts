// ============================================================================
// De dónde sale la conexión a la base.
//
// La integración de Neon en Vercel crea las variables con el prefijo del
// proyecto: WISE_DATABASE_URL (con pooler, para la app) y
// WISE_DATABASE_URL_UNPOOLED (directa, para crear/alterar tablas). Vercel
// respeta las mayúsculas del prefijo tal como se escribió, así que se buscan
// sin importar mayúsculas ("wise_DATABASE_URL" también sirve).
// ============================================================================

export const VAR_BD = 'WISE_DATABASE_URL';
export const VAR_BD_DIRECTA = 'WISE_DATABASE_URL_UNPOOLED';

export function leerVariable(nombre: string, env: NodeJS.ProcessEnv = process.env): string | undefined {
  if (env[nombre]) return env[nombre];
  const clave = Object.keys(env).find(k => k.toUpperCase() === nombre.toUpperCase());
  return clave ? env[clave] : undefined;
}

/** URL con pooler para la app. */
export function urlBaseDatos(env: NodeJS.ProcessEnv = process.env): string | undefined {
  return leerVariable(VAR_BD, env);
}

/** URL directa (sin pooler) para migraciones; si no existe, la del pooler. */
export function urlBaseDatosDirecta(env: NodeJS.ProcessEnv = process.env): string | undefined {
  return leerVariable(VAR_BD_DIRECTA, env) ?? urlBaseDatos(env);
}
