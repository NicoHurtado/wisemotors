// ============================================================================
// Fetch educado: user-agent identificable, robots.txt respetado, timeout,
// y conversión HTML → texto plano acotado para el extractor.
//
// Regla del plan §5.2: un scraper abusivo es una demanda esperando ocurrir.
// ============================================================================

// UA de navegador: los WAF de la prensa CO bloquean cualquier agente con "Bot"
// (403 o timeout), aunque su robots.txt permite el rastreo. El cumplimiento
// real está en respetar robots.txt, cachear y pedir 1-2 páginas por sitio por
// ingesta — no en el string del agente.
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const FETCH_TIMEOUT_MS = 20_000;
/** Máximo de texto que pasa al extractor por página. */
const MAX_TEXT_CHARS = 18_000;

// Cache simple en memoria por proceso (la ingesta de versiones del mismo
// carro comparte el 90% de las fuentes).
const pageCache = new Map<string, { at: number; text: string | null }>();
const robotsCache = new Map<string, { at: number; disallows: string[] }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

async function fetchWithTimeout(url: string, accept: string): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': accept, 'Accept-Language': 'es-CO,es;q=0.9' },
      redirect: 'follow',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

/** Parser mínimo de robots.txt: reglas Disallow del agente * (y del nuestro). */
async function getDisallows(origin: string): Promise<string[]> {
  const cached = robotsCache.get(origin);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.disallows;

  let disallows: string[] = [];
  try {
    const res = await fetchWithTimeout(`${origin}/robots.txt`, 'text/plain');
    if (res.ok) {
      const text = await res.text();
      let applies = false;
      for (const line of text.split('\n')) {
        const l = line.trim().toLowerCase();
        if (l.startsWith('user-agent:')) {
          const agent = l.slice('user-agent:'.length).trim();
          applies = agent === '*' || agent.includes('wisemotors');
        } else if (applies && l.startsWith('disallow:')) {
          const path = line.slice(line.toLowerCase().indexOf('disallow:') + 9).trim();
          if (path) disallows.push(path);
        }
      }
    }
  } catch {
    // Sin robots.txt legible: se asume permitido (comportamiento estándar).
  }
  robotsCache.set(origin, { at: Date.now(), disallows });
  return disallows;
}

export async function isAllowedByRobots(url: string): Promise<boolean> {
  try {
    const u = new URL(url);
    const disallows = await getDisallows(u.origin);
    return !disallows.some(d => d !== '/' ? u.pathname.startsWith(d.replace(/\*$/, '')) : true);
  } catch {
    return false;
  }
}

/** Quita tags, scripts y estilos; colapsa espacios. Sin dependencias. */
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(br|\/p|\/div|\/tr|\/li|\/h[1-6])[^>]*>/gi, '\n')
    .replace(/<td[^>]*>/gi, ' | ') // conservar la estructura de tablas de specs
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

/**
 * Trae una página como texto plano, o null si no se pudo o robots lo prohíbe.
 * Nunca lanza: el pipeline reporta la fuente como fallida y sigue.
 */
export async function fetchPageText(url: string): Promise<string | null> {
  const cached = pageCache.get(url);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.text;

  let text: string | null = null;
  try {
    if (await isAllowedByRobots(url)) {
      const res = await fetchWithTimeout(url, 'text/html');
      const contentType = res.headers.get('content-type') ?? '';
      if (res.ok && contentType.includes('html')) {
        const html = await res.text();
        const full = htmlToText(html);
        // Si la página es enorme, quedarse con la zona más densa en números
        // (las tablas de especificaciones), no con el arranque del artículo.
        text = full.length <= MAX_TEXT_CHARS ? full : denserWindow(full, MAX_TEXT_CHARS);
      }
    }
  } catch {
    text = null;
  }
  pageCache.set(url, { at: Date.now(), text });
  return text;
}

/** Ventana del texto con mayor densidad de dígitos: ahí viven las specs. */
function denserWindow(text: string, size: number): string {
  const step = Math.floor(size / 2);
  let best = 0;
  let bestScore = -1;
  for (let i = 0; i + size <= text.length; i += step) {
    const slice = text.slice(i, i + size);
    const score = (slice.match(/\d/g) ?? []).length;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return text.slice(best, best + size);
}

/** Los resultados de búsqueda de sitios WordPress: extraer links de artículos. */
export async function fetchSearchResultLinks(searchUrl: string, mustContain: string[]): Promise<string[]> {
  try {
    if (!(await isAllowedByRobots(searchUrl))) return [];
    const res = await fetchWithTimeout(searchUrl, 'text/html');
    if (!res.ok) return [];
    const html = await res.text();
    const origin = new URL(searchUrl).origin;
    const hrefs = Array.from(html.matchAll(/href="(https?:\/\/[^"]+)"/g)).map(m => m[1]);

    const slugTerms = mustContain.map(t =>
      t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-')
    );

    const unique: string[] = [];
    for (const href of hrefs) {
      if (!href.startsWith(origin)) continue;
      const path = href.toLowerCase();
      if (path.includes('/?s=') || path.includes('/tag/') || path.includes('/category/')) continue;
      if (!slugTerms.every(term => path.includes(term))) continue;
      if (!unique.includes(href)) unique.push(href);
    }
    return unique.slice(0, 2);
  } catch {
    return [];
  }
}
