'use client';

// ============================================================================
// Pestañas Liquid Glass.
//
// Una píldora de vidrio con una gota (el "lente") que se desliza a la pestaña
// activa. Al moverse la gota se estira en la dirección del viaje y rebota al
// llegar, como una gota de agua; al pasar el cursor, la gota se asoma hacia la
// pestaña señalada. La posición va por translateX; el ancho sí se transiciona
// (con scaleX las puntas redondeadas se deforman) y es barato porque el lente
// es absoluto: no empuja a nadie.
// ============================================================================

import Link from 'next/link';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface LiquidTab {
  href: string;
  texto: string;
  icono: LucideIcon;
}

interface Props {
  tabs: LiquidTab[];
  activo: string | null;
  /** 'barra' = navbar de escritorio (icono + texto en línea); 'dock' = barra inferior móvil (icono sobre texto). */
  variante?: 'barra' | 'dock';
  className?: string;
}

export function LiquidTabs({ tabs, activo, variante = 'barra', className = '' }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const refs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [objetivo, setObjetivo] = useState<string | null>(activo);
  const [geo, setGeo] = useState<{ x: number; w: number } | null>(null);
  const [viaje, setViaje] = useState(0); // cambia en cada salto → reinicia la animación de gota
  const previa = useRef<number | null>(null);

  const medir = useCallback((href: string | null) => {
    const el = href ? refs.current[href] : null;
    const caja = contenedor.current;
    if (!el || !caja) {
      setGeo(null);
      return;
    }
    const x = el.offsetLeft;
    const w = el.offsetWidth;
    if (previa.current !== null && previa.current !== x) setViaje(v => v + 1);
    previa.current = x;
    setGeo({ x, w });
  }, []);

  // El activo manda; el hover solo lo desplaza temporalmente.
  useLayoutEffect(() => setObjetivo(activo), [activo]);
  useLayoutEffect(() => medir(objetivo), [objetivo, medir, tabs.length]);

  useLayoutEffect(() => {
    const caja = contenedor.current;
    if (!caja || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => medir(objetivo));
    ro.observe(caja);
    return () => ro.disconnect();
  }, [objetivo, medir]);

  const dock = variante === 'dock';

  return (
    <div
      ref={contenedor}
      onMouseLeave={() => setObjetivo(activo)}
      className={`liquid-tabs ${dock ? 'liquid-tabs--dock' : ''} ${className}`}
    >
      {geo && (
        <span
          aria-hidden
          className="liquid-lens"
          style={
            {
              '--lens-x': `${geo.x}px`,
              width: `${geo.w}px`,
              opacity: objetivo === activo ? 1 : 0.7,
            } as React.CSSProperties
          }
        >
          {/* La gota se estira en su propia capa para no pelear con el translate */}
          <span key={viaje} className="liquid-lens__gota" />
        </span>
      )}

      {tabs.map(tab => {
        const esActivo = tab.href === activo;
        const Icono = tab.icono;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            ref={el => {
              refs.current[tab.href] = el;
            }}
            aria-current={esActivo ? 'page' : undefined}
            onMouseEnter={() => setObjetivo(tab.href)}
            onFocus={() => setObjetivo(tab.href)}
            onBlur={() => setObjetivo(activo)}
            className={`liquid-tab ${esActivo ? 'is-active' : ''}`}
          >
            <Icono className={dock ? 'h-[22px] w-[22px]' : 'h-4 w-4'} strokeWidth={esActivo ? 2.1 : 1.75} />
            <span>{tab.texto}</span>
          </Link>
        );
      })}
    </div>
  );
}
