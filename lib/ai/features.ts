// Sistema de features precomputadas para scoring determinístico
import { prisma } from '@/lib/prisma';
import type { VehicleIntent } from './nlu';

export interface VehicleFeatures {
  // Performance normalizadas (0-1)
  power_to_weight_norm: number;
  acceleration_norm: number; // 0-100 km/h (inverso, más rápido = mayor score)
  braking_norm: number; // 100-0 km/h (inverso, menor distancia = mayor score)
  max_speed_norm: number;
  
  // Capacidades normalizadas (0-1)
  ground_clearance_norm: number;
  efficiency_norm: number; // Inverso del consumo
  comfort_norm: number;
  safety_norm: number;
  tech_norm: number;
  reliability_norm: number;
  
  // Scores compuestos (0-1)
  urban_score: number; // Tamaño, maniobrabilidad, parqueo
  highway_score: number; // Comodidad, estabilidad, consumo
  offroad_score: number; // Altura, tracción, robustez
  hill_climb_score: number; // Potencia, torque, tracción
  potholes_score: number; // Altura, suspensión, robustez
  
  // Ratios de valor
  quality_price_ratio_norm: number;
  prestige_norm: number;
  
  // Scores adicionales para comparación
  performance_score: number;
  efficiency_score: number;
  safety_score: number;
  comfort_score: number;
  tech_score: number;
  value_score: number;
  
  // Scores de uso específico
  usage_urban: number;
  consumption_score: number;
  electric_range: number;
}

export interface VehicleCandidate {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  fuelType: string;
  vehicleType: string;
  type: string;
  imageUrl: string | null;
  features: VehicleFeatures;
  tags: string[];
}

// Normalizar valor entre min y max a rango 0-1
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

// Calcular features normalizadas para un vehículo
export function computeVehicleFeatures(vehicle: any, marketStats: any): VehicleFeatures {
  const specs = vehicle.specifications ? JSON.parse(vehicle.specifications) : {};
  
  // Extraer valores numéricos de las especificaciones reales
  const power = parseFloat(specs.performance?.maxPower) || parseFloat(specs.combustion?.maxPower) || 150;
  const weight = parseFloat(specs.dimensions?.weight) || 1500; // kg default
  const acceleration = parseFloat(specs.performance?.acceleration0to100) || 10; // 0-100 km/h
  const topSpeed = parseFloat(specs.performance?.maxSpeed) || 180; // km/h
  const fuelConsumption = parseFloat(specs.combustion?.cityConsumption) || 8; // L/100km
  const groundClearance = parseFloat(specs.chassis?.groundClearance) * 1000 || 150; // convertir m a mm
  
  // Calcular scores basados en especificaciones reales (todos normalizados 0-1)
  const sportiness = Math.max(0, Math.min(1, ((power / 200) + (10 - acceleration) / 10) / 2));
  const comfort = Math.max(0, Math.min(1, (
    (specs.comfort?.airConditioning ? 0.3 : 0) + 
    (specs.comfort?.heatedSeats ? 0.2 : 0) + 
    (specs.comfort?.ventilatedSeats ? 0.2 : 0) + 0.3
  )));
  const efficiency = Math.max(0, Math.min(1, (15 - fuelConsumption) / 10)); // 5-15 L/100km range
  const luxury = Math.max(0, Math.min(1, (
    (specs.technology?.touchscreen ? 0.25 : 0) + 
    (specs.technology?.navigation ? 0.25 : 0) + 
    (power / 1000) + 0.25 // Power contribution capped
  )));
  const reliability = Math.max(0, Math.min(1, (70 + Math.min(20, (vehicle.year - 2020) * 5)) / 100));
  const practicality = Math.max(0, Math.min(1, (vehicle.type === 'SUV' ? 0.8 : 
    vehicle.type === 'Sedán' ? 0.7 : vehicle.type === 'Hatchback' ? 0.75 : 0.6)));
  
  // Normalizar métricas de performance
  const power_to_weight_norm = normalize(power / weight, marketStats.power_to_weight.min, marketStats.power_to_weight.max);
  const acceleration_norm = normalize(15 - acceleration, 0, 10); // Inverso: menos tiempo = mejor
  const braking_norm = normalize(45 - (acceleration * 3), 0, 15); // Estimado basado en aceleración
  const max_speed_norm = normalize(topSpeed, marketStats.top_speed.min, marketStats.top_speed.max);
  const ground_clearance_norm = normalize(groundClearance, marketStats.ground_clearance.min, marketStats.ground_clearance.max);
  const efficiency_norm = normalize(12 - fuelConsumption, 0, 8); // Inverso: menos consumo = mejor
  
  // Scores compuestos basados en tipo de vehículo y especificaciones
  const urban_score = calculateUrbanScore(vehicle.type, specs, practicality);
  const highway_score = calculateHighwayScore(comfort, efficiency_norm, max_speed_norm);
  const offroad_score = calculateOffroadScore(vehicle.type, ground_clearance_norm, power_to_weight_norm);
  const hill_climb_score = calculateHillClimbScore(power_to_weight_norm, specs.drivetrain, acceleration_norm);
  const potholes_score = calculatePotholesScore(ground_clearance_norm, vehicle.type, comfort);
  
  // Ratios de valor
  const quality_price_ratio_norm = calculateQualityPriceRatio(vehicle.price, luxury, reliability, marketStats.price);
  const prestige_norm = calculatePrestigeScore(vehicle.brand, luxury, vehicle.price, marketStats.price);
  
  // Calcular scores adicionales para comparación
  const performance_score = (power_to_weight_norm + acceleration_norm + max_speed_norm) / 3;
  const efficiency_score = efficiency_norm;
  const safety_score = reliability * 0.6 + (specs.safety?.airbags ? 0.2 : 0) + (specs.safety?.stabilityControl ? 0.2 : 0);
  const comfort_score = comfort;
  const tech_score = luxury * 0.7 + practicality * 0.3;
  const value_score = quality_price_ratio_norm;
  
  // Scores de uso específico
  const usage_urban = urban_score;
  const consumption_score = 1 - efficiency_norm; // Inverso de efficiency
  const electric_range = parseFloat(specs.electric?.electricRange) || 0;

  return {
    power_to_weight_norm,
    acceleration_norm,
    braking_norm,
    max_speed_norm,
    ground_clearance_norm,
    efficiency_norm,
    comfort_norm: comfort,
    safety_norm: reliability, // Usar reliability como proxy de safety
    tech_norm: luxury * 0.7 + practicality * 0.3, // Tech correlaciona con lujo y practicidad
    reliability_norm: reliability,
    urban_score,
    highway_score,
    offroad_score,
    hill_climb_score,
    potholes_score,
    quality_price_ratio_norm,
    prestige_norm,
    // Scores adicionales
    performance_score,
    efficiency_score,
    safety_score,
    comfort_score,
    tech_score,
    value_score,
    // Scores de uso específico
    usage_urban,
    consumption_score,
    electric_range
  };
}

function calculateUrbanScore(type: string, specs: any, practicality: number): number {
  let base = practicality;
  
  // Bonificación por tipo urbano
  if (type === 'Hatchback') base += 0.2;
  else if (type === 'Sedán') base += 0.1;
  else if (type === 'SUV') base -= 0.1;
  else if (type === 'Pickup') base -= 0.2;
  
  // Penalización por tamaño excesivo
  const length = parseFloat(specs.dimensions?.length) || 4500;
  if (length > 4800) base -= 0.15;
  
  return Math.max(0, Math.min(1, base));
}

function calculateHighwayScore(comfort: number, efficiency: number, speed: number): number {
  return comfort * 0.5 + efficiency * 0.3 + speed * 0.2;
}

function calculateOffroadScore(type: string, clearance: number, power: number): number {
  let base = clearance * 0.6 + power * 0.4;
  
  // Bonificación por tipo apropiado
  if (type === 'SUV') base += 0.2;
  else if (type === 'Pickup') base += 0.3;
  else if (type === 'Hatchback' || type === 'Sedán') base -= 0.2;
  
  return Math.max(0, Math.min(1, base));
}

function calculateHillClimbScore(power: number, drivetrain: string, acceleration: number): number {
  let score = power * 0.6 + acceleration * 0.4;
  
  // Bonificación por tracción
  if (drivetrain === 'AWD' || drivetrain === '4WD') score += 0.15;
  else if (drivetrain === 'FWD') score += 0.05;
  
  return Math.max(0, Math.min(1, score));
}

function calculatePotholesScore(clearance: number, type: string, comfort: number): number {
  let score = clearance * 0.7 + comfort * 0.3;
  
  // Bonificación por tipo robusto
  if (type === 'SUV' || type === 'Pickup') score += 0.1;
  
  return Math.max(0, Math.min(1, score));
}

function calculateQualityPriceRatio(price: number, luxury: number, reliability: number, priceStats: any): number {
  const priceNorm = normalize(price, priceStats.min, priceStats.max);
  const quality = (luxury + reliability) / 2;
  
  // Mejor ratio = más calidad por menos precio (normalizado entre 0-1)
  const ratio = quality / Math.max(0.1, priceNorm);
  return Math.max(0, Math.min(1, ratio / 3)); // Dividir por 3 para mantener en rango 0-1
}

function calculatePrestigeScore(brand: string, luxury: number, price: number, priceStats: any): number {
  const prestigeBrands = ['Mercedes', 'BMW', 'Audi', 'Porsche', 'Lexus'];
  let brandBonus = prestigeBrands.includes(brand) ? 0.2 : 0;
  
  const priceNorm = normalize(price, priceStats.min, priceStats.max);
  return Math.min(1, luxury + brandBonus + (priceNorm * 0.3));
}

// Obtener estadísticas del mercado para normalización
export async function getMarketStats() {
  const vehicles = await prisma.vehicle.findMany({
    select: {
      price: true,
      specifications: true
    }
  });
  
  const specs = vehicles.map(v => {
    try {
      return JSON.parse(v.specifications || '{}');
    } catch {
      return {};
    }
  });
  
  const powers = specs.map(s => parseFloat(s.performance?.maxPower) || parseFloat(s.combustion?.maxPower) || 150).filter(Boolean);
  const weights = specs.map(s => parseFloat(s.dimensions?.weight) || 1500).filter(Boolean);
  const topSpeeds = specs.map(s => parseFloat(s.performance?.maxSpeed) || 180).filter(Boolean);
  const clearances = specs.map(s => (parseFloat(s.chassis?.groundClearance) * 1000) || 150).filter(Boolean);
  const prices = vehicles.map(v => v.price).filter(Boolean);
  
  return {
    power_to_weight: {
      min: Math.min(...powers.map((p, i) => p / weights[i])),
      max: Math.max(...powers.map((p, i) => p / weights[i]))
    },
    top_speed: {
      min: Math.min(...topSpeeds),
      max: Math.max(...topSpeeds)
    },
    ground_clearance: {
      min: Math.min(...clearances),
      max: Math.max(...clearances)
    },
    price: {
      min: Math.min(...prices),
      max: Math.max(...prices)
    }
  };
}

// Generar tags descriptivos para un vehículo
export function generateVehicleTags(vehicle: any, features: VehicleFeatures): string[] {
  const tags: string[] = [];
  
  // Tags basados en features
  if (features.hill_climb_score > 0.7) tags.push('sube-palmas');
  if (features.potholes_score > 0.7) tags.push('resistente-huecos');
  if (features.efficiency_norm > 0.7) tags.push('economico');
  if (features.comfort_norm > 0.7) tags.push('comodo');
  if (features.prestige_norm > 0.7) tags.push('prestigioso');
  if (features.urban_score > 0.7) tags.push('urbano');
  if (features.highway_score > 0.7) tags.push('carretera');
  if (features.offroad_score > 0.7) tags.push('todoterreno');
  
  // Tags por tipo
  if (vehicle.type === 'SUV') tags.push('familiar');
  if (vehicle.type === 'Pickup') tags.push('trabajo', 'carga');
  if (vehicle.type === 'Deportivo') tags.push('deportivo', 'rapido');
  if (vehicle.fuelType === 'Eléctrico') tags.push('electrico', 'ecologico');
  
  // Tags de categorías WiseMotors si existen - interpretación inteligente
  if (vehicle.wiseCategories) {
    const wiseCategories = vehicle.wiseCategories.split(',').map((cat: string) => cat.trim().toLowerCase());
    wiseCategories.forEach((category: string) => {
      // Interpretar categorías relacionadas con velocidad/performance
      if (category.includes('correr') || category.includes('rápido') || category.includes('velocidad') || 
          category.includes('deportiv') || category.includes('racing') || category.includes('speed')) {
        tags.push('rapido', 'deportivo', 'performance');
      }
      
      // Interpretar categorías relacionadas con elegancia/estilo
      if (category.includes('chica') || category.includes('elegante') || category.includes('estilo') || 
          category.includes('bonito') || category.includes('lindo') || category.includes('fashion')) {
        tags.push('elegante', 'urbano', 'estiloso');
      }
      
      // Interpretar categorías relacionadas con terreno/subidas
      if (category.includes('subir') || category.includes('montaña') || category.includes('colina') || 
          category.includes('finca') || category.includes('tierra') || category.includes('4x4')) {
        tags.push('todoterreno', 'potente', 'rural');
      }
      
      // Interpretar categorías relacionadas con familia
      if (category.includes('familiar') || category.includes('familia') || category.includes('niños') || 
          category.includes('seguro') || category.includes('espacioso')) {
        tags.push('familiar', 'espacioso', 'seguro');
      }
      
      // Interpretar categorías relacionadas con economía
      if (category.includes('económico') || category.includes('ahorro') || category.includes('barato') || 
          category.includes('eficient') || category.includes('consumo')) {
        tags.push('economico', 'eficiente', 'ahorro');
      }
      
      // Interpretar categorías relacionadas con lujo
      if (category.includes('lujo') || category.includes('premium') || category.includes('exclusivo') || 
          category.includes('ejecutivo') || category.includes('vip')) {
        tags.push('lujo', 'premium', 'exclusivo');
      }
      
      // Interpretar categorías relacionadas con trabajo
      if (category.includes('trabajo') || category.includes('carga') || category.includes('negocio') || 
          category.includes('comercial') || category.includes('herramientas')) {
        tags.push('trabajo', 'comercial', 'utilitario');
      }
      
      // Interpretar categorías relacionadas con ciudad/urbano
      if (category.includes('ciudad') || category.includes('urbano') || category.includes('parqueo') || 
          category.includes('pequeño') || category.includes('ágil')) {
        tags.push('urbano', 'compacto', 'maniobrable');
      }
      
      // Agregar la categoría original como tag también (limpia)
      const cleanCategory = category.replace(/[^\w\s]/g, '').trim();
      if (cleanCategory.length > 2) {
        tags.push(cleanCategory.replace(/\s+/g, '_'));
      }
    });
  }
  
  return Array.from(new Set(tags)).slice(0, 10); // Remover duplicados y aumentar a 10 tags
}
