'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * true la primera vez que el elemento entra en pantalla (y se queda en true).
 * Cada ronda del duelo "se juega" cuando el usuario llega a ella.
 * Con `habilitado = false` no observa: sirve para ignorar lo que cruza la
 * pantalla durante un scroll automático.
 */
export function useEnVista<T extends Element>(umbral = 0.35, habilitado = true) {
  const ref = useRef<T>(null);
  const [visto, setVisto] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visto || !habilitado) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisto(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisto(true);
          io.disconnect();
        }
      },
      { threshold: umbral }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visto, umbral, habilitado]);

  return [ref, visto] as const;
}
