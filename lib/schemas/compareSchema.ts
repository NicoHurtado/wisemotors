import { FavoriteVehicle } from '@/hooks/useFavorites';

export interface CompareField {
  key: string;
  label: string;
  unit?: string;
  better: 'higher' | 'lower' | 'boolean';
  category: string;
  icon?: string;
  description?: string;
  formatter?: (val: any, fuelType?: string) => string | undefined;
}

export interface CompareSection {
  key: string;
  label: string;
  icon: string;
  fields: CompareField[];
  conditional?: (fuelType: string) => boolean; // Para mostrar secciones solo para ciertos tipos de combustible
}

export const COMPARE_SECTIONS: CompareSection[] = [
  {
    key: 'identification',
    label: 'Identificación',
    icon: '📋',
    fields: [
      { key: 'year', label: 'Año modelo', better: 'higher', category: 'identification' },
      { key: 'carroceria', label: 'Carrocería', better: 'boolean', category: 'identification' },
      { key: 'plazas', label: 'Plazas', better: 'higher', category: 'identification' },
      { key: 'puertas', label: 'Puertas', better: 'boolean', category: 'identification' },
      { key: 'versionTrim', label: 'Versión/Trim', better: 'boolean', category: 'identification' },
    ]
  },
  {
    key: 'powertrain-electric',
    label: 'Motorización Eléctrica',
    icon: '⚡',
    fields: [
      { key: 'potenciaMaxEV', label: 'Potencia Máxima (EV)', unit: 'kW', better: 'higher', category: 'powertrain' },
      { key: 'torqueMaxEV', label: 'Torque Máximo (EV)', unit: 'Nm', better: 'higher', category: 'powertrain' },
      { key: 'capacidadBrutaBateria', label: 'Capacidad de Batería', unit: 'kWh', better: 'higher', category: 'powertrain' },
    ],
    conditional: (fuelType) => fuelType?.toLowerCase().includes('eléctrico') || fuelType?.toLowerCase().includes('electric')
  },
  {
    key: 'powertrain-hybrid',
    label: 'Motorización Híbrida',
    icon: '🔋',
    fields: [
      { key: 'alimentacion', label: 'Alimentación', better: 'boolean', category: 'powertrain' },
      { key: 'arquitecturaMotorTermico', label: 'Arquitectura motor térmico', better: 'boolean', category: 'powertrain' },
      { key: 'cicloTrabajo', label: 'Ciclo de trabajo', better: 'boolean', category: 'powertrain' },
      { key: 'cilindrada', label: 'Cilindrada', unit: 'L', better: 'higher', category: 'powertrain' },
      { key: 'combustible', label: 'Combustible', better: 'boolean', category: 'powertrain' },
      { key: 'modosConduccion', label: 'Modos de conducción', better: 'boolean', category: 'powertrain' },
      { key: 'octanajeRecomendado', label: 'Octanaje recomendado', unit: 'RON', better: 'boolean', category: 'powertrain' },
      { key: 'potenciaMaxMotorTermico', label: 'Potencia máx. (motor térmico)', unit: 'kW', better: 'higher', category: 'powertrain' },
      { key: 'potenciaMaxSistemaHibrido', label: 'Potencia máx. (sistema híbrido)', unit: 'kW', better: 'higher', category: 'powertrain' },
      { key: 'torqueMaxMotorTermico', label: 'Torque máx. (motor térmico)', unit: 'Nm', better: 'higher', category: 'powertrain' },
      { key: 'torqueMaxSistemaHibrido', label: 'Torque máx. (sistema híbrido)', unit: 'Nm', better: 'higher', category: 'powertrain' },
      { key: 'startStop', label: 'Sistema Start-Stop', better: 'boolean', category: 'powertrain' },
      { key: 'launchControl', label: 'Launch control', better: 'boolean', category: 'powertrain' },
      { key: 'capacidadBrutaBateria', label: 'Capacidad de Batería', unit: 'kWh', better: 'higher', category: 'powertrain' },
      { key: 'regeneracionNiveles', label: 'Regeneración (niveles)', better: 'higher', category: 'powertrain' },
    ],
    conditional: (fuelType) => fuelType?.toLowerCase().includes('híbrido') || fuelType?.toLowerCase().includes('hybrid')
  },
  {
    key: 'powertrain-combustion',
    label: 'Motorización',
    icon: '🔧',
    fields: [
      { key: 'alimentacion', label: 'Alimentación', better: 'boolean', category: 'powertrain' },
      { key: 'arquitecturaMotorTermico', label: 'Arquitectura motor térmico', better: 'boolean', category: 'powertrain' },
      { key: 'cicloTrabajo', label: 'Ciclo de trabajo', better: 'boolean', category: 'powertrain' },
      { key: 'cilindrada', label: 'Cilindrada', unit: 'L', better: 'higher', category: 'powertrain' },
      { key: 'combustible', label: 'Combustible', better: 'boolean', category: 'powertrain' },
      { key: 'modosConduccion', label: 'Modos de conducción', better: 'boolean', category: 'powertrain' },
      { key: 'octanajeRecomendado', label: 'Octanaje recomendado', unit: 'RON', better: 'boolean', category: 'powertrain' },
      { key: 'potenciaMaxMotorTermico', label: 'Potencia máx.', unit: 'kW', better: 'higher', category: 'powertrain' },
      { key: 'torqueMaxMotorTermico', label: 'Torque máx.', unit: 'Nm', better: 'higher', category: 'powertrain' },
      { key: 'startStop', label: 'Sistema Start-Stop', better: 'boolean', category: 'powertrain' },
      { key: 'launchControl', label: 'Launch control', better: 'boolean', category: 'powertrain' },
    ],
    conditional: (fuelType) => {
      const lower = fuelType?.toLowerCase() || '';
      return !lower.includes('eléctrico') && !lower.includes('electric') && !lower.includes('híbrido') && !lower.includes('hybrid');
    }
  },
  {
    key: 'transmission',
    label: 'Transmisión',
    icon: '⚙️',
    fields: [
      { key: 'traccion', label: 'Tracción', better: 'boolean', category: 'transmission' },
      { key: 'tipoTransmision', label: 'Tipo de Transmisión', better: 'boolean', category: 'transmission' },
      { key: 'numeroMarchas', label: 'Número de marchas', better: 'boolean', category: 'transmission' },
      { key: 'modoRemolque', label: 'Modo remolque/arrastre', better: 'boolean', category: 'transmission' },
      { key: 'paddleShifters', label: 'Paddle shifters', better: 'boolean', category: 'transmission' },
      { key: 'torqueVectoring', label: 'Torque Vectoring', better: 'boolean', category: 'transmission' },
      { key: 'traccionInteligenteOnDemand', label: 'Tracción inteligente On-Demand', better: 'boolean', category: 'transmission' },
    ]
  },
  {
    key: 'dimensions',
    label: 'Dimensiones y Pesos',
    icon: '📏',
    fields: [
      { key: 'length', label: 'Largo', unit: 'mm', better: 'boolean', category: 'dimensions' },
      { key: 'width', label: 'Ancho (sin espejos)', unit: 'mm', better: 'boolean', category: 'dimensions' },
      { key: 'height', label: 'Alto', unit: 'mm', better: 'boolean', category: 'dimensions' },
      { key: 'wheelbase', label: 'Distancia entre ejes', unit: 'mm', better: 'boolean', category: 'dimensions' },
      { key: 'turningRadius', label: 'Radio de giro', unit: 'm', better: 'lower', category: 'dimensions' },
      { key: 'curbWeight', label: 'Peso en orden de marcha', unit: 'kg', better: 'lower', category: 'dimensions' },
      { key: 'payload', label: 'Carga útil (payload)', unit: 'kg', better: 'higher', category: 'dimensions' },
      { key: 'cargoCapacity', label: 'Capacidad de baúl (máxima)', unit: 'L', better: 'higher', category: 'dimensions' },
      { key: 'cargoCapacityMin', label: 'Capacidad de baúl (mínima)', unit: 'L', better: 'higher', category: 'dimensions' },
      { key: 'roofCapacity', label: 'Capacidad de techo/barras', unit: 'kg', better: 'higher', category: 'dimensions' },
    ]
  },
  {
    key: 'efficiency',
    label: 'Consumo y Eficiencia',
    icon: '⛽',
    fields: [
      { key: 'consumoCiudad', label: 'Consumo Ciudad', unit: 'L/100km', better: 'lower', category: 'efficiency', formatter: (v, fuelType) => {
        const isElectric = fuelType?.toLowerCase().includes('eléctrico') || fuelType?.toLowerCase().includes('electric');
        return v ? `${v} ${isElectric ? 'kWh/100km' : 'L/100km'}` : undefined;
      }},
      { key: 'consumoCarretera', label: 'Consumo Carretera', unit: 'L/100km', better: 'lower', category: 'efficiency', formatter: (v, fuelType) => {
        const isElectric = fuelType?.toLowerCase().includes('eléctrico') || fuelType?.toLowerCase().includes('electric');
        return v ? `${v} ${isElectric ? 'kWh/100km' : 'L/100km'}` : undefined;
      }},
      { key: 'consumoMixto', label: 'Consumo Mixto', unit: 'L/100km', better: 'lower', category: 'efficiency', formatter: (v, fuelType) => {
        const isElectric = fuelType?.toLowerCase().includes('eléctrico') || fuelType?.toLowerCase().includes('electric');
        return v ? `${v} ${isElectric ? 'kWh/100km' : 'L/100km'}` : undefined;
      }},
      { key: 'autonomiaOficial', label: 'Autonomía oficial', unit: 'km', better: 'higher', category: 'efficiency' },
      { key: 'capacidadTanque', label: 'Capacidad de tanque', unit: 'L', better: 'higher', category: 'efficiency' },
      { key: 'mpgeCiudad', label: 'MPGe ciudad', unit: 'MPGe', better: 'higher', category: 'efficiency' },
      { key: 'mpgeCarretera', label: 'MPGe carretera', unit: 'MPGe', better: 'higher', category: 'efficiency' },
      { key: 'mpgeCombinado', label: 'MPGe combinado', unit: 'MPGe', better: 'higher', category: 'efficiency' },
      { key: 'ahorro5Anos', label: 'Ahorro a 5 años', unit: 'COP', better: 'higher', category: 'efficiency' },
      { key: 'costoEnergia100km', label: 'Costo de energía por 100 km', unit: 'COP', better: 'lower', category: 'efficiency' },
    ]
  },
  {
    key: 'performance',
    label: 'Prestaciones',
    icon: '⚡',
    fields: [
      { key: 'acceleration0to100', label: '0-100 km/h', unit: 's', better: 'lower', category: 'performance' },
      { key: 'acceleration0to200', label: '0-200 km/h', unit: 's', better: 'lower', category: 'performance' },
      { key: 'quarterMile', label: '1/4 de milla', unit: 's', better: 'lower', category: 'performance' },
      { key: 'acceleration50to80', label: '50-80 km/h', unit: 's', better: 'lower', category: 'performance' },
      { key: 'overtaking80to120', label: '80-120 km/h', unit: 's', better: 'lower', category: 'performance' },
      { key: 'maxSpeed', label: 'Velocidad máxima', unit: 'km/h', better: 'higher', category: 'performance' },
      { key: 'powerToWeight', label: 'Relación peso/potencia', unit: 'HP/ton', better: 'higher', category: 'performance' },
      { key: 'maxLateralAcceleration', label: 'Aceleración lateral máxima', unit: 'g', better: 'higher', category: 'performance' },
      { key: 'maxLongitudinalAcceleration', label: 'Aceleración longitudinal máxima', unit: 'g', better: 'higher', category: 'performance' },
      { key: 'brakingDistance100to0', label: 'Frenado 100-0 km/h', unit: 'm', better: 'lower', category: 'performance' },
      { key: 'launchControl', label: 'Launch control', better: 'boolean', category: 'performance' },
    ]
  },
  {
    key: 'safety',
    label: 'Seguridad',
    icon: '🛡️',
    fields: [
      { key: 'airbags', label: 'Número total de airbags', better: 'higher', category: 'safety' },
      { key: 'abs', label: 'ABS', better: 'boolean', category: 'safety' },
      { key: 'esp', label: 'ESP', better: 'boolean', category: 'safety' },
      { key: 'ncapRating', label: 'Euro NCAP (estrellas)', better: 'higher', category: 'safety' },
      { key: 'adultSafetyScore', label: 'Euro NCAP (Adulto %)', unit: '%', better: 'higher', category: 'safety' },
      { key: 'childSafetyScore', label: 'Euro NCAP (Niño %)', unit: '%', better: 'higher', category: 'safety' },
      { key: 'pedestrianScore', label: 'Euro NCAP (Peatón %)', unit: '%', better: 'higher', category: 'safety' },
      { key: 'assistanceScore', label: 'Euro NCAP (Asistencias %)', unit: '%', better: 'higher', category: 'safety' },
      { key: 'latinNCAPRating', label: 'Latin NCAP (estrellas)', better: 'higher', category: 'safety' },
    ]
  },
  {
    key: 'adas',
    label: 'Sistemas de Asistencia (ADAS)',
    icon: '🚗',
    fields: [
      { key: 'acc', label: 'ACC (crucero adaptativo)', better: 'boolean', category: 'adas' },
      { key: 'aeb', label: 'AEB (frenado autónomo)', better: 'boolean', category: 'adas' },
      { key: 'bsm', label: 'BSM (punto ciego)', better: 'boolean', category: 'adas' },
      { key: 'camara360', label: 'Cámara 360°', better: 'boolean', category: 'adas' },
      { key: 'farosAdaptativos', label: 'Faros adaptativos (ADB)', better: 'boolean', category: 'adas' },
      { key: 'lka', label: 'LKA (asistente carril)', better: 'boolean', category: 'adas' },
      { key: 'lucesAltasAutomaticas', label: 'Luces altas automáticas', better: 'boolean', category: 'adas' },
      { key: 'parkAssist', label: 'Park Assist (autónomo)', better: 'boolean', category: 'adas' },
      { key: 'sensoresEstacionamientoDelantero', label: 'Sensores estacionamiento delantero', better: 'boolean', category: 'adas' },
    ]
  },
  {
    key: 'battery',
    label: 'Batería y Carga',
    icon: '🔋',
    fields: [
      { key: 'capacidadBrutaBateria', label: 'Capacidad bruta batería', unit: 'kWh', better: 'higher', category: 'battery' },
      { key: 'cargadorOBCAC', label: 'Cargador a bordo (OBC) AC', unit: 'kW', better: 'higher', category: 'battery' },
      { key: 'conduccionOnePedal', label: 'Conducción One-Pedal', better: 'boolean', category: 'battery' },
      { key: 'highPowerChargingTimes', label: 'High Power Charging times', better: 'boolean', category: 'battery' },
      { key: 'regeneracionNiveles', label: 'Regeneración (niveles)', better: 'higher', category: 'battery' },
      { key: 'tiempo0100AC', label: 'Tiempo 0-100% (AC)', unit: 'h', better: 'lower', category: 'battery' },
      { key: 'tiempo1080DC', label: 'Tiempo 10-80% (DC)', unit: 'min', better: 'lower', category: 'battery' },
      { key: 'v2hV2g', label: 'V2H/V2G (bidireccional)', better: 'boolean', category: 'battery' },
      { key: 'potenciaV2hV2g', label: 'V2H/V2G Potencia', unit: 'kW', better: 'higher', category: 'battery' },
    ]
    // NOTA: La lógica condicional de batería se maneja explícitamente en CompareTables.tsx
    // para asegurar que solo se muestre cuando TODOS los vehículos son eléctricos o híbridos
  },
  {
    key: 'chassis',
    label: 'Chasis, Frenos y Dirección',
    icon: '🔧',
    fields: [
      { key: 'amortiguacionAdaptativa', label: 'Amortiguación adaptativa', better: 'boolean', category: 'chassis' },
      { key: 'materialDiscos', label: 'Material de discos', better: 'boolean', category: 'chassis' },
      { key: 'materialMuelles', label: 'Material de muelles', better: 'boolean', category: 'chassis' },
      { key: 'suspensionDelantera', label: 'Suspensión delantera', better: 'boolean', category: 'chassis' },
      { key: 'suspensionTrasera', label: 'Suspensión trasera', better: 'boolean', category: 'chassis' },
      { key: 'tipoPinzasFreno', label: 'Tipo de pinzas de freno', better: 'boolean', category: 'chassis' },
      { key: 'groundClearance', label: 'Despeje al suelo', unit: 'mm', better: 'higher', category: 'chassis' },
      { key: 'controlDescenso', label: 'Control de descenso', better: 'boolean', category: 'chassis' },
      { key: 'controlTraccionOffRoad', label: 'Control de tracción off-road', better: 'boolean', category: 'chassis' },
    ]
  },
  {
    key: 'lighting',
    label: 'Iluminación y Visibilidad',
    icon: '💡',
    fields: [
      { key: 'antinieblaDelantero', label: 'Antiniebla delantero', better: 'boolean', category: 'lighting' },
      { key: 'headlightType', label: 'Faros (tecnología)', better: 'boolean', category: 'lighting' },
      { key: 'intermitentesDinamicos', label: 'Intermitentes dinámicos', better: 'boolean', category: 'lighting' },
      { key: 'lavafaros', label: 'Lavafaros', better: 'boolean', category: 'lighting' },
      { key: 'sensorLluvia', label: 'Sensor de lluvia', better: 'boolean', category: 'lighting' },
    ]
  },
  {
    key: 'infotainment',
    label: 'Conectividad e Infoentretenimiento',
    icon: '📱',
    fields: [
      { key: 'pantallaCentralTamano', label: 'Pantalla central', unit: '"', better: 'higher', category: 'infotainment' },
      { key: 'pantallaCuadroTamano', label: 'Pantalla de cuadro', unit: 'in', better: 'higher', category: 'infotainment' },
      { key: 'androidAuto', label: 'Android Auto', better: 'boolean', category: 'infotainment' },
      { key: 'appleCarPlay', label: 'Apple CarPlay', better: 'boolean', category: 'infotainment' },
      { key: 'bluetooth', label: 'Bluetooth', better: 'boolean', category: 'infotainment' },
      { key: 'wifiBordo', label: 'Wi-Fi a bordo', better: 'boolean', category: 'infotainment' },
      { key: 'appRemotaOTA', label: 'App remota / OTA', better: 'boolean', category: 'infotainment' },
      { key: 'navegacionIntegrada', label: 'Navegación integrada', better: 'boolean', category: 'infotainment' },
      { key: 'cargadorInalambrico', label: 'Cargador inalámbrico', better: 'boolean', category: 'infotainment' },
      { key: 'audioMarca', label: 'Audio (marca)', better: 'boolean', category: 'infotainment' },
      { key: 'audioNumeroBocinas', label: 'Audio (número de bocinas)', better: 'higher', category: 'infotainment' },
      { key: 'potenciaAmplificador', label: 'Potencia de amplificador', unit: 'W', better: 'higher', category: 'infotainment' },
      { key: 'puertosUSBA', label: 'Puertos USB-A', better: 'higher', category: 'infotainment' },
      { key: 'puertosUSBC', label: 'Puertos USB-C', better: 'higher', category: 'infotainment' },
    ]
  },
  {
    key: 'comfort',
    label: 'Confort e Interior',
    icon: '🛋️',
    fields: [
      { key: 'ajusteElectricoConductor', label: 'Ajuste eléctrico conductor', better: 'higher', category: 'comfort' },
      { key: 'ajusteElectricoPasajero', label: 'Ajuste eléctrico pasajero', better: 'higher', category: 'comfort' },
      { key: 'calefaccionAsientos', label: 'Calefacción de asientos', better: 'boolean', category: 'comfort' },
      { key: 'ventilacionAsientos', label: 'Ventilación de asientos', better: 'boolean', category: 'comfort' },
      { key: 'masajeAsientos', label: 'Masaje en asientos', better: 'boolean', category: 'comfort' },
      { key: 'memoriaAsientos', label: 'Memoria de asientos', better: 'boolean', category: 'comfort' },
      { key: 'materialAsientos', label: 'Material de asientos', better: 'boolean', category: 'comfort' },
      { key: 'climatizadorZonas', label: 'Climatizador (zonas)', better: 'higher', category: 'comfort' },
      { key: 'airConditioning', label: 'Aire acondicionado', better: 'boolean', category: 'comfort' },
      { key: 'cristalesAcusticos', label: 'Cristales acústicos', better: 'boolean', category: 'comfort' },
      { key: 'parabrisasCalefactable', label: 'Parabrisas calefactable', better: 'boolean', category: 'comfort' },
      { key: 'iluminacionAmbiental', label: 'Iluminación ambiental', better: 'boolean', category: 'comfort' },
      { key: 'techoPanoramico', label: 'Techo panorámico', better: 'boolean', category: 'comfort' },
      { key: 'segundaFilaCorrediza', label: 'Segunda fila corrediza', better: 'boolean', category: 'comfort' },
      { key: 'terceraFilaAsientos', label: 'Tercera fila de asientos', better: 'boolean', category: 'comfort' },
      { key: 'vidriosElectricos', label: 'Vidrios eléctricos', better: 'boolean', category: 'comfort' },
      { key: 'espejoInteriorElectrocromico', label: 'Espejo interior electrocrómico', better: 'boolean', category: 'comfort' },
      { key: 'volanteMaterialAjustes', label: 'Volante (material y ajustes)', better: 'boolean', category: 'comfort' },
      { key: 'volanteCalefactable', label: 'Volante calefactable', better: 'boolean', category: 'comfort' },
      { key: 'tomas12V120V', label: 'Tomas 12 V/120 V', better: 'higher', category: 'comfort' },
      { key: 'tomacorrienteEnCaja', label: 'Tomacorriente en caja', better: 'boolean', category: 'comfort' },
    ]
  },
  {
    key: 'commercial',
    label: 'Información Comercial',
    icon: '💰',
    fields: [
      { key: 'precioLista', label: 'Precio de lista', unit: 'COP', better: 'lower', category: 'commercial' },
      { key: 'garantiaVehiculo', label: 'Garantía vehículo', better: 'boolean', category: 'commercial' },
      { key: 'garantiaBateria', label: 'Garantía batería', better: 'boolean', category: 'commercial' },
      { key: 'asistenciaCarretera', label: 'Asistencia en carretera', unit: 'años', better: 'higher', category: 'commercial' },
      { key: 'intervaloMantenimiento', label: 'Intervalo de mantenimiento', better: 'boolean', category: 'commercial' },
      { key: 'costoMantenimiento3Primeros', label: 'Costo mantenimiento (3 primeros)', unit: 'COP', better: 'lower', category: 'commercial' },
      { key: 'financiacionCuotaEstimada', label: 'Financiación (cuota estimada)', unit: 'COP', better: 'lower', category: 'commercial' },
      { key: 'origenPaisPlanta', label: 'Origen (país/planta)', better: 'boolean', category: 'commercial' },
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
