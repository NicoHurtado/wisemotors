// ============================================================================
// Fuentes REALES con búsqueda web (plan §5.1, paso 2).
//
// Antes las URLs se adivinaban (chevrolet.com.co/onix → 404). Ahora Claude
// busca en la web la página oficial del fabricante en Colombia y reseñas o
// fichas técnicas de prensa colombiana, y SOLO se aceptan URLs que aparecieron
// en los resultados de búsqueda: si el modelo escribe una que no vino de la
// búsqueda, se descarta (no inventa fuentes).
//
// leerConClaude(): cuando el fetch directo falla (sitio que bloquea a Vercel,
// WAF, robots), la página se lee con la herramienta web_fetch de Anthropic y
// se devuelve el TEXTO tal cual, para que la extracción y la verificación de
// citas trabajen sobre el contenido real.
//
// Se usan las versiones básicas de las herramientas (20250305 / 20250910):
// devuelven los resultados y el documento completos en la respuesta, sin el
// filtrado dinámico que los procesa en código antes de verlos.
// ============================================================================

import { z } from 'zod/v4';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { claude, CLAUDE_MODEL } from '@/lib/ai/claude';
import type { DiscoveredSource, SourceTier } from './types';

const MODELO_LECTOR = 'claude-haiku-4-5';

const TIPOS = ['fabricante_colombia', 'prensa_colombia', 'prensa_internacional', 'enciclopedia', 'otro'] as const;

const FuentesSchema = z.object({
  fuentes: z.array(
    z.object({
      url: z.string().describe('URL EXACTA tal como apareció en los resultados de búsqueda'),
      nombre: z.string().describe('Nombre corto del sitio, ej. "Chevrolet Colombia", "El Carro Colombiano"'),
      tipo: z.enum(TIPOS),
    })
  ),
});

const normalizar = (u: string) => u.trim().replace(/#.*$/, '').replace(/\/+$/, '').replace(/^http:\/\//, 'https://').toLowerCase();

function tierDe(tipo: (typeof TIPOS)[number], url: string, marca: string): SourceTier {
  const host = (() => {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return '';
    }
  })();
  const marcaSlug = marca.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  // Tier 1 solo si el dominio es del fabricante y de Colombia: el tipo que diga el modelo no basta.
  if (tipo === 'fabricante_colombia' && host.replace(/[^a-z0-9.]/g, '').includes(marcaSlug) && (host.endsWith('.co') || host.includes('.com.co') || url.toLowerCase().includes('/co/'))) {
    return 1;
  }
  if (tipo === 'otro') return 3;
  return 2;
}

/** Busca en la web las mejores fuentes para el vehículo. Nunca inventa URLs. */
export async function buscarFuentes(marca: string, modelo: string, version: string, anio: number): Promise<DiscoveredSource[]> {
  const nombre = `${marca} ${modelo}${version ? ` ${version}` : ''}`;
  const res = await claude().beta.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    tools: [
      {
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: 4,
        // user_location no admite Colombia (400 "Country code CO is not supported"):
        // el foco en Colombia va en el prompt.
      },
    ],
    system: `Buscas fuentes de especificaciones técnicas de carros nuevos vendidos en Colombia. Prioridad:
1. La página OFICIAL del modelo en el sitio del fabricante en Colombia (la ficha del modelo, no el home ni un concesionario).
2. Reseñas, pruebas de manejo o fichas técnicas de prensa automotriz colombiana (El Carro Colombiano, Autos de Primera, Motor.com.co, Revista Autos, El Tiempo Motor, etc.) de la generación actual.
3. Si hace falta, prensa internacional seria o Wikipedia en español.
Evita concesionarios, clasificados de usados, foros y videos. Prefiere páginas de la generación/año más reciente vendida en Colombia.`,
    messages: [
      {
        role: 'user',
        content: `Encuentra entre 3 y 6 páginas con la ficha técnica del ${nombre} (modelo ${anio} o la generación vigente) para Colombia. Devuelve solo URLs que hayas visto en los resultados de la búsqueda, copiadas exactas.`,
      },
    ],
    output_config: { format: betaZodOutputFormat(FuentesSchema) },
  });

  // URLs que de verdad vinieron de la búsqueda.
  const vistas = new Set<string>();
  for (const b of res.content as any[]) {
    if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) {
      for (const r of b.content) if (r?.url) vistas.add(normalizar(r.url));
    }
  }

  const datos = res.parsed_output;
  if (!datos) return [];

  const unicas = new Map<string, DiscoveredSource>();
  for (const f of datos.fuentes) {
    const n = normalizar(f.url);
    if (!vistas.has(n) || unicas.has(n)) continue;
    unicas.set(n, { url: f.url.trim(), tier: tierDe(f.tipo, f.url, marca), nameEs: f.nombre.slice(0, 60) });
  }
  // Fabricante primero, luego prensa: si hay que recortar, se recorta lo menos confiable.
  return Array.from(unicas.values()).sort((a, b) => a.tier - b.tier).slice(0, 6);
}

/** Contenido de una fuente: texto plano, o PDF (las fichas técnicas oficiales suelen serlo). */
export type Contenido = { texto: string } | { pdfBase64: string };

/**
 * Lee una página o PDF con web_fetch de Anthropic. null si no se pudo.
 */
export async function leerConClaude(url: string): Promise<Contenido | null> {
  const res = await claude().beta.messages.create({
    // Aquí el modelo solo dispara la descarga: el más rápido basta.
    model: MODELO_LECTOR,
    max_tokens: 300,
    tools: [{ type: 'web_fetch_20250910', name: 'web_fetch', max_uses: 1, max_content_tokens: 40000 }],
    messages: [{ role: 'user', content: `Usa web_fetch para leer exactamente esta URL y luego responde solo "listo": ${url}` }],
    betas: ['web-fetch-2025-09-10'],
  } as any);

  for (const b of res.content as any[]) {
    if (b.type === 'web_fetch_tool_result' && b.content?.type === 'web_fetch_result') {
      const src = b.content.content?.source;
      if (src?.type === 'text' && typeof src.data === 'string' && src.data.trim().length > 200) return { texto: src.data };
      if (src?.type === 'base64' && src.media_type === 'application/pdf' && typeof src.data === 'string') return { pdfBase64: src.data };
    }
  }
  return null;
}
