'use client';

// ============================================================================
// Arena del duelo.
//
// 1. Presentación de los luchadores (pantalla "VS").
// 2. Rondas en un mosaico de tamaños distintos: cada una se juega sola cuando
//    entra en pantalla, con su propia gráfica (duel/viz.tsx), y suma al
//    marcador flotante.
// 3. Pantalla de campeón con confeti.
//
// La lógica (quién gana qué, qué no es comparable) vive en
// lib/comparison/duel.ts; aquí solo se pone en escena.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  ArrowUpFromLine,
  BatteryCharging,
  ChevronsRight,
  Circle,
  Crown,
  Dumbbell,
  Fuel,
  Lock,
  Luggage,
  RotateCcw,
  ShieldCheck,
  Swords,
  Timer,
  Trophy,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { runDuel, type DuelRound, type DuelVehicle } from '@/lib/comparison/duel';
import { serie } from '@/lib/palette';
import { formatPrice } from '@/lib/utils';
import { CarroLateral, VIZ, duracionCarrera } from './viz';
import { useEnVista } from './useEnVista';

type Var = CSSProperties & Record<`--${string}`, string | number>;

const ICONOS: Record<string, LucideIcon> = {
  arranque: Timer,
  musculo: Dumbbell,
  bolsillo: Wallet,
  rinde: Fuel,
  autonomia: BatteryCharging,
  baul: Luggage,
  escudo: ShieldCheck,
  airbags: Circle,
  hueco: ArrowUpFromLine,
};

/** Tamaño de cada ronda en el mosaico: nada de todas iguales. */
const TAMANO: Record<string, string> = {
  arranque: 'md:col-span-12',
  musculo: 'md:col-span-5 md:row-span-2',
  bolsillo: 'md:col-span-7',
  rinde: 'md:col-span-7',
  autonomia: 'md:col-span-7',
  baul: 'md:col-span-7',
  escudo: 'md:col-span-5',
  airbags: 'md:col-span-5',
  hueco: 'md:col-span-7',
};

// ── Ficha de ronda ──────────────────────────────────────────────────────────
function Ronda({
  ronda,
  numero,
  nombre,
  color,
  onJugada,
  listo,
}: {
  ronda: DuelRound;
  numero: number;
  nombre: (id: string) => string;
  color: (id: string) => string;
  onJugada: (id: string) => void;
  listo: boolean;
}) {
  const [ref, visto] = useEnVista<HTMLElement>(0.3, listo);
  const Icono = ICONOS[ronda.id] ?? Swords;
  const Viz = VIZ[ronda.id];
  const ganadores = ronda.entries.filter(e => e.winner);

  // El punto se suma cuando la gráfica termina de contar la historia; en la
  // carrera, cuando el ganador cruza la meta.
  const retraso =
    ronda.id === 'arranque'
      ? Math.min(...ganadores.map(g => duracionCarrera(g.value ?? 0))) + 0.4
      : 1.2;

  useEffect(() => {
    if (!visto || !ronda.comparable) return;
    const t = setTimeout(() => onJugada(ronda.id), retraso * 1000 + 200);
    return () => clearTimeout(t);
  }, [visto, ronda, onJugada, retraso]);

  if (!ronda.comparable) {
    return (
      <section ref={ref} data-on={visto} className="duel-tile duel-tile--bloqueada md:col-span-5">
        <div className="flex items-center gap-2 text-white/40">
          <Lock className="h-4 w-4" />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em]">Ronda bloqueada · {ronda.titulo}</span>
        </div>
        <p className="mt-2 text-[15px] font-semibold text-white/70">{ronda.pregunta}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-white/40">{ronda.motivoNoComparable}</p>
      </section>
    );
  }

  return (
    <section ref={ref} data-on={visto} className={`duel-tile flex flex-col ${TAMANO[ronda.id] ?? 'md:col-span-6'}`}>
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-fuchsia-300/80">
            <Icono className="h-3.5 w-3.5" strokeWidth={2.25} />
            Ronda {numero} · {ronda.titulo}
          </p>
          <h3 className="mt-1.5 text-[20px] font-semibold leading-tight tracking-[-0.02em] text-white md:text-[22px]">
            {ronda.pregunta}
          </h3>
          <p className="mt-1 text-[13px] text-white/50">{ronda.porQue}</p>
        </div>
        <span className="duel-numero font-mono text-[44px] font-bold leading-none text-white/[0.06]" aria-hidden>
          {String(numero).padStart(2, '0')}
        </span>
      </header>

      <div className="mt-5 flex-1">{Viz ? <Viz ronda={ronda} nombre={nombre} color={color} /> : null}</div>

      {ganadores.length > 0 && (
        <div
          data-anim
          className="duel-banner mt-5 inline-flex self-start items-center gap-2 rounded-full py-1.5 pl-2 pr-3.5 text-[13px] font-semibold text-white"
          style={
            {
              '--delay': `${retraso}s`,
              background: `linear-gradient(90deg, ${color(ganadores[0].vehicleId)}, ${color(ganadores[0].vehicleId)}55)`,
            } as Var
          }
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
            <Crown className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          {ganadores.length === 1 ? `+1 ${nombre(ganadores[0].vehicleId)}` : `Empate: +1 para ${ganadores.length}`}
        </div>
      )}
    </section>
  );
}

// ── Presentación ────────────────────────────────────────────────────────────
function Luchador({
  v,
  color,
  lado,
  poderes,
}: {
  v: DuelVehicle;
  color: string;
  lado: 'izq' | 'der' | 'centro';
  poderes: { etiqueta: string; valor: number | null }[];
}) {
  return (
    <div className={`duel-luchador duel-luchador--${lado}`} style={{ '--c': color } as Var}>
      <div className="relative z-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">{v.brand}</p>
        <h3 className="mt-1 text-[30px] font-bold leading-[0.95] tracking-[-0.035em] text-white md:text-[38px]">{v.model}</h3>
        <p className="mt-2 text-[12px] text-white/60">
          {v.year} · {v.fuelType}
        </p>
        <CarroLateral color="#fff" className="duel-flota mt-5 h-12 w-[124px] opacity-90" />
        <p className="mt-4 font-mono text-[18px] font-bold tabular-nums text-white">{formatPrice(v.price)}</p>
        <div className="mt-4 space-y-1.5">
          {poderes.map(p => (
            <div key={p.etiqueta} className="flex items-center gap-2">
              <span className="w-14 text-[10px] uppercase tracking-[0.12em] text-white/55">{p.etiqueta}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
                {p.valor !== null && (
                  <div className="duel-poder h-full w-full rounded-full bg-white" style={{ '--sx': p.valor } as Var} />
                )}
              </div>
              {p.valor === null && <span className="text-[10px] text-white/40">?</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Marcador flotante ───────────────────────────────────────────────────────
function Marcador({
  vehicles,
  puntos,
  jugadas,
  total,
  color,
  onSaltar,
}: {
  vehicles: DuelVehicle[];
  puntos: Record<string, number>;
  jugadas: number;
  total: number;
  color: (id: string) => string;
  onSaltar: () => void;
}) {
  const suma = vehicles.reduce((s, v) => s + puntos[v.id], 0);
  return (
    <div className="duel-hud fixed inset-x-3 bottom-[92px] z-30 mx-auto max-w-xl md:bottom-6">
      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-[#140a1c]/85 px-3 py-2 shadow-[0_20px_50px_-20px_rgba(136,28,183,0.8)] backdrop-blur-xl">
        <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-white/45 sm:inline">
          {jugadas}/{total}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex justify-between gap-2 text-[11px] font-semibold text-white">
            {vehicles.map(v => (
              <span key={v.id} className="flex min-w-0 items-center gap-1">
                <span className="truncate">{v.model}</span>
                <span key={puntos[v.id]} className="duel-punto font-mono text-[14px]" style={{ color: color(v.id) }}>
                  {puntos[v.id]}
                </span>
              </span>
            ))}
          </div>
          {/* Barra de dominio: cada carro ocupa lo que ha ganado */}
          <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-white/10">
            {vehicles.map(v => (
              <div
                key={v.id}
                className="h-full transition-[flex-grow] duration-700"
                style={{ flexGrow: suma === 0 ? 1 : puntos[v.id] + 0.001, background: color(v.id) }}
              />
            ))}
          </div>
        </div>
        <button
          onClick={onSaltar}
          className="flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-white/20"
        >
          Final <ChevronsRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Final ───────────────────────────────────────────────────────────────────
const CONFETI = Array.from({ length: 36 }, (_, i) => ({
  x: (i * 37) % 100,
  delay: (i % 9) * 0.12,
  dur: 1.8 + ((i * 7) % 10) / 10,
  giro: (i * 53) % 360,
  color: serie(i),
}));

function Final({
  vehicles,
  rounds,
  score,
  color,
  nombre,
  onVisto,
  onRevancha,
  refFinal,
  listo,
}: {
  vehicles: DuelVehicle[];
  rounds: DuelRound[];
  score: Record<string, number>;
  color: (id: string) => string;
  nombre: (id: string) => string;
  onVisto: () => void;
  onRevancha: () => void;
  refFinal: React.MutableRefObject<HTMLElement | null>;
  listo: boolean;
}) {
  const [ref, visto] = useEnVista<HTMLElement>(0.4, listo);
  useEffect(() => {
    if (visto) onVisto();
  }, [visto, onVisto]);

  const max = Math.max(0, ...Object.values(score));
  const campeones = vehicles.filter(v => score[v.id] === max && max > 0);
  const jugables = rounds.filter(r => r.comparable);
  const campeon = campeones.length === 1 ? campeones[0] : null;

  return (
    <section
      ref={el => {
        (ref as React.MutableRefObject<HTMLElement | null>).current = el;
        refFinal.current = el;
      }}
      data-on={visto}
      className="duel-tile duel-final relative overflow-hidden md:col-span-12"
      style={{ '--c': campeon ? color(campeon.id) : '#881cb7' } as Var}
    >
      {/* Rayos y confeti */}
      <div data-anim className="duel-rayos pointer-events-none absolute left-1/2 top-24 h-[640px] w-[640px]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {CONFETI.map((c, i) => (
          <span
            key={i}
            data-anim
            className="duel-confeti absolute top-0 h-3 w-1.5 rounded-sm"
            style={{ left: `${c.x}%`, background: c.color, '--delay': `${c.delay}s`, '--dur': `${c.dur}s`, '--giro': `${c.giro}deg` } as Var}
          />
        ))}
      </div>

      <div className="relative text-center">
        <div data-anim className="duel-trofeo mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/20">
          <Trophy className="h-10 w-10 text-fuchsia-200" strokeWidth={1.5} />
        </div>
        <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-fuchsia-200/70">
          {campeon ? 'Campeón del duelo' : campeones.length > 1 ? 'Empate' : 'Sin ganador'}
        </p>
        <h3 data-anim className="duel-titulo-campeon mt-2 text-[40px] font-bold leading-[0.95] tracking-[-0.04em] md:text-[64px]">
          {campeon
            ? nombre(campeon.id)
            : campeones.length > 1
              ? campeones.map(c => c.model).join(' = ')
              : 'Faltan datos'}
        </h3>
        {campeon && (
          <p className="mt-3 text-[15px] text-white/70">
            Ganó {max} de {jugables.length} rondas
          </p>
        )}
      </div>

      {/* Medallero: qué ganó cada uno */}
      <div className="relative mx-auto mt-8 grid max-w-3xl gap-2">
        {[...vehicles]
          .sort((a, b) => score[b.id] - score[a.id])
          .map((v, pos) => (
            <div
              key={v.id}
              data-anim
              className="duel-medallero flex items-center gap-3 rounded-2xl bg-white/[0.05] px-4 py-3 ring-1 ring-white/10"
              style={{ '--delay': `${0.4 + pos * 0.12}s` } as Var}
            >
              <span className="w-5 font-mono text-[13px] font-bold text-white/50">{pos + 1}</span>
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: color(v.id) }} />
              <span className="min-w-0 flex-1 truncate text-left text-[14px] font-semibold text-white">{nombre(v.id)}</span>
              <span className="flex flex-wrap justify-end gap-1">
                {jugables
                  .filter(r => r.entries.some(e => e.winner && e.vehicleId === v.id))
                  .map(r => {
                    const I = ICONOS[r.id] ?? Swords;
                    return (
                      <span
                        key={r.id}
                        title={r.titulo}
                        className="flex h-7 w-7 items-center justify-center rounded-lg"
                        style={{ background: `${color(v.id)}40` }}
                      >
                        <I className="h-3.5 w-3.5 text-white" strokeWidth={2.25} />
                      </span>
                    );
                  })}
              </span>
              <span className="w-8 text-right font-mono text-[20px] font-bold tabular-nums" style={{ color: color(v.id) }}>
                {score[v.id]}
              </span>
            </div>
          ))}
      </div>

      <p className="relative mx-auto mt-6 max-w-lg text-center text-[13px] leading-relaxed text-white/55">
        Ganar más rondas no lo hace el mejor para ti. Si lo tuyo es la plata, mira quién ganó Bolsillo; si
        viajas con familia, Baúl y Escudo pesan más.
      </p>
      <div className="relative mt-6 flex justify-center">
        <button
          onClick={onRevancha}
          className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-[#2a0b3a] hover:bg-fuchsia-100"
        >
          <RotateCcw className="h-4 w-4" /> Revancha
        </button>
      </div>
    </section>
  );
}

// ── Arena ───────────────────────────────────────────────────────────────────
export function DuelArena({ vehicles }: { vehicles: DuelVehicle[] }) {
  const { rounds, score } = useMemo(() => runDuel(vehicles), [vehicles]);
  const [fase, setFase] = useState<'intro' | 'pelea'>('intro');
  const [jugadas, setJugadas] = useState<Set<string>>(new Set());
  const arenaRef = useRef<HTMLDivElement>(null);
  const finalRef = useRef<HTMLElement | null>(null);
  const [arenaVisible, setArenaVisible] = useState(false);
  // Las rondas empiezan a jugarse cuando termina el scroll hasta la arena:
  // si no, las que cruzan la pantalla en el camino suman puntos solas.
  const [listo, setListo] = useState(false);

  // El marcador flota solo mientras la arena está en pantalla: sobre el
  // footer o el encabezado sería ruido.
  useEffect(() => {
    const el = arenaRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setArenaVisible(e.isIntersecting), { rootMargin: '-35% 0px -35% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const color = useCallback((id: string) => serie(vehicles.findIndex(v => v.id === id)), [vehicles]);
  const nombre = useCallback(
    (id: string) => {
      const v = vehicles.find(x => x.id === id);
      return v ? `${v.brand} ${v.model}` : '';
    },
    [vehicles]
  );

  const jugables = rounds.filter(r => r.comparable);
  const onJugada = useCallback((id: string) => setJugadas(prev => (prev.has(id) ? prev : new Set(prev).add(id))), []);
  const onFinalVisto = useCallback(() => setJugadas(new Set(rounds.filter(r => r.comparable).map(r => r.id))), [rounds]);

  const puntos = useMemo(() => {
    const p: Record<string, number> = Object.fromEntries(vehicles.map(v => [v.id, 0]));
    rounds.forEach(r => jugadas.has(r.id) && r.entries.forEach(e => e.winner && (p[e.vehicleId] += 1)));
    return p;
  }, [rounds, jugadas, vehicles]);

  // Barras de "poder" de la presentación: el mismo dato de las rondas.
  const poderesDe = (id: string) =>
    [
      { etiqueta: 'Fuerza', ronda: 'musculo' },
      { etiqueta: 'Espacio', ronda: 'baul' },
      { etiqueta: 'Precio', ronda: 'bolsillo' },
    ].map(p => {
      const e = rounds.find(r => r.id === p.ronda)?.entries.find(x => x.vehicleId === id);
      return { etiqueta: p.etiqueta, valor: e && e.value !== null ? e.bar : null };
    });

  const empezar = () => {
    setJugadas(new Set());
    setListo(false);
    setFase('pelea');
    requestAnimationFrame(() => arenaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    setTimeout(() => setListo(true), 750);
  };

  const dos = vehicles.length === 2;

  return (
    <div ref={arenaRef} className="duel-arena scroll-mt-24">
      {fase === 'intro' ? (
        <div className="duel-intro relative overflow-hidden px-5 py-10 md:px-10 md:py-14">
          <p className="relative text-center font-mono text-[11px] uppercase tracking-[0.24em] text-fuchsia-200/70">
            {jugables.length} rondas · {rounds.length - jugables.length > 0 ? `${rounds.length - jugables.length} bloqueadas por falta de datos` : 'todas jugables'}
          </p>

          <div className={`relative mt-8 ${dos ? 'grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]' : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'}`}>
            {dos ? (
              <>
                <Luchador v={vehicles[0]} color={color(vehicles[0].id)} lado="izq" poderes={poderesDe(vehicles[0].id)} />
                <div className="duel-vs mx-auto">VS</div>
                <Luchador v={vehicles[1]} color={color(vehicles[1].id)} lado="der" poderes={poderesDe(vehicles[1].id)} />
              </>
            ) : (
              vehicles.map(v => (
                <Luchador key={v.id} v={v} color={color(v.id)} lado="centro" poderes={poderesDe(v.id)} />
              ))
            )}
          </div>

          {!dos && <div className="duel-vs duel-vs--todos mt-6 text-center">TODOS VS TODOS</div>}

          <div className="relative mt-10 flex justify-center">
            <button onClick={empezar} className="duel-boton-pelea">
              <Swords className="h-5 w-5" strokeWidth={2.25} />
              ¡A pelear!
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-flow-row-dense grid-cols-1 gap-4 p-4 md:grid-cols-12 md:p-6">
            {rounds.map((r, i) => (
              <Ronda key={r.id} ronda={r} numero={i + 1} nombre={nombre} color={color} onJugada={onJugada} listo={listo} />
            ))}
            <Final
              vehicles={vehicles}
              rounds={rounds}
              score={score}
              color={color}
              nombre={nombre}
              onVisto={onFinalVisto}
              onRevancha={() => {
                setFase('intro');
                requestAnimationFrame(() => arenaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
              }}
              refFinal={finalRef}
              listo={listo}
            />
          </div>
          {arenaVisible && <Marcador
            vehicles={vehicles}
            puntos={puntos}
            jugadas={jugadas.size}
            total={jugables.length}
            color={color}
            onSaltar={() => finalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          />}
        </>
      )}
    </div>
  );
}
