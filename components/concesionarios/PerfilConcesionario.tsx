'use client';

// ============================================================================
// Página de un concesionario, como su perfil de Google Maps pero dentro de
// WiseMotors: mapa (que no se puede tocar, para no irse a Google), dirección,
// horario, a cuántos km estás y UN llamado claro: escribirles por WhatsApp,
// que queda como lead. "Cómo llegar" aparece solo después de escribirles.
// ============================================================================

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Check, MessageCircle } from 'lucide-react';
import { TarjetaCarro, type VehiculoTarjeta } from '@/components/car/TarjetaCarro';
import { useMiUbicacion } from '@/hooks/useMiUbicacion';
import { BotonCercania, DatosConcesionario, MapaConcesionario, tieneUbicacion, type Concesionario } from './piezas';
import { useContactar } from './Contacto';

export function PerfilConcesionario({ c, carros }: { c: Concesionario; carros: VehiculoTarjeta[] }) {
  const { yo, estado, pedir } = useMiUbicacion();
  const contactar = useContactar('perfil');
  const [nombre, setNombre] = useState('');
  const [escrito, setEscrito] = useState(false);

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
              <DatosConcesionario c={c} yo={yo} comoLlegar={escrito} />
              <form
                className="flex flex-col gap-2 sm:flex-row"
                onSubmit={e => {
                  e.preventDefault();
                  contactar('info', nombre, null, c);
                  setEscrito(true);
                }}
              >
                <label htmlFor="nombre-perfil" className="sr-only">
                  Tu nombre
                </label>
                <input
                  id="nombre-perfil"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="¿Cómo te llamas?"
                  className="h-14 min-w-0 flex-1 rounded-full border border-linea bg-blanco px-5 text-[15px] outline-none focus:border-tinta"
                />
                <button type="submit" className="pastilla pastilla--verde h-14 justify-center px-8 text-[17px] font-semibold">
                  {escrito ? <Check className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />} {escrito ? 'Escribirles otra vez' : 'Escribirles por WhatsApp'}
                </button>
              </form>
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
