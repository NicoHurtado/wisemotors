'use client';

// ============================================================================
// Ficha del vehículo (referencia Car Sell Center / Mercedes).
//
// Marca enorme + modelo en gris. Categorías en pastillas a la izquierda; al
// elegir una, los puntos de interés se reacomodan SOBRE el carro con datos
// reales de esa categoría, y la tarjeta negra de la derecha explica en
// palabras de persona qué significan. Debajo: datos destacados, el bloque
// para hablar con el concesionario (botones verdes: prueba de manejo y
// contacto, directo a su WhatsApp) y los 3 más parecidos, con botón para
// compararlos.
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
  CalendarCheck,
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
import { SeccionesFicha } from '@/components/vehicles/ficha/SeccionesFicha';
import type { IndicesVehiculo } from '@/lib/indices/calculo';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { useWhatsAppLeads } from '@/hooks/useWhatsAppLeads';
import { leer, precioCompleto, rendimiento, specsDe } from '@/lib/vehiculo-datos';
import { fotoDe, pinturaDe } from '@/components/car/CarRender';

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
            h(P.cabina, rendimiento(s) !== null ? `${fmt(rendimiento(s)!)} km por galón` : null),
            h(P.capo, n(['combustion.displacement', 'hybrid.displacement', 'phev.displacement'], x => `Motor de ${fmt(x)} cc`)),
            h(P.cola, n(['combustion.fuelTankCapacity', 'hybrid.fuelTankCapacity'], x => `Tanque de ${fmt(x, 1)} galones`)),
            h(P.ruedaR, texto('combustion.transmissionType') ?? texto('hybrid.transmissionType')),
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

/** El nombre antes de abrir WhatsApp: el concesionario sabe con quién habla. */
function FormNombre({ nombre, setNombre, onSubmit }: { nombre: string; setNombre: (v: string) => void; onSubmit: (e: React.FormEvent) => void }) {
  return (
    <form onSubmit={onSubmit} className="sube flex w-full max-w-[420px] gap-2 md:justify-end">
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
  );
}

export function FichaVehiculo({ vehicle, indices = null }: { vehicle: any; indices?: IndicesVehiculo | null }) {
  const router = useRouter();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { createLead } = useWhatsAppLeads();
  const s = useMemo(() => specsDe(vehicle.specifications), [vehicle.specifications]);
  const cats = useMemo(() => categorias(vehicle.fuelType, s), [vehicle.fuelType, s]);
  const [cat, setCat] = useState(0);
  // Qué quiere (prueba de manejo o información) y desde dónde lo pidió: el
  // formulario del nombre se abre junto al botón que se tocó.
  const [contacto, setContacto] = useState<{ motivo: 'prueba' | 'info'; lugar: 'arriba' | 'abajo' } | null>(null);
  const concesionarios: { id: string; name: string; location: string; whatsapp: string | null }[] = vehicle.dealerships ?? [];
  const [elegido, setElegido] = useState(0);
  const concesionario = concesionarios[elegido] ?? null;
  const [nombre, setNombre] = useState(user?.username ?? '');
  const fav = isFavorite(vehicle.id);
  const actual = cats[cat];
  const similares: VehiculoTarjeta[] = (vehicle.similarVehicles ?? []).map((v: any) => ({
    ...v,
    fuelType: v.fuelType ?? (v.fuel ? v.fuel.charAt(0) + v.fuel.slice(1).toLowerCase() : ''),
    type: v.type ?? v.category,
  }));

  const favorito = async () => {
    if (!user) return router.push(`/login?next=${encodeURIComponent(`/vehicles/${vehicle.id}`)}`);
    await toggleFavorite(vehicle.id);
  };

  const pedir = (motivo: 'prueba' | 'info', lugar: 'arriba' | 'abajo') =>
    setContacto(c => (c?.motivo === motivo && c.lugar === lugar ? null : { motivo, lugar }));

  const escribir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contacto) return;
    const quien = nombre.trim() || 'Cliente';
    const etiqueta = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`;
    const donde = concesionario ? ` en ${concesionario.name}${concesionario.location ? ` (${concesionario.location})` : ''}` : '';
    const mensaje =
      contacto.motivo === 'prueba'
        ? `Hola, me interesa el ${etiqueta}. Mi nombre es ${quien} y quiero agendar una prueba de manejo${donde}.`
        : `Hola, me interesa el ${etiqueta}${donde}. Mi nombre es ${quien} y quiero más información: precio, disponibilidad y financiación.`;
    try {
      await createLead({
        name: quien,
        username: user?.username || undefined,
        email: user?.email || undefined,
        vehicleId: vehicle.id,
        vehicleBrand: vehicle.brand,
        vehicleModel: vehicle.model,
        dealershipId: concesionario?.id,
        dealershipName: concesionario?.name,
        message: mensaje,
        source: contacto.motivo === 'prueba' ? 'ficha_prueba' : 'ficha_concesionario',
      });
    } catch {
      // El lead es para el concesionario; si falla, igual se abre WhatsApp.
    }
    // Directo al WhatsApp del concesionario si tiene celular; si no, al de WiseMotors, que lo pasa.
    window.open(`https://wa.me/${concesionario?.whatsapp ?? WHATSAPP}?text=${encodeURIComponent(mensaje)}`, '_blank');
    setContacto(null);
  };

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
          <div className="sube flex w-full flex-col items-start gap-4 md:w-auto md:items-end" style={{ '--d': '120ms' } as React.CSSProperties}>
            <div className="md:text-right">
              <p className="text-[13px] text-tinta-2">Precio de lista</p>
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
            </div>
            <button
              onClick={() => pedir('prueba', 'arriba')}
              aria-expanded={contacto?.lugar === 'arriba'}
              className="pastilla pastilla--verde h-14 w-full justify-center px-8 text-[17px] font-semibold md:w-auto"
            >
              <CalendarCheck className="h-5 w-5" /> Agendar prueba de manejo
            </button>
            {contacto?.lugar === 'arriba' && <FormNombre nombre={nombre} setNombre={setNombre} onSubmit={escribir} />}
          </div>
        </div>
      </section>

      {/* ── Escenario con puntos de interés ─────────────────────────────── */}
      <section className="mx-auto mt-8 max-w-[1440px] px-5 md:px-8">
        <div className="estudio relative overflow-hidden rounded-[36px] px-4 py-8 md:px-8 md:py-14">
          <p
            aria-hidden
            className="t-display pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 select-none text-center text-[clamp(120px,19vw,300px)] leading-none md:block"
            style={
              !fotoDe(vehicle) && ['perla', 'plata'].includes(pinturaDe(vehicle).nombre)
                ? { color: 'transparent', WebkitTextStroke: '1.5px #cfcdd5' }
                : { color: '#dcdae0' }
            }
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

            <div className="relative mx-auto aspect-[480/220] w-full max-w-[860px]">
              <CarRender car={vehicle} prioridad className="carro-entra absolute inset-x-0 bottom-0 top-[6%]" />
              {actual?.puntos.map((p, i) => {
                const izquierda = p.donde.x > 58;
                return (
                  <div
                    key={`${actual.id}-${i}`}
                    className="hotspot !hidden md:!flex"
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
              <ul className="grid grid-cols-2 gap-2 md:hidden">
                {actual.puntos.map(p => (
                  <li key={p.texto} className="rounded-2xl bg-blanco/90 px-3 py-2.5 text-[13px] font-medium">
                    {p.texto}
                  </li>
                ))}
              </ul>
            )}

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

      <SeccionesFicha vehicle={vehicle} indices={indices} />

      {/* ── Contacto: hablar con quien lo vende (verde = una persona al otro lado) ── */}
      <section className="mx-auto mt-24 max-w-[1440px] px-5 md:px-8">
        <div className="grid gap-8 rounded-[36px] bg-blanco p-8 md:grid-cols-[1.2fr_1fr] md:items-center md:p-12">
          <div>
            <h2 className="t-titulo text-[32px] md:text-[44px]">
              ¿Te gustó el {vehicle.model}? <span className="text-tinta-2/50">Habla con quien lo vende.</span>
            </h2>
            <p className="mt-4 max-w-[520px] text-[16px] leading-relaxed text-tinta-2">
              Te responden por WhatsApp: precio final, colores disponibles, financiación y cuándo puedes probarlo.
            </p>
            {concesionarios.length > 1 && (
              <div className="mt-6 flex flex-wrap gap-2" role="radiogroup" aria-label="Concesionario">
                {concesionarios.map((c, i) => (
                  <button key={c.id} type="button" role="radio" aria-checked={i === elegido} data-activa={i === elegido} onClick={() => setElegido(i)} className="pastilla h-11 px-4 text-[14px]">
                    {c.name}
                    {c.location ? <span className="text-tinta-2"> · {c.location}</span> : null}
                  </button>
                ))}
              </div>
            )}
            {concesionarios.length === 1 && concesionario && (
              <p className="mt-6 text-[14px] text-tinta-2">
                Lo vende <span className="font-semibold text-tinta">{concesionario.name}</span>
                {concesionario.location ? ` · ${concesionario.location}` : ''}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => pedir('info', 'abajo')}
              aria-expanded={contacto?.lugar === 'abajo' && contacto.motivo === 'info'}
              className="pastilla pastilla--verde h-14 justify-center px-8 text-[17px] font-semibold"
            >
              <MessageCircle className="h-5 w-5" /> Contactar al concesionario
            </button>
            <button
              onClick={() => pedir('prueba', 'abajo')}
              aria-expanded={contacto?.lugar === 'abajo' && contacto.motivo === 'prueba'}
              className="pastilla pastilla--verde h-14 justify-center px-8 text-[17px] font-semibold"
            >
              <CalendarCheck className="h-5 w-5" /> Agendar prueba de manejo
            </button>
            {contacto?.lugar === 'abajo' && <FormNombre nombre={nombre} setNombre={setNombre} onSubmit={escribir} />}
          </div>
        </div>
      </section>
      {/* ── Similares: los 3 más parecidos en tipo, precio y características ── */}
      {similares.length > 0 && (
        <section className="mx-auto mt-24 max-w-[1440px] px-5 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="t-titulo text-[32px] md:text-[44px]">
              Si te gusta este, <span className="text-tinta-2/50">mira también.</span>
            </h2>
            <p className="max-w-[40ch] text-[15px] text-tinta-2">Los más parecidos en precio, tamaño y tipo de carro. Ponlos frente a frente.</p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {similares.slice(0, 3).map((v, i) => (
              <div key={v.id} className="flex flex-col gap-3">
                <TarjetaCarro vehiculo={v} indice={i} />
                <div className="grid grid-cols-2 gap-2">
                  <Link href={`/vehicles/${v.id}`} className="pastilla h-11 justify-center">
                    Ver ficha <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <Link href={`/compare?ids=${vehicle.id},${v.id}`} className="pastilla pastilla--wise h-11 justify-center">
                    Comparar con este
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
