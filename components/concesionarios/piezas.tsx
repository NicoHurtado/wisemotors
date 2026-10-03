'use client';

// ============================================================================
// Piezas del "perfil tipo Google Maps" de un concesionario, compartidas por
// la ficha del carro, la lista de concesionarios y su página propia.
// ============================================================================

import Link from 'next/link';
import { ArrowUpRight, Clock, Loader2, LocateFixed, MapPin, Navigation } from 'lucide-react';
import { kmEntre, textoDistancia, type Coordenadas } from '@/lib/distancia';
import { urlComoLlegar, urlMapaIncrustado } from '@/lib/mapas';

export interface Concesionario {
  id: string;
  name: string;
  location: string;
  address?: string | null;
  horario?: string | null;
  lat?: number | null;
  lng?: number | null;
  mapsUrl?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
}

export const tieneUbicacion = (c: Concesionario) => typeof c.lat === 'number' && typeof c.lng === 'number';

export function kmA(c: Concesionario, yo: Coordenadas | null): number | null {
  return yo && tieneUbicacion(c) ? kmEntre(yo, { lat: c.lat!, lng: c.lng! }) : null;
}

/** "¿Qué tan cerca estás?": pide la ubicación solo al tocarlo. */
export function BotonCercania({ estado, pedir, claro = false }: { estado: string; pedir: () => void; claro?: boolean }) {
  if (estado === 'lista') return null;
  const texto =
    estado === 'pidiendo'
      ? 'Buscando dónde estás…'
      : estado === 'negada'
        ? 'Sin permiso de ubicación: actívalo en el navegador para ver distancias'
        : estado === 'no-disponible'
          ? 'No pudimos saber dónde estás'
          : '¿Qué tan cerca estás? Ver distancias';
  return (
    <button
      type="button"
      onClick={pedir}
      disabled={estado === 'pidiendo'}
      className={`pastilla h-11 px-4 text-[14px] ${claro ? 'pastilla--oscura' : ''}`}
      title="Tu ubicación se usa solo en tu navegador para calcular la distancia. No la guardamos."
    >
      {estado === 'pidiendo' ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />} {texto}
    </button>
  );
}

export function Distancia({ km, grande = false }: { km: number | null; grande?: boolean }) {
  if (km === null) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-wise/10 font-semibold text-wise ${grande ? 'px-4 py-2 text-[15px]' : 'px-3 py-1 text-[13px]'}`}>
      <Navigation className={grande ? 'h-4 w-4' : 'h-3.5 w-3.5'} /> a {textoDistancia(km)} de ti
      <span className="font-normal text-wise/70">en línea recta</span>
    </span>
  );
}

/**
 * El mapa como imagen: se ve dónde queda, pero no se puede tocar. Así ningún
 * clic manda a la persona a Google Maps (fotos, reseñas, otros lugares) y
 * perdemos el lead. El único camino es el botón verde.
 */
export function MapaConcesionario({ c, className = 'h-[280px]' }: { c: Concesionario; className?: string }) {
  const src = urlMapaIncrustado(c);
  if (!src) return null;
  return (
    <div className={`relative overflow-hidden rounded-[22px] bg-tarjeta ${className}`}>
      <iframe title={`Mapa de ${c.name}`} src={src} className="pointer-events-none h-full w-full border-0" loading="lazy" tabIndex={-1} aria-hidden referrerPolicy="no-referrer-when-downgrade" />
      <div className="absolute inset-0" aria-hidden />
    </div>
  );
}

/**
 * Dirección, horario y distancia. "Cómo llegar" (abre Google Maps) solo donde
 * la persona ya escribió o en la página del concesionario: antes del contacto
 * no hay links que la saquen de WiseMotors.
 */
export function DatosConcesionario({ c, yo, comoLlegar = false }: { c: Concesionario; yo: Coordenadas | null; comoLlegar?: boolean }) {
  return (
    <div className="space-y-3">
      <Distancia km={kmA(c, yo)} />
      {(c.address || c.location) && (
        <p className="flex items-start gap-2 text-[14px] text-tinta">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-tinta-2" />
          <span>
            {c.address}
            {c.address && c.location ? ' · ' : ''}
            {c.location}
          </span>
        </p>
      )}
      {c.horario && (
        <p className="flex items-start gap-2 text-[14px] text-tinta">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-tinta-2" /> {c.horario}
        </p>
      )}
      {comoLlegar && (tieneUbicacion(c) || c.address) && (
        <a href={urlComoLlegar(c)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] text-tinta-2 underline-offset-2 hover:text-tinta hover:underline">
          <Navigation className="h-3.5 w-3.5" /> Cómo llegar
        </a>
      )}
    </div>
  );
}

/** Tarjeta para listas (ficha del carro, /concesionarios). */
export function TarjetaConcesionario({
  c,
  yo,
  conMapa = false,
  carros,
  enlace = true,
  etiqueta,
}: {
  c: Concesionario;
  yo: Coordenadas | null;
  conMapa?: boolean;
  carros?: number;
  /** Link a su página dentro de WiseMotors (en la ficha no: distrae del contacto). */
  enlace?: boolean;
  etiqueta?: string;
}) {
  return (
    <div className="rounded-[26px] border border-linea bg-blanco p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {etiqueta && <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-tinta-2">{etiqueta}</p>}
          <p className="text-[17px] font-semibold tracking-[-0.02em]">{c.name}</p>
          {typeof carros === 'number' && (
            <p className="text-[13px] text-tinta-2">
              {carros} {carros === 1 ? 'carro' : 'carros'} en WiseMotors
            </p>
          )}
        </div>
        {enlace && (
          <Link href={`/concesionarios/${c.id}`} className="pastilla h-9 px-3 text-[13px]">
            Ver concesionario <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {conMapa && tieneUbicacion(c) && <MapaConcesionario c={c} className="mt-4 h-[200px]" />}
      <div className="mt-4">
        <DatosConcesionario c={c} yo={yo} />
      </div>
    </div>
  );
}
