import { FavoriteVehicle } from '@/hooks/useFavorites';

export interface CompareField {
  key: string;
  label: string;
  unit?: string;
  better: 'higher' | 'lower' | 'boolean';
  category: string;
  icon?: string;
  description?: string;
}

export interface CompareSection {
  key: string;
  label: string;
  icon: string;
  fields: CompareField[];
}

export const COMPARE_SECTIONS: CompareSection[] = [
  {
    key: 'general',
    label: 'Información General',
    icon: '📋',
    fields: [
      { key: 'brand', label: 'Marca', better: 'boolean', category: 'general' },
      { key: 'model', label: 'Modelo', better: 'boolean', category: 'general' },
      { key: 'year', label: 'Año', better: 'higher', category: 'general' },
      { key: 'price', label: 'Precio', unit: 'COP', better: 'lower', category: 'general' },
      { key: 'fuelType', label: 'Combustible', better: 'boolean', category: 'general' },
      { key: 'type', label: 'Tipo', better: 'boolean', category: 'general' },
    ]
  },
  {
    key: 'performance',
    label: 'Rendimiento',
    icon: '🚀',
    fields: [
      { key: 'maxPower', label: 'Potencia', unit: 'HP', better: 'higher', category: 'performance' },
      { key: 'maxTorque', label: 'Par Motor', unit: 'Nm', better: 'higher', category: 'performance' },
      { key: 'acceleration0to100', label: '0-100 km/h', unit: 's', better: 'lower', category: 'performance' },
      { key: 'maxSpeed', label: 'Velocidad Máx', unit: 'km/h', better: 'higher', category: 'performance' },
      { key: 'quarterMile', label: '1/4 Milla', unit: 's', better: 'lower', category: 'performance' },
      { key: 'brakingDistance100to0', label: 'Frenado 100-0', unit: 'm', better: 'lower', category: 'performance' },
    ]
  },
  {
    key: 'engine',
    label: 'Motor',
    icon: '⚙️',
    fields: [
      { key: 'displacement', label: 'Cilindrada', unit: 'cc', better: 'higher', category: 'engine' },
      { key: 'inductionType', label: 'Inducción', better: 'boolean', category: 'engine' },
      { key: 'compressionRatio', label: 'Compresión', better: 'higher', category: 'engine' },
      { key: 'gears', label: 'Marchas', better: 'higher', category: 'engine' },
      { key: 'transmissionType', label: 'Transmisión', better: 'boolean', category: 'engine' },
      { key: 'fuelTankCapacity', label: 'Tanque', unit: 'L', better: 'higher', category: 'engine' },
    ]
  },
  {
    key: 'consumption',
    label: 'Consumo',
    icon: '⛽',
    fields: [
      { key: 'cityConsumption', label: 'Ciudad', unit: 'L/100km', better: 'lower', category: 'consumption' },
      { key: 'highwayConsumption', label: 'Carretera', unit: 'L/100km', better: 'lower', category: 'consumption' },
      { key: 'electricRange', label: 'Autonomía Eléctrica', unit: 'km', better: 'higher', category: 'consumption' },
      { key: 'acChargingTime', label: 'Tiempo Carga AC', unit: 'h', better: 'lower', category: 'consumption' },
    ]
  },
  {
    key: 'dimensions',
    label: 'Dimensiones',
    icon: '📏',
    fields: [
      { key: 'length', label: 'Longitud', unit: 'mm', better: 'boolean', category: 'dimensions' },
      { key: 'width', label: 'Ancho', unit: 'mm', better: 'boolean', category: 'dimensions' },
      { key: 'height', label: 'Altura', unit: 'mm', better: 'boolean', category: 'dimensions' },
      { key: 'wheelbase', label: 'Distancia entre Ejes', unit: 'mm', better: 'boolean', category: 'dimensions' },
      { key: 'curbWeight', label: 'Peso', unit: 'kg', better: 'lower', category: 'dimensions' },
    ]
  },
  {
    key: 'capacities',
    label: 'Capacidades',
    icon: '👥',
    fields: [
      { key: 'passengerCapacity', label: 'Pasajeros', better: 'higher', category: 'capacities' },
      { key: 'cargoCapacity', label: 'Carga', unit: 'L', better: 'higher', category: 'capacities' },
      { key: 'towingCapacity', label: 'Remolque', unit: 'kg', better: 'higher', category: 'capacities' },
      { key: 'payload', label: 'Carga Útil', unit: 'kg', better: 'higher', category: 'capacities' },
    ]
  },
  {
    key: 'safety',
    label: 'Seguridad',
    icon: '🛡️',
    fields: [
      { key: 'airbags', label: 'Airbags', better: 'higher', category: 'safety' },
      { key: 'ncapRating', label: 'Calificación NCAP', better: 'higher', category: 'safety' },
      { key: 'stabilityControl', label: 'Control Estabilidad', better: 'boolean', category: 'safety' },
      { key: 'tractionControl', label: 'Control Tracción', better: 'boolean', category: 'safety' },
      { key: 'autonomousEmergencyBraking', label: 'Frenado Emergencia', better: 'boolean', category: 'safety' },
      { key: 'laneAssist', label: 'Asistente Carril', better: 'boolean', category: 'safety' },
    ]
  },
  {
    key: 'comfort',
    label: 'Confort',
    icon: '🪑',
    fields: [
      { key: 'airConditioning', label: 'Aire Acondicionado', better: 'boolean', category: 'comfort' },
      { key: 'automaticClimateControl', label: 'Clima Automático', better: 'boolean', category: 'comfort' },
      { key: 'heatedSeats', label: 'Asientos Calefactados', better: 'boolean', category: 'comfort' },
      { key: 'ventilatedSeats', label: 'Asientos Ventilados', better: 'boolean', category: 'comfort' },
      { key: 'massageSeats', label: 'Asientos Masaje', better: 'boolean', category: 'comfort' },
    ]
  },
  {
    key: 'technology',
    label: 'Tecnología',
    icon: '📱',
    fields: [
      { key: 'bluetooth', label: 'Bluetooth', better: 'boolean', category: 'technology' },
      { key: 'touchscreen', label: 'Pantalla Táctil', better: 'boolean', category: 'technology' },
      { key: 'navigation', label: 'Navegación', better: 'boolean', category: 'technology' },
      { key: 'smartphoneIntegration', label: 'Integración Smartphone', better: 'boolean', category: 'technology' },
      { key: 'wirelessCharger', label: 'Cargador Inalámbrico', better: 'boolean', category: 'technology' },
    ]
  },
  {
    key: 'wisemetrics',
    label: 'WiseMetrics',
    icon: '⭐',
    fields: [
      { key: 'drivingFun', label: 'Diversión al Conducir', unit: '/100', better: 'higher', category: 'wisemetrics' },
      { key: 'technology', label: 'Tecnología', unit: '/100', better: 'higher', category: 'wisemetrics' },
      { key: 'environmentalImpact', label: 'Impacto Ambiental', unit: '/100', better: 'higher', category: 'wisemetrics' },
      { key: 'reliability', label: 'Confiabilidad', unit: '/100', better: 'higher', category: 'wisemetrics' },
      { key: 'qualityPriceRatio', label: 'Relación Calidad-Precio', unit: '/100', better: 'higher', category: 'wisemetrics' },
      { key: 'comfort', label: 'Confort', unit: '/100', better: 'higher', category: 'wisemetrics' },
      { key: 'usability', label: 'Usabilidad', unit: '/100', better: 'higher', category: 'wisemetrics' },
      { key: 'efficiency', label: 'Eficiencia', unit: '/100', better: 'higher', category: 'wisemetrics' },
      { key: 'prestige', label: 'Prestigio', unit: '/100', better: 'higher', category: 'wisemetrics' },
    ]
  }
];

export interface VehicleComparisonData extends FavoriteVehicle {
  specifications?: any; // Especificaciones completas del vehículo
  highlights?: string[]; // Highlights generados desde specs
  matchPercentage?: number; // Porcentaje de match si existe
}

export function getFieldValue(vehicle: VehicleComparisonData, fieldKey: string): any {
  if (!vehicle.specifications) return null;
  
  // Buscar en diferentes niveles de especificaciones
  const keys = fieldKey.split('.');
  let value = vehicle.specifications;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return null;
    }
  }
  
  return value;
}

export function getFieldDisplayValue(vehicle: VehicleComparisonData, field: CompareField): string {
  const value = getFieldValue(vehicle, field.key);
  
  if (value === null || value === undefined) return 'N/A';
  
  if (typeof value === 'boolean') {
    return value ? '✓' : '✗';
  }
  
  if (typeof value === 'number') {
    if (field.unit) {
      return `${value} ${field.unit}`;
    }
    return value.toString();
  }
  
  return value.toString();
}

export function getWinnerIndex(vehicles: VehicleComparisonData[], field: CompareField): number | null {
  const values = vehicles.map(v => getFieldValue(v, field.key));
  
  // Filtrar valores válidos (no null/undefined)
  const validValues = values.filter(v => v !== null && v !== undefined);
  if (validValues.length === 0) return null;
  
  let bestValue: any;
  let bestIndex: number = -1;
  
  if (field.better === 'higher') {
    bestValue = Math.max(...validValues);
  } else if (field.better === 'lower') {
    bestValue = Math.min(...validValues);
  } else {
    // Para booleanos, contar cuántos son true
    const trueCount = validValues.filter(v => v === true).length;
    if (trueCount === 0) return null;
    if (trueCount === 1) {
      bestIndex = values.findIndex(v => v === true);
      return bestIndex;
    }
    // Si hay empate, no hay ganador único
    return null;
  }
  
  bestIndex = values.findIndex(v => v === bestValue);
  
  // Verificar si hay empate
  const winners = values.filter(v => v === bestValue);
  if (winners.length > 1) return null; // Empate
  
  return bestIndex;
}


