'use client';

// ============================================================================
// Ficha del vehículo (referencia Car Sell Center / Mercedes).
//
// Marca enorme + modelo en gris. Categorías en pastillas a la izquierda; al
// elegir una, los puntos de interés se reacomodan SOBRE el carro con datos
// reales de esa categoría, y la tarjeta negra de la derecha explica en
// palabras de persona qué significan. Debajo: datos destacados, ficha técnica
// completa agrupada, procedencia y similares.
// Una categoría sin datos no aparece; un dato faltante no se inventa.
// ============================================================================

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Armchair,
  Fuel,
  Gauge,
  Heart,
  Luggage,
  MessageCircle,
  Shield,
  Timer,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { CarRender } from '@/components/car/CarRender';
import { TarjetaCarro, type VehiculoTarjeta } from '@/components/car/TarjetaCarro';
import { DataProvenance } from '@/components/vehicles/DataProvenance';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { useWhatsAppLeads } from '@/hooks/useWhatsAppLeads';
import { ATTRIBUTE_REGISTRY } from '@/lib/attributes/registry';
import { datosClave, leer, precioCompleto, specsDe } from '@/lib/vehiculo-datos';

const WHATSAPP = '573103818615';

type Punto = { x: number; y: number };
// Puntos genéricos sobre un perfil lateral mirando a la derecha.
const P: Record<string, Punto> = {
  capo: { x: 80, y: 40 },
  techoF: { x: 60, y: 14 },
  techoR: { x: 34, y: 16 },
  cabina: { x: 48, y: 46 },
  cola: { x: 12, y: 42 },
  ruedaF: { x: 76, y: 80 },
  ruedaR: { x: 24, y: 80 },
};

interface Hotspot {
  donde: Punto;
  texto: string;
}

interface Categoria {
  id: string;
  nombre: string;
  titulo: string;
  explicacion: string;
  puntos: Hotspot[];
}

const fmt = (n: number, dec = 0) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: dec }).format(n);

function categorias(fuelType: string, s: Record<string, any>): Categoria[] {
  const texto = (path: string) => {
    let cur: any = s;
    for (const k of path.split('.')) cur = cur?.[k];
    return typeof cur === 'string' && cur.trim() ? cur.trim() : null;
  };
  const si = (path: string) => {
    let cur: any = s;
    for (const k of path.split('.')) cur = cur?.[k];
    return cur === true;
  };
  const h = (donde: Punto, t: string | null): Hotspot | null => (t ? { donde, texto: t } : null);
  const n = (path: string[], f: (x: number) => string) => {
    const v = leer(s, ...path);
    return v !== null ? f(v) : null;
  };
  const electrico = fuelType === 'Eléctrico';

  const lista: Categoria[] = [
    {
      id: 'desempeno',
      nombre: 'Desempeño',
      titulo: 'Fuerza y respuesta',
      explicacion:
        'La potencia es la fuerza para subir y adelantar. El torque es el empujón desde abajo, el que se siente al arrancar en una loma. El 0 a 100 dice qué tan rápido responde cuando aceleras a fondo.',
      puntos: [
        h(P.capo, n(['combustion.maxPower', 'hybrid.maxPower', 'phev.maxPower', 'electric.maxPower'], x => `${fmt(x)} hp de potencia`)),
        h(P.ruedaF, n(['combustion.maxTorque', 'hybrid.maxTorque', 'electric.maxTorque'], x => `${fmt(x)} Nm de torque`)),
        h(P.ruedaR, n(['performance.acceleration0to100'], x => `0 a 100 en ${fmt(x, 1)} s`)),
        h(P.techoF, n(['performance.maxSpeed'], x => `${fmt(x)} km/h máximo`)),
      ].filter((x): x is Hotspot => !!x),
    },
    {
      id: 'espacio',
      nombre: 'Espacio',
      titulo: 'Lo que le cabe',
      explicacion:
        'El baúl se mide en litros: una maleta de cabina ocupa unos 40. La altura al piso decide si pasas un policía acostado o un hueco sin raspar.',
      puntos: [
        h(P.cola, n(['dimensions.cargoCapacity'], x => `Baúl de ${fmt(x)} L`)),
        h(P.cabina, n(['interior.passengerCapacity'], x => `${fmt(x)} pasajeros`)),
        h(P.ruedaF, n(['chassis.groundClearance'], x => `${fmt(x / 10, 1)} cm del piso`)),
        h(P.techoR, n(['dimensions.length'], x => `${fmt(x / 1000, 2)} m de largo`)),
      ].filter((x): x is Hotspot => !!x),
    },
    {
      id: 'seguridad',
      nombre: 'Seguridad',
      titulo: 'Cómo te cuida',
      explicacion:
        'Las estrellas vienen de pruebas de choque reales. Los airbags son cojines que se inflan en un impacto. Las ayudas electrónicas frenan o corrigen antes de que tú alcances a reaccionar.',
      puntos: [
        h(P.cabina, n(['safety.airbags'], x => `${fmt(x)} airbags`)),
        h(P.techoF, n(['safety.ncapRating'], x => `${fmt(x)} estrellas en choques`)),
        h(P.capo, si('safety.autonomousEmergencyBraking') ? 'Frena solo si ve un choque' : null),
        h(P.ruedaR, si('safety.stabilityControl') ? 'Control de estabilidad' : null),
      ].filter((x): x is Hotspot => !!x),
    },
    {
      id: 'eficiencia',
      nombre: electrico ? 'Batería' : 'Consumo',
      titulo: electrico ? 'Cuánto aguanta' : 'Cuánto gasta',
      explicacion: electrico
        ? 'La autonomía es cuánto recorre con una carga completa; en ciudad suele rendir más que en carretera. La batería se mide en kWh: más kWh, más kilómetros.'
        : 'Los km por galón dicen cuánto recorres con un galón. Más es mejor para el bolsillo. En trancón se gasta más que en carretera.',
      puntos: electrico
        ? [
            h(P.cabina, n(['electric.realRangeMixed', 'electric.electricRange'], x => `${fmt(x)} km por carga`)),
            h(P.cola, n(['electric.batteryCapacity'], x => `Batería de ${fmt(x, 1)} kWh`)),
            h(P.capo, n(['electric.dcChargingTime'], x => `Carga rápida en ${fmt(x)} min`)),
          ].filter((x): x is Hotspot => !!x)
        : [
            h(P.cabina, n(['combustion.combinedConsumption'], x => `${fmt(x)} km por galón`)),
            h(P.capo, n(['combustion.displacement'], x => `Motor de ${fmt(x)} cc`)),
            h(P.cola, n(['combustion.fuelTankCapacity'], x => `Tanque de ${fmt(x)} L`)),
            h(P.ruedaR, texto('combustion.transmissionType')),
          ].filter((x): x is Hotspot => !!x),
    },
    {
      id: 'tecnologia',
      nombre: 'Tecnología',
      titulo: 'Lo que trae',
      explicacion:
        'Lo que usas todos los días: conectar el celular, ver hacia atrás al parquear, que el carro te avise si algo se acerca.',
      puntos: [
        h(P.cabina, texto('technology.smartphoneIntegration') ? 'Conecta tu celular' : si('technology.bluetooth') ? 'Bluetooth' : null),
        h(P.cola, si('assistance.reverseCamera') ? 'Cámara de reversa' : null),
        h(P.ruedaR, si('assistance.parkingSensors') ? 'Sensores de parqueo' : null),
        h(P.techoF, si('technology.touchscreen') ? 'Pantalla táctil' : null),
      ].filter((x): x is Hotspot => !!x),
    },
  ];
  return lista.filter(c => c.puntos.length > 0);
}

const ICONOS: Record<string, LucideIcon> = {
  potencia: Zap,
  aceleracion: Timer,
  consumo: Fuel,
  autonomia: Zap,
  baul: Luggage,
  torque: Gauge,
  velocidad: Gauge,
  altura: Armchair,
  airbags: Shield,
  pasajeros: Users,
};

/** Ficha técnica completa agrupada por el registro de atributos. */
function fichaTecnica(s: Record<string, any>) {
  const grupos = new Map<string, { etiqueta: string; valor: string }[]>();
  for (const def of ATTRIBUTE_REGISTRY) {
    if (def.displayGroup === 'WiseMetrics' || def.key === 'commercial.priceCop') continue;
    let cur: any = s;
    for (const k of def.key.split('.')) cur = cur?.[k];
    if (cur === undefined || cur === null || cur === '' || cur === false) continue;
    let valor: string;
    if (def.dataType === 'boolean') valor = 'Sí';
    else if (def.dataType === 'numeric') {
      const nnum = typeof cur === 'number' ? cur : parseFloat(String(cur));
      if (!Number.isFinite(nnum) || nnum <= 0) continue;
      valor = `${fmt(nnum, 1)}${def.unit ? ` ${def.unit}` : ''}`;
    } else valor = String(cur);
    const lista = grupos.get(def.displayGroup) ?? [];
    lista.push({ etiqueta: def.labelEs, valor });
    grupos.set(def.displayGroup, lista);
  }
  return Array.from(grupos.entries());
}

export function FichaVehiculo({ vehicle }: { vehicle: any }) {
  const router = useRouter();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { createLead } = useWhatsAppLeads();
  const s = useMemo(() => specsDe(vehicle.specifications), [vehicle.specifications]);
  const cats = useMemo(() => categorias(vehicle.fuelType, s), [vehicle.fuelType, s]);
  const [cat, setCat] = useState(0);
  const datos = useMemo(() => datosClave(vehicle), [vehicle]);
  const ficha = useMemo(() => fichaTecnica(s), [s]);
  const fila = useRef<HTMLDivElement>(null);
  const [contacto, setContacto] = useState(false);
  const [nombre, setNombre] = useState(user?.username ?? '');
  const fav = isFavorite(vehicle.id);
  const actual = cats[cat];
  const commercial = s.commercial ?? {};
  const similares: VehiculoTarjeta[] = (vehicle.similarVehicles ?? []).map((v: any) => ({
    ...v,
    fuelType: v.fuelType ?? (v.fuel ? v.fuel.charAt(0) + v.fuel.slice(1).toLowerCase() : ''),
    type: v.type ?? v.category,
  }));

  const favorito = async () => {
    if (!user) return router.push('/login');
    await toggleFavorite(vehicle.id);
  };

  const escribir = async (e: React.FormEvent) => {
    e.preventDefault();
    const quien = nombre.trim() || 'Cliente';
    const etiqueta = `${vehicle.brand} ${vehicle.model}`;
    const mensaje = `Hola, me interesa el ${etiqueta}. Mi nombre es ${quien} y quiero agendar una prueba de manejo.`;
    try {
      await createLead({
        name: quien,
        username: user?.username || undefined,
        email: user?.email || undefined,
        vehicleId: vehicle.id,
        vehicleBrand: vehicle.brand,
        vehicleModel: vehicle.model,
        message: mensaje,
        source: 'ficha',
      });
    } catch {
      // El lead es para el concesionario; si falla, igual se abre WhatsApp.
    }
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`, '_blank');
    setContacto(false);
  };

  const desplazar = (dir: 1 | -1) => fila.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });

  return (
    <div className="pb-10">
      {/* ── Cabecera ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1440px] px-5 pt-8 md:px-8 md:pt-12">
        <Link href="/vehicles" className="inline-flex items-center gap-2 text-[14px] text-tinta-2 hover:text-tinta">
          <ArrowLeft className="h-4 w-4" /> Catálogo
        </Link>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-8">
          <div className="sube">
            <h1 className="t-titulo text-[56px] md:text-[96px]">{vehicle.brand}</h1>
            <p className="t-ligero mt-2 text-[28px] text-tinta-2 md:text-[40px]">
              {vehicle.model} · {vehicle.year}
            </p>
          </div>
          <div className="sube flex flex-col items-start gap-4 md:items-end" style={{ '--d': '120ms' } as React.CSSProperties}>
            <div className="md:text-right">
              <p className="text-[13px] text-tinta-2">
                Precio de lista{commercial.priceEstimated ? ' · estimado' : ''}
              </p>
              <p className="cifra text-[32px] font-semibold md:text-[40px]">
                <AnimatedNumber value={vehicle.price} format={n => precioCompleto(Math.round(n))} durationMs={1100} />
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={favorito}
                aria-pressed={fav}
                className={`inline-flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${
                  fav ? 'border-wise bg-wise text-white' : 'border-linea bg-blanco hover:border-tinta'
                }`}
                aria-label={fav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
              >
                <Heart className="h-5 w-5" fill={fav ? 'currentColor' : 'none'} />
              </button>
              <Link href="/compare" className="pastilla h-12 px-5">
                Comparar
              </Link>
              <button onClick={() => setContacto(c => !c)} className="pastilla pastilla--wise h-12 px-5">
                <MessageCircle className="h-4 w-4" /> Prueba de manejo
              </button>
            </div>
            {contacto && (
              <form onSubmit={escribir} className="sube flex w-full max-w-[420px] gap-2 md:justify-end">
                <label htmlFor="nombre-lead" className="sr-only">
                  Tu nombre
                </label>
                <input
                  id="nombre-lead"
                  autoFocus
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="¿Cómo te llamas?"
                  className="h-12 min-w-0 flex-1 rounded-full border border-linea bg-blanco px-5 text-[15px] outline-none focus:border-tinta"
                />
                <button type="submit" className="pastilla pastilla--tinta h-12 px-5">
                  Abrir WhatsApp <ArrowUpRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── Escenario con puntos de interés ─────────────────────────────── */}
      <section className="mx-auto mt-8 max-w-[1440px] px-5 md:px-8">
        <div className="estudio relative overflow-hidden rounded-[36px] px-4 pb-8 pt-6 md:px-8 md:pb-10">
          <p
            aria-hidden
            className="t-display pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none text-center text-[22vw] leading-none text-tinta/[0.045]"
          >
            {vehicle.brand.toUpperCase()}
          </p>

          <div className="relative grid gap-6 lg:grid-cols-[180px_1fr_300px] lg:items-center">
            <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible" aria-label="Categorías">
              {cats.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setCat(i)}
                  className="pastilla h-12 shrink-0 justify-center px-6 lg:w-full"
                  data-activa={i === cat}
                >
                  {c.nombre}
                </button>
              ))}
            </nav>

            <div className="relative mx-auto aspect-[480/200] w-full max-w-[860px]">
              <CarRender car={vehicle} prioridad className="carro-entra absolute inset-0" />
              {actual?.puntos.map((p, i) => {
                const izquierda = p.donde.x > 58;
                return (
                  <div
                    key={`${actual.id}-${i}`}
                    className="hotspot"
                    style={
                      {
                        left: `${p.donde.x}%`,
                        top: `${p.donde.y}%`,
                        flexDirection: izquierda ? 'row-reverse' : 'row',
                        transform: izquierda ? 'translate(calc(-100% + 20px), -50%)' : undefined,
                        '--d': `${i * 90}ms`,
                      } as React.CSSProperties
                    }
                  >
                    <span className="hotspot__punto" />
                    <span className="hotspot__etiqueta">{p.texto}</span>
                  </div>
                );
              })}
            </div>

            {actual && (
              <div key={actual.id} className="sube overflow-hidden rounded-[28px] bg-blanco shadow-[0_30px_60px_-40px_rgba(14,12,17,0.5)]">
                <div className="flex items-center gap-3 bg-tinta px-5 py-4 text-white">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                    <Gauge className="h-4 w-4" />
                  </span>
                  <p className="text-[17px] font-medium tracking-[-0.02em]">{actual.titulo}</p>
                </div>
                <p className="px-5 py-5 text-[14px] leading-relaxed text-tinta-2">{actual.explicacion}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Datos destacados ─────────────────────────────────────────────── */}
      {datos.length > 0 && (
        <section className="mx-auto mt-16 max-w-[1440px] px-5 md:px-8">
          <div className="flex items-end justify-between gap-4">
            <h2 className="t-titulo text-[32px] md:text-[44px]">En cifras</h2>
            <div className="flex gap-2">
              <button onClick={() => desplazar(-1)} className="flecha" aria-label="Anterior">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button onClick={() => desplazar(1)} className="flecha" aria-label="Siguiente">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div ref={fila} className="mt-6 flex snap-x gap-4 overflow-x-auto pb-4 [scrollbar-width:none]">
            <div className="flex w-[260px] shrink-0 snap-start flex-col justify-between rounded-[28px] bg-tinta p-6 text-white">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <Fuel className="h-5 w-5" />
              </span>
              <div className="mt-10">
                <p className="text-[13px] text-white/50">Tren motriz</p>
                <p className="mt-1 text-[30px] font-semibold tracking-[-0.03em]">{vehicle.fuelType}</p>
                <p className="text-[13px] text-white/50">{vehicle.type}</p>
              </div>
            </div>
            {datos.map(d => {
              const Icono = ICONOS[d.clave] ?? Gauge;
              return (
                <div key={d.clave} className="flex w-[240px] shrink-0 snap-start flex-col justify-between rounded-[28px] border border-linea bg-blanco p-6">
                  <div className="flex items-start justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-linea">
                      <Icono className="h-5 w-5" />
                    </span>
                    <span className="text-right text-[14px] text-tinta-2">{d.etiqueta}</span>
                  </div>
                  <p className="mt-10 text-[52px] font-light leading-none tracking-[-0.05em]">
                    {d.valor}
                    {d.unidad && <span className="ml-1.5 text-[18px] text-tinta-2">{d.unidad}</span>}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Ficha técnica completa ───────────────────────────────────────── */}
      {ficha.length > 0 && (
        <section className="mx-auto mt-20 max-w-[1440px] px-5 md:px-8">
          <div className="grid gap-6 border-t border-linea pt-10 md:grid-cols-12">
            <p className="t-meta text-tinta-2 md:col-span-3">(Ficha técnica)</p>
            <h2 className="t-titulo text-[32px] md:col-span-9 md:text-[44px]">
              Todo lo que sabemos. <span className="text-tinta-2/50">Y nada que no.</span>
            </h2>
          </div>
          <div className="mt-10 columns-1 gap-8 md:columns-2 xl:columns-3">
            {ficha.map(([grupo, filas]) => (
              <div key={grupo} className="mb-8 break-inside-avoid rounded-[24px] bg-blanco p-6">
                <p className="text-[17px] font-semibold tracking-[-0.02em]">{grupo}</p>
                <dl className="mt-3">
                  {filas.map(f => (
                    <div key={f.etiqueta} className="flex items-baseline justify-between gap-4 border-b border-linea/70 py-2.5 last:border-0">
                      <dt className="text-[14px] text-tinta-2">{f.etiqueta}</dt>
                      <dd className="cifra text-right text-[14px] text-tinta">{f.valor}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Procedencia ──────────────────────────────────────────────────── */}
      <section className="mx-auto mt-12 max-w-[1440px] px-5 md:px-8">
        <DataProvenance
          vehicleId={vehicle.id}
          precioEstimado={Boolean(commercial.priceEstimated)}
          razonamientoPrecio={commercial.priceReasoningEs}
          coberturaGlobal={vehicle.coverageGlobal ?? null}
        />
      </section>

      {/* ── Similares ───────────────────────────────────────────────────── */}
      {similares.length > 0 && (
        <section className="mx-auto mt-24 max-w-[1440px] px-5 md:px-8">
          <h2 className="t-titulo text-[32px] md:text-[44px]">
            También podría servirte <span className="t-ligero text-tinta-2/50">({similares.length})</span>
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {similares.slice(0, 3).map((v, i) => (
              <TarjetaCarro key={v.id} vehiculo={v} indice={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
