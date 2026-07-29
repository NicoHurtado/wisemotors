'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Revela su contenido cuando entra en pantalla, una sola vez.
 * Solo anima transform y opacity, así que no provoca reflow.
 */
export function Reveal({
  children,
  className = '',
  delayMs = 0,
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  /** Retraso para escalonar hermanos. Máximo recomendado: 60ms por elemento. */
  delayMs?: number;
  as?: 'div' | 'section' | 'li';
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -80px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as any}
      className={`reveal ${className}`}
      data-shown={shown}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
