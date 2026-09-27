'use client';

// ============================================================================
// El carro como protagonista.
//
// Si el vehículo tiene foto (recortada, fondo transparente) se usa la foto.
// Si no, un render de estudio en SVG según la carrocería: nunca un ícono ni un
// placeholder gris. Perfil lateral mirando a la derecha, pintura con degradado
// y reflejo de hombro, vidrio oscuro con destello, rines con aro morado (el
// acento de marca como luz, igual que los aros azules de la referencia
// Porsche) y sombra de piso.
// ============================================================================

import { useId } from 'react';

export interface CarLike {
  id?: string;
  brand?: string;
  model?: string;
  type?: string;
  imageUrl?: string | null;
  images?: { url: string; type?: string | null; isThumbnail?: boolean | null }[] | null;
}

type Carroceria = 'sedan' | 'hatch' | 'suv' | 'pickup';

export function carroceriaDe(type?: string): Carroceria {
  const t = (type ?? '').toLowerCase();
  if (t.includes('suv') || t.includes('todoterreno') || t.includes('crossover')) return 'suv';
  if (t.includes('pickup') || t.includes('camioneta')) return 'pickup';
  if (t.includes('hatch')) return 'hatch';
  return 'sedan';
}

/** Acabado del render: grafito (casi todos) o perla. Estable por vehículo. */
export function acabadoDe(car: CarLike): 'grafito' | 'perla' {
  const semilla = `${car.brand ?? ''}${car.model ?? ''}${car.id ?? ''}`;
  let h = 0;
  for (let i = 0; i < semilla.length; i++) h = (h * 31 + semilla.charCodeAt(i)) >>> 0;
  return h % 10 < 7 ? 'grafito' : 'perla';
}

export function fotoDe(car: CarLike): string | null {
  const imgs = car.images ?? [];
  const portada = imgs.find(i => i.isThumbnail) ?? imgs.find(i => i.type === 'cover') ?? imgs[0];
  return portada?.url ?? car.imageUrl ?? null;
}

interface Silueta {
  cuerpo: string;
  vidrio: string;
  /** Líneas de luz que recorren la lámina (referencia Porsche). */
  luces: string[];
  ruedas: [number, number];
  ry: number;
  r: number;
  faro: string;
  stop: string;
  extra?: string;
}

// viewBox 0 0 480 180 · piso en y=160 · el carro mira a la derecha
const SILUETAS: Record<Carroceria, Silueta> = {
  sedan: {
    cuerpo:
      'M52 150 C44 148 40 140 40 130 L41 113 C42 105 48 100 58 98 L102 93 C130 89 148 77 170 65 C196 52 224 47 256 47 C284 47 302 53 322 67 C334 75 344 81 356 85 C390 91 420 97 436 105 C446 110 450 119 448 129 L446 141 C445 147 440 150 432 150 Z',
    vidrio: 'M168 83 C186 67 214 57 254 55 C282 55 300 61 318 73 L333 84 Z',
    luces: [
      'M64 101 C150 92 300 88 432 108',
      'M176 66 C204 53 232 49 258 49 C284 49 302 55 318 67',
    ],
    ruedas: [118, 358],
    ry: 128,
    r: 29,
    faro: 'M414 99 C428 102 438 106 443 113',
    stop: 'M42 110 L60 105',
  },
  hatch: {
    cuerpo:
      'M70 150 C62 148 58 140 58 130 L59 111 C60 99 64 91 70 85 C78 71 92 59 116 53 C150 47 200 45 250 46 C278 47 298 55 318 71 C330 79 340 84 352 87 C382 92 406 98 418 106 C428 112 432 120 431 130 L429 141 C428 147 423 150 415 150 Z',
    vidrio: 'M86 85 C96 69 110 61 130 58 C164 53 212 52 248 53 C272 54 292 61 312 77 L322 85 Z',
    luces: ['M72 104 C160 95 300 92 414 110', 'M100 60 C150 50 220 48 252 49 C276 50 294 57 310 70'],
    ruedas: [130, 346],
    ry: 128,
    r: 28,
    faro: 'M398 101 C410 103 420 108 426 115',
    stop: 'M60 100 L70 90',
  },
  suv: {
    cuerpo:
      'M56 152 C48 150 44 142 44 132 L45 104 C46 92 52 84 60 80 L72 50 C76 42 84 38 96 38 L270 37 C292 37 308 44 324 58 L350 80 C390 86 424 92 440 100 C450 106 454 116 452 128 L450 144 C449 150 444 152 436 152 Z',
    vidrio: 'M80 79 L90 53 C93 47 98 45 106 45 L268 45 C286 45 300 51 314 63 L334 80 Z',
    luces: ['M50 98 C160 90 320 88 440 104', 'M92 41 L268 40 C288 40 304 46 318 58'],
    ruedas: [124, 364],
    ry: 124,
    r: 32,
    faro: 'M420 94 C434 97 444 101 449 108',
    stop: 'M46 96 L58 88',
  },
  pickup: {
    cuerpo:
      'M52 152 C44 150 40 142 40 132 L41 97 C41 94 43 93 46 93 L192 93 L200 56 C203 44 210 40 222 40 L290 40 C306 40 318 46 330 58 L352 82 C394 88 428 94 444 102 C452 108 456 116 455 128 L453 144 C452 150 447 152 439 152 Z',
    vidrio: 'M210 80 L216 52 C218 47 222 46 228 46 L288 46 C302 46 312 51 322 60 L338 80 Z',
    luces: ['M46 101 L190 101', 'M200 98 C290 92 360 90 444 106', 'M214 43 L288 43 C304 43 316 49 326 60'],
    ruedas: [116, 370],
    ry: 124,
    r: 32,
    faro: 'M424 96 C438 99 448 104 452 111',
    stop: 'M42 100 L42 116',
    extra: 'M192 93 L192 140',
  },
};

function Rueda({ cx, cy, r, id, perla }: { cx: number; cy: number; r: number; id: string; perla: boolean }) {
  const rayos = Array.from({ length: 10 }, (_, i) => i * 36);
  const rin = r - 7;
  return (
    <g>
      {/* Sombra de contacto */}
      <ellipse cx={cx} cy={cy + r + 1} rx={r * 1.15} ry={4} fill="#000" opacity={0.55} />
      <circle cx={cx} cy={cy} r={r + 5} fill="#060508" />
      <circle cx={cx} cy={cy} r={r} fill="#0d0c10" />
      <circle cx={cx} cy={cy} r={rin} fill={`url(#rin-${id})`} />
      {rayos.map(a => (
        <line
          key={a}
          x1={cx}
          y1={cy - 6}
          x2={cx}
          y2={cy - rin + 2}
          stroke={perla ? '#9a96a1' : '#5c5764'}
          strokeWidth={1.8}
          strokeLinecap="round"
          transform={`rotate(${a} ${cx} ${cy})`}
        />
      ))}
      {/* Aro morado con resplandor: el acento de marca como luz */}
      <circle cx={cx} cy={cy} r={rin + 1.5} fill="none" stroke="#a855f7" strokeWidth={4} opacity={0.75} filter={`url(#brillo-${id})`} />
      <circle cx={cx} cy={cy} r={rin + 1.5} fill="none" stroke="#c084fc" strokeWidth={1.6} />
      <circle cx={cx} cy={cy} r={6} fill="#1a171e" />
      <circle cx={cx} cy={cy} r={2.2} fill="#d8b4fe" />
    </g>
  );
}

function RenderSvg({ car, className }: { car: CarLike; className?: string }) {
  const id = useId().replace(/:/g, '');
  const s = SILUETAS[carroceriaDe(car.type)];
  const perla = acabadoDe(car) === 'perla';
  const [r1, r2] = s.ruedas;
  const centro = (r1 + r2) / 2;
  const tonos = perla
    ? { alto: '#fbfbfc', medio: '#e6e4ea', bajo: '#a9a6b0', luz: '#ffffff', vidrio: ['#57525e', '#16131a'] }
    : { alto: '#4a4652', medio: '#232028', bajo: '#0b0a0d', luz: '#e9d5ff', vidrio: ['#2b2731', '#050407'] };

  return (
    <svg viewBox="0 0 480 180" className={className} role="img" aria-label={`${car.brand ?? ''} ${car.model ?? ''}`}>
      <defs>
        <linearGradient id={`pintura-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tonos.alto} />
          <stop offset="0.45" stopColor={tonos.medio} />
          <stop offset="1" stopColor={tonos.bajo} />
        </linearGradient>
        <radialGradient id={`brillo-lamina-${id}`} cx="0.62" cy="0.25" r="0.6">
          <stop offset="0" stopColor="#fff" stopOpacity={perla ? 0.7 : 0.22} />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`vidrio-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tonos.vidrio[0]} />
          <stop offset="1" stopColor={tonos.vidrio[1]} />
        </linearGradient>
        <linearGradient id={`luz-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={tonos.luz} stopOpacity="0" />
          <stop offset="0.4" stopColor={tonos.luz} stopOpacity="0.95" />
          <stop offset="0.75" stopColor="#c084fc" stopOpacity="0.7" />
          <stop offset="1" stopColor="#c084fc" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`rin-${id}`}>
          <stop offset="0" stopColor={perla ? '#3a3640' : '#1c1a20'} />
          <stop offset="1" stopColor={perla ? '#6f6b77' : '#2e2a33'} />
        </radialGradient>
        <radialGradient id={`sombra-${id}`}>
          <stop offset="0" stopColor="#000" stopOpacity="0.38" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <filter id={`brillo-${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <clipPath id={`cuerpo-${id}`}>
          <path d={s.cuerpo} />
        </clipPath>
      </defs>

      <ellipse cx={centro} cy={160} rx={215} ry={12} fill={`url(#sombra-${id})`} />

      <path d={s.cuerpo} fill={`url(#pintura-${id})`} />
      <g clipPath={`url(#cuerpo-${id})`}>
        <rect x="0" y="0" width="480" height="180" fill={`url(#brillo-lamina-${id})`} />
        <rect x="0" y={s.ry + 4} width="480" height="40" fill="#050407" opacity="0.5" />
        {[r1, r2].map(x => (
          <circle key={x} cx={x} cy={s.ry} r={s.r + 8} fill={perla ? '#2b2830' : '#050407'} />
        ))}
      </g>
      {s.extra && <path d={s.extra} stroke="#000" strokeOpacity="0.4" strokeWidth="1.2" />}

      <path d={s.vidrio} fill={`url(#vidrio-${id})`} />

      <g className="carro-luces" fill="none" strokeLinecap="round">
        {s.luces.map((d, i) => (
          <path key={i} d={d} stroke={`url(#luz-${id})`} strokeWidth={i === 0 ? 1.6 : 1.2} />
        ))}
      </g>

      <path d={s.faro} fill="none" stroke="#f3e8ff" strokeWidth="3.2" strokeLinecap="round" />
      <path d={s.faro} fill="none" stroke="#c084fc" strokeWidth="7" strokeLinecap="round" opacity="0.5" filter={`url(#brillo-${id})`} />
      <path d={s.stop} fill="none" stroke="#be123c" strokeWidth="3" strokeLinecap="round" />

      <Rueda cx={r1} cy={s.ry} r={s.r} id={id} perla={perla} />
      <Rueda cx={r2} cy={s.ry} r={s.r} id={id} perla={perla} />
    </svg>
  );
}

/**
 * El carro, en foto o render. `reflejo` añade el piso de estudio pulido
 * (referencia Porsche).
 */
export function CarRender({
  car,
  className = '',
  reflejo = false,
  prioridad = false,
}: {
  car: CarLike;
  className?: string;
  reflejo?: boolean;
  prioridad?: boolean;
}) {
  const foto = fotoDe(car);
  const alt = `${car.brand ?? ''} ${car.model ?? ''}`.trim();

  const pieza = foto ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={foto}
      alt={alt}
      loading={prioridad ? 'eager' : 'lazy'}
      className="block h-full w-full object-contain drop-shadow-[0_18px_22px_rgba(0,0,0,0.28)]"
      draggable={false}
    />
  ) : (
    <RenderSvg car={car} className="block h-full w-full" />
  );

  if (!reflejo) return <div className={className}>{pieza}</div>;

  return (
    <div className={`relative ${className}`}>
      {pieza}
      <div className="carro-reflejo pointer-events-none absolute inset-x-0 top-full h-[38%] overflow-hidden" aria-hidden>
        <div className="h-full w-full -scale-y-100 opacity-[0.16] blur-[1px]">{pieza}</div>
      </div>
    </div>
  );
}
