'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  /** Valor final. */
  value: number;
  /** Formateador del número mostrado (ej. formatPrice). Por defecto, toLocaleString es-CO. */
  format?: (n: number) => string;
  /** Duración en ms. Por defecto usa el token `smooth` (400ms). */
  durationMs?: number;
  className?: string;
}

/**
 * Contador que anima de 0 al valor cuando entra al viewport, una sola vez.
 *
 * - Solo cambia texto: nada de layout, nada de width/height.
 * - `prefers-reduced-motion` ⇒ muestra el valor final de inmediato, sin animar.
 * - Ease-out cúbico: la cifra "aterriza" en vez de frenar en seco.
 */
export function AnimatedNumber({
  value,
  format = n => Math.round(n).toLocaleString('es-CO'),
  durationMs = 400,
  className,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    const observer = new IntersectionObserver(
      entries => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / durationMs);
          const eased = 1 - Math.pow(1 - t, 3); // ease-out cúbico
          setDisplay(value * eased);
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, durationMs]);

  return (
    <span ref={ref} className={className}>
      {/* Antes de entrar al viewport se muestra el valor final: sin parpadeo de 0
          en SSR ni saltos si el observer nunca dispara. */}
      {format(display ?? value)}
    </span>
  );
}
