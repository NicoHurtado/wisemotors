'use client';

import { useEffect, useRef } from 'react';

/**
 * Luz morada que sigue al cursor por toda la página.
 *
 * Persigue la posición del mouse con interpolación, así el foco llega con
 * inercia en vez de pegarse al puntero: eso es lo que hace que se sienta
 * material y no un sticker. Un solo rAF, solo `transform`, y el bucle se
 * detiene cuando la luz alcanzó su destino para no quemar batería.
 *
 * No se monta en táctil ni con prefers-reduced-motion.
 */
export function CursorLight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const finoYConMouse = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!finoYConMouse.matches || reducido.matches) return;

    // destino (mouse) y posición actual (luz)
    let destinoX = window.innerWidth / 2;
    let destinoY = window.innerHeight / 2;
    let x = destinoX;
    let y = destinoY;
    let frame = 0;
    let corriendo = false;

    const pintar = () => {
      // Interpolación: 12% de la distancia por frame ⇒ estela suave
      x += (destinoX - x) * 0.12;
      y += (destinoY - y) * 0.12;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;

      const quieto = Math.abs(destinoX - x) < 0.5 && Math.abs(destinoY - y) < 0.5;
      if (quieto) {
        corriendo = false;
        frame = 0;
        return;
      }
      frame = requestAnimationFrame(pintar);
    };

    const arrancar = () => {
      if (corriendo) return;
      corriendo = true;
      frame = requestAnimationFrame(pintar);
    };

    const onMove = (e: MouseEvent) => {
      destinoX = e.clientX;
      destinoY = e.clientY;
      el.dataset.active = 'true';
      arrancar();
    };

    const onLeave = () => {
      el.dataset.active = 'false';
    };

    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={ref} className="cursor-light" data-active="false" aria-hidden />;
}
