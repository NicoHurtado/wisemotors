'use client';

// ============================================================================
// Hero: showroom partido (referencia LaFerrari).
//
// Panel morado profundo a la izquierda, negro a la derecha. El nombre del
// modelo gigante en Anton, en dos tonos según el fondo que pisa, y el carro
// encima. Los destacados rotan como en una tornamesa: el carro sale, el nuevo
// entra desenfocado y se posa, la palabra sube letra por letra. Abajo: la
// búsqueda con IA sobre el panel y los datos del carro sobre el negro.
// ============================================================================

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { CarRender, fotoDe } from '@/components/car/CarRender';
import type { VehiculoTarjeta } from '@/components/car/TarjetaCarro';
import { BuscadorIA } from '@/components/home/BuscadorIA';
import { millones, palabraGigante, tresDatos } from '@/lib/vehiculo-datos';

const INTERVALO = 7000;

function Palabra({ texto, color }: { texto: string; color: string }) {
  return (
    <p className="t-display whitespace-nowrap text-[36vw] lg:text-[clamp(120px,23vw,420px)]" style={{ color }}>
      {Array.from(texto).map((l, i) => (
        <span key={i} className="letra-sube">
          <span style={{ '--i': i } as React.CSSProperties}>{l === ' ' ? ' ' : l}</span>
        </span>
      ))}
    </p>
  );
}

export function HeroShowroom({ vehiculos, consulta }: { vehiculos: VehiculoTarjeta[]; consulta: string }) {
  // Primero los que tienen foto real; luego el resto. Cinco como máximo.
  const destacados = useMemo(
    () => [...vehiculos].sort((a, b) => Number(!!fotoDe(b)) - Number(!!fotoDe(a))).slice(0, 5),
    [vehiculos]
  );
  const [i, setI] = useState(0);
  const [pausa, setPausa] = useState(false);
  const total = destacados.length;

  useEffect(() => {
    if (pausa || total < 2) return;
    const t = setTimeout(() => setI(x => (x + 1) % total), INTERVALO);
    return () => clearTimeout(t);
  }, [i, pausa, total]);

  const v = destacados[i];
  const palabra = v ? palabraGigante(v.model, v.brand) : 'WISE';
  const datos = v ? tresDatos(v) : [];

  return (
    <section
      className="hero-showroom relative isolate overflow-hidden bg-showroom text-white"
      onMouseEnter={() => setPausa(true)}
      onMouseLeave={() => setPausa(false)}
    >
      {/* Panel morado */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 hidden w-[36vw] lg:block"
        style={{ background: 'linear-gradient(170deg, #521672 0%, #3b0d55 55%, #2a0a3d 100%)' }}
      />
      {/* Luz de estudio sobre el negro */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(50% 45% at 68% 62%, rgba(136,28,183,0.22), transparent 70%), radial-gradient(30% 20% at 66% 86%, rgba(255,255,255,0.06), transparent 70%)',
        }}
      />

      {/* Palabra gigante en dos tonos: negra sobre el morado, morada sobre el negro */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[92px] lg:top-[16%]" key={palabra}>
        <div className="palabra-capa palabra-capa--panel absolute inset-x-0 top-0 pl-[4vw]">
          <Palabra texto={palabra} color="#0c0a0f" />
        </div>
        <div className="palabra-capa palabra-capa--negro absolute inset-x-0 top-0 pl-[4vw]">
          <Palabra texto={palabra} color="#5b1a82" />
        </div>
      </div>

      <div className="relative flex flex-col px-5 pt-[96px] md:px-8 lg:h-[100svh] lg:max-h-[1000px] lg:min-h-[780px]">
        {/* Escenario del carro */}
        <div className="relative h-[78vw] max-h-[560px] lg:h-auto lg:max-h-none lg:flex-1">
          {v && (
            <div key={v.id} className="carro-entra absolute bottom-0 right-0 h-[64%] w-full lg:bottom-[10%] lg:right-[2vw] lg:h-[74%] lg:w-[62vw] lg:max-w-[900px]">
              <CarRender car={v} prioridad className="h-full w-full" />
            </div>
          )}
        </div>

        {/* Fila inferior */}
        <div className="grid gap-8 pb-8 lg:grid-cols-[calc(36vw-64px)_1fr] lg:gap-16 lg:pb-12">
          <div className="-mx-5 bg-[linear-gradient(170deg,#521672,#2a0a3d)] px-5 py-8 md:-mx-8 md:px-8 lg:order-none lg:m-0 lg:bg-none lg:p-0">
            <h1 className="t-titulo text-[38px] md:text-[48px]">
              <span className="block">Dinos cómo vives.</span>
              <span className="block text-white/45">Te decimos qué carro.</span>
            </h1>
            <div className="mt-7">
              <BuscadorIA inicial={consulta} oscuro />
            </div>
          </div>

          {v && (
            <div className="order-first flex flex-col justify-end gap-6 lg:order-none">
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div className="min-w-0">
                  <p className="t-meta text-white/45">
                    {v.brand} · {v.year} · {v.fuelType}
                  </p>
                  <p className="mt-2 text-[26px] font-semibold tracking-[-0.03em] md:text-[30px]">{v.model}</p>
                </div>
                <div className="fila-datos fila-datos--oscura">
                  <div className="pr-3 md:pr-6">
                    <p className="text-[12px] text-white/45 md:text-[13px]">Desde</p>
                    <p className="cifra mt-1 whitespace-nowrap text-[17px] font-semibold md:text-[26px]">{millones(v.price)}</p>
                  </div>
                  {datos.map(d => (
                    <div key={d.clave} className="px-3 last:pr-0 md:px-6">
                      <p className="whitespace-nowrap text-[12px] text-white/45 md:text-[13px]">{d.etiqueta}</p>
                      <p className="cifra mt-1 whitespace-nowrap text-[17px] font-semibold md:text-[26px]">
                        {d.valor}
                        <span className="ml-1 text-[13px] font-normal text-white/50">{d.unidad}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setI(x => (x - 1 + total) % total)}
                    aria-label="Carro anterior"
                    className="flecha !border-white/15 !bg-white/5 !text-white hover:!bg-wise"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setI(x => (x + 1) % total)}
                    aria-label="Carro siguiente"
                    className="flecha !border-white/15 !bg-white/5 !text-white hover:!bg-wise"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <span className="cifra ml-2 text-[13px] text-white/60">
                    {String(i + 1).padStart(2, '0')} <span className="text-white/25">/ {String(total).padStart(2, '0')}</span>
                  </span>
                  <span className="relative ml-2 hidden h-px w-24 overflow-hidden bg-white/15 sm:block">
                    <span
                      key={`${i}-${pausa}`}
                      className="progreso-hero absolute inset-0 origin-left bg-wise-lila"
                      style={{ animationDuration: `${INTERVALO}ms`, animationPlayState: pausa ? 'paused' : 'running' }}
                    />
                  </span>
                </div>
                <Link href={`/vehicles/${v.id}`} className="cta-corte">
                  Ver ficha <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
