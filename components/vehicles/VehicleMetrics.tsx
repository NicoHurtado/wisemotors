'use client';

import { BarChart3, Info } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

interface WiseMetrics {
  drivingFun: number;
  technology: number;
  environmentalImpact: number;
  reliability: number;
  qualityPriceRatio: number;
  comfort: number;
  usability: number;
  efficiency: number;
  prestige: number;
  interiorQuality: number;
}

interface VehicleMetricsProps {
  metrics?: WiseMetrics;
}

export function VehicleMetrics({ metrics }: VehicleMetricsProps) {
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Las barras y los números arrancan cuando el panel entra en pantalla, no al
  // montar: si el usuario nunca baja hasta aquí, la animación no se desperdicia.
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Si no hay métricas, mostrar mensaje o componente vacío
  if (!metrics) {
    return (
      <div className="glass rounded-3xl p-7 md:p-9">
        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-200">
            <BarChart3 className="h-6 w-6 text-gray-400" strokeWidth={1.75} />
          </div>
          <h3 className="text-[26px] font-semibold tracking-tight text-gray-900">
            WiseMetrics
          </h3>
        </div>
        <p className="max-w-[54ch] text-[15px] leading-relaxed text-gray-500">
          Todavía no hay lecturas para este vehículo. Aparecen cuando la ficha alcanza
          la cobertura mínima de datos.
        </p>
      </div>
    );
  }

  // Explicaciones para cada métrica
  const metricExplanations = {
    drivingFun: 'Mide qué tan divertido y emocionante es conducir este vehículo, considerando aceleración, manejo y respuesta',
    technology: 'Evalúa el nivel de tecnología y conectividad disponible, incluyendo sistemas de infoentretenimiento y asistentes',
    environmentalImpact: 'Califica el impacto ambiental del vehículo, considerando emisiones y eficiencia energética',
    reliability: 'Mide la confiabilidad y durabilidad esperada del vehículo basada en historial y componentes',
    qualityPriceRatio: 'Evalúa si el precio del vehículo es justo considerando la calidad y características que ofrece',
    comfort: 'Califica el nivel de comodidad en el interior, incluyendo asientos, espacio y aislamiento acústico',
    usability: 'Mide qué tan fácil y intuitivo es usar los controles y sistemas del vehículo',
    efficiency: 'Evalúa la eficiencia del vehículo en términos de consumo de combustible o energía',
    prestige: 'Califica el prestigio y estatus social asociado con la marca y modelo del vehículo',
    interiorQuality: 'Evalúa la calidad de los materiales y acabados del interior del vehículo'
  };

  // Solo las métricas que se pueden ingresar manualmente en el formulario
  const leftColumnMetrics = [
    { key: 'drivingFun', label: 'Diversión al Conducir' },
    { key: 'technology', label: 'Tecnología/Conectividad' },
    { key: 'environmentalImpact', label: 'Impacto Ambiental' },
    { key: 'reliability', label: 'Fiabilidad' },
    { key: 'qualityPriceRatio', label: 'Relación Calidad-Precio' },
  ];

  const rightColumnMetrics = [
    { key: 'comfort', label: 'Comodidad' },
    { key: 'usability', label: 'Usabilidad' },
    { key: 'efficiency', label: 'Eficiencia' },
    { key: 'prestige', label: 'Prestigio' },
    { key: 'interiorQuality', label: 'Calidad Interior' },
  ];

  const renderMetric = (key: keyof WiseMetrics, label: string, orden: number) => {
    const value = metrics[key];
    if (value === undefined || value === null) return null;

    const maxValue = 100;
    const percentage = (value / maxValue) * 100;
    const explanation = metricExplanations[key as keyof typeof metricExplanations];

    return (
      <div key={key} className="relative py-3.5">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span
            className="relative cursor-help text-[15px] font-medium text-gray-700 hover:text-wise"
            style={{ transition: 'color var(--motion-instant) ease' }}
            onMouseEnter={() => setHoveredMetric(key)}
            onMouseLeave={() => setHoveredMetric(null)}
          >
            {label}
            {hoveredMetric === key && (
              <span className="absolute bottom-full left-0 z-50 mb-2 block w-72 rounded-xl bg-gray-900 p-3 text-xs font-normal leading-relaxed text-white shadow-xl">
                {explanation}
              </span>
            )}
          </span>

          <span className="shrink-0 font-mono text-[17px] font-semibold tabular-nums text-wise">
            {visible ? <AnimatedNumber value={value} durationMs={900} /> : 0}
            <span className="ml-0.5 text-[12px] font-normal text-gray-400">/100</span>
          </span>
        </div>

        {/* La barra se dibuja con scaleX: no toca width, no provoca reflow */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200/70">
          <div
            className="metric-bar h-full rounded-full bg-gradient-to-r from-wise to-[#a855d8]"
            data-shown={visible}
            style={{
              width: `${percentage}%`,
              transitionDelay: `${Math.min(orden, 9) * 55}ms`,
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div
      ref={panelRef}
      className="glass relative overflow-hidden rounded-3xl p-7 md:p-9"
    >
      {/* Luz morada de fondo: le da al vidrio algo que refractar */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(136,28,183,0.14) 0%, transparent 70%)',
        }}
      />

      <div className="relative mb-8 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-wise shadow-lg shadow-wise/25">
          <BarChart3 className="h-6 w-6 text-white" strokeWidth={1.75} />
        </div>
        <div>
          <h3 className="text-[26px] font-semibold tracking-tight text-gray-900">
            WiseMetrics
          </h3>
          <p className="mt-1 max-w-[52ch] text-[14px] leading-relaxed text-gray-600">
            Diez lecturas que preparamos a partir del análisis completo del carro.
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-gray-400">
            <Info className="h-3 w-3" strokeWidth={2} />
            Pasa el mouse sobre cada una para ver qué mide
          </p>
        </div>
      </div>

      <div className="relative grid grid-cols-1 gap-x-12 md:grid-cols-2">
        <div>
          {leftColumnMetrics.map(({ key, label }, i) =>
            renderMetric(key as keyof WiseMetrics, label, i)
          )}
        </div>
        <div>
          {rightColumnMetrics.map(({ key, label }, i) =>
            renderMetric(key as keyof WiseMetrics, label, i + 5)
          )}
        </div>
      </div>
    </div>
  );
}
