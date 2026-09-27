'use client';

// ============================================================================
// Secciones de la home (después del hero).
// ============================================================================

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { CarRender } from '@/components/car/CarRender';
import { TarjetaCarro, type VehiculoTarjeta } from '@/components/car/TarjetaCarro';
import { Reveal } from '@/components/ui/Reveal';
import { useEnVista } from '@/components/ui/useEnVista';
import { datosClave, millones } from '@/lib/vehiculo-datos';

// ── Marquesina de marcas ────────────────────────────────────────────────────
const MARCAS_CO = ['Toyota', 'Mazda', 'Renault', 'Chevrolet', 'Kia', 'BYD', 'Volkswagen', 'Tesla', 'Hyundai', 'Nissan', 'Suzuki'];

export function Marquesina() {
  const lista = [...MARCAS_CO, ...MARCAS_CO];
  return (
    <div className="overflow-hidden border-b border-linea bg-papel py-8" aria-label="Marcas en WiseMotors">
      <div className="marquesina">
        {lista.map((m, i) => (
          <span key={i} className="t-ligero flex items-center gap-12 px-6 text-[40px] text-tinta md:text-[56px]">
            {m}
            <span className="h-2.5 w-2.5 rounded-full bg-wise" aria-hidden />
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Cómo funciona (editorial) ───────────────────────────────────────────────
const PASOS = [
  {
    titulo: 'Cuéntanos tu vida',
    texto: 'Para qué lo usas, quién va contigo, cuánto quieres gastar. Con tus palabras, sin términos técnicos.',
  },
  {
    titulo: 'Medimos contra Colombia',
    texto: 'Cada carro se compara con los de su precio y tipo que se venden aquí. Nunca contra un Ferrari.',
  },
  {
    titulo: 'Decides con datos claros',
    texto: 'Te decimos por qué te sirve, de dónde sale cada cifra y qué no sabemos todavía.',
  },
];

export function ComoFunciona({ vitrina }: { vitrina?: VehiculoTarjeta }) {
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-24 md:px-8 md:py-32">
      <div className="grid items-end gap-6 md:grid-cols-12">
        <p className="t-meta text-tinta-2 md:col-span-3 md:pb-3">(Cómo funciona)</p>
        <Reveal className="md:col-span-9">
          <h2 className="t-titulo text-[44px] md:text-[84px]">
            <span className="text-tinta-2/50">Escríbelo como se lo dirías a un amigo.</span> La parte técnica corre por nuestra cuenta.
          </h2>
        </Reveal>
      </div>

      <div className="ticks mt-16 text-tinta" />

      <div className="mt-14 grid gap-10 md:grid-cols-12 md:gap-8">
        <Reveal className="md:col-span-7">
          <div className="estudio relative aspect-[5/4] overflow-hidden rounded-[32px] md:aspect-[4/3]">
            <p className="t-meta absolute left-6 top-6 text-tinta-2">(Estudio WiseMotors)</p>
            <p className="t-meta absolute right-6 top-6 text-tinta-2">{vitrina ? `${vitrina.brand} ${vitrina.model}` : ''}</p>
            {vitrina && (
              <div className="absolute inset-x-[8%] top-[18%] h-[52%]">
                <CarRender car={vitrina} reflejo className="h-full w-full" />
              </div>
            )}
            <div className="absolute bottom-5 left-5 w-[min(320px,78%)] rounded-[26px] bg-wise p-6 text-white shadow-[0_30px_60px_-30px_rgba(59,13,85,0.9)] md:bottom-8 md:left-8">
              <p className="text-[24px] font-semibold leading-[1.1] tracking-[-0.03em]">Cada dato, en palabras de persona.</p>
              <Link
                href="/vehicles"
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-white pl-5 pr-1.5 text-[14px] font-medium text-tinta"
              >
                Explorar catálogo
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-wise text-white">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </div>
        </Reveal>

        <div className="flex flex-col md:col-span-5">
          {PASOS.map((p, i) => (
            <Reveal key={p.titulo} delayMs={i * 90}>
              <div className="group grid grid-cols-[56px_1fr_auto] items-start gap-4 border-t border-linea py-8">
                <span className="cifra pt-2 text-[13px] text-tinta-2">({String(i + 1).padStart(2, '0')})</span>
                <div>
                  <h3 className="text-[28px] font-semibold tracking-[-0.035em] md:text-[32px]">{p.titulo}</h3>
                  <p className="mt-2 max-w-[42ch] text-[15px] leading-relaxed text-tinta-2">{p.texto}</p>
                </div>
                <ArrowUpRight className="mt-2 h-5 w-5 text-tinta-2 transition-transform duration-500 group-hover:rotate-45 group-hover:text-wise" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Destacados (Carzone) ────────────────────────────────────────────────────
const FILTROS = [
  { texto: 'Todos', f: () => true },
  { texto: 'SUV', f: (v: VehiculoTarjeta) => v.type === 'SUV' },
  { texto: 'Hatchback', f: (v: VehiculoTarjeta) => v.type === 'Hatchback' },
  { texto: 'Sedán', f: (v: VehiculoTarjeta) => v.type === 'Sedán' },
  { texto: 'Eléctricos', f: (v: VehiculoTarjeta) => v.fuelType === 'Eléctrico' },
];

export function Destacados({ vehiculos, total }: { vehiculos: VehiculoTarjeta[]; total: number }) {
  const [filtro, setFiltro] = useState(0);
  const lista = vehiculos.filter(FILTROS[filtro].f).slice(0, 6);

  return (
    <section className="mx-auto max-w-[1440px] px-5 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h2 className="t-titulo text-[44px] md:text-[64px]">
          En el catálogo <span className="t-ligero text-tinta-2/50">({total})</span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {FILTROS.map((f, i) => (
            <button key={f.texto} onClick={() => setFiltro(i)} className="pastilla h-10 px-4" data-activa={filtro === i}>
              {f.texto}
            </button>
          ))}
          <Link href="/vehicles" className="pastilla pastilla--wise h-10 px-4">
            Ver todo <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div key={filtro} className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {lista.map((v, i) => (
          <TarjetaCarro key={v.id} vehiculo={v} indice={i} />
        ))}
        {lista.length === 0 && (
          <p className="col-span-full rounded-[28px] bg-tarjeta p-10 text-center text-tinta-2">
            Todavía no hay carros de este tipo en el catálogo.
          </p>
        )}
      </div>
    </section>
  );
}

// ── Franja del comparador (showroom con muesca) ─────────────────────────────
export function BandaComparar({ vehiculos }: { vehiculos: VehiculoTarjeta[] }) {
  const [ref, visto] = useEnVista<HTMLDivElement>(0.3);

  // Dos del mismo tipo para que la comparación tenga sentido.
  const par = useMemo(() => {
    const porTipo = new Map<string, VehiculoTarjeta[]>();
    vehiculos.forEach(v => porTipo.set(v.type, [...(porTipo.get(v.type) ?? []), v]));
    const grupo = Array.from(porTipo.values()).sort((a, b) => b.length - a.length)[0] ?? [];
    return grupo.slice(0, 2);
  }, [vehiculos]);

  if (par.length < 2) return null;
  const [a, b] = par;
  const da = datosClave(a);
  const db = datosClave(b);
  const filas = [
    { etiqueta: 'Precio', va: a.price, vb: b.price, ta: millones(a.price), tb: millones(b.price), menor: true },
    ...['potencia', 'baul', 'consumo', 'autonomia', 'aceleracion']
      .map(k => ({ x: da.find(d => d.clave === k), y: db.find(d => d.clave === k) }))
      .filter(p => p.x && p.y)
      .slice(0, 3)
      .map(({ x, y }) => ({
        etiqueta: x!.etiqueta,
        va: x!.numero,
        vb: y!.numero,
        ta: `${x!.valor} ${x!.unidad}`,
        tb: `${y!.valor} ${y!.unidad}`,
        menor: x!.clave === 'aceleracion',
      })),
  ];

  return (
    <section className="banda-muesca relative mt-28 bg-showroom text-white md:mt-36">
      <div ref={ref} data-visto={visto} className="mx-auto max-w-[1440px] px-5 pb-24 pt-28 md:px-8 md:pt-32">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 className="t-titulo text-[44px] md:text-[64px]">
              Ponlos frente a frente. <span className="text-white/40">Sin letra menuda.</span>
            </h2>
            <p className="mt-6 max-w-[40ch] text-[15px] leading-relaxed text-white/60">
              Guarda los que te gusten y compáralos dato por dato. Cuando un dato no aplica o nos falta, te lo decimos.
            </p>
            <Link href="/compare" className="cta-corte mt-10">
              Comparar ahora <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="lg:col-span-8">
            <div className="relative grid grid-cols-2 items-end gap-4">
              <div>
                <CarRender car={a} className="aspect-[480/180] w-full" />
                <p className="mt-4 text-[17px] font-semibold tracking-[-0.03em] md:text-[20px]">{a.brand} {a.model}</p>
              </div>
              <div className="text-right">
                <CarRender car={b} className="aspect-[480/180] w-full -scale-x-100" />
                <p className="mt-4 text-[17px] font-semibold tracking-[-0.03em] md:text-[20px]">{b.brand} {b.model}</p>
              </div>
              <span className="cifra absolute left-1/2 top-[34%] flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-white/20 bg-showroom text-[13px] text-white/70">
                vs
              </span>
            </div>

            <div className="mt-10 space-y-5">
              {filas.map((f, i) => {
                const max = Math.max(f.va, f.vb);
                const gana = f.menor ? (f.va <= f.vb ? 'a' : 'b') : f.va >= f.vb ? 'a' : 'b';
                return (
                  <div key={f.etiqueta} className="grid grid-cols-[1fr_64px_1fr] items-center gap-2 md:grid-cols-[1fr_120px_1fr] md:gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`cifra w-20 shrink-0 text-[14px] md:w-24 md:text-[15px] ${gana === 'a' ? 'text-white' : 'text-[#a39fab]'}`}>{f.ta}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="barra-izq h-full w-full rounded-full"
                          style={{
                            '--v': f.va / max,
                            background: gana === 'a' ? '#a855f7' : 'rgba(255,255,255,0.4)',
                            transitionDelay: `${i * 120}ms`,
                          } as React.CSSProperties}
                        />
                      </div>
                    </div>
                    <span className="text-center text-[13px] text-white/55">{f.etiqueta}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="barra-der h-full w-full rounded-full"
                          style={{
                            '--v': f.vb / max,
                            background: gana === 'b' ? '#a855f7' : 'rgba(255,255,255,0.4)',
                            transitionDelay: `${i * 120}ms`,
                          } as React.CSSProperties}
                        />
                      </div>
                      <span className={`cifra w-20 shrink-0 text-right text-[14px] md:w-24 md:text-[15px] ${gana === 'b' ? 'text-white' : 'text-[#a39fab]'}`}>{f.tb}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

