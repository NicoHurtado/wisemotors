'use client';

// ============================================================================
// Una gráfica distinta por ronda del duelo.
//
// Cada una traduce el dato a algo que se entiende sin saber de carros: una
// carrera para el 0-100, maletas para el baúl, un reductor para la altura al
// piso, una carretera desde Medellín para la autonomía.
//
// Todas las animaciones son CSS con `animation-fill-mode: both` y quedan en
// pausa hasta que la ronda entra en pantalla (data-on en la ficha, ver
// globals.css). Con prefers-reduced-motion se ve directamente el estado final.
// ============================================================================

import type { CSSProperties } from 'react';
import { Luggage, Star } from 'lucide-react';
import type { DuelEntry, DuelRound } from '@/lib/comparison/duel';

export interface VizProps {
  ronda: DuelRound;
  nombre: (id: string) => string;
  color: (id: string) => string;
}

type Var = CSSProperties & Record<`--${string}`, string | number>;

const conDato = (r: DuelRound) => r.entries.filter(e => e.value !== null) as (DuelEntry & { value: number })[];

function SinDato({ e, nombre, texto }: { e: DuelEntry; nombre: (id: string) => string; texto?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-white/10 px-3 py-2 text-[12px] text-white/45">
      <span className="truncate">{nombre(e.vehicleId)}</span>
      <span className="shrink-0 italic">{texto ?? e.display ?? 'Sin dato todavía'}</span>
    </div>
  );
}

/** Silueta lateral simple: se lee como carro a cualquier tamaño. */
export function CarroLateral({ color, className = '' }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 64 26" className={`block ${className}`} aria-hidden>
      <path
        d="M4 19c0-3 1-5 4-6l8-2 7-6c2-1 4-2 7-2h10c3 0 5 1 7 3l5 5 6 1c3 1 4 3 4 6v1H4z"
        fill={color}
      />
      <path d="M24 6l-5 5h13V5h-4c-2 0-3 0-4 1zM35 5v6h13l-4-4c-1-1-3-2-5-2z" fill="rgba(255,255,255,0.55)" />
      <circle cx="16" cy="20" r="5" fill="#0b0410" />
      <circle cx="16" cy="20" r="2.2" fill="rgba(255,255,255,0.7)" />
      <circle cx="49" cy="20" r="5" fill="#0b0410" />
      <circle cx="49" cy="20" r="2.2" fill="rgba(255,255,255,0.7)" />
    </svg>
  );
}

// ── Arranque: carrera de 0 a 100 ────────────────────────────────────────────
/** 1 s real ≈ 0.22 s de animación: el más lento se nota, sin aburrir. */
export const duracionCarrera = (segundos: number) => Math.min(4, Math.max(1.2, segundos * 0.22));

export function Carrera({ ronda, nombre, color }: VizProps) {
  return (
    <div className="space-y-2.5">
      {ronda.entries.map(e => {
        if (e.value === null) return <SinDato key={e.vehicleId} e={e} nombre={nombre} />;
        const dur = duracionCarrera(e.value);
        return (
          <div key={e.vehicleId} className="relative h-14 overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/10">
            <div className="duel-pista-linea absolute inset-x-4 top-1/2 h-px" />
            <div className="duel-meta absolute inset-y-0 right-0 w-3" />
            <span className="absolute left-3 top-1.5 text-[11px] font-medium text-white/60">{nombre(e.vehicleId)}</span>
            <div
              data-anim
              className="duel-carro absolute inset-y-0 left-0 flex w-full items-end justify-end pb-1.5 pr-5"
              style={{ '--dur': `${dur}s` } as Var}
            >
              <CarroLateral color={color(e.vehicleId)} className="h-7 w-[68px] drop-shadow-[0_0_14px_rgba(255,255,255,0.25)]" />
            </div>
            <span
              data-anim
              className="duel-aparece absolute right-7 top-1.5 font-mono text-[12px] font-bold tabular-nums"
              style={{ '--delay': `${dur}s`, color: e.winner ? '#fff' : 'rgba(255,255,255,0.6)' } as Var}
            >
              {e.value.toFixed(1)} s
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Músculo: columnas de potencia ───────────────────────────────────────────
export function Columnas({ ronda, nombre, color }: VizProps) {
  return (
    <div className="flex h-full min-h-56 items-end justify-around gap-3 pt-6">
      {ronda.entries.map((e, i) => (
        <div key={e.vehicleId} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
          {e.value === null ? (
            <span className="mb-8 text-center text-[11px] italic text-white/40">Sin dato</span>
          ) : (
            <>
              <span
                data-anim
                className="duel-aparece font-mono text-[22px] font-bold leading-none tabular-nums text-white"
                style={{ '--delay': `${0.5 + i * 0.12}s` } as Var}
              >
                {Math.round(e.value)}
                <span className="ml-0.5 text-[11px] font-medium text-white/50">HP</span>
              </span>
              <div className="relative w-full max-w-[72px] flex-1">
                <div
                  data-anim
                  className="duel-columna absolute inset-x-0 bottom-0 rounded-t-2xl"
                  style={
                    {
                      height: `${e.bar * 100}%`,
                      '--delay': `${i * 0.12}s`,
                      background: `linear-gradient(180deg, ${color(e.vehicleId)}, ${color(e.vehicleId)}33)`,
                      boxShadow: e.winner ? `0 0 32px -4px ${color(e.vehicleId)}` : undefined,
                    } as Var
                  }
                >
                  <div className="absolute inset-x-2 top-1.5 h-1 rounded-full bg-white/60" />
                </div>
              </div>
            </>
          )}
          <span className="w-full truncate text-center text-[11px] text-white/60">{nombre(e.vehicleId)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Bolsillo: etiquetas de precio ───────────────────────────────────────────
export function Etiquetas({ ronda, nombre, color }: VizProps) {
  const datos = conDato(ronda);
  const barato = datos.reduce((a, b) => (b.value < a.value ? b : a), datos[0]);
  const caro = datos.reduce((a, b) => (b.value > a.value ? b : a), datos[0]);
  const ahorro = caro && barato ? caro.value - barato.value : 0;
  const maxP = caro?.value ?? 1;
  return (
    <div className="space-y-2.5">
      {ronda.entries.map((e, i) =>
        e.value === null ? (
          <SinDato key={e.vehicleId} e={e} nombre={nombre} />
        ) : (
          <div key={e.vehicleId} className="flex items-center gap-3">
            <div className="relative h-11 flex-1">
              <div
                data-anim
                className="duel-etiqueta absolute inset-y-0 left-0 flex items-center justify-between gap-2 pl-3 pr-5"
                style={
                  {
                    width: `${Math.max(38, (e.value / maxP) * 100)}%`,
                    '--delay': `${i * 0.1}s`,
                    background: e.winner ? color(e.vehicleId) : 'rgba(255,255,255,0.07)',
                    boxShadow: e.winner ? `0 10px 30px -12px ${color(e.vehicleId)}` : undefined,
                  } as Var
                }
              >
                <span className="truncate text-[12px] font-medium text-white/85">{nombre(e.vehicleId)}</span>
                <span className="shrink-0 font-mono text-[14px] font-bold tabular-nums text-white">{e.display}</span>
              </div>
            </div>
          </div>
        )
      )}
      {datos.length > 1 && ahorro > 0 && (
        <p data-anim className="duel-aparece pt-1 text-[13px] text-white/70" style={{ '--delay': '0.7s' } as Var}>
          Con el <span className="font-semibold text-white">{nombre(barato.vehicleId)}</span> te quedan{' '}
          <span className="font-semibold text-white">${Math.round(ahorro / 1_000_000)} millones</span> en el bolsillo frente al más caro.
        </p>
      )}
    </div>
  );
}

// ── Rinde: medidores de gasolina ────────────────────────────────────────────
export function Medidores({ ronda, nombre, color }: VizProps) {
  const datos = conDato(ronda);
  const tope = Math.max(...datos.map(d => d.value)) * 1.15;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {ronda.entries.map((e, i) => {
        if (e.value === null) return <SinDato key={e.vehicleId} e={e} nombre={nombre} texto={e.display ?? 'Sin dato'} />;
        const angulo = -90 + (e.value / tope) * 180;
        return (
          <div key={e.vehicleId} className="flex flex-col items-center">
            <svg viewBox="0 0 120 70" className="w-full max-w-[160px]">
              <path d="M10 62a50 50 0 0 1 100 0" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" strokeLinecap="round" />
              <path
                d="M10 62a50 50 0 0 1 100 0"
                fill="none"
                stroke={color(e.vehicleId)}
                strokeWidth="10"
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray="100"
                data-anim
                className="duel-arco"
                style={{ '--off': 100 - (e.value / tope) * 100, '--delay': `${i * 0.12}s` } as Var}
              />
              <g
                data-anim
                className="duel-aguja"
                style={{ '--ang': `${angulo}deg`, '--delay': `${i * 0.12}s`, transformOrigin: '60px 62px' } as Var}
              >
                <line x1="60" y1="62" x2="60" y2="20" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
              </g>
              <circle cx="60" cy="62" r="5" fill="#fff" />
            </svg>
            <p className="-mt-1 font-mono text-[18px] font-bold tabular-nums text-white">{Math.round(e.value)}</p>
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">km por galón</p>
            <p className="mt-1 max-w-full truncate text-[11px] text-white/65">{nombre(e.vehicleId)}</p>
          </div>
        );
      })}
    </div>
  );
}

// ── Autonomía: carretera desde Medellín ─────────────────────────────────────
// Distancias por carretera aproximadas: sirven de escala, no de ruta.
const DESTINOS = [
  { km: 80, nombre: 'Guatapé' },
  { km: 195, nombre: 'Manizales' },
  { km: 415, nombre: 'Bogotá' },
  { km: 640, nombre: 'Cartagena' },
];

export function Carretera({ ronda, nombre, color }: VizProps) {
  const datos = conDato(ronda);
  const escala = Math.max(450, ...datos.map(d => d.value)) * 1.08;
  return (
    <div>
      <div className="relative h-20">
        <div className="absolute inset-x-0 top-9 h-2 rounded-full bg-white/10" />
        <div className="duel-pista-linea absolute inset-x-0 top-[39px] h-px" />
        <span className="absolute left-0 top-0 text-[11px] font-semibold text-white">Medellín</span>
        {DESTINOS.filter(d => d.km < escala).map(d => (
          <div key={d.nombre} className="absolute top-5" style={{ left: `${(d.km / escala) * 100}%` }}>
            <div className="h-9 w-px -translate-x-1/2 bg-white/25" />
            <span className="absolute left-0 top-10 -translate-x-1/2 whitespace-nowrap text-[10px] text-white/50">
              {d.nombre} · {d.km}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {ronda.entries.map((e, i) => {
          if (e.value === null) return <SinDato key={e.vehicleId} e={e} nombre={nombre} />;
          const km = e.value;
          const alcanza = DESTINOS.filter(d => d.km <= km).pop();
          return (
            <div key={e.vehicleId}>
              <div className="relative h-3 rounded-full bg-white/[0.05]">
                <div
                  data-anim
                  className="duel-crece-x absolute inset-y-0 left-0 w-full rounded-full"
                  style={{ '--sx': e.value / escala, '--delay': `${i * 0.15}s`, background: color(e.vehicleId) } as Var}
                />
              </div>
              <p className="mt-1 text-[12px] text-white/70">
                <span className="font-semibold text-white">{nombre(e.vehicleId)}</span> · {Math.round(e.value)} km
                {alcanza ? ` — llega a ${alcanza.nombre} sin recargar` : ''}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Baúl: maletas que caen ──────────────────────────────────────────────────
export function Maletas({ ronda, nombre, color }: VizProps) {
  return (
    <div className="space-y-3">
      {ronda.entries.map((e, fila) => {
        if (e.value === null) return <SinDato key={e.vehicleId} e={e} nombre={nombre} />;
        const n = Math.min(18, Math.max(1, Math.round(e.value / 40)));
        return (
          <div key={e.vehicleId}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="truncate text-[12px] text-white/70">{nombre(e.vehicleId)}</span>
              <span className="shrink-0 font-mono text-[13px] font-bold tabular-nums text-white">{Math.round(e.value)} L</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: n }, (_, k) => (
                <span
                  key={k}
                  data-anim
                  className="duel-cae inline-flex h-7 w-6 items-center justify-center rounded-md"
                  style={{ '--delay': `${fila * 0.2 + k * 0.05}s`, background: `${color(e.vehicleId)}33` } as Var}
                >
                  <Luggage className="h-4 w-4" style={{ color: color(e.vehicleId) }} strokeWidth={2} />
                </span>
              ))}
            </div>
          </div>
        );
      })}
      <p className="text-[11px] text-white/40">Cada ícono ≈ una maleta de cabina (40 L).</p>
    </div>
  );
}

// ── Escudo: estrellas de pruebas de choque ──────────────────────────────────
export function Estrellas({ ronda, nombre }: VizProps) {
  return (
    <div className="space-y-3">
      {ronda.entries.map((e, fila) =>
        e.value === null ? (
          <SinDato key={e.vehicleId} e={e} nombre={nombre} />
        ) : (
          <div key={e.vehicleId}>
            <p className="mb-1 truncate text-[12px] text-white/70">{nombre(e.vehicleId)}</p>
            <div className="flex gap-1">
              {Array.from({ length: 5 }, (_, k) => {
                const llena = k < Math.round(e.value!);
                return (
                  <span
                    key={k}
                    data-anim
                    className={llena ? 'duel-estrella' : ''}
                    style={{ '--delay': `${fila * 0.25 + k * 0.1}s` } as Var}
                  >
                    <Star
                      className="h-6 w-6"
                      fill={llena ? '#f5c2ff' : 'transparent'}
                      stroke={llena ? '#f5c2ff' : 'rgba(255,255,255,0.2)'}
                      strokeWidth={1.5}
                    />
                  </span>
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );
}

// ── Airbags: burbujas que se inflan ─────────────────────────────────────────
export function Burbujas({ ronda, nombre, color }: VizProps) {
  return (
    <div className="space-y-3">
      {ronda.entries.map((e, fila) =>
        e.value === null ? (
          <SinDato key={e.vehicleId} e={e} nombre={nombre} />
        ) : (
          <div key={e.vehicleId}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="truncate text-[12px] text-white/70">{nombre(e.vehicleId)}</span>
              <span className="font-mono text-[13px] font-bold text-white">{Math.round(e.value)}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: Math.min(12, Math.round(e.value)) }, (_, k) => (
                <span
                  key={k}
                  data-anim
                  className="duel-infla h-5 w-5 rounded-full"
                  style={
                    {
                      '--delay': `${fila * 0.2 + k * 0.06}s`,
                      background: `radial-gradient(circle at 35% 30%, #fff8, ${color(e.vehicleId)})`,
                    } as Var
                  }
                />
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}

// ── Anti-huecos: altura sobre un reductor ───────────────────────────────────
export function Reductor({ ronda, nombre, color }: VizProps) {
  const datos = conDato(ronda);
  const max = Math.max(...datos.map(d => d.value), 1);
  const ALTO = 150; // px del escenario
  const piso = ALTO - 18;
  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/10" style={{ height: ALTO }}>
        {/* Piso y reductor (ilustrativo) */}
        <div className="absolute inset-x-0 bottom-0 h-[18px] bg-white/[0.06]" />
        <svg className="absolute bottom-[18px] left-1/2 h-6 w-28 -translate-x-1/2" viewBox="0 0 112 24" aria-hidden>
          <path d="M0 24C20 24 30 2 56 2s36 22 56 22z" fill="#e11d48" opacity="0.8" />
          <path d="M20 14h8M44 5h8M68 5h8M88 14h8" stroke="#fde68a" strokeWidth="3" />
        </svg>
        <div className="absolute inset-x-0 flex justify-around px-4" style={{ bottom: 18 }}>
          {ronda.entries.map((e, i) => {
            if (e.value === null) return <span key={e.vehicleId} className="mb-2 text-[11px] italic text-white/35">Sin dato</span>;
            const alto = (e.value / max) * (piso - 60);
            return (
              <div key={e.vehicleId} className="flex flex-col items-center">
                <div
                  data-anim
                  className="duel-sube flex flex-col items-center"
                  style={{ '--dy': `${alto}px`, '--delay': `${i * 0.12}s` } as Var}
                >
                  <span className="mb-0.5 font-mono text-[12px] font-bold text-white">{(e.value / 10).toFixed(1)} cm</span>
                  <CarroLateral color={color(e.vehicleId)} className="h-6 w-[58px]" />
                </div>
                {/* Poste de altura: crece en Y desde el piso */}
                <div
                  data-anim
                  className="duel-crece-y w-0.5 origin-bottom"
                  style={{ height: alto, '--delay': `${i * 0.12}s`, background: `${color(e.vehicleId)}aa` } as Var}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap justify-around gap-2">
        {ronda.entries.map(e => (
          <span key={e.vehicleId} className="text-[11px] text-white/60">
            <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: color(e.vehicleId) }} />
            {nombre(e.vehicleId)}
          </span>
        ))}
      </div>
    </div>
  );
}

export const VIZ: Record<string, (p: VizProps) => JSX.Element> = {
  arranque: Carrera,
  musculo: Columnas,
  bolsillo: Etiquetas,
  rinde: Medidores,
  autonomia: Carretera,
  baul: Maletas,
  escudo: Estrellas,
  airbags: Burbujas,
  hueco: Reductor,
};
