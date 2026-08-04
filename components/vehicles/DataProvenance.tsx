'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, ShieldCheck, CircleAlert } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';

// ============================================================================
// Procedencia de los datos de una ficha.
//
// Si el precio es una estimación o un dato viene de un foro, el comprador
// tiene derecho a saberlo ANTES de escribirle al concesionario. Esto no es
// un detalle de transparencia: es lo que evita que alguien vaya a un
// concesionario con un precio que nos inventamos nosotros.
// ============================================================================

interface Fuente {
  url: string;
  tier: number;
  cantidad: number;
}

interface Procedencia {
  total: number;
  verificados: number;
  sinFuente: number;
  confianzaMedia: number | null;
  ultimaActualizacion: string | null;
  coberturaGlobal: number | null;
  coberturaPorDimension: Record<string, number> | null;
  fuentes: Fuente[];
}

interface Props {
  vehicleId: string;
  /** Viene de specifications.commercial */
  precioEstimado?: boolean;
  razonamientoPrecio?: string;
  coberturaGlobal?: number | null;
}

const ETIQUETA_TIER: Record<number, { texto: string; clase: string }> = {
  1: { texto: 'Fabricante', clase: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15' },
  2: { texto: 'Prensa especializada', clase: 'bg-sky-50 text-sky-700 ring-sky-600/15' },
  3: { texto: 'Comunidad, sin verificar', clase: 'bg-amber-50 text-amber-800 ring-amber-600/20' },
};

function dominio(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function fecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function DataProvenance({
  vehicleId,
  precioEstimado,
  razonamientoPrecio,
  coberturaGlobal,
}: Props) {
  const [datos, setDatos] = useState<Procedencia | null>(null);

  useEffect(() => {
    let vivo = true;
    fetch(`/api/vehicles/${vehicleId}/provenance`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (vivo && d) setDatos(d);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [vehicleId]);

  // Sin atributos registrados y sin aviso de precio no hay nada honesto que mostrar
  if (!datos && !precioEstimado) return null;
  if (datos && datos.total === 0 && !precioEstimado) return null;

  const fuentes = datos?.fuentes ?? [];
  const total = datos?.total ?? 0;
  const verificados = datos?.verificados ?? 0;
  const cobertura =
    datos?.coberturaGlobal != null
      ? Math.round(datos.coberturaGlobal * 100)
      : coberturaGlobal != null
        ? Math.round(coberturaGlobal * 100)
        : null;

  return (
    <Reveal className="glass rounded-3xl p-6 md:p-8">
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-wise/10">
          <ShieldCheck className="h-5 w-5 text-wise" strokeWidth={1.75} />
        </div>
        <div>
          <h3 className="text-[20px] font-semibold tracking-tight text-gray-900">
            De dónde salen estos datos
          </h3>
          <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
            {total > 0
              ? `${total} datos registrados con su fuente. ${verificados} revisados por una persona.`
              : 'Ficha cargada manualmente, sin registro de fuentes por dato.'}
            {cobertura != null && ` Cobertura de ficha: ${cobertura}%.`}
          </p>
        </div>
      </div>

      {/* Aviso de precio estimado: lo más importante de todo este panel */}
      {precioEstimado && (
        <div className="mb-5 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-600/15">
          <p className="flex items-center gap-2 text-[14px] font-semibold text-amber-900">
            <CircleAlert className="h-4 w-4 shrink-0" strokeWidth={2} />
            Este precio es una estimación, no una cotización
          </p>
          {razonamientoPrecio && (
            <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-amber-900/80">
              {razonamientoPrecio}
            </p>
          )}
          <p className="mt-2 text-[13px] text-amber-900/70">
            Confírmalo con el concesionario antes de tomar cualquier decisión.
          </p>
        </div>
      )}

      {/* Métricas de la ficha: sin adornos, tres números que se pueden auditar */}
      {total > 0 && (
        <dl className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { k: 'Datos con fuente', v: `${total - (datos?.sinFuente ?? 0)}/${total}` },
            { k: 'Revisados a mano', v: `${verificados}` },
            {
              k: 'Confianza media',
              v: datos?.confianzaMedia != null ? `${Math.round(datos.confianzaMedia * 100)}%` : '—',
            },
            { k: 'Cobertura', v: cobertura != null ? `${cobertura}%` : '—' },
          ].map(m => (
            <div key={m.k} className="rounded-2xl bg-foreground/[0.03] px-3 py-2.5">
              <dt className="text-[10px] font-medium uppercase tracking-[0.07em] text-muted-foreground">
                {m.k}
              </dt>
              <dd className="mt-0.5 font-mono text-[17px] font-semibold tabular-nums text-foreground">
                {m.v}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {fuentes.length > 0 && (
        <ul className="space-y-2">
          {fuentes.map(f => {
            const etiqueta = ETIQUETA_TIER[f.tier] ?? ETIQUETA_TIER[3];
            return (
              <li
                key={f.url}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-foreground/[0.07] pt-2.5"
              >
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${etiqueta.clase}`}
                >
                  {etiqueta.texto}
                </span>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1 text-[14px] text-foreground/80 hover:text-wise"
                  style={{ transition: 'color var(--motion-instant) ease' }}
                >
                  {dominio(f.url)}
                  <ExternalLink className="h-3 w-3 opacity-40 group-hover:opacity-100" strokeWidth={2} />
                </a>
                <span className="ml-auto font-mono text-[12px] tabular-nums text-muted-foreground">
                  {f.cantidad} {f.cantidad === 1 ? 'dato' : 'datos'}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {datos?.ultimaActualizacion && (
        <p className="mt-4 text-[12px] text-muted-foreground">
          Última extracción: {fecha(datos.ultimaActualizacion)}.
        </p>
      )}
    </Reveal>
  );
}
