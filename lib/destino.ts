// ============================================================================
// A dónde volver después de iniciar sesión o registrarse (?next=/compare?ids=…).
//
// Solo rutas internas: empieza con "/" y no con "//" ni "/\" (que el navegador
// trata como otro sitio). Así nadie puede armar un enlace de login que, tras
// entrar, mande a la persona a una página ajena.
// ============================================================================

export function destinoSeguro(next: string | null | undefined, porDefecto = '/'): string {
  if (!next || typeof next !== 'string') return porDefecto;
  const t = next.trim();
  if (!t.startsWith('/') || t.startsWith('//') || t.startsWith('/\\') || /[\r\n]/.test(t)) return porDefecto;
  return t.slice(0, 500);
}

/** El destino que trae la URL actual (solo en el navegador). */
export function destinoDeLaUrl(porDefecto = '/'): string {
  if (typeof window === 'undefined') return porDefecto;
  return destinoSeguro(new URLSearchParams(window.location.search).get('next'), porDefecto);
}

/** "/login" + el destino, para enlazar entre login y registro sin perderlo. */
export function conDestino(ruta: string, next: string | null | undefined): string {
  const d = destinoSeguro(next, '');
  return d ? `${ruta}?next=${encodeURIComponent(d)}` : ruta;
}
