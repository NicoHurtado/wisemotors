'use client';

// ============================================================================
// Duelo: la comparación jugada por rondas.
//
// Pensado para quien no sabe de carros: cada ronda es una pregunta de la vida
// real, el dato se traduce a algo tangible (maletas, cm del piso, caballos) y
// el marcador dice quién va ganando. Se puede jugar ronda a ronda o ver todo.
// La lógica vive en lib/comparison/duel.ts; aquí solo se pinta.
// ============================================================================

import { useMemo, useState } from 'react';
import { Crown, Flag, Play, FastForward, RotateCcw, Trophy } from 'lucide-react';
import { runDuel, type DuelVehicle } from '@/lib/comparison/duel';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Button } from '@/components/ui/button';

/** El morado de marca es el jugador 1; el resto son acentos que no compiten con él. */
const COLORES = ['#881cb7', '#0ea5e9', '#f59e0b', '#10b981', '#f43f5e'];

export function CompareDuel({ vehicles }: { vehicles: DuelVehicle[] }) {
  const { rounds, score } = useMemo(() => runDuel(vehicles), [vehicles]);
  const [reveladas, setReveladas] = useState(0);

  const jugables = rounds.filter(r => r.comparable).length;
  const color = (id: string) => COLORES[vehicles.findIndex(v => v.id === id) % COLORES.length];
  const nombre = (id: string) => {
    const v = vehicles.find(x => x.id === id);
    return v ? `${v.brand} ${v.model}` : '';
  };

  // El marcador solo cuenta lo que ya se jugó: así se siente como partido.
  const marcador = useMemo(() => {
    const m: Record<string, number> = Object.fromEntries(vehicles.map(v => [v.id, 0]));
    rounds.slice(0, reveladas).forEach(r => r.entries.forEach(e => e.winner && (m[e.vehicleId] += 1)));
    return m;
  }, [rounds, reveladas, vehicles]);

  const terminado = reveladas >= rounds.length;
  const maxPuntos = Math.max(0, ...Object.values(score));
  const campeones = vehicles.filter(v => score[v.id] === maxPuntos && maxPuntos > 0);

  return (
    <div className="space-y-5">
      {/* Marcador */}
      <div className="glass rounded-3xl p-4 md:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <Flag className="h-3.5 w-3.5" strokeWidth={2.25} />
            Marcador · ronda {Math.min(reveladas, rounds.length)}/{rounds.length}
          </p>
          {reveladas > 0 && (
            <button
              onClick={() => setReveladas(0)}
              className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reiniciar
            </button>
          )}
        </div>
        <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(vehicles.length, 5)}, minmax(0, 1fr))` }}>
          {vehicles.map(v => (
            <div key={v.id} className="min-w-0 rounded-2xl border border-foreground/[0.06] bg-white/70 px-3 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color(v.id) }} />
                <p className="truncate text-[13px] font-semibold text-foreground">{v.model}</p>
              </div>
              <p className="mt-0.5 font-mono text-[26px] font-bold leading-none tabular-nums" style={{ color: color(v.id) }}>
                <AnimatedNumber value={marcador[v.id]} durationMs={500} />
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Arranque del juego */}
      {reveladas === 0 && (
        <div className="glass card-enter rounded-3xl p-8 text-center">
          <Trophy className="mx-auto h-10 w-10 text-wise" strokeWidth={1.5} />
          <h3 className="mt-3 text-[24px] font-semibold tracking-[-0.02em] text-foreground">
            {vehicles.length === 2 ? `${nombre(vehicles[0].id)} vs ${nombre(vehicles[1].id)}` : `${vehicles.length} carros, un ganador`}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-muted-foreground">
            {rounds.length} rondas de preguntas que te harías tú en el concesionario.
            {jugables < rounds.length && ` En ${rounds.length - jugables} nos falta información y no reparten puntos.`}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="wise" className="rounded-full px-6" onClick={() => setReveladas(1)}>
              <Play className="mr-2 h-4 w-4" /> Empezar duelo
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => setReveladas(rounds.length)}>
              <FastForward className="mr-2 h-4 w-4" /> Ver todo de una
            </Button>
          </div>
        </div>
      )}

      {/* Rondas */}
      {rounds.slice(0, reveladas).map((r, i) => (
        <section
          key={r.id}
          className={`card-enter rounded-3xl p-5 md:p-6 ${r.comparable ? 'glass' : 'border border-dashed border-foreground/15 bg-white/40'}`}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-wise">
                Ronda {i + 1} · {r.titulo}
              </p>
              <h3 className="mt-1 text-[19px] font-semibold tracking-[-0.02em] text-foreground">{r.pregunta}</h3>
            </div>
            {!r.comparable && (
              <span className="rounded-full bg-foreground/[0.06] px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                No comparable
              </span>
            )}
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">{r.porQue}</p>

          <div className="mt-4 space-y-3">
            {r.entries.map((e, j) => (
              <div key={e.vehicleId}>
                <div className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="flex min-w-0 items-center gap-1.5 font-medium text-foreground">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color(e.vehicleId) }} />
                    <span className="truncate">{nombre(e.vehicleId)}</span>
                    {e.winner && (
                      <span className="duel-corona flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                        <Crown className="h-3 w-3" strokeWidth={2.5} /> +1
                      </span>
                    )}
                  </span>
                  <span className={`shrink-0 text-right ${e.value === null ? 'italic text-muted-foreground' : 'font-semibold text-foreground'}`}>
                    {e.display ?? 'Sin dato todavía'}
                  </span>
                </div>
                {e.value !== null && (
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                    {/* Solo transform: la barra crece con scaleX desde la izquierda */}
                    <div
                      className="duel-barra h-full w-full rounded-full"
                      style={
                        {
                          '--barra': e.bar,
                          animationDelay: `${120 + j * 90}ms`,
                          background: color(e.vehicleId),
                          opacity: e.winner || !r.comparable ? 1 : 0.55,
                        } as React.CSSProperties
                      }
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {r.motivoNoComparable && <p className="mt-3 text-[12px] text-muted-foreground">{r.motivoNoComparable}</p>}
        </section>
      ))}

      {/* Siguiente ronda */}
      {reveladas > 0 && !terminado && (
        <div className="flex justify-center gap-3">
          <Button variant="wise" className="rounded-full px-6" onClick={() => setReveladas(n => n + 1)}>
            Siguiente ronda
          </Button>
          <Button variant="ghost" className="rounded-full" onClick={() => setReveladas(rounds.length)}>
            Ver el resto
          </Button>
        </div>
      )}

      {/* Final */}
      {terminado && reveladas > 0 && (
        <div className="glass card-enter rounded-3xl p-7 text-center">
          <Trophy className="mx-auto h-10 w-10 text-amber-500" strokeWidth={1.5} />
          <h3 className="mt-3 text-[22px] font-semibold tracking-[-0.02em] text-foreground">
            {campeones.length === 0
              ? 'Sin ganador: faltan datos para jugar'
              : campeones.length === 1
                ? `Gana ${nombre(campeones[0].id)} con ${maxPuntos} de ${jugables} rondas`
                : `Empate entre ${campeones.map(c => c.model).join(' y ')}`}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-[14px] text-muted-foreground">
            Ganar más rondas no lo hace el mejor para ti. Si lo tuyo es la plata, mira quién ganó
            Bolsillo; si viajas con familia, Baúl y Escudo pesan más.
          </p>
        </div>
      )}
    </div>
  );
}
