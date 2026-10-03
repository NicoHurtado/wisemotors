// ============================================================================
// Verificación de la agrupación de la demanda (lib/demanda.ts). Sin BD.
//   npx tsx scripts/verify-demanda.ts
// ============================================================================

import { QueryType } from '../lib/ai/categorization';
import { bandaPresupuesto, carroceriaCanonica, carroceriaDelTexto, presupuestoDelTexto, demandaCsv, etiquetaIntencion, fichaDeBusqueda, hashSesion, normalizarBusqueda, resumirDemanda, type Fila } from '../lib/demanda';

let fallas = 0;
function check(nombre: string, ok: boolean, detalle = '') {
  if (ok) console.log(`  ✓ ${nombre}`);
  else {
    fallas++;
    console.error(`  ✗ ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  }
}

const intent = (body: string[] = [], max?: number, extra: Record<string, unknown> = {}) => ({
  query_type: QueryType.HYBRID,
  objective_filters: { body_types: body, ...(max ? { price_range: { max } } : {}) },
  ...extra,
});

// Escritas distinto, misma intención
const a = fichaDeBusqueda('Una SUV para la familia que no gaste mucho', intent(['SUV'], 110e6));
const b = fichaDeBusqueda('camioneta familiar económica', intent(['camioneta'], 115e6));
check('"SUV para la familia que no gaste" y "camioneta familiar económica" caen en el mismo grupo', a.intencion === b.intencion, `${a.intencion} vs ${b.intencion}`);
check('el grupo lleva necesidad, carrocería y presupuesto', a.intencion === 'economia+familia|SUV|80-120', a.intencion);
check('la etiqueta se lee como persona', etiquetaIntencion(a.intencion) === 'SUV · Que gaste poco + Familia · $80–120 M', etiquetaIntencion(a.intencion));

const c = fichaDeBusqueda('carro para la ciudad', intent());
check('sin carrocería ni presupuesto: "cualquiera" y "sin"', c.intencion === 'ciudad|cualquiera|sin', c.intencion);
check('sin necesidad: "general"', fichaDeBusqueda('Mazda 2026', intent()).intencion.startsWith('general|'));

check('carrocerías: camioneta→SUV, pick-up→Pickup, sedán→Sedán', carroceriaCanonica('camioneta') === 'SUV' && carroceriaCanonica('pick-up') === 'Pickup' && carroceriaCanonica('Sedan') === 'Sedán');
check('una "camioneta de platón" es Pickup, no SUV', carroceriaCanonica('camioneta de platon') === 'Pickup');
check('bandas: 80 M justos es "hasta 80"', bandaPresupuesto(null, 80e6).clave === 'hasta-80');
check('bandas: solo mínimo usa el mínimo', bandaPresupuesto(200e6, null).clave === '180-300');
check('normalizar quita tildes, signos y espacios', normalizarBusqueda('  ¿Una SUV  económica?? ') === 'una suv economica');
check('el hash de la sesión no es la sesión y es estable', hashSesion('abc-123-def') !== 'abc-123-def' && hashSesion('abc-123-def') === hashSesion('abc-123-def'));
check('marcas que no tenemos quedan registradas', fichaDeBusqueda('un Ferrari', intent([], undefined, { missing_brands: ['Ferrari'] })).marcasFaltantes[0] === 'Ferrari');

// Respaldo sin IA (si Claude falla, la demanda no queda vacía)
const sinIA = fichaDeBusqueda('Una SUV para la familia que no gaste mucho, hasta 110 millones', intent());
check('sin IA: la carrocería sale del texto', sinIA.carrocerias[0] === 'SUV');
check('sin IA: el presupuesto sale del texto', sinIA.presupuestoMax === 110e6, String(sinIA.presupuestoMax));
check('"120 palos" son 120 millones', presupuestoDelTexto('algo de 120 palos').max === 120e6);
check('"más de 200 M" es un mínimo', presupuestoDelTexto('más de 200 M').min === 200e6);
check('"van" con palabra completa: "avanzado" no es Van', carroceriaDelTexto('un carro avanzado') === null && carroceriaDelTexto('una van') === 'Van');
check('la IA manda sobre el texto', fichaDeBusqueda('una SUV', intent(['Sedán'])).carrocerias[0] === 'Sedán');

// Resumen
const fila = (texto: string, i: ReturnType<typeof fichaDeBusqueda>, sesion: string, resultados = 5): Fila => ({
  ...i,
  texto,
  resultados,
  sesion,
  ciudad: 'Medellín',
  createdAt: new Date(),
});
const filas = [
  fila('Una SUV para la familia que no gaste mucho', a, 's1'),
  fila('una suv para la familia que no gaste mucho', a, 's2'),
  fila('camioneta familiar económica', b, 's1'),
  fila('carro para la ciudad', c, 's3', 0),
];
const votos = new Map<string, [number, number]>([[normalizarBusqueda('una suv para la familia que no gaste mucho'), [1, 2]]]);
const r = resumirDemanda(filas, [{ intencion: a.intencion }], votos);
const g = r.grupos[0];
check('el grupo más buscado va primero', g.clave === a.intencion && g.busquedas === 3);
check('personas únicas por grupo', g.personas === 2, String(g.personas));
check('tendencia contra el periodo anterior', g.anterior === 1);
check('satisfacción del grupo sale de los 👍/👎', g.satisfaccion === 0.5, String(g.satisfaccion));
check('la forma más repetida es el primer ejemplo', normalizarBusqueda(g.ejemplos[0]) === 'una suv para la familia que no gaste mucho');
check('presupuesto mediano', g.presupuestoMediano === 110e6, String(g.presupuestoMediano));
check('búsqueda sin resultados se cuenta', r.grupos.find(x => x.clave === c.intencion)?.sinResultado === 1);
check('total de personas del periodo', r.personas === 3);
const csv = demandaCsv(r);
check('el CSV es solo agregados: sin texto libre', !csv.includes('no gaste mucho') && csv.includes('SUV · Que gaste poco + Familia'));

console.log(fallas ? `\n${fallas} fallas` : '\nTodo bien');
process.exit(fallas ? 1 : 0);
