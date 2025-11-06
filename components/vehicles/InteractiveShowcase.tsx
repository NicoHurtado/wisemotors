'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type HotspotKey =
  | 'powertrain'
  | 'dimensions'
  | 'comfort'
  | 'chassis'
  | 'efficiency'
  | 'safety';

interface InteractiveShowcaseProps {
  imageSrc: string;
  vehicle: any; // The page already uses a rich vehicle object; keep flexible here
}

export default function InteractiveShowcase({ imageSrc, vehicle }: InteractiveShowcaseProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollTo = useCallback((id: string) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Anchors to existing sections already rendered below in VehicleDetail
  const targets = useMemo(
    () => ({
      powertrain: 'sec-powertrain',
      dimensions: 'sec-dimensiones',
      comfort: 'sec-confort',
      chassis: 'sec-chasis',
      efficiency: 'sec-consumo',
      safety: 'sec-seguridad-adas',
    }),
    []
  );

  const Hotspot = ({
    label,
    onClick,
  }: {
    label: string;
    onClick: () => void;
  }) => (
    <button
      aria-label={label}
      onClick={onClick}
      className="group px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm border border-[#8112b4]/20 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 hover:border-[#8112b4]/40 hover:bg-white"
    >
      <span className="text-xs md:text-sm font-medium text-[#8112b4] whitespace-nowrap">
        {label}
      </span>
    </button>
  );

  // No local cards here; we just link to the existing sections below

  return (
    <div ref={containerRef} className="relative py-8">
      {/* Only floating car image with hotspots over a clean, subtle backdrop */}
      <div className="relative mx-auto max-w-4xl">
        <div className={
          'relative mx-auto w-full h-[600px] md:h-[750px] transition-opacity duration-700 ' +
          (mounted ? 'opacity-100' : 'opacity-0')
        }>
            <Image
              src={imageSrc}
              alt={`${vehicle?.brand || ''} ${vehicle?.model || ''}`.trim() || 'Vehicle'}
              fill
              sizes="(max-width: 768px) 100vw, 900px"
              className="object-contain select-none"
              priority
              unoptimized
              style={{ objectFit: 'contain' }}
            />
        </div>
        {/* Hotspots ahora en una fila debajo de la imagen */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 md:gap-3">
          <Hotspot label="Motor y Transmisión" onClick={() => scrollTo(targets.powertrain)} />
          <Hotspot label="Diseño y Dimensiones" onClick={() => scrollTo(targets.dimensions)} />
          <Hotspot label="Interior y Confort" onClick={() => scrollTo(targets.comfort)} />
          <Hotspot label="Chasis y Frenos" onClick={() => scrollTo(targets.chassis)} />
          <Hotspot label="Consumo y Batería" onClick={() => scrollTo(targets.efficiency)} />
          <Hotspot label="Seguridad y ADAS" onClick={() => scrollTo(targets.safety)} />
        </div>
      </div>
    </div>
  );
}
