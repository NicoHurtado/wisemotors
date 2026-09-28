// ============================================================================
// Veredicto de la IA para el comparador.
//
// Claude recibe SOLO los datos que tenemos de cada carro (nada de su memoria
// sobre el modelo) y devuelve un veredicto en palabras de persona: para quién
// es cada uno, qué tener en cuenta y cuál conviene según el uso. Salida
// estructurada contra un esquema Zod: la interfaz nunca recibe texto suelto.
//
// Se cachea en memoria por combinación de carros (misma pregunta, misma
// respuesta, sin pagar dos veces).
// ============================================================================

import { z } from 'zod/v4';
import { pedirJson } from '@/lib/ai/claude';
import { ATTRIBUTE_REGISTRY } from '@/lib/attributes/registry';
import { specsDe } from '@/lib/vehiculo-datos';

export const PERFILES = ['familia', 'ciudad', 'carretera', 'bolsillo', 'seguridad', 'primer_carro'] as const;

export const VeredictoSchema = z.object({
  titular: z.string().describe('Una frase corta (máx. 14 palabras) que resume la comparación. Sin tecnicismos.'),
  resumen: z.string().describe('2 o 3 frases que explican la diferencia de fondo entre los carros, para alguien que no sabe de carros.'),
  porCarro: z.array(
    z.object({
      id: z.string(),
      esParaTiSi: z.string().describe('Empieza en minúscula, completa la frase "Es para ti si…". Máx. 18 palabras.'),
      ojoCon: z.string().describe('Lo que debe tener en cuenta antes de comprarlo, basado en los datos. Máx. 18 palabras.'),
      fuertes: z.array(z.string()).describe('2 o 3 puntos fuertes cortos (máx. 6 palabras cada uno), con cifra cuando la haya.'),
    })
  ),
  perfiles: z.array(
    z.object({
      perfil: z.enum(PERFILES),
      ganadorId: z.string().describe('id del carro que más conviene para ese uso'),
      razon: z.string().describe('Por qué, con una cifra de los datos. Máx. 16 palabras.'),
    })
  ),
});

export type Veredicto = z.infer<typeof VeredictoSchema>;

const cache = new Map<string, { hasta: number; valor: Veredicto }>();
const UNA_HORA = 60 * 60 * 1000;

interface CarroEntrada {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  fuelType: string;
  type: string;
  specifications: unknown;
}

/** Ficha compacta y legible: solo los datos que existen, con su etiqueta en español. */
function fichaCompacta(v: CarroEntrada) {
  const s = specsDe(v.specifications);
  const lineas: string[] = [];
  for (const def of ATTRIBUTE_REGISTRY) {
    if (def.displayGroup === 'WiseMetrics' || def.key === 'commercial.priceCop' || def.key.startsWith('commercial.price')) continue;
    let cur: any = s;
    for (const k of def.key.split('.')) cur = cur?.[k];
    if (cur === undefined || cur === null || cur === '' || cur === false || cur === 0) continue;
    const valor = cur === true ? 'sí' : `${cur}${def.unit ? ` ${def.unit}` : ''}`;
    lineas.push(`- ${def.labelEs}: ${valor}`);
  }
  return `### ${v.brand} ${v.model} ${v.year} (id: ${v.id})
- Precio de lista en Colombia: $${Math.round(v.price / 1e6)} millones de pesos${s.commercial?.priceEstimated ? ' (estimado)' : ''}
- Tipo: ${v.type} · Combustible: ${v.fuelType}
${lineas.join('\n')}`;
}

export async function veredictoIA(carros: CarroEntrada[]): Promise<Veredicto> {
  const clave = carros
    .map(c => c.id)
    .sort()
    .join('|');
  const guardado = cache.get(clave);
  if (guardado && guardado.hasta > Date.now()) return guardado.valor;

  const valor = await pedirJson({
    schema: VeredictoSchema,
    maxTokens: 4000,
    modelo: 'haiku', // lo ve el usuario, pero sale de datos ya verificados: no necesita Sonnet
    system: `Eres el asesor de WiseMotors, un marketplace de carros nuevos en Colombia (Medellín). Le hablas a compradores que NO saben de carros: tuteas, frases cortas, cero jerga (si usas un término técnico, lo traduces). Contexto de mercado: en Colombia un Mercedes es lujo pleno y un Corolla es casi gama alta; precios en millones de pesos; las lomas de Medellín, el trancón, los huecos y los reductores ("policías acostados") importan.

Reglas duras:
- Usa ÚNICAMENTE los datos que te doy. Si un dato no está, no lo supongas ni lo menciones como si existiera.
- Si comparas algo, cita la cifra ("8,1 s de 0 a 100", "580 L de baúl").
- Sé justo: cada carro tiene algo a favor. No declares un ganador absoluto.
- km/gal de un carro de gasolina y autonomía de un eléctrico no se comparan directamente.
- En "perfiles" incluye los 6 perfiles, cada uno con el id exacto de un carro de la lista.`,
    prompt: `Compara estos ${carros.length} carros para un comprador en Colombia.

${carros.map(fichaCompacta).join('\n\n')}

Devuelve un "porCarro" por cada id, en el mismo orden.`,
  });

  // Blindaje: los ids tienen que ser de los carros pedidos.
  const ids = new Set(carros.map(c => c.id));
  valor.porCarro = valor.porCarro.filter(p => ids.has(p.id));
  valor.perfiles = valor.perfiles.filter(p => ids.has(p.ganadorId));

  cache.set(clave, { hasta: Date.now() + UNA_HORA, valor });
  return valor;
}
