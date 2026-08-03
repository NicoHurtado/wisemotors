'use client';

import { useEffect, useRef, useState } from 'react';

// ============================================================================
// HUD de búsqueda.
//
// Las etapas son las REALES del pipeline (intención → filtro SQL → percentiles
// de cohorte → redacción), no un relleno decorativo: si el usuario lee que
// "puntúa contra la cohorte", eso es exactamente lo que está pasando.
//
// Todo el movimiento es CSS sobre transform y opacity; el único estado en JS
// es qué etapa va y el contador. Un solo intervalo, con limpieza.
// ============================================================================

const ETAPAS = [
  { clave: 'INTENT', texto: 'Interpretando la consulta', detalle: 'extracción de intención' },
  { clave: 'QUERY', texto: 'Filtrando el catálogo', detalle: 'marca · precio · carrocería' },
  { clave: 'SCORE', texto: 'Puntuando contra la cohorte', detalle: 'percentiles winsorizados' },
  { clave: 'RANK', texto: 'Redactando las razones', detalle: 'top 12' },
] as const;

const SEGMENTOS = 28;
const GLIFOS = '0123456789ABCDEF#$%&/*+-<>';

export function AIResultsLoader() {
  const [etapa, setEtapa] = useState(0);
  const [progreso, setProgreso] = useState(0);
  const [contador, setContador] = useState(0);
  const [ruido, setRuido] = useState('');
  const reducido = useRef(false);

  useEffect(() => {
    reducido.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // El progreso avanza rápido al principio y se frena cerca del final:
    // nunca llega al 100% porque quien lo cierra es la respuesta real.
    const id = setInterval(() => {
      setProgreso(p => p + (94 - p) * 0.06);
      setContador(c => c + Math.round(Math.random() * 7) + 2);
      setRuido(
        Array.from({ length: 6 }, () => GLIFOS[Math.floor(Math.random() * GLIFOS.length)]).join('')
      );
    }, 140);

    const idEtapa = setInterval(() => {
      setEtapa(e => Math.min(e + 1, ETAPAS.length - 1));
    }, 1500);

    return () => {
      clearInterval(id);
      clearInterval(idEtapa);
    };
  }, []);

  const llenos = Math.round((progreso / 100) * SEGMENTOS);

  return (
    <div className="glass hud-panel relative mx-auto w-full max-w-3xl overflow-hidden rounded-2xl p-6 md:p-8">
      {/* Barrido de escáner: cruza el panel de arriba abajo, solo transform */}
      <div aria-hidden className="hud-scan pointer-events-none absolute inset-x-0 top-0 h-24" />

      {/* Retícula técnica de fondo */}
      <div aria-hidden className="hud-grid pointer-events-none absolute inset-0 opacity-[0.35]" />

      <div className="relative">
        <div className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-wise">
            Motor de búsqueda
            <span className="ml-2 text-foreground/25">{ruido}</span>
          </p>
          <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {contador.toLocaleString('es-CO')} specs leídas
          </p>
        </div>

        {/* Barra segmentada */}
        <div className="mt-4 flex gap-[3px]" role="progressbar" aria-label="Progreso de la búsqueda">
          {Array.from({ length: SEGMENTOS }).map((_, i) => (
            <span
              key={i}
              className="hud-seg h-7 flex-1 rounded-[2px]"
              data-on={i < llenos}
              style={{ transitionDelay: `${(i % 6) * 18}ms` }}
            />
          ))}
        </div>

        {/* Etapas reales del pipeline */}
        <ul className="mt-6 space-y-2">
          {ETAPAS.map((e, i) => {
            const hecha = i < etapa;
            const activa = i === etapa;
            return (
              <li
                key={e.clave}
                className="flex items-center gap-3 font-mono text-[13px]"
                style={{
                  opacity: hecha ? 0.45 : activa ? 1 : 0.22,
                  transition: 'opacity 240ms var(--ease-out-strong)',
                }}
              >
                <span
                  className="hud-dot h-1.5 w-1.5 shrink-0 rounded-full"
                  data-estado={hecha ? 'hecha' : activa ? 'activa' : 'espera'}
                />
                <span className="w-[68px] shrink-0 text-[10px] uppercase tracking-[0.14em] text-wise/70">
                  {e.clave}
                </span>
                <span className="text-foreground">{e.texto}</span>
                <span className="hidden text-muted-foreground sm:inline">· {e.detalle}</span>
                {activa && <span className="hud-caret ml-auto text-wise">▍</span>}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
