// ============================================================================
// Logo WiseMotors.
//
// Marca: cuadrado redondeado morado con una "W" de un solo trazo, como una
// carretera de curvas vista desde arriba; el punto lila es el conductor que
// ya sabe a dónde va. Palabra: "wise" en 700, "motors" en 400, minúsculas.
// ============================================================================

export function LogoMarca({ className = 'h-8 w-8', tono = 'wise' }: { className?: string; tono?: 'wise' | 'blanco' }) {
  const fondo = tono === 'wise' ? '#881cb7' : '#ffffff';
  const trazo = tono === 'wise' ? '#ffffff' : '#881cb7';
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill={fondo} />
      <path
        d="M6.5 10 L11.2 22.5 L16 13.5 L20.8 22.5 L25.5 10"
        fill="none"
        stroke={trazo}
        strokeWidth="3.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="25.5" cy="10" r="2.3" fill={tono === 'wise' ? '#d8b4fe' : '#881cb7'} />
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
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMarca />
      {!soloMarca && (
        <span className={`text-[21px] leading-none tracking-[-0.045em] ${oscuro ? 'text-white' : 'text-tinta'}`}>
          <span className="font-bold">wise</span>
          <span className="font-normal">motors</span>
        </span>
      )}
    </span>
  );
}
