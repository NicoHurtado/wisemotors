// ============================================================================
// Extracción estructurada CONTRA EL REGISTRO (plan §5.1, paso 3).
//
// El LLM no inventa campos: recibe el catálogo de keys válidas del registro
// de atributos y solo puede devolver esas, cada una con su cita textual.
// Un valor sin cita se descarta.
// ============================================================================

import { ATTRIBUTE_REGISTRY } from '@/lib/attributes/registry';
import { z } from 'zod/v4';
import { pedirJson } from '@/lib/ai/claude';
import type { RawFact, SourceTier } from './types';
import type { Contenido } from './buscar-fuentes';
import { denserWindow, MAX_TEXT_CHARS } from './fetcher';

// Solo atributos que se publican en Colombia y con keys válidas
const EXTRACTABLE = ATTRIBUTE_REGISTRY.filter(d => d.coAvailability !== 'never_published');
const VALID_KEYS = new Set(EXTRACTABLE.map(d => d.key));

const ExtraccionSchema = z.object({
  facts: z
    .array(
      z.object({
        key: z.string().describe('Key EXACTA del catálogo de atributos proporcionado'),
        value: z
          .union([z.number(), z.string(), z.boolean()])
          .describe('Número puro para numéricos (sin unidad), true para booleanos presentes, string para texto/enum'),
        quote: z.string().describe('Cita textual CORTA (máx 100 caracteres) del fragmento del texto que respalda el valor'),
        aplicaA: z
          .enum(['version_objetivo', 'todas_las_versiones', 'otra_version', 'no_especifica'])
          .describe(
            'A qué versión se refiere el dato según el texto: version_objetivo (el texto lo atribuye a la versión pedida, o la página/documento entero trata SOLO de esa versión), todas_las_versiones (el texto dice que es de serie en toda la gama), otra_version (el texto lo atribuye a otra versión), no_especifica (no queda claro).'
          ),
        vigencia: z.string().describe('Fecha o vigencia que el texto asocia al dato (sobre todo precios), ej. "octubre de 2025". Cadena vacía si no dice.'),
      })
    )
    .describe('Especificaciones encontradas en el texto, solo keys del catálogo'),
  anioModeloFuente: z
    .number()
    .describe('Año modelo del que habla el texto/documento (ej. 2026). 0 si no se puede saber.'),
  otrasVersiones: z
    .array(z.string())
    .describe('Nombres de las OTRAS versiones de este modelo que aparecen en el texto (ej. "LT", "LTZ", "Premier"), sin la versión objetivo. Vacío si no hay.'),
});

function buildCatalog(): string {
  // Catálogo compacto: key | etiqueta | unidad esperada | tipo
  return EXTRACTABLE
    .map(d => `${d.key} | ${d.labelEs}${d.unit ? ` (${d.unit})` : ''} | ${d.dataType}`)
    .join('\n');
}

const SYSTEM_PROMPT = `Eres un extractor de especificaciones de vehículos para el mercado colombiano.

REGLAS ABSOLUTAS:
1. Solo reportas datos que estén EXPLÍCITOS en el texto. Nada de conocimiento propio, nada de estimaciones.
2. Solo usas keys del catálogo. Si un dato del texto no corresponde a ninguna key, lo ignoras.
3. Números en la unidad del catálogo: convierte si el texto usa otra (kW→HP: ×1.341; kgf·m→Nm: ×9.807; km/L→L/100km: 100÷valor). La conversión de unidades mal hecha es la fuente #1 de basura en datos automotores — verifica cada una.
4. Cada valor lleva su cita textual. Sin cita, no reportes el dato.
5. VERSIONES — la regla más importante: cada versión (LT, LTZ, RS, Premier…) es un carro distinto. Un dato de otra versión JAMÁS se atribuye a la versión objetivo, aunque sea "parecido" o "probablemente igual". Si el texto dice "el Onix LT trae cámara de reversa" y el objetivo es el Onix RS, ese dato NO existe para el RS. Solo vale: lo que el texto atribuye a la versión objetivo, lo que dice que es de serie en TODAS las versiones, o lo que está en una página/ficha dedicada exclusivamente a la versión objetivo. Si no hay versión objetivo, el objetivo es la versión de entrada (base). Marca siempre 'aplicaA' con honestidad.
6. Precios en COP: repórtalos SOLO en la key 'commercial.priceCop' si el texto trae el precio en Colombia de EXACTAMENTE la versión objetivo (con su caja si el texto distingue). Un "desde $X" de la gama, un precio de otra versión, en USD o de otro país NO se reporta. Anota en 'vigencia' la fecha que dé el texto para ese precio.
7. Anota en 'anioModeloFuente' el año modelo del que habla la página o el documento (si lo dice, aunque sea en el título o el nombre del archivo). Año modelo: la prensa y los fabricantes suelen hablar del año anterior o siguiente de la MISMA generación (un Onix 2026 y un 2027 son el mismo carro). Eso cuenta como el vehículo objetivo. Solo si es otra generación, otro modelo u otro mercado, no reportes nada.
8. Que el texto NO mencione algo NO significa que el carro no lo tenga. Si no encuentras un dato, OMITE la key. Jamás reportes false ni 0 para decir "no aparece": eso afirma que el carro carece del equipamiento, que es una mentira distinta a no saberlo.`;

/** Texto comparable para verificar citas: sin tildes, espacios ni puntuación. */
const plano = (t: string) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

/**
 * ¿La cita aparece en el texto? Se compara sin espacios ni puntuación y basta
 * con un tramo largo de la cita (el modelo a veces recorta los bordes).
 */
function citaEnTexto(cita: string, textoPlano: string) {
  const c = plano(cita);
  if (c.length < 4) return false;
  if (textoPlano.includes(c)) return true;
  const tramo = Math.max(12, Math.floor(c.length * 0.6));
  for (let i = 0; i + tramo <= c.length; i += 4) if (textoPlano.includes(c.slice(i, i + tramo))) return true;
  return false;
}

/** ¿El texto menciona este nombre de versión como palabra suelta? */
function menciona(texto: string, nombre: string) {
  const n = nombre.trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!n) return false;
  return new RegExp(`(^|[^a-z0-9áéíóúñ])${n}([^a-z0-9áéíóúñ]|$)`, 'i').test(texto);
}

export interface ResultadoExtraccion {
  facts: RawFact[];
  /** Datos descartados por ser de otra versión (o sin versión clara), para contarlo en la revisión. */
  descartadosPorVersion: number;
  /** Año modelo del que habla la fuente (0 = no se sabe). */
  anioModeloFuente: number;
}

// Palabras que describen carrocería o caja, no la versión: "Premier Sedán" es la versión "Premier".
const GENERICAS = new Set(['sedan', 'sedán', 'hatchback', 'hb', 'automatico', 'automático', 'manual', 'mt', 'at', 'cvt', 'aut', 'mec', 'mecánico', 'mecanico', 'turbo', 'plus', 'version', 'versión', 'de', 'la', 'el']);

/** Palabras que identifican a las otras versiones, sin las genéricas ni las de la versión pedida o el modelo. */
function marcasDeOtras(otras: string[], version: string, modelo: string) {
  const propias = new Set(`${version} ${modelo}`.toLowerCase().split(/[^a-z0-9áéíóúñ]+/).filter(Boolean));
  const tokens = new Set<string>();
  for (const o of otras) {
    for (const t of o.toLowerCase().split(/[^a-z0-9áéíóúñ]+/)) {
      if (t.length >= 2 && !GENERICAS.has(t) && !propias.has(t)) tokens.add(t);
    }
  }
  return Array.from(tokens);
}

export async function extractFromPage(
  contenido: string | Contenido,
  sourceUrl: string,
  tier: SourceTier,
  vehicleLabel: string,
  /** Versión pedida ("RS"). Vacía = versión de entrada. */
  version = ''
): Promise<ResultadoExtraccion> {
  const c: Contenido = typeof contenido === 'string' ? { texto: contenido } : contenido;
  const esPdf = 'pdfBase64' in c;
  const encabezado = `VEHÍCULO OBJETIVO: ${vehicleLabel}

CATÁLOGO DE ATRIBUTOS (key | etiqueta | tipo):
${buildCatalog()}
`;
  const cierre = `Extrae las especificaciones del vehículo objetivo presentes en ${esPdf ? 'el documento' : 'el texto'}. Si habla de otro vehículo, no reportes nada.`;

  let parsed: z.infer<typeof ExtraccionSchema>;
  try {
    parsed = await pedirJson({
      schema: ExtraccionSchema,
      system: SYSTEM_PROMPT,
      prompt: esPdf
        ? [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: c.pdfBase64 } },
            { type: 'text', text: `${encabezado}\nEl documento adjunto es ${sourceUrl}.\n\n${cierre}` },
          ]
        : `${encabezado}\nTEXTO DE LA PÁGINA (${sourceUrl}):\n"""\n${c.texto.length <= MAX_TEXT_CHARS ? c.texto : denserWindow(c.texto, MAX_TEXT_CHARS)}\n"""\n\n${cierre}`,
    });
  } catch (err) {
    throw new Error(`Claude falló extrayendo de ${sourceUrl}: ${err instanceof Error ? err.message : err}`);
  }

  const textoPlano = esPdf ? null : plano(c.texto);
  const facts: RawFact[] = [];
  let descartadosPorVersion = 0;
  // Palabras que delatan otra versión ("Premier", "LTZ"…), comparadas palabra por palabra:
  // la IA puede decir "Premier Sedán" y la cita solo "el Premier".
  const modelo = vehicleLabel.split(' ').slice(1, 3).join(' ');
  const otras = marcasDeOtras(parsed.otrasVersiones ?? [], version, modelo);
  for (const f of parsed.facts ?? []) {
    // El LLM no inventa campos: keys fuera del registro mueren aquí.
    if (!VALID_KEYS.has(f.key)) continue;

    // Regla de versiones, verificada en código y no solo pedida al modelo:
    //  - lo que el modelo marcó como de otra versión, fuera;
    //  - con versión pedida, lo que no quedó claro también fuera;
    //  - el precio solo si es explícitamente de la versión objetivo;
    //  - si la cita nombra otra versión y no la pedida, fuera aunque el modelo la haya aceptado.
    const esPrecio = f.key === 'commercial.priceCop';
    const citaNombraOtra = otras.some(o => menciona(f.quote, o)) && !(version && menciona(f.quote, version));
    if (
      f.aplicaA === 'otra_version' ||
      (version && f.aplicaA === 'no_especifica') ||
      (esPrecio && f.aplicaA !== 'version_objetivo') ||
      citaNombraOtra
    ) {
      descartadosPorVersion++;
      continue;
    }
    if (f.value === null || f.value === undefined || f.value === '') continue;
    if (typeof f.quote !== 'string' || f.quote.trim() === '') continue;
    // La cita tiene que estar en la página: una cita que no aparece es un dato inventado.
    // (En PDF no hay texto para comparar; son fichas oficiales del fabricante.)
    if (textoPlano !== null && !citaEnTexto(f.quote, textoPlano)) continue;

    const def = EXTRACTABLE.find(d => d.key === f.key)!;
    let value: number | string | boolean = f.value;

    if (def.dataType === 'numeric') {
      const n = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
      if (!Number.isFinite(n)) continue;
      // Un 0 casi nunca es un dato leído: es el modelo rellenando el catálogo
      // cuando la página no traía especificaciones. Un carro con 0 airbags o
      // 0 estrellas NCAP es una afirmación grave, y ninguna ficha real la hace.
      if (n === 0) continue;
      value = n;
    } else if (def.dataType === 'boolean') {
      // Mismo criterio: "no lo encontré" NO es "no lo tiene". La ausencia se
      // representa con el hecho inexistente (eso es lo que mide la cobertura);
      // publicar `false` la convierte en una negación que nadie verificó.
      if (value !== true && value !== 'true' && value !== 'Sí' && value !== 'si') continue;
      value = true;
    } else {
      value = String(value).slice(0, 200);
    }

    facts.push({ key: f.key, value, quote: f.quote.slice(0, 160), sourceUrl, tier, vigencia: f.vigencia?.trim() || undefined });
  }

  return { facts, descartadosPorVersion, anioModeloFuente: Math.round(parsed.anioModeloFuente || 0) };
}

/** Resolución de identidad canónica (plan §5.1, paso 1): una sola llamada. */
export async function resolveIdentity(
  brand: string,
  model: string,
  year: number,
  country: string
): Promise<{ brand: string; model: string; trim: string; versionEntrada: string; type: string; vehicleType: string; fuelType: string }> {
  const IdentidadSchema = z.object({
    brand: z.string().describe('Marca con capitalización oficial (ej. "Toyota", "BYD")'),
    model: z.string().describe('Modelo canónico SIN marca, año ni versión (ej. "Corolla Cross", "Onix")'),
    trim: z
      .string()
      .describe('Versión/línea que el usuario pidió (ej. "RS", "XEI", "Premier"), con su nombre comercial en el país. Cadena vacía si no pidió ninguna. No inventes una.'),
    versionEntrada: z
      .string()
      .describe('Nombre comercial de la versión de ENTRADA (la más barata) de este modelo en ese país, ej. "Prime", "LT", "Zen". Cadena vacía si no la conoces con seguridad.'),
    type: z.enum(['Sedán', 'SUV', 'Pickup', 'Deportivo', 'Wagon', 'Hatchback', 'Convertible']),
    vehicleType: z.enum(['Automóvil', 'Deportivo', 'Todoterreno', 'Lujo', 'Económico']),
    fuelType: z
      .enum(['Gasolina', 'Diesel', 'Eléctrico', 'Híbrido', 'Híbrido Enchufable'])
      .describe('Tren motriz de la versión pedida; si no se pidió versión, el de la MÁS VENDIDA en el país'),
  });

  const args = await pedirJson({
    schema: IdentidadSchema,
    maxTokens: 4000,
    prompt: `Vehículo: ${brand ? `${brand} ` : ''}${model} ${year}, mercado ${country}. Normaliza su identidad.${brand ? '' : ' La marca no vino: dedúcela del modelo.'} Si el modelo tiene un nombre comercial distinto en ese mercado, usa el del mercado. Separa la versión del modelo: "Onix RS" es modelo "Onix", versión "RS".`,
  });

  return {
    brand: args.brand || brand,
    model: args.model || model,
    trim: args.trim.trim(),
    versionEntrada: args.versionEntrada.trim(),
    type: args.type || 'Sedán',
    vehicleType: args.vehicleType || 'Automóvil',
    fuelType: args.fuelType || 'Gasolina',
  };
}
