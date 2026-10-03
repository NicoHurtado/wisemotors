'use client';

// ============================================================================
// Página de un concesionario, como su perfil de Google Maps dentro de
// WiseMotors: mapa grande, dirección, horario, a cuántos km estás, "Cómo
// llegar", llamar, WhatsApp (verde) y los carros que vende.
// ============================================================================

import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { TarjetaCarro, type VehiculoTarjeta } from '@/components/car/TarjetaCarro';
import { useMiUbicacion } from '@/hooks/useMiUbicacion';
import { BotonCercania, DatosConcesionario, MapaConcesionario, tieneUbicacion, type Concesionario } from './piezas';

const WHATSAPP_WISE = '573103818615';

export function PerfilConcesionario({ c, carros }: { c: Concesionario; carros: VehiculoTarjeta[] }) {
  const { yo, estado, pedir } = useMiUbicacion();
  const mensaje = `Hola ${c.name}, los encontré en WiseMotors y quiero información sobre sus carros.`;
  const destino = c.whatsapp ?? WHATSAPP_WISE;

  return (
    <div className="pb-20">
      <section className="mx-auto max-w-[1440px] px-5 pt-8 md:px-8 md:pt-12">
        <Link href="/concesionarios" className="inline-flex items-center gap-2 text-[14px] text-tinta-2 hover:text-tinta">
          <ArrowLeft className="h-4 w-4" /> Concesionarios
        </Link>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-start">
          <div className="sube">
            <p className="text-[14px] text-tinta-2">{c.location}</p>
            <h1 className="t-titulo mt-2 text-[44px] md:text-[72px]">{c.name}</h1>
            <div className="mt-6 space-y-5">
              {tieneUbicacion(c) && <BotonCercania estado={estado} pedir={pedir} />}
              <DatosConcesionario c={c} yo={yo} />
              <a
                href={`https://wa.me/${destino}?text=${encodeURIComponent(mensaje)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pastilla pastilla--verde h-14 w-full justify-center px-8 text-[17px] font-semibold md:w-auto"
              >
                <MessageCircle className="h-5 w-5" /> Escribirles por WhatsApp
              </a>
            </div>
          </div>
          <div className="sube" style={{ '--d': '120ms' } as React.CSSProperties}>
            {tieneUbicacion(c) || c.address ? (
              <MapaConcesionario c={c} className="h-[360px] md:h-[480px]" />
            ) : (
              <div className="flex h-[360px] items-center justify-center rounded-[22px] bg-tarjeta text-tinta-2">Pronto verás aquí su ubicación.</div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[1440px] px-5 md:px-8">
        <h2 className="t-titulo text-[32px] md:text-[44px]">
          Lo que vende. <span className="text-tinta-2/50">{carros.length} {carros.length === 1 ? 'carro' : 'carros'} en WiseMotors.</span>
        </h2>
        {carros.length > 0 ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {carros.map((v, i) => (
              <TarjetaCarro key={v.id} vehiculo={v} indice={i} />
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl bg-blanco p-6 text-tinta-2">Todavía no hay carros de este concesionario en la página.</p>
        )}
      </section>
    </div>
  );
}
