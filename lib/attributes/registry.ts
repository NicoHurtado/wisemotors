// ============================================================================
// REGISTRO DE ATRIBUTOS — fuente de verdad de qué campos existen.
// Las keys son paths reales dentro de Vehicle.specifications (bloque.campo),
// así la migración del JSON es un recorrido directo, sin mapeos mágicos.
// ============================================================================

export type AttrDataType = 'numeric' | 'boolean' | 'text' | 'enum';
export type AttrDirection = 'higher_better' | 'lower_better' | 'neutral';

export interface AttributeDef {
  key: string;
  labelEs: string;
  unit?: string;
  dataType: AttrDataType;
  direction: AttrDirection;
  appliesTo: string; // CSV de fuelTypes (valores del schema Zod) o '*'
  displayGroup: string;
  dimension: string;
  displayPriority: number;
  cardEligible?: boolean;
  coAvailability?: 'common' | 'rare' | 'never_published';
  comparable?: boolean;
  expectedMin?: number;
  expectedMax?: number;
}

// FuelTypes canónicos (los del schema Zod / BD)
export const FT = {
  GAS: 'Gasolina',
  DIESEL: 'Diesel',
  EV: 'Eléctrico',
  HEV: 'Híbrido',
  PHEV: 'Híbrido Enchufable',
} as const;

const ICE = `${FT.GAS},${FT.DIESEL}`;
const ALL = '*';

// Helper compacto
function def(
  key: string,
  labelEs: string,
  dataType: AttrDataType,
  o: Partial<Omit<AttributeDef, 'key' | 'labelEs' | 'dataType'>> = {}
): AttributeDef {
  return {
    key,
    labelEs,
    // `unit` se declara en casi todas las definiciones pero no se estaba
    // copiando: las 156 salían sin unidad, así que la UI mostraba "190" donde
    // debía decir "190 HP" y el extractor recibía un catálogo sin unidades
    // (justo el dato que evita confundir kW con HP).
    unit: o.unit,
    dataType,
    direction: o.direction ?? 'neutral',
    appliesTo: o.appliesTo ?? ALL,
    displayGroup: o.displayGroup ?? 'General',
    dimension: o.dimension ?? 'general',
    displayPriority: o.displayPriority ?? 50,
    cardEligible: o.cardEligible ?? false,
    coAvailability: o.coAvailability ?? 'common',
    comparable: o.comparable ?? true,
    expectedMin: o.expectedMin,
    expectedMax: o.expectedMax,
  };
}

const num = (k: string, l: string, o: Parameters<typeof def>[3] = {}) => def(k, l, 'numeric', o);
const bool = (k: string, l: string, o: Parameters<typeof def>[3] = {}) =>
  def(k, l, 'boolean', { direction: 'higher_better', ...o });
const txt = (k: string, l: string, o: Parameters<typeof def>[3] = {}) =>
  def(k, l, 'text', { comparable: false, ...o });
const enm = (k: string, l: string, o: Parameters<typeof def>[3] = {}) => def(k, l, 'enum', o);

// ---------------------------------------------------------------------------
// PERFORMANCE — dimensión: desempeño
// ---------------------------------------------------------------------------
const G_PERF = { displayGroup: 'Motor y desempeño', dimension: 'desempeño' };
const performance: AttributeDef[] = [
  num('performance.acceleration0to100', '0–100 km/h', { ...G_PERF, unit: 's', direction: 'lower_better', displayPriority: 90, cardEligible: true, expectedMin: 1.8, expectedMax: 25 }),
  num('performance.acceleration0to200', '0–200 km/h', { ...G_PERF, unit: 's', direction: 'lower_better', displayPriority: 40, coAvailability: 'rare', expectedMin: 5, expectedMax: 60 }),
  num('performance.quarterMile', 'Cuarto de milla', { ...G_PERF, unit: 's', direction: 'lower_better', displayPriority: 30, coAvailability: 'rare', expectedMin: 7, expectedMax: 25 }),
  num('performance.overtaking80to120', 'Adelantamiento 80–120', { ...G_PERF, unit: 's', direction: 'lower_better', displayPriority: 55, coAvailability: 'rare', expectedMin: 2, expectedMax: 20 }),
  num('performance.maxSpeed', 'Velocidad máxima', { ...G_PERF, unit: 'km/h', direction: 'higher_better', displayPriority: 60, expectedMin: 90, expectedMax: 420 }),
  num('performance.powerToWeight', 'Relación potencia/peso', { ...G_PERF, unit: 'HP/t', direction: 'higher_better', displayPriority: 70, cardEligible: true, expectedMin: 20, expectedMax: 700 }),
  bool('performance.launchControl', 'Launch control', { ...G_PERF, displayPriority: 20, coAvailability: 'rare' }),
];

// ---------------------------------------------------------------------------
// CHASSIS — dimensión: desempeño
// ---------------------------------------------------------------------------
const G_CHAS = { displayGroup: 'Chasis y frenos', dimension: 'desempeño' };
const chassis: AttributeDef[] = [
  num('chassis.groundClearance', 'Despeje al piso', { ...G_CHAS, unit: 'mm', direction: 'higher_better', displayPriority: 75, cardEligible: true, expectedMin: 80, expectedMax: 350 }),
  num('chassis.brakingDistance100to0', 'Frenado 100–0', { ...G_CHAS, unit: 'm', direction: 'lower_better', displayPriority: 70, coAvailability: 'rare', expectedMin: 28, expectedMax: 60 }),
  num('chassis.maxLateralAcceleration', 'Aceleración lateral máx.', { ...G_CHAS, unit: 'g', direction: 'higher_better', displayPriority: 30, coAvailability: 'rare', expectedMin: 0.5, expectedMax: 1.6 }),
  num('chassis.maxLongitudinalAcceleration', 'Aceleración longitudinal máx.', { ...G_CHAS, unit: 'g', direction: 'higher_better', displayPriority: 20, coAvailability: 'rare', expectedMin: 0.3, expectedMax: 1.8 }),
  txt('chassis.suspensionSetup', 'Suspensión', { ...G_CHAS, displayPriority: 45 }),
];

// ---------------------------------------------------------------------------
// OFF-ROAD — dimensión: capacidad
// ---------------------------------------------------------------------------
const G_OFF = { displayGroup: 'Todoterreno', dimension: 'capacidad' };
const offRoad: AttributeDef[] = [
  num('offRoad.approachAngle', 'Ángulo de ataque', { ...G_OFF, unit: '°', direction: 'higher_better', displayPriority: 60, expectedMin: 5, expectedMax: 55 }),
  num('offRoad.departureAngle', 'Ángulo de salida', { ...G_OFF, unit: '°', direction: 'higher_better', displayPriority: 55, expectedMin: 5, expectedMax: 55 }),
  num('offRoad.breakoverAngle', 'Ángulo ventral', { ...G_OFF, unit: '°', direction: 'higher_better', displayPriority: 50, expectedMin: 5, expectedMax: 45 }),
  num('offRoad.wadingDepth', 'Vadeo (profundidad)', { ...G_OFF, unit: 'mm', direction: 'higher_better', displayPriority: 45, coAvailability: 'rare', expectedMin: 100, expectedMax: 1000 }),
  num('offRoad.wadingHeight', 'Vadeo (altura)', { ...G_OFF, unit: 'mm', direction: 'higher_better', displayPriority: 20, coAvailability: 'rare', expectedMin: 100, expectedMax: 1000 }),
];

// ---------------------------------------------------------------------------
// WEIGHT / CARGA — dimensión: capacidad
// ---------------------------------------------------------------------------
const G_CARGA = { displayGroup: 'Peso y carga', dimension: 'capacidad' };
const weight: AttributeDef[] = [
  num('weight.grossCombinedWeight', 'Peso bruto combinado', { ...G_CARGA, unit: 'kg', displayPriority: 30, coAvailability: 'rare', expectedMin: 1000, expectedMax: 10000 }),
  num('weight.payload', 'Capacidad de carga', { ...G_CARGA, unit: 'kg', direction: 'higher_better', displayPriority: 65, cardEligible: true, expectedMin: 100, expectedMax: 2500 }),
  num('weight.towingCapacity', 'Capacidad de remolque', { ...G_CARGA, unit: 'kg', direction: 'higher_better', displayPriority: 55, expectedMin: 0, expectedMax: 5000 }),
  num('weight.cargoBoxVolume', 'Volumen del platón', { ...G_CARGA, unit: 'L', direction: 'higher_better', displayPriority: 40, coAvailability: 'rare', expectedMin: 100, expectedMax: 4000 }),
];

// ---------------------------------------------------------------------------
// DIMENSIONS — dimensión: espacio
// ---------------------------------------------------------------------------
const G_DIM = { displayGroup: 'Dimensiones', dimension: 'espacio' };
const dimensions: AttributeDef[] = [
  num('dimensions.length', 'Largo', { ...G_DIM, unit: 'mm', displayPriority: 60, expectedMin: 2500, expectedMax: 6500 }),
  num('dimensions.width', 'Ancho', { ...G_DIM, unit: 'mm', displayPriority: 55, expectedMin: 1400, expectedMax: 2300 }),
  num('dimensions.height', 'Alto', { ...G_DIM, unit: 'mm', displayPriority: 50, expectedMin: 1100, expectedMax: 2200 }),
  num('dimensions.wheelbase', 'Distancia entre ejes', { ...G_DIM, unit: 'mm', direction: 'higher_better', displayPriority: 45, expectedMin: 1800, expectedMax: 4000 }),
  num('dimensions.curbWeight', 'Peso en vacío', { ...G_DIM, unit: 'kg', displayPriority: 55, expectedMin: 600, expectedMax: 3500 }),
  num('dimensions.cargoCapacity', 'Baúl', { ...G_DIM, unit: 'L', direction: 'higher_better', displayPriority: 80, cardEligible: true, expectedMin: 50, expectedMax: 1200 }),
];

// ---------------------------------------------------------------------------
// INTERIOR — dimensión: espacio
// ---------------------------------------------------------------------------
const G_INT = { displayGroup: 'Interior y espacio', dimension: 'espacio' };
const interior: AttributeDef[] = [
  num('interior.trunkCapacitySeatsDown', 'Baúl con sillas abatidas', { ...G_INT, unit: 'L', direction: 'higher_better', displayPriority: 55, expectedMin: 100, expectedMax: 3500 }),
  num('interior.seatRows', 'Filas de asientos', { ...G_INT, direction: 'higher_better', displayPriority: 60, expectedMin: 1, expectedMax: 4 }),
  num('interior.interiorCargoCapacity', 'Capacidad interior', { ...G_INT, unit: 'L', direction: 'higher_better', displayPriority: 30, coAvailability: 'rare', expectedMin: 50, expectedMax: 5000 }),
  num('interior.passengerCapacity', 'Pasajeros', { ...G_INT, direction: 'higher_better', displayPriority: 85, cardEligible: true, expectedMin: 2, expectedMax: 9 }),
];

// ---------------------------------------------------------------------------
// SAFETY — dimensión: seguridad
// ---------------------------------------------------------------------------
const G_SAF = { displayGroup: 'Seguridad', dimension: 'seguridad' };
const safety: AttributeDef[] = [
  num('safety.airbags', 'Airbags', { ...G_SAF, direction: 'higher_better', displayPriority: 90, cardEligible: true, expectedMin: 0, expectedMax: 12 }),
  num('safety.ncapRating', 'Calificación NCAP', { ...G_SAF, unit: '★', direction: 'higher_better', displayPriority: 95, cardEligible: true, expectedMin: 0, expectedMax: 5 }),
  num('safety.adultSafetyScore', 'Protección adultos NCAP', { ...G_SAF, unit: '%', direction: 'higher_better', displayPriority: 60, coAvailability: 'rare', expectedMin: 0, expectedMax: 100 }),
  num('safety.childSafetyScore', 'Protección niños NCAP', { ...G_SAF, unit: '%', direction: 'higher_better', displayPriority: 60, coAvailability: 'rare', expectedMin: 0, expectedMax: 100 }),
  num('safety.assistanceScore', 'Asistencias NCAP', { ...G_SAF, unit: '%', direction: 'higher_better', displayPriority: 40, coAvailability: 'rare', expectedMin: 0, expectedMax: 100 }),
  txt('safety.brakingSystem', 'Sistema de frenos', { ...G_SAF, displayPriority: 50 }),
  bool('safety.stabilityControl', 'Control de estabilidad', { ...G_SAF, displayPriority: 85 }),
  bool('safety.tractionControl', 'Control de tracción', { ...G_SAF, displayPriority: 80 }),
  bool('safety.autonomousEmergencyBraking', 'Frenado autónomo de emergencia', { ...G_SAF, displayPriority: 88 }),
  bool('safety.forwardCollisionWarning', 'Alerta de colisión frontal', { ...G_SAF, displayPriority: 70 }),
  bool('safety.laneAssist', 'Asistente de carril', { ...G_SAF, displayPriority: 75 }),
  bool('safety.adaptiveCruiseControl', 'Crucero adaptativo', { ...G_SAF, displayPriority: 72 }),
  bool('safety.blindSpotDetection', 'Punto ciego', { ...G_SAF, displayPriority: 74 }),
  bool('safety.crossTrafficAlert', 'Alerta de tráfico cruzado', { ...G_SAF, displayPriority: 55 }),
  bool('safety.fatigueMonitor', 'Monitor de fatiga', { ...G_SAF, displayPriority: 45 }),
  bool('safety.tirePressureMonitoring', 'Monitoreo presión llantas', { ...G_SAF, displayPriority: 50 }),
];

// ---------------------------------------------------------------------------
// LIGHTING + ASSISTANCE — dimensión: seguridad
// ---------------------------------------------------------------------------
const lighting: AttributeDef[] = [
  enm('lighting.headlightType', 'Tipo de faros', { displayGroup: 'Seguridad', dimension: 'seguridad', displayPriority: 40 }),
];

const G_ASSIST = { displayGroup: 'Asistencias de manejo', dimension: 'seguridad' };
const assistance: AttributeDef[] = [
  bool('assistance.brakeAssist', 'Asistente de frenado', { ...G_ASSIST, displayPriority: 60 }),
  bool('assistance.hillStartAssist', 'Asistente de arranque en pendiente', { ...G_ASSIST, displayPriority: 72, cardEligible: true }),
  bool('assistance.reverseCamera', 'Cámara de reversa', { ...G_ASSIST, displayPriority: 80 }),
  bool('assistance.parkingSensors', 'Sensores de parqueo', { ...G_ASSIST, displayPriority: 75 }),
  bool('assistance.cameras360', 'Cámaras 360°', { ...G_ASSIST, displayPriority: 55 }),
];

// ---------------------------------------------------------------------------
// COMFORT — dimensión: confort
// ---------------------------------------------------------------------------
const G_COMF = { displayGroup: 'Confort', dimension: 'confort' };
const comfort: AttributeDef[] = [
  bool('comfort.airConditioning', 'Aire acondicionado', { ...G_COMF, displayPriority: 85 }),
  bool('comfort.automaticClimateControl', 'Climatizador automático', { ...G_COMF, displayPriority: 70 }),
  bool('comfort.heatedSeats', 'Asientos calefaccionados', { ...G_COMF, displayPriority: 40, coAvailability: 'rare' }),
  bool('comfort.ventilatedSeats', 'Asientos ventilados', { ...G_COMF, displayPriority: 45 }),
  bool('comfort.massageSeats', 'Asientos con masaje', { ...G_COMF, displayPriority: 25, coAvailability: 'rare' }),
  bool('comfort.automaticHighBeam', 'Luces altas automáticas', { ...G_COMF, displayPriority: 35 }),
];

// ---------------------------------------------------------------------------
// TECHNOLOGY — dimensión: tecnología
// ---------------------------------------------------------------------------
const G_TECH = { displayGroup: 'Tecnología', dimension: 'tecnología' };
const technology: AttributeDef[] = [
  bool('technology.bluetooth', 'Bluetooth', { ...G_TECH, displayPriority: 60 }),
  bool('technology.touchscreen', 'Pantalla táctil', { ...G_TECH, displayPriority: 70 }),
  bool('technology.navigation', 'Navegación', { ...G_TECH, displayPriority: 50 }),
  txt('technology.smartphoneIntegration', 'CarPlay / Android Auto', { ...G_TECH, displayPriority: 85, cardEligible: true, comparable: true }),
  bool('technology.wirelessCharger', 'Cargador inalámbrico', { ...G_TECH, displayPriority: 45 }),
  bool('technology.startStop', 'Start-Stop', { ...G_TECH, displayPriority: 40 }),
];

// ---------------------------------------------------------------------------
// WISEMETRICS — dimensión: editorial (curados a mano, el activo de la casa)
// ---------------------------------------------------------------------------
const G_WISE = { displayGroup: 'WiseMetrics', dimension: 'editorial' };
const wm = (field: string, label: string, priority = 50, card = false): AttributeDef =>
  num(`wisemetrics.${field}`, label, { ...G_WISE, direction: 'higher_better', displayPriority: priority, cardEligible: card, expectedMin: 0, expectedMax: 100 });

const wisemetrics: AttributeDef[] = [
  wm('drivingFun', 'Diversión al manejar', 80, true),
  wm('technology', 'Tecnología (Wise)', 60),
  wm('environmentalImpact', 'Impacto ambiental', 50),
  wm('reliability', 'Confiabilidad', 90, true),
  wm('qualityPriceRatio', 'Relación calidad-precio', 85, true),
  wm('comfort', 'Confort (Wise)', 75),
  wm('usability', 'Usabilidad', 40),
  wm('efficiency', 'Eficiencia (Wise)', 70),
  wm('prestige', 'Prestigio', 65),
  { ...wm('userRating', 'Calificación usuarios', 55), expectedMax: 5, unit: '★' },
  wm('interiorQuality', 'Calidad interior', 60),
  wm('easeOfUse', 'Facilidad de uso', 35),
  wm('easeOfParking', 'Facilidad de parqueo', 55),
  wm('practicality', 'Practicidad', 65),
  wm('serviceConvenience', 'Conveniencia de servicio', 60),
  wm('experience', 'Experiencia', 40),
  wm('visibility', 'Visibilidad', 45),
  wm('easeOfCleaning', 'Facilidad de limpieza', 20),
  wm('petFriendly', 'Pet friendly', 35),
  wm('familyFriendly', 'Family friendly', 75, true),
];

// ---------------------------------------------------------------------------
// COMBUSTION — solo Gasolina / Diesel
// ---------------------------------------------------------------------------
const G_MOTOR_ICE = { displayGroup: 'Motor a combustión', dimension: 'motor', appliesTo: ICE };
const combustion: AttributeDef[] = [
  num('combustion.displacement', 'Cilindraje', { ...G_MOTOR_ICE, unit: 'cc', displayPriority: 80, cardEligible: true, expectedMin: 600, expectedMax: 8500 }),
  bool('combustion.turbo', 'Turbo', { ...G_MOTOR_ICE, displayPriority: 75, cardEligible: true }),
  bool('combustion.supercharger', 'Supercargador', { ...G_MOTOR_ICE, displayPriority: 30, coAvailability: 'rare' }),
  enm('combustion.engineConfiguration', 'Configuración del motor', { ...G_MOTOR_ICE, displayPriority: 45 }),
  enm('combustion.inductionType', 'Tipo de inducción', { ...G_MOTOR_ICE, displayPriority: 50 }),
  num('combustion.compressionRatio', 'Relación de compresión', { ...G_MOTOR_ICE, displayPriority: 25, coAvailability: 'rare', expectedMin: 7, expectedMax: 16 }),
  txt('combustion.octanajeRecomendado', 'Octanaje recomendado', { ...G_MOTOR_ICE, displayPriority: 40 }),
  num('combustion.maxPower', 'Potencia máxima', { ...G_MOTOR_ICE, unit: 'HP', direction: 'higher_better', displayPriority: 95, cardEligible: true, expectedMin: 40, expectedMax: 1600 }),
  num('combustion.maxTorque', 'Torque máximo', { ...G_MOTOR_ICE, unit: 'Nm', direction: 'higher_better', displayPriority: 90, cardEligible: true, expectedMin: 60, expectedMax: 1500 }),
  num('combustion.rpmLimit', 'Corte de RPM', { ...G_MOTOR_ICE, unit: 'rpm', displayPriority: 20, coAvailability: 'rare', expectedMin: 4000, expectedMax: 10000 }),
  enm('combustion.transmissionType', 'Transmisión', { ...G_MOTOR_ICE, displayPriority: 85, cardEligible: true }),
  num('combustion.gears', 'Marchas', { ...G_MOTOR_ICE, displayPriority: 55, expectedMin: 1, expectedMax: 10 }),
  num('combustion.fuelTankCapacity', 'Tanque de combustible', { ...G_MOTOR_ICE, unit: 'gal', displayPriority: 50, expectedMin: 5, expectedMax: 40 }),
  num('combustion.powerAtRpm', 'Potencia @ RPM', { ...G_MOTOR_ICE, unit: 'rpm', displayPriority: 25, coAvailability: 'rare', expectedMin: 1000, expectedMax: 9000 }),
  num('combustion.cityConsumption', 'Consumo ciudad', { ...G_MOTOR_ICE, unit: 'km/gal', direction: 'higher_better', displayPriority: 85, cardEligible: true, dimension: 'eficiencia', expectedMin: 10, expectedMax: 90 }),
  num('combustion.highwayConsumption', 'Consumo carretera', { ...G_MOTOR_ICE, unit: 'km/gal', direction: 'higher_better', displayPriority: 80, dimension: 'eficiencia', expectedMin: 15, expectedMax: 110 }),
  num('combustion.combinedConsumption', 'Consumo mixto', { ...G_MOTOR_ICE, unit: 'km/gal', direction: 'higher_better', displayPriority: 88, cardEligible: true, dimension: 'eficiencia', expectedMin: 12, expectedMax: 100 }),
  txt('combustion.emissionStandard', 'Norma de emisiones', { ...G_MOTOR_ICE, displayPriority: 30, dimension: 'eficiencia' }),
  bool('combustion.startStop', 'Start-Stop (motor)', { ...G_MOTOR_ICE, displayPriority: 35, dimension: 'eficiencia' }),
  bool('combustion.ecoMode', 'Modo eco', { ...G_MOTOR_ICE, displayPriority: 30, dimension: 'eficiencia' }),
  txt('combustion.ahorro5Anos', 'Ahorro estimado 5 años', { ...G_MOTOR_ICE, displayPriority: 40, dimension: 'costo' }),
];

// ---------------------------------------------------------------------------
// ELECTRIC — solo Eléctrico
// ---------------------------------------------------------------------------
const G_EV = { displayGroup: 'Eléctrico', dimension: 'motor', appliesTo: FT.EV };
const G_EV_EF = { ...G_EV, dimension: 'eficiencia' };
const electric: AttributeDef[] = [
  num('electric.cityElectricConsumption', 'Consumo eléctrico ciudad', { ...G_EV_EF, unit: 'kWh/100km', direction: 'lower_better', displayPriority: 70, expectedMin: 8, expectedMax: 35 }),
  num('electric.highwayElectricConsumption', 'Consumo eléctrico carretera', { ...G_EV_EF, unit: 'kWh/100km', direction: 'lower_better', displayPriority: 65, expectedMin: 10, expectedMax: 40 }),
  num('electric.electricRange', 'Autonomía', { ...G_EV, unit: 'km', direction: 'higher_better', displayPriority: 95, cardEligible: true, expectedMin: 80, expectedMax: 900 }),
  num('electric.theoreticalRangeHighway', 'Autonomía teórica carretera', { ...G_EV, unit: 'km', direction: 'higher_better', displayPriority: 40, coAvailability: 'rare', expectedMin: 50, expectedMax: 900 }),
  num('electric.theoreticalRangeCity', 'Autonomía teórica ciudad', { ...G_EV, unit: 'km', direction: 'higher_better', displayPriority: 40, coAvailability: 'rare', expectedMin: 50, expectedMax: 1000 }),
  num('electric.theoreticalRangeMixed', 'Autonomía teórica mixta', { ...G_EV, unit: 'km', direction: 'higher_better', displayPriority: 45, coAvailability: 'rare', expectedMin: 50, expectedMax: 950 }),
  num('electric.realRangeHighway', 'Autonomía real carretera', { ...G_EV, unit: 'km', direction: 'higher_better', displayPriority: 75, coAvailability: 'rare', expectedMin: 50, expectedMax: 850 }),
  num('electric.realRangeCity', 'Autonomía real ciudad', { ...G_EV, unit: 'km', direction: 'higher_better', displayPriority: 78, coAvailability: 'rare', expectedMin: 50, expectedMax: 950 }),
  num('electric.realRangeMixed', 'Autonomía real mixta', { ...G_EV, unit: 'km', direction: 'higher_better', displayPriority: 80, cardEligible: true, coAvailability: 'rare', expectedMin: 50, expectedMax: 900 }),
  num('electric.acChargingTime', 'Carga AC', { ...G_EV, unit: 'h', direction: 'lower_better', displayPriority: 60, expectedMin: 1, expectedMax: 40 }),
  num('electric.dcChargingTime', 'Carga DC rápida', { ...G_EV, unit: 'min', direction: 'lower_better', displayPriority: 85, cardEligible: true, expectedMin: 10, expectedMax: 240 }),
  num('electric.chargingTime1080', 'Carga 10–80%', { ...G_EV, unit: 'min', direction: 'lower_better', displayPriority: 82, expectedMin: 10, expectedMax: 180 }),
  bool('electric.regenerativeBraking', 'Frenado regenerativo', { ...G_EV, displayPriority: 50 }),
  num('electric.batteryCapacity', 'Capacidad de batería', { ...G_EV, unit: 'kWh', direction: 'higher_better', displayPriority: 88, cardEligible: true, expectedMin: 10, expectedMax: 200 }),
  num('electric.batteryPrice', 'Precio de la batería', { ...G_EV, unit: 'COP', direction: 'lower_better', displayPriority: 35, dimension: 'costo', coAvailability: 'rare', expectedMin: 5_000_000, expectedMax: 300_000_000 }),
  num('electric.homeChargerCost', 'Costo cargador en casa', { ...G_EV, unit: 'COP', direction: 'lower_better', displayPriority: 40, dimension: 'costo', coAvailability: 'rare', expectedMin: 500_000, expectedMax: 20_000_000 }),
  num('electric.chargingConvenienceIndex', 'Índice conveniencia de carga', { ...G_EV, direction: 'higher_better', displayPriority: 45, coAvailability: 'rare', expectedMin: 0, expectedMax: 100 }),
];

// ---------------------------------------------------------------------------
// HYBRID — solo Híbrido
// ---------------------------------------------------------------------------
const G_HEV = { displayGroup: 'Híbrido', dimension: 'motor', appliesTo: FT.HEV };
const hybrid: AttributeDef[] = [
  num('hybrid.displacement', 'Cilindraje (HEV)', { ...G_HEV, unit: 'cc', displayPriority: 70, expectedMin: 600, expectedMax: 6000 }),
  enm('hybrid.engineConfiguration', 'Configuración del motor (HEV)', { ...G_HEV, displayPriority: 35 }),
  num('hybrid.maxPower', 'Potencia máxima (HEV)', { ...G_HEV, unit: 'HP', direction: 'higher_better', displayPriority: 95, cardEligible: true, expectedMin: 60, expectedMax: 800 }),
  num('hybrid.maxTorque', 'Torque máximo (HEV)', { ...G_HEV, unit: 'Nm', direction: 'higher_better', displayPriority: 90, cardEligible: true, expectedMin: 90, expectedMax: 1000 }),
  enm('hybrid.transmissionType', 'Transmisión (HEV)', { ...G_HEV, displayPriority: 80 }),
  num('hybrid.gears', 'Marchas (HEV)', { ...G_HEV, displayPriority: 45, expectedMin: 1, expectedMax: 10 }),
  num('hybrid.fuelTankCapacity', 'Tanque (HEV)', { ...G_HEV, unit: 'gal', displayPriority: 45, expectedMin: 5, expectedMax: 30 }),
  num('hybrid.cityConsumption', 'Consumo ciudad (HEV)', { ...G_HEV, unit: 'km/gal', direction: 'higher_better', displayPriority: 90, cardEligible: true, dimension: 'eficiencia', expectedMin: 20, expectedMax: 130 }),
  num('hybrid.highwayConsumption', 'Consumo carretera (HEV)', { ...G_HEV, unit: 'km/gal', direction: 'higher_better', displayPriority: 82, dimension: 'eficiencia', expectedMin: 20, expectedMax: 120 }),
  num('hybrid.batteryCapacity', 'Batería (HEV)', { ...G_HEV, unit: 'kWh', direction: 'higher_better', displayPriority: 55, expectedMin: 0.5, expectedMax: 5 }),
  bool('hybrid.regenerativeBraking', 'Frenado regenerativo (HEV)', { ...G_HEV, displayPriority: 50 }),
  bool('hybrid.startStop', 'Start-Stop (HEV)', { ...G_HEV, displayPriority: 30, dimension: 'eficiencia' }),
  bool('hybrid.ecoMode', 'Modo eco (HEV)', { ...G_HEV, displayPriority: 30, dimension: 'eficiencia' }),
];

// ---------------------------------------------------------------------------
// PHEV — solo Híbrido Enchufable
// ---------------------------------------------------------------------------
const G_PHEV = { displayGroup: 'Híbrido enchufable', dimension: 'motor', appliesTo: FT.PHEV };
const phev: AttributeDef[] = [
  num('phev.displacement', 'Cilindraje (PHEV)', { ...G_PHEV, unit: 'cc', displayPriority: 65, expectedMin: 600, expectedMax: 6000 }),
  enm('phev.engineConfiguration', 'Configuración del motor (PHEV)', { ...G_PHEV, displayPriority: 30 }),
  num('phev.maxPower', 'Potencia máxima (PHEV)', { ...G_PHEV, unit: 'HP', direction: 'higher_better', displayPriority: 95, cardEligible: true, expectedMin: 80, expectedMax: 900 }),
  num('phev.maxTorque', 'Torque máximo (PHEV)', { ...G_PHEV, unit: 'Nm', direction: 'higher_better', displayPriority: 90, cardEligible: true, expectedMin: 120, expectedMax: 1200 }),
  enm('phev.transmissionType', 'Transmisión (PHEV)', { ...G_PHEV, displayPriority: 78 }),
  num('phev.gears', 'Marchas (PHEV)', { ...G_PHEV, displayPriority: 40, expectedMin: 1, expectedMax: 10 }),
  num('phev.fuelTankCapacity', 'Tanque (PHEV)', { ...G_PHEV, unit: 'gal', displayPriority: 42, expectedMin: 5, expectedMax: 30 }),
  num('phev.cityConsumption', 'Consumo ciudad (PHEV)', { ...G_PHEV, unit: 'km/gal', direction: 'higher_better', displayPriority: 80, dimension: 'eficiencia', expectedMin: 20, expectedMax: 200 }),
  num('phev.highwayConsumption', 'Consumo carretera (PHEV)', { ...G_PHEV, unit: 'km/gal', direction: 'higher_better', displayPriority: 75, dimension: 'eficiencia', expectedMin: 20, expectedMax: 180 }),
  num('phev.batteryCapacity', 'Batería (PHEV)', { ...G_PHEV, unit: 'kWh', direction: 'higher_better', displayPriority: 82, expectedMin: 5, expectedMax: 40 }),
  num('phev.electricRange', 'Autonomía eléctrica (PHEV)', { ...G_PHEV, unit: 'km', direction: 'higher_better', displayPriority: 92, cardEligible: true, expectedMin: 10, expectedMax: 200 }),
  num('phev.acChargingTime', 'Carga AC (PHEV)', { ...G_PHEV, unit: 'h', direction: 'lower_better', displayPriority: 55, expectedMin: 1, expectedMax: 15 }),
  num('phev.dcChargingTime', 'Carga DC (PHEV)', { ...G_PHEV, unit: 'min', direction: 'lower_better', displayPriority: 50, coAvailability: 'rare', expectedMin: 10, expectedMax: 240 }),
  bool('phev.regenerativeBraking', 'Frenado regenerativo (PHEV)', { ...G_PHEV, displayPriority: 45 }),
  num('phev.batteryWeight', 'Peso de la batería (PHEV)', { ...G_PHEV, unit: 'kg', displayPriority: 20, coAvailability: 'rare', expectedMin: 50, expectedMax: 500 }),
  num('phev.homeChargerCost', 'Costo cargador en casa (PHEV)', { ...G_PHEV, unit: 'COP', direction: 'lower_better', displayPriority: 35, dimension: 'costo', coAvailability: 'rare', expectedMin: 500_000, expectedMax: 20_000_000 }),
  num('phev.chargingConvenienceIndex', 'Índice conveniencia de carga (PHEV)', { ...G_PHEV, direction: 'higher_better', displayPriority: 40, coAvailability: 'rare', expectedMin: 0, expectedMax: 100 }),
];

// ---------------------------------------------------------------------------
// COMERCIAL — dimensión: costo (datos de mercado, no de la máquina)
// ---------------------------------------------------------------------------
const G_COM = { displayGroup: 'Comercial', dimension: 'costo' };
const commercial: AttributeDef[] = [
  num('commercial.priceCop', 'Precio de lista (Colombia)', { ...G_COM, unit: 'COP', direction: 'lower_better', displayPriority: 95, cardEligible: true, expectedMin: 30_000_000, expectedMax: 3_000_000_000 }),
  num('commercial.warrantyYears', 'Garantía', { ...G_COM, unit: 'años', direction: 'higher_better', displayPriority: 60, expectedMin: 1, expectedMax: 10 }),
  num('commercial.warrantyKm', 'Garantía en km', { ...G_COM, unit: 'km', direction: 'higher_better', displayPriority: 55, expectedMin: 20_000, expectedMax: 1_000_000 }),
];

// ---------------------------------------------------------------------------
// REGISTRO COMPLETO
// ---------------------------------------------------------------------------
export const ATTRIBUTE_REGISTRY: AttributeDef[] = [
  ...commercial,
  ...performance,
  ...chassis,
  ...offRoad,
  ...weight,
  ...dimensions,
  ...interior,
  ...safety,
  ...lighting,
  ...assistance,
  ...comfort,
  ...technology,
  ...wisemetrics,
  ...combustion,
  ...electric,
  ...hybrid,
  ...phev,
];

// Dimensiones usadas para cobertura (editorial se excluye: es curaduría, no dato)
export const COVERAGE_DIMENSIONS = [
  'desempeño',
  'capacidad',
  'espacio',
  'seguridad',
  'confort',
  'tecnología',
  'motor',
  'eficiencia',
  'costo',
] as const;

/** ¿Este atributo aplica a un vehículo con este fuelType? */
export function attributeAppliesTo(defn: Pick<AttributeDef, 'appliesTo'>, fuelType: string): boolean {
  if (defn.appliesTo === '*') return true;
  return defn.appliesTo.split(',').map(s => s.trim()).includes(fuelType);
}
