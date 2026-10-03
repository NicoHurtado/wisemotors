'use client';

// ============================================================================
// Piezas del "perfil tipo Google Maps" de un concesionario, compartidas por
// la ficha del carro, la lista de concesionarios y su página propia.
// ============================================================================

import Link from 'next/link';
import { ArrowUpRight, Clock, Loader2, LocateFixed, MapPin, Navigation, Phone } from 'lucide-react';
import { kmEntre, textoDistancia, type Coordenadas } from '@/lib/distancia';
import { urlComoLlegar, urlEnGoogleMaps, urlMapaIncrustado } from '@/lib/mapas';

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

export function MapaConcesionario({ c, className = 'h-[280px]' }: { c: Concesionario; className?: string }) {
  const src = urlMapaIncrustado(c);
  if (!src) return null;
  return (
    <iframe
      title={`Mapa de ${c.name}`}
      src={src}
      className={`w-full rounded-[22px] border-0 bg-tarjeta ${className}`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  );
}

/** Datos + acciones: dirección, horario, distancia, "Cómo llegar", llamar, perfil en Google Maps. */
export function DatosConcesionario({ c, yo }: { c: Concesionario; yo: Coordenadas | null }) {
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
      <div className="flex flex-wrap gap-2 pt-1">
        {(tieneUbicacion(c) || c.address) && (
          <a href={urlComoLlegar(c)} target="_blank" rel="noopener noreferrer" className="pastilla h-10 px-4 text-[13px]">
            <Navigation className="h-4 w-4" /> Cómo llegar
          </a>
        )}
        {c.phone && (
          <a href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} className="pastilla h-10 px-4 text-[13px]">
            <Phone className="h-4 w-4" /> Llamar
          </a>
        )}
        <a href={urlEnGoogleMaps(c)} target="_blank" rel="noopener noreferrer" className="pastilla h-10 px-4 text-[13px]">
          Reseñas en Google <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

/** Tarjeta para listas (ficha del carro, /concesionarios). */
export function TarjetaConcesionario({
  c,
  yo,
  elegido,
  onElegir,
  conMapa = false,
  carros,
}: {
  c: Concesionario;
  yo: Coordenadas | null;
  elegido?: boolean;
  onElegir?: () => void;
  conMapa?: boolean;
  carros?: number;
}) {
  return (
    <div
      className={`rounded-[26px] border bg-blanco p-5 transition-colors ${elegido ? 'border-wise shadow-[0_0_0_3px_rgba(136,28,183,0.15)]' : 'border-linea'}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[17px] font-semibold tracking-[-0.02em]">{c.name}</p>
          {typeof carros === 'number' && (
            <p className="text-[13px] text-tinta-2">
              {carros} {carros === 1 ? 'carro' : 'carros'} en WiseMotors
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {onElegir && (
            <button type="button" onClick={onElegir} aria-pressed={elegido} className="pastilla h-9 px-3 text-[13px]" data-activa={elegido}>
              {elegido ? 'Elegido' : 'Elegir'}
            </button>
          )}
          <Link href={`/concesionarios/${c.id}`} className="pastilla h-9 px-3 text-[13px]">
            Ver concesionario <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
      {conMapa && tieneUbicacion(c) && <MapaConcesionario c={c} className="mt-4 h-[200px]" />}
      <div className="mt-4">
        <DatosConcesionario c={c} yo={yo} />
      </div>
    </div>
  );
}
