'use client';

import { BarChart3, Info } from 'lucide-react';
import { useState } from 'react';

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

  // Si no hay métricas, mostrar mensaje o componente vacío
  if (!metrics) {
    return (
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-wise/10 rounded-full flex items-center justify-center mr-3">
            <BarChart3 className="w-5 h-5 text-wise" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            WiseMetrics
          </h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          No hay métricas disponibles para este vehículo
        </div>
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
    { key: 'comfort', label: 'Comodidad' },
  ];

  const rightColumnMetrics = [
    { key: 'usability', label: 'Usabilidad' },
    { key: 'efficiency', label: 'Eficiencia' },
    { key: 'prestige', label: 'Prestigio' },
    { key: 'interiorQuality', label: 'Calidad Interior' },
  ];

  const renderMetric = (key: keyof WiseMetrics, label: string) => {
    const value = metrics[key];
    if (value === undefined || value === null) return null;

    // Escala de 100 para todas las métricas
    const maxValue = 100;
    const displayValue = value;
    const explanation = metricExplanations[key as keyof typeof metricExplanations];
    
    return (
      <div key={key} className="flex items-center justify-between py-2 relative group">
        <span 
          className="text-gray-700 cursor-help relative transition-colors duration-200 hover:text-wise hover:font-medium" 
          onMouseEnter={() => setHoveredMetric(key)}
          onMouseLeave={() => setHoveredMetric(null)}
        >
          {label}
          {hoveredMetric === key && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-50">
              <div className="relative">
                {explanation}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          )}
        </span>
        <div className="flex items-center space-x-3">
          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-wise rounded-full transition-all duration-300"
              style={{ width: `${(value / maxValue) * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-900 min-w-[3rem]">
            {displayValue}/{maxValue}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-wise/10 rounded-full flex items-center justify-center mr-3">
          <BarChart3 className="w-5 h-5 text-wise" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            WiseMetrics
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Métricas que WiseMotors prepara para ti basándonos en un análisis general del carro
          </p>
          <div className="flex items-center mt-2 text-xs text-gray-500">
            <Info className="w-3 h-3 mr-1" />
            <span>Pasa el mouse sobre cada métrica para ver su explicación</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-1">
          {leftColumnMetrics.map(({ key, label }) => 
            renderMetric(key as keyof WiseMetrics, label)
          )}
        </div>
        
        {/* Right Column */}
        <div className="space-y-1">
          {rightColumnMetrics.map(({ key, label }) => 
            renderMetric(key as keyof WiseMetrics, label)
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-center">
          <div className="text-sm text-gray-500">
            Categorías WiseStats: Deportividad, Elegancia
          </div>
        </div>
      </div>
    </div>
  );
}
