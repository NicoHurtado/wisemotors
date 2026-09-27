// ============================================================================
// Datos clave de un vehículo para la interfaz, en palabras de persona.
//
// Un solo lugar para leer `specifications` (JSON string u objeto) y decidir
// qué tres cifras muestra una tarjeta o un hero: lo que le importa a alguien
// que no sabe de carros, y nada que no exista (un dato faltante no se muestra;
// nunca un guion ni un cero).
// ============================================================================

export interface DatoClave {
  clave: string;
  etiqueta: string;
  valor: string;
  unidad: string;
  numero: number;
}

export function specsDe(raw: unknown): Record<string, any> {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) ?? {};
    } catch {
      return {};
    }
  }
  return typeof raw === 'object' ? (raw as Record<string, any>) : {};
}

export function leer(specs: Record<string, any>, ...paths: string[]): number | null {
  for (const path of paths) {
    let cur: any = specs;
    for (const k of path.split('.')) cur = cur?.[k];
    const n = typeof cur === 'string' ? parseFloat(cur.replace(',', '.')) : cur;
    if (typeof n === 'number' && Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

const fmt = (n: number, dec = 0) =>
  new Intl.NumberFormat('es-CO', { maximumFractionDigits: dec, minimumFractionDigits: dec }).format(n);

/** "$89,9 M" — como se dice un precio en Colombia. */
export function millones(precio: number): string {
  const m = precio / 1_000_000;
  return `$${fmt(m, m >= 100 ? 0 : 1).replace(/,0$/, '')} M`;
}

export function precioCompleto(precio: number): string {
  return `$${fmt(precio)}`;
}

/** Todos los datos clave disponibles, en orden de importancia para un no experto. */
export function datosClave(vehiculo: { fuelType?: string; specifications?: unknown }): DatoClave[] {
  const s = specsDe(vehiculo.specifications);
  const electrico = vehiculo.fuelType === 'Eléctrico';
  const out: DatoClave[] = [];
  const add = (clave: string, etiqueta: string, n: number | null, unidad: string, dec = 0) => {
    if (n !== null) out.push({ clave, etiqueta, valor: fmt(n, dec), unidad, numero: n });
  };

  add('potencia', 'Potencia', leer(s, 'combustion.maxPower', 'hybrid.maxPower', 'phev.maxPower', 'electric.maxPower'), 'hp');
  add('aceleracion', '0 a 100', leer(s, 'performance.acceleration0to100'), 's', 1);
  if (electrico) {
    add('autonomia', 'Autonomía', leer(s, 'electric.realRangeMixed', 'electric.electricRange'), 'km');
  } else {
    add('consumo', 'Rinde', leer(s, 'combustion.combinedConsumption'), 'km/gal');
  }
  add('baul', 'Baúl', leer(s, 'dimensions.cargoCapacity'), 'L');
  add('torque', 'Torque', leer(s, 'combustion.maxTorque', 'hybrid.maxTorque', 'electric.maxTorque'), 'Nm');
  add('velocidad', 'Vel. máx.', leer(s, 'performance.maxSpeed'), 'km/h');
  add('altura', 'Altura al piso', leer(s, 'chassis.groundClearance'), 'mm');
  add('airbags', 'Airbags', leer(s, 'safety.airbags'), '');
  add('pasajeros', 'Pasajeros', leer(s, 'interior.passengerCapacity'), '');
  return out;
}

/** Tres cifras para una tarjeta: potencia, 0-100 y lo que rinda (gasolina o batería). */
export function tresDatos(vehiculo: { fuelType?: string; specifications?: unknown }): DatoClave[] {
  const todos = datosClave(vehiculo);
  const orden = ['potencia', 'aceleracion', 'autonomia', 'consumo', 'baul', 'torque', 'velocidad'];
  return orden.map(c => todos.find(d => d.clave === c)).filter((d): d is DatoClave => !!d).slice(0, 3);
}

/** Primera palabra "de marca" del modelo para la palabra gigante: "RAV4 Híbrida" → "RAV4". */
export function palabraGigante(modelo: string, marca = ''): string {
  const limpio = modelo.replace(/(^|\s)(sedán|sedan|hatchback|híbrida|hibrida|híbrido|rs|gt)(?=\s|$)/gi, ' ').trim();
  const partes = limpio.split(/\s+/);
  // "Model Y", "Serie 3", "Clase C": la primera palabra sola es genérica.
  const generica = /^(model|serie|series|clase|class)$/i.test(partes[0] ?? '');
  const palabra = (generica ? partes.slice(0, 2).join(' ') : partes[0] || modelo).toUpperCase();
  // "3" o "Y" solos no dicen nada: se acompañan de la marca.
  return palabra.length < 3 && marca ? `${marca} ${palabra}`.toUpperCase() : palabra;
}
