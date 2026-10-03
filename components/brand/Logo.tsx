// ============================================================================
// Logo WiseMotors.
//
// Marca: "WM" de trazo grueso inclinada hacia adelante, donde el último palito
// de la W es el primero de la M (la M termina con su pata recta). La W en
// lila y la M en morado: se lee como una estela que acelera.
// Palabra: "wise" en 700, "motors" en 400, minúsculas y apretada.
// Ícono, favicon y foto de perfil (app/icon.svg y public/*.png) salen de
// videos/src/contenido/marca.tsx: si cambia el trazo, cambiarlo en los dos.
// ============================================================================

export const TRAZO_W = '4,5 13,31 22,13 31,31';
export const TRAZO_M = '31,31 40,5 49,20 58,5 60,31';

export function LogoMarca({ className = 'h-7 w-auto', tono = 'wise' }: { className?: string; tono?: 'wise' | 'blanco' }) {
  const claro = '#d8b4fe';
  const fuerte = tono === 'wise' ? '#881cb7' : '#a855f7';
  return (
    <svg viewBox="6 1 63 34" className={className} aria-hidden>
      <g transform="skewX(-12) translate(8 0)" fill="none" strokeWidth="6.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points={TRAZO_W} stroke={claro} />
        <polyline points={TRAZO_M} stroke={fuerte} />
      </g>
    </svg>
  );
}

export function Logo({
  className = '',
  oscuro = false,
  soloMarca = false,
}: {
  className?: string;
  oscuro?: boolean;
  soloMarca?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <LogoMarca tono={oscuro ? 'blanco' : 'wise'} />
      {!soloMarca && (
        <span className={`text-[21px] leading-none tracking-[-0.05em] ${oscuro ? 'text-white' : 'text-tinta'}`}>
          <span className="font-bold">wise</span>
          <span className="font-normal">motors</span>
        </span>
      )}
    </span>
  );
}
