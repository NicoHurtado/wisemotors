'use server';

import { getOptimizedComparison } from '@/lib/ai/comparison';

interface VehicleSpecs {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  fuelType: string;
  type: string;
  specifications: any;
}

interface AIAnalysis {
  vehicleId: string;
  pros: string[];
  cons: string[];
  recommendation: string;
  score: number;
}

interface ProfileRecommendation {
  profile: string;
  vehicle: string;
  reason: string;
}

export async function getIntelligentAnalysis(vehicles: VehicleSpecs[]): Promise<{
  analysis: AIAnalysis[];
  profileRecommendations: ProfileRecommendation[];
  keyDifferences: string[];
}> {
  try {
    // Usar el nuevo sistema optimizado
    const vehicleIds = vehicles.map(v => v.id);
    const result = await getOptimizedComparison(vehicleIds);
    
    // Transformar el resultado al formato esperado
    const analysis: AIAnalysis[] = result.analysis.summary.map(summary => ({
      vehicleId: summary.vehicleId,
      pros: summary.pros,
      cons: summary.cons,
      recommendation: summary.recommendation,
      score: Math.max(0, Math.min(100, Math.round(summary.score * 100))) // Asegurar rango 0-100
    }));
    
    console.log(`🚀 Comparación optimizada completada:`, {
      vehicles: vehicleIds.length,
      processingTime: `${result.meta.processingTime}ms`,
      cacheHit: result.meta.cacheHit,
      tokensUsed: result.meta.tokensUsed,
      efficiency: result.meta.cacheHit ? 'CACHE' : `${result.meta.tokensUsed} tokens`
    });
    
    return {
      analysis,
      profileRecommendations: result.profileRecommendations,
      keyDifferences: result.analysis.keyDifferences || []
    };
    
  } catch (error) {
    console.error('Error in optimized comparison:', error);
    
    // Fallback al análisis básico
    return {
      analysis: generateFallbackAnalysis(vehicles),
      profileRecommendations: generateFallbackProfileRecommendations(vehicles),
      keyDifferences: []
    };
  }
}

// Función de fallback para análisis individual
function generateFallbackAnalysis(vehicles: VehicleSpecs[]): AIAnalysis[] {
  return vehicles.map(vehicle => {
    const pros: string[] = [];
    const cons: string[] = [];
    const specs = typeof vehicle.specifications === 'string' 
      ? JSON.parse(vehicle.specifications || '{}') 
      : (vehicle.specifications || {});
    
    let recommendation = '';
    let score = 70;
    const priceMillions = Math.round(vehicle.price / 1000000);

    // Análisis detallado por tipo de combustible
    if (vehicle.fuelType === 'Eléctrico') {
      const range = specs.electric?.electricRange;
      if (range && range > 400) {
        pros.push(`Autonomía excepcional de ${range}km sin emisiones`);
      } else {
        pros.push('Operación 100% eléctrica con cero emisiones locales');
      }
      pros.push('Costos de operación mínimos y mantenimiento reducido');
      pros.push('Aceleración instantánea y funcionamiento silencioso');
      
      if (range && range < 300) {
        cons.push(`Autonomía limitada de ${range}km requiere planificación de viajes`);
      } else {
        cons.push('Red de carga rápida aún en desarrollo en Colombia');
      }
      cons.push(`Inversión inicial elevada de $${priceMillions}M`);
      
      recommendation = `Ideal para conductores urbanos comprometidos con el medio ambiente y dispuestos a invertir $${priceMillions}M en tecnología de vanguardia`;
      score = 85;
      
    } else if (vehicle.fuelType === 'Híbrido') {
      const consumption = specs.combustion?.cityConsumption || specs.hybrid?.cityConsumption;
      if (consumption && consumption < 6) {
        pros.push(`Consumo excepcional de ${consumption}L/100km en ciudad`);
      } else {
        pros.push('Eficiencia superior combinando motor eléctrico y gasolina');
      }
      pros.push('Transición automática entre modos de propulsión');
      pros.push('Recarga regenerativa en frenadas y desaceleraciones');
      
      cons.push('Complejidad mecánica dual requiere mantenimiento especializado');
      cons.push(`Sobreprecio híbrido incrementa inversión inicial`);
      
      if (consumption) {
        recommendation = `Perfecto equilibrio para uso mixto: ${consumption}L/100km en ciudad con la confiabilidad de motor convencional de respaldo`;
      } else {
        recommendation = 'Excelente opción para conductores que buscan eficiencia sin limitaciones de autonomía';
      }
      score = 78;
      
    } else {
      // Gasolina
      const power = specs.performance?.maxPower || specs.combustion?.maxPower;
      const consumption = specs.combustion?.cityConsumption;
      
      if (power && power > 300) {
        pros.push(`Potencia robusta de ${power}hp para rendimiento deportivo`);
      } else {
        pros.push('Motor de combustión probado y confiable');
      }
      pros.push('Red de servicio amplia y repuestos accesibles');
      pros.push(`Precio competitivo de $${priceMillions}M en su segmento`);
      
      if (consumption && consumption > 10) {
        cons.push(`Consumo elevado de ${consumption}L/100km aumenta costos operativos`);
      } else {
        cons.push('Dependencia de combustibles fósiles con precios variables');
      }
      cons.push('Emisiones contaminantes impactan huella de carbono');
      
      if (consumption) {
        recommendation = `Opción tradicional sólida: $${priceMillions}M con ${consumption}L/100km y mantenimiento predecible`;
      } else {
        recommendation = `Alternativa confiable y accesible para conductores que priorizan simplicidad mecánica`;
      }
      score = 72;
    }

    return {
      vehicleId: vehicle.id,
      pros: pros.slice(0, 3),
      cons: cons.slice(0, 3),
      recommendation,
      score: Math.max(0, Math.min(100, score))
    };
  });
}

// Función de fallback para recomendaciones por perfil
function generateFallbackProfileRecommendations(vehicles: VehicleSpecs[]): ProfileRecommendation[] {
  const recommendations: ProfileRecommendation[] = [];
  
  // Familiar: Priorizar SUV/Sedán, evitar deportivos
  const familyBest = vehicles.reduce((best, current) => {
    const currentScore = calculateFamilyScore(current);
    const bestScore = calculateFamilyScore(best);
    return currentScore > bestScore ? current : best;
  });
  
  recommendations.push({
    profile: 'Familiar',
    vehicle: `${familyBest.brand} ${familyBest.model}`,
    reason: getFamilyReason(familyBest)
  });
  
  // Económico: Priorizar eficiencia y precio bajo, penalizar deportivos caros
  const economicBest = vehicles.reduce((best, current) => {
    const currentScore = calculateEconomicScore(current);
    const bestScore = calculateEconomicScore(best);
    return currentScore > bestScore ? current : best;
  });
  
  recommendations.push({
    profile: 'Económico',
    vehicle: `${economicBest.brand} ${economicBest.model}`,
    reason: getEconomicReason(economicBest)
  });
  
  return recommendations;
}

function calculateFamilyScore(vehicle: VehicleSpecs): number {
  let score = 0;
  
  // Bonus por tipo familiar
  if (vehicle.type === 'SUV') score += 0.4;
  else if (vehicle.type === 'Sedán') score += 0.3;
  else if (vehicle.type === 'Hatchback') score += 0.2;
  else if (vehicle.type === 'Deportivo') score -= 0.3; // Penalización
  
  // Bonus por características familiares
  if (vehicle.fuelType === 'Híbrido') score += 0.1; // Eficiente para familias
  if (vehicle.price < 200000000) score += 0.1; // Precio razonable
  
  return Math.max(0, score);
}

function calculateEconomicScore(vehicle: VehicleSpecs): number {
  let score = 0;
  
  // Bonus por tipo económico
  if (vehicle.type === 'Hatchback') score += 0.3;
  else if (vehicle.type === 'Sedán') score += 0.2;
  else if (vehicle.type === 'Deportivo') score -= 0.4; // Penalización fuerte
  
  // Bonus por combustible eficiente
  if (vehicle.fuelType === 'Híbrido') score += 0.3;
  else if (vehicle.fuelType === 'Eléctrico') score += 0.2;
  
  // Penalizar precios muy altos
  if (vehicle.price > 200000000) score -= 0.3;
  else if (vehicle.price < 150000000) score += 0.2;
  
  return Math.max(0, score);
}

function getFamilyReason(vehicle: VehicleSpecs): string {
  const reasons = [];
  const specs = typeof vehicle.specifications === 'string' 
    ? JSON.parse(vehicle.specifications || '{}') 
    : (vehicle.specifications || {});
  
  // Razones específicas por tipo
  if (vehicle.type === 'SUV') {
    reasons.push('espacio familiar amplio');
    if (specs.chassis?.groundClearance > 0.15) reasons.push('capacidad todoterreno');
  } else if (vehicle.type === 'Sedán') {
    reasons.push('confort en viajes largos');
    if (vehicle.year >= 2020) reasons.push('tecnología moderna');
  }
  
  // Razones por características de seguridad
  if (specs.safety?.airbags >= 6) reasons.push(specs.safety.airbags + ' airbags');
  if (specs.safety?.stabilityControl) reasons.push('control de estabilidad avanzado');
  
  // Razones por precio y practicidad
  if (vehicle.price < 200000000) reasons.push('precio familiar accesible');
  if (vehicle.fuelType === 'Híbrido') reasons.push('eficiencia para uso diario');
  
  // Construir frase dinámica
  if (reasons.length >= 3) {
    return `Ideal por su ${reasons.slice(0, 2).join(', ')} y ${reasons[2]}`;
  } else if (reasons.length === 2) {
    return `Combina ${reasons[0]} con ${reasons[1]}`;
  } else if (reasons.length === 1) {
    return `Destacado por su ${reasons[0]}`;
  } else {
    return 'Mejor opción familiar disponible';
  }
}

function getEconomicReason(vehicle: VehicleSpecs): string {
  const reasons = [];
  const specs = typeof vehicle.specifications === 'string' 
    ? JSON.parse(vehicle.specifications || '{}') 
    : (vehicle.specifications || {});
  
  // Razones específicas por combustible
  if (vehicle.fuelType === 'Híbrido') {
    const consumption = specs.combustion?.cityConsumption || specs.hybrid?.cityConsumption;
    if (consumption && consumption < 6) {
      reasons.push(`consumo de solo ${consumption}L/100km`);
    } else {
      reasons.push('tecnología híbrida económica');
    }
  } else if (vehicle.fuelType === 'Eléctrico') {
    reasons.push('cero gastos de combustible');
    if (specs.electric?.electricRange > 300) {
      reasons.push(`${specs.electric.electricRange}km de autonomía`);
    }
  } else {
    const consumption = specs.combustion?.cityConsumption;
    if (consumption && consumption < 8) {
      reasons.push(`consumo eficiente de ${consumption}L/100km`);
    }
  }
  
  // Razones por precio
  const priceMillions = Math.round(vehicle.price / 1000000);
  if (vehicle.price < 100000000) {
    reasons.push(`precio accesible de $${priceMillions}M`);
  } else if (vehicle.price < 150000000) {
    reasons.push('excelente relación precio-calidad');
  }
  
  // Razones por marca y mantenimiento
  const economicBrands = ['Honda', 'Toyota', 'Nissan', 'Hyundai', 'Kia'];
  if (economicBrands.includes(vehicle.brand)) {
    reasons.push('mantenimiento económico ' + vehicle.brand);
  }
  
  // Construir frase dinámica
  if (reasons.length >= 3) {
    return `Económico por su ${reasons.slice(0, 2).join(', ')} y ${reasons[2]}`;
  } else if (reasons.length === 2) {
    return `Combina ${reasons[0]} con ${reasons[1]}`;
  } else if (reasons.length === 1) {
    return `Destacado por su ${reasons[0]}`;
  } else {
    return 'Mejor valor económico de la comparación';
  }
}