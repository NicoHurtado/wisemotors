// Cálculo de cobertura de datos por vehículo.
// Regla de producto: ningún puntaje se muestra sin su cobertura.
// La distinción clave: un campo NO APLICABLE (cilindraje en un EV) no cuenta
// como faltante. Faltante es solo lo aplicable que no está.

import { ATTRIBUTE_REGISTRY, COVERAGE_DIMENSIONS, attributeAppliesTo } from './registry';

export interface CoverageResult {
  global: number; // 0-1
  byDimension: Record<string, number | null>; // null = ninguna definición aplicable
}

/** Umbral mínimo de cobertura para mostrar un puntaje de dimensión en la UI. */
export const MIN_DIMENSION_COVERAGE = 0.6;

export function computeCoverage(fuelType: string, presentKeys: Set<string>): CoverageResult {
  const applicable = ATTRIBUTE_REGISTRY.filter(d => attributeAppliesTo(d, fuelType) && d.dimension !== 'editorial');

  const byDimension: Record<string, number | null> = {};
  for (const dim of COVERAGE_DIMENSIONS) {
    const dimDefs = applicable.filter(d => d.dimension === dim);
    if (dimDefs.length === 0) {
      byDimension[dim] = null;
      continue;
    }
    const present = dimDefs.filter(d => presentKeys.has(d.key)).length;
    byDimension[dim] = present / dimDefs.length;
  }

  const present = applicable.filter(d => presentKeys.has(d.key)).length;
  const global = applicable.length > 0 ? present / applicable.length : 0;

  return { global, byDimension };
}
