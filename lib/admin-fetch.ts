'use client';

/**
 * `fetch` para llamadas que el servidor protege con requireAdmin/requireUser.
 *
 * Las rutas de escritura ya no aceptan peticiones anónimas, así que todo el panel
 * admin tiene que mandar el token. Centralizado aquí para que agregar una llamada
 * nueva no implique acordarse del header.
 */

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export async function adminFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(init.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, { ...init, headers });
}

/**
 * Mensaje de error legible para 401/403, que ahora sí pueden ocurrir.
 * Sirve para no mostrarle "Error interno" a un admin cuya sesión simplemente venció.
 */
export function mensajeDeErrorDeAuth(response: Response): string | null {
  if (response.status === 401) {
    return 'Tu sesión expiró. Vuelve a iniciar sesión.';
  }
  if (response.status === 403) {
    return 'Tu cuenta no tiene permisos de administrador.';
  }
  return null;
}
