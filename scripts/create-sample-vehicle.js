/**
 * Script para crear un vehículo de ejemplo con todos los campos llenos
 * 
 * Uso:
 *   npm run create-sample-vehicle
 * 
 * O con variables de entorno:
 *   API_URL=http://localhost:3000 DEALER_ID=tu-dealer-id node scripts/create-sample-vehicle.js
 */

// Usar fetch nativo de Node.js 18+ o importar node-fetch
// Node.js 18+ tiene fetch nativo, para versiones anteriores usar node-fetch
let fetch;
if (typeof globalThis.fetch !== 'undefined') {
  fetch = globalThis.fetch;
} else {
  try {
    fetch = require('node-fetch');
  } catch (e) {
    console.error('❌ Error: Se requiere Node.js 18+ o instalar node-fetch');
    console.error('   npm install node-fetch@2');
    process.exit(1);
  }
}

const API_URL = process.env.API_URL || 'http://localhost:3000';
const DEALER_ID = process.env.DEALER_ID || '';

// Función para generar un número aleatorio en un rango
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 2) => {
  const num = Math.random() * (max - min) + min;
  return parseFloat(num.toFixed(decimals));
};

// Función para elegir un elemento aleatorio de un array
const randomChoice = (array) => array[Math.floor(Math.random() * array.length)];

// Variables globales para usar en la función createVehicle
let isElectric = false;
let isHybrid = false;

// Generar datos de vehículo completo
function generateSampleVehicle() {
  const fuelType = randomChoice(['Gasolina', 'Diesel', 'Eléctrico', 'Híbrido', 'Híbrido Enchufable']);
  isElectric = fuelType === 'Eléctrico';
  isHybrid = fuelType === 'Híbrido' || fuelType === 'Híbrido Enchufable';
  const type = randomChoice(['Sedán', 'SUV', 'Pickup', 'Deportivo', 'Wagon', 'Hatchback', 'Convertible']);
  
  // Mapear vehicleType según tipo
  const vehicleTypeMap = {
    'Sedán': 'Automóvil',
    'SUV': 'Todoterreno',
    'Pickup': 'Todoterreno',
    'Deportivo': 'Deportivo',
    'Wagon': 'Automóvil',
    'Hatchback': 'Automóvil',
    'Convertible': 'Deportivo'
  };

  const vehicleData = {
    brand: randomChoice(['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Volkswagen', 'BMW', 'Mercedes-Benz', 'Audi', 'Nissan', 'Hyundai']),
    model: randomChoice(['Camry', 'Corolla', 'Civic', 'Accord', 'F-150', 'Silverado', 'Jetta', 'Golf', 'X3', 'GLC', 'A4', 'Q5', 'Sentra', 'Tucson']),
    year: random(2020, 2024),
    price: random(30000000, 200000000), // 30M - 200M COP
    type: type,
    vehicleType: vehicleTypeMap[type],
    fuelType: fuelType,
    history: 'Vehículo de muestra con especificaciones completas para pruebas del sistema.',
    wiseCategories: 'Premium, Tecnología, Eficiencia',
    reviewVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    
    specifications: {
      identification: {
        añoModelo: random(2020, 2024),
        carrocería: type,
        plazas: randomChoice([4, 5, 7, 8]),
        puertas: randomChoice([3, 4, 5]),
        versionTrim: randomChoice(['Base', 'Comfort', 'Sport', 'Premium', 'Limited', 'Ultimate']),
      },
      
      powertrain: {
        alimentacion: randomChoice(['Inyección directa', 'Inyección multipunto', 'Inyección indirecta']),
        cicloTrabajo: randomChoice(['4 tiempos', '2 tiempos']),
        cilindrada: !isElectric ? randomFloat(1.0, 5.0, 1) : undefined,
        combustible: fuelType,
        modosConduccion: randomChoice(['Eco, Normal, Sport', 'Comfort, Sport, Sport+', 'Eco, Normal, Sport, Individual']),
        octanajeRecomendado: !isElectric ? randomChoice([87, 91, 95, 98]) : undefined,
        arquitecturaMotorTermico: !isElectric ? randomChoice(['En línea', 'V', 'Boxer']) : undefined,
        potenciaMaxEV: isElectric || isHybrid ? random(100, 500) : undefined,
        potenciaMaxMotorTermico: !isElectric ? random(100, 400) : undefined,
        potenciaMaxSistemaHibrido: isHybrid ? random(150, 450) : undefined,
        torqueMaxEV: isElectric || isHybrid ? random(200, 800) : undefined,
        torqueMaxMotorTermico: !isElectric ? random(150, 600) : undefined,
        torqueMaxSistemaHibrido: isHybrid ? random(250, 700) : undefined,
        traccion: randomChoice(['Delantera', 'Trasera', 'AWD', '4WD']),
        startStop: !isElectric ? randomChoice([true, false]) : undefined,
        launchControl: randomChoice([true, false]),
      },
      
      transmission: {
        tipoTransmision: randomChoice(['Manual', 'Automática', 'CVT', 'DCT', 'Automática secuencial']),
        numeroMarchas: randomChoice([5, 6, 7, 8, 9, 10]),
        modoRemolque: randomChoice([true, false]),
        paddleShifters: randomChoice([true, false]),
        torqueVectoring: randomChoice([true, false]),
        traccionInteligenteOnDemand: randomChoice([true, false]),
      },
      
      dimensions: {
        length: random(4000, 5500),
        width: random(1700, 2000),
        height: random(1400, 1900),
        curbWeight: random(1200, 2500),
        wheelbase: random(2500, 3200),
        cargoCapacity: random(300, 2000),
        cargoCapacityMin: random(200, 1500),
        roofCapacity: random(50, 150),
        turningRadius: randomFloat(5.0, 12.0, 1),
      },
      
      weight: {
        payload: random(400, 1000),
        grossCombinedWeight: random(2500, 3500),
        towingCapacity: type === 'SUV' || type === 'Pickup' ? random(1500, 3500) : random(0, 1500),
        cargoBoxVolume: type === 'Pickup' ? random(1000, 2000) : undefined,
      },
      
      interior: {
        trunkCapacitySeatsDown: random(500, 2000),
        passengerCapacity: random(4, 8),
        seatRows: type === 'SUV' ? randomChoice([2, 3]) : 2,
        interiorCargoCapacity: random(300, 800),
      },
      
      efficiency: {
        consumoCiudad: isElectric ? randomFloat(15, 25, 1) : randomFloat(8, 15, 1),
        consumoCarretera: isElectric ? randomFloat(18, 28, 1) : randomFloat(6, 12, 1),
        consumoMixto: isElectric ? randomFloat(16, 26, 1) : randomFloat(7, 13, 1),
        capacidadTanque: !isElectric ? randomFloat(40, 80, 1) : undefined,
        autonomiaOficial: isElectric || isHybrid ? random(300, 600) : undefined,
        costoEnergia100km: isElectric ? randomFloat(15000, 35000) : undefined,
        ahorro5Anos: isElectric || isHybrid ? random(5000000, 25000000) : undefined,
        mpgeCiudad: isElectric || isHybrid ? random(80, 140) : undefined,
        mpgeCarretera: isElectric || isHybrid ? random(70, 130) : undefined,
        mpgeCombinado: isElectric || isHybrid ? random(75, 135) : undefined,
      },
      
      battery: {
        capacidadBrutaBateria: isElectric || isHybrid ? randomFloat(40, 120, 1) : undefined,
        cargadorOBCAC: isElectric || isHybrid ? randomFloat(3.7, 22, 1) : undefined,
        conduccionOnePedal: isElectric ? randomChoice([true, false]) : undefined,
        regeneracionNiveles: isElectric || isHybrid ? random(1, 5) : undefined,
        tiempo0100AC: isElectric || isHybrid ? randomFloat(6, 12, 1) : undefined,
        tiempo1080DC: isElectric || isHybrid ? random(20, 60) : undefined,
        highPowerChargingTimes: isElectric || isHybrid ? randomChoice(['30 min', '45 min', '1 hora']) : undefined,
        v2hV2g: isElectric ? randomChoice([true, false]) : undefined,
        potenciaV2hV2g: isElectric ? randomFloat(3, 11, 1) : undefined,
      },
      
      chassis: {
        groundClearance: random(120, 250),
        suspensionDelantera: randomChoice(['McPherson', 'Doble horquilla', 'Multibrazo', 'Torsión', 'Multibrazo independiente']),
        suspensionTrasera: randomChoice(['Multibrazo', 'Torsión', 'Barras estabilizadoras', 'McPherson', 'Multibrazo independiente']),
        amortiguacionAdaptativa: randomChoice([true, false]),
        materialDiscos: randomChoice(['Hierro fundido', 'Carbono cerámico', 'Hierro ventilado', 'Acero inoxidable']),
        materialMuelles: randomChoice(['Acero', 'Aire', 'Neumático', 'Fibra de carbono']),
        tipoPinzasFreno: randomChoice(['Fijas 4 pistones', 'Fijas 6 pistones', 'Flotantes 2 pistones', 'Fijas 8 pistones']),
        brakingDistance100to0: randomFloat(35, 45, 1),
        maxLateralAcceleration: randomFloat(0.8, 1.2, 2),
        maxLongitudinalAcceleration: randomFloat(0.9, 1.1, 2),
        suspensionSetup: randomChoice(['Deportiva', 'Confort', 'Adaptativa', 'Estándar']),
      },
      
      performance: {
        acceleration0to100: randomFloat(5.5, 12.0, 1),
        acceleration0100: randomFloat(5.5, 12.0, 1),
        acceleration0to200: randomFloat(15, 35, 1),
        acceleration0to60: randomFloat(4.5, 10.0, 1),
        acceleration50to80: randomFloat(3.0, 8.0, 1),
        overtaking80to120: randomFloat(4.0, 10.0, 1),
        maxLateralAcceleration: randomFloat(0.8, 1.2, 2),
        maxLongitudinalAcceleration: randomFloat(0.6, 1.0, 2),
        brakingDistance100to0: random(35, 45),
        topSpeed: random(180, 280),
        maxSpeed: random(180, 280),
        powerToWeight: randomFloat(80, 200, 1),
        quarterMile: randomFloat(12, 16, 2),
        launchControl: randomChoice([true, false]),
      },
      
      safety: {
        airbags: random(4, 12),
        ncapRating: randomChoice([3, 4, 5]),
        adultSafetyScore: randomFloat(70, 95, 1),
        childSafetyScore: randomFloat(70, 95, 1),
        pedestrianScore: randomFloat(60, 90, 1),
        assistanceScore: randomFloat(60, 95, 1),
        latinNCAPRating: randomChoice([0, 3, 4, 5]),
        brakingSystem: randomChoice([['ABS'], ['ABS', 'EBD'], ['ABS', 'EBD', 'BA']]),
        stabilityControl: randomChoice([true, false]),
        tractionControl: randomChoice([true, false]),
        autonomousEmergencyBraking: randomChoice([true, false]),
        forwardCollisionWarning: randomChoice([true, false]),
        laneAssist: randomChoice([true, false]),
        adaptiveCruiseControl: randomChoice([true, false]),
        blindSpotDetection: randomChoice([true, false]),
        crossTrafficAlert: randomChoice([true, false]),
        fatigueMonitor: randomChoice([true, false]),
        tirePressureMonitoring: randomChoice([true, false]),
        isofixTopTether: randomChoice([true, false]),
      },
      
      adas: {
        acc: randomChoice([true, false]),
        adaptiveCruiseControl: randomChoice([true, false]),
        aeb: randomChoice([true, false]),
        bsm: randomChoice([true, false]),
        blindSpotMonitoring: randomChoice([true, false]),
        camara360: randomChoice([true, false]),
        farosAdaptativos: randomChoice([true, false]),
        lka: randomChoice([true, false]),
        laneKeepingAssist: randomChoice([true, false]),
        lucesAltasAutomaticas: randomChoice([true, false]),
        parkAssist: randomChoice([true, false]),
        sensoresEstacionamientoDelantero: randomChoice([true, false]),
      },
      
      lighting: {
        headlightType: randomChoice(['Halógeno', 'Xenón', 'LED', 'Laser', 'Matrix LED']),
        antinieblaDelantero: randomChoice([true, false]),
        intermitentesDinamicos: randomChoice([true, false]),
        lavafaros: randomChoice([true, false]),
        sensorLluvia: randomChoice([true, false]),
        automaticHighBeam: randomChoice([true, false]),
      },
      
      infotainment: {
        screenSize: randomFloat(7, 15, 1),
        pantallaCentralTamano: String(randomFloat(7, 15, 1)) + '"',
        pantallaCuadroTamano: randomFloat(4, 12, 1),
        androidAuto: randomChoice([true, false]),
        appleCarplay: randomChoice([true, false]),
        appleCarPlay: randomChoice([true, false]),
        appRemotaOTA: randomChoice([true, false]),
        audioMarca: randomChoice(['Bose', 'Harman Kardon', 'JBL', 'B&O', 'Premium Sound']),
        audioNumeroBocinas: random(4, 16),
        bluetooth: true,
        cargadorInalambrico: randomChoice([true, false]),
        navegacionIntegrada: randomChoice([true, false]),
        potenciaAmplificador: random(200, 1000),
        puertosUSBA: random(1, 4),
        puertosUSBC: random(1, 3),
        wifiBordo: randomChoice([true, false]),
      },
      
      comfort: {
        ajusteElectricoConductor: random(6, 12),
        ajusteElectricoPasajero: random(4, 10),
        calefaccionAsientos: randomChoice([true, false]),
        heatedSeats: randomChoice([true, false]),
        climatizadorZonas: random(1, 4),
        cristalesAcusticos: randomChoice([true, false]),
        iluminacionAmbiental: randomChoice([true, false]),
        masajeAsientos: randomChoice([true, false]),
        massageSeats: randomChoice([true, false]),
        materialAsientos: randomChoice(['Tela', 'Ecocuero', 'Cuero', 'Alcantara', 'Cuero Nappa']),
        memoriaAsientos: randomChoice([true, false]),
        parabrisasCalefactable: randomChoice([true, false]),
        segundaFilaCorrediza: type === 'SUV' ? randomChoice([true, false]) : false,
        techoPanoramico: randomChoice([true, false]),
        sunroof: randomChoice([true, false]),
        terceraFilaAsientos: type === 'SUV' ? randomChoice([true, false]) : false,
        tomas12V120V: random(1, 4),
        tomacorrienteEnCaja: type === 'Pickup' ? randomChoice([true, false]) : false,
        ventilacionAsientos: randomChoice([true, false]),
        ventilatedSeats: randomChoice([true, false]),
        vidriosElectricos: randomChoice([true, false]),
        volanteMaterialAjustes: randomChoice(['Cuero con ajustes eléctricos', 'Cuero', 'Plástico con ajustes manuales', 'Cuero con costuras contrastantes']),
        volanteCalefactable: randomChoice([true, false]),
        espejoInteriorElectrocromico: randomChoice([true, false]),
        airConditioning: true,
        automaticClimateControl: randomChoice([true, false]),
        automaticHighBeam: randomChoice([true, false]),
      },
      
      offRoad: {
        controlDescenso: type === 'SUV' || type === 'Pickup' ? randomChoice([true, false]) : false,
        controlTraccionOffRoad: type === 'SUV' || type === 'Pickup' ? randomChoice([true, false]) : false,
        approachAngle: type === 'SUV' || type === 'Pickup' ? random(20, 35) : undefined,
        departureAngle: type === 'SUV' || type === 'Pickup' ? random(20, 35) : undefined,
        breakoverAngle: type === 'SUV' || type === 'Pickup' ? random(15, 25) : undefined,
        wadingDepth: type === 'SUV' || type === 'Pickup' ? random(500, 900) : undefined,
        wadingHeight: type === 'SUV' || type === 'Pickup' ? random(500, 900) : undefined,
      },
      
      assistance: {
        brakeAssist: randomChoice([true, false]),
        hillStartAssist: randomChoice([true, false]),
        reverseCamera: randomChoice([true, false]),
        parkingSensors: randomChoice([true, false]),
        cameras360: randomChoice([true, false]),
      },
      
      technology: {
        bluetooth: true,
        touchscreen: true,
        navigation: randomChoice([true, false]),
        smartphoneIntegration: randomChoice([['CarPlay'], ['Android Auto'], ['CarPlay', 'Android Auto'], []]),
        wirelessCharger: randomChoice([true, false]),
        startStop: !isElectric ? randomChoice([true, false]) : undefined,
      },
      
      wisemetrics: {
        drivingFun: random(60, 95),
        technology: random(70, 95),
        environmentalImpact: isElectric || isHybrid ? random(80, 95) : random(40, 70),
        reliability: random(70, 90),
        qualityPriceRatio: random(65, 90),
        comfort: random(70, 95),
        usability: random(75, 95),
        efficiency: isElectric || isHybrid ? random(85, 95) : random(60, 85),
        prestige: random(50, 90),
        userRating: randomFloat(3.5, 5.0, 1),
        interiorQuality: random(70, 95),
        easeOfUse: random(75, 95),
        easeOfParking: random(70, 90),
        practicality: random(70, 95),
        serviceConvenience: random(65, 90),
        experience: random(70, 95),
        visibility: random(75, 95),
        easeOfCleaning: random(70, 90),
        petFriendly: random(60, 85),
        familyFriendly: random(70, 95),
      },
      
      commercial: {
        precioLista: random(30000000, 200000000),
        garantiaVehiculo: randomChoice(['3 años / 100.000 km', '5 años / 150.000 km', '7 años / 200.000 km']),
        garantiaBateria: isElectric || isHybrid ? randomChoice(['8 años / 160.000 km', '10 años / 200.000 km']) : undefined,
        asistenciaCarretera: random(3, 7),
        intervaloMantenimiento: randomChoice(['10.000 km', '15.000 km', '20.000 km']),
        costoMantenimiento3Primeros: random(2000000, 8000000),
        financiacionCuotaEstimada: random(2000000, 5000000),
        origenPaisPlanta: randomChoice(['Colombia', 'México', 'Brasil', 'Argentina', 'Estados Unidos', 'Alemania', 'Japón']),
      },
      
      metadata: {
        aplicabilidadFlags: 'Todos',
        observaciones: 'Vehículo de muestra generado automáticamente con todas las especificaciones completas.',
      },
    },
    
    dealerIds: DEALER_ID ? [DEALER_ID] : [],
    coverImage: 'https://via.placeholder.com/800x600/0066cc/ffffff?text=Vehicle+Cover',
    galleryImages: [
      'https://via.placeholder.com/800x600/0066cc/ffffff?text=Gallery+1',
      'https://via.placeholder.com/800x600/0066cc/ffffff?text=Gallery+2',
      'https://via.placeholder.com/800x600/0066cc/ffffff?text=Gallery+3',
      'https://via.placeholder.com/800x600/0066cc/ffffff?text=Gallery+4',
    ],
    thumbnailIndex: 0,
  };

  // Limpiar campos undefined/null/vacíos recursivamente, pero mantener las secciones requeridas
  const cleanObject = (obj, depth = 0, isTopLevel = false) => {
    if (obj === null || obj === undefined) return isTopLevel ? {} : undefined;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      const cleaned = obj.map(item => cleanObject(item, depth + 1, false)).filter(item => item !== undefined && item !== null);
      return cleaned.length > 0 ? cleaned : [];
    }
    
    const cleaned = {};
    let hasValues = false;
    
    // Secciones requeridas que siempre deben estar presentes (según el schema)
    const requiredSections = ['performance', 'chassis', 'offRoad', 'weight', 'dimensions', 'interior', 'safety', 'lighting', 'assistance', 'comfort', 'technology', 'wisemetrics'];
    
    for (const [key, value] of Object.entries(obj)) {
      // Si es una sección requerida en el nivel superior, asegurar que existe
      if (isTopLevel && requiredSections.includes(key)) {
        if (value !== undefined && value !== null) {
          const cleanedObj = cleanObject(value, depth + 1, false);
          cleaned[key] = cleanedObj && Object.keys(cleanedObj).length > 0 ? cleanedObj : {};
          hasValues = true;
        } else {
          cleaned[key] = {};
          hasValues = true;
        }
      } else if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
          cleaned[key] = value;
          hasValues = true;
        } else if (Array.isArray(value)) {
          const cleanedArray = cleanObject(value, depth + 1, false);
          if (cleanedArray && cleanedArray.length > 0) {
            cleaned[key] = cleanedArray;
            hasValues = true;
          } else if (cleanedArray && cleanedArray.length === 0) {
            cleaned[key] = [];
            hasValues = true;
          }
        } else if (typeof value === 'object') {
          const cleanedObj = cleanObject(value, depth + 1, false);
          if (cleanedObj && Object.keys(cleanedObj).length > 0) {
            cleaned[key] = cleanedObj;
            hasValues = true;
          }
        }
      }
    }
    
    // Si es el nivel superior, asegurar que todas las secciones requeridas estén presentes
    if (isTopLevel) {
      for (const reqSection of requiredSections) {
        if (!cleaned[reqSection]) {
          cleaned[reqSection] = {};
        }
      }
      return cleaned;
    }
    
    return hasValues ? cleaned : (isTopLevel ? {} : undefined);
  };

  // Limpiar specifications recursivamente, marcando que es el nivel superior
  vehicleData.specifications = cleanObject(vehicleData.specifications, 0, true);

  return vehicleData;
}

// Obtener dealerId si no está configurado (buscar en la base de datos o API)
async function getDealerId() {
  if (DEALER_ID) {
    return DEALER_ID;
  }

  try {
    console.log('🔍 Buscando concesionarios disponibles...');
    const response = await fetch(`${API_URL}/api/dealers`);
    
    if (response.ok) {
      const dealers = await response.json();
      if (dealers && Array.isArray(dealers) && dealers.length > 0) {
        console.log(`✅ Encontrados ${dealers.length} concesionarios`);
        console.log(`📋 Usando el primer concesionario: ${dealers[0].name} (${dealers[0].id})`);
        return dealers[0].id;
      } else {
        console.warn('⚠️  No se encontraron concesionarios en la base de datos');
        console.log('💡 Crea un concesionario primero desde el panel de administración');
      }
    } else {
      console.warn('⚠️  No se pudo obtener concesionarios de la API');
    }
  } catch (error) {
    console.warn('⚠️  Error al obtener concesionarios:', error.message);
  }

  return null;
}

// Función principal
async function createVehicle() {
  try {
    console.log('🚗 Generando vehículo de muestra...');
    
    // Obtener dealerId (automático o desde variable de entorno)
    let dealerId = DEALER_ID;
    if (!dealerId) {
      dealerId = await getDealerId();
    }
    
    // Validar que haya un dealerId
    if (!dealerId) {
      console.error('\n❌ Error: DEALER_ID es requerido');
      console.log('\n💡 Opciones:');
      console.log('   1. Crear un concesionario desde el panel de administración');
      console.log('   2. Usar variable de entorno:');
      console.log('      DEALER_ID=tu-dealer-id npm run create-sample-vehicle');
      console.log('\n   3. Configurar variables de entorno:');
      console.log('      export DEALER_ID=tu-dealer-id');
      console.log('      export API_URL=http://localhost:3000');
      console.log('      npm run create-sample-vehicle');
      process.exit(1);
    }

    const vehicleData = generateSampleVehicle();
    vehicleData.dealerIds = [dealerId];
    
    console.log(`\n📝 Vehículo: ${vehicleData.brand} ${vehicleData.model} ${vehicleData.year}`);
    console.log(`💰 Precio: $${vehicleData.price.toLocaleString('es-CO')} COP`);
    console.log(`⛽ Combustible: ${vehicleData.fuelType}`);
    console.log(`🚙 Tipo: ${vehicleData.type}`);
    console.log(`🏢 Concesionario ID: ${dealerId}`);
    console.log(`\n📤 Enviando a ${API_URL}/api/vehicles...`);
    
    const response = await fetch(`${API_URL}/api/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vehicleData),
    });

    const responseData = await response.json();

    if (response.ok) {
      console.log('\n✅ Vehículo creado exitosamente!');
      console.log(`🆔 ID: ${responseData.id}`);
      console.log(`🔗 URL: ${API_URL}/vehicles/${responseData.id}`);
      console.log(`\n📊 Especificaciones incluidas:`);
      console.log(`   - Identificación: ✓`);
      console.log(`   - Motorización: ✓`);
      console.log(`   - Transmisión: ✓`);
      console.log(`   - Dimensiones: ✓`);
      console.log(`   - Consumo/Eficiencia: ✓`);
      console.log(`   - Prestaciones: ✓`);
      console.log(`   - Seguridad: ✓`);
      console.log(`   - ADAS: ✓`);
      console.log(`   - Batería (${isElectric || isHybrid ? 'Sí' : 'N/A'}): ${isElectric || isHybrid ? '✓' : '—'}`);
      console.log(`   - Chasis: ✓`);
      console.log(`   - Iluminación: ✓`);
      console.log(`   - Conectividad: ✓`);
      console.log(`   - Confort: ✓`);
      console.log(`   - Comercial: ✓`);
      return responseData;
    } else {
      console.error('\n❌ Error al crear el vehículo:');
      console.error('Status:', response.status);
      console.error('Error:', JSON.stringify(responseData, null, 2));
      if (responseData.details) {
        console.error('\n📋 Detalles de validación:');
        responseData.details.forEach((detail, index) => {
          console.error(`   ${index + 1}. ${detail.path.join('.')}: ${detail.message}`);
        });
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch')) {
      console.error('💡 Asegúrate de que el servidor esté ejecutándose en', API_URL);
      console.error('   Ejecuta: npm run dev');
    }
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Ejecutar script
(async () => {
  await createVehicle();
})();

