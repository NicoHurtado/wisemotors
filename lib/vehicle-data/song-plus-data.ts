/**
 * BYD Song Plus DM-i 1.5T - Datos técnicos 2025 Facelift
 * Modelo actualizado con motor turbo y especificaciones mejoradas
 */

export const songPlusVehicleData = {
    // Identificación básica
    marca: 'BYD',
    modelo: 'Song Plus DM-i',
    añoModelo: 2025,
    carrocería: 'SUV',
    plazas: '5',
    puertas: '5',
    versionTrim: 'GS',

    // Motorización y tren motriz
    alimentacion: 'Híbrido Enchufable',
    combustible: 'Híbrido Enchufable',
    cilindrada: '1.5', // 1498 cc
    numeroCilindros: '4',
    arquitecturaMotorTermico: 'En línea',
    potenciaMaxMotorTermico: '128.8', // HP (96 kW)
    potenciaMaxEV: '201', // HP motor eléctrico
    potenciaMaxSistemaHibrido: '261', // HP combinado
    torqueMaxMotorTermico: '220', // Nm
    torqueMaxEV: '300', // Nm motor eléctrico
    traccion: 'FWD',
    octanajeRecomendado: '91',

    // Transmisión
    tipoTransmision: 'Automático',
    sistemaTransmision: 'E-CVT',
    numeroMarchas: '1',

    // Dimensiones y capacidades (en mm y kg)
    largo: '4775', // Modelo Facelift es más largo
    ancho: '1890',
    alto: '1670',
    distanciaEntreEjes: '2765',
    pesoOrdenMarcha: '1900',
    radioGiro: '5.5',
    despejeSuelo: '180',
    capacidadBaulMaxima: '1440', // Con asientos abatidos
    capacidadBaulMinima: '552',
    cargaUtil: '410', // Peso bruto ~2310 - Peso vacío 1900

    // Batería y carga
    capacidadBrutaBateria: '18.3', // kWh Blade Battery
    tipoEntrada: 'Tipo 2 (Mennekes)',
    cargadorOBCAC: '6.6', // kW AC
    tiempo2080AC7KW: '180', // 3 horas para 0-100%
    v2hV2g: true, // V2L
    potenciaV2hV2g: '3.3', // kW
    conduccionOnePedal: false,

    // Eficiencia y autonomía
    autonomiaOficial: '105', // km EV NEDC
    capacidadTanque: '53', // Litros (~14 galones)
    consumoMixto: '5.1', // L/100km en modo híbrido

    // Prestaciones
    aceleracion0100: '8.3', // segundos
    velocidadMaxima: '170', // km/h

    // Chasis y suspensión
    suspensionDelantera: 'McPherson',
    suspensionTrasera: 'Multi-link',
    materialDiscos: 'Ventilados delanteros',
    tipoPinzasFreno: 'Estándar',

    // Seguridad pasiva
    numeroAirbags: '6',
    isofixTopTether: true,
    agenciaCertifica: 'C-NCAP / EuroNCAP',
    puntajeAgencia: '5',

    // ADAS (Sistemas de asistencia)
    acc: true, // ACC
    aeb: true, // AEB
    bsm: true, // BSD
    camara360: true,
    lka: true, // LKA
    lucesAltasAutomaticas: true, // HMA
    parkAssist: true,
    sensoresEstacionamientoDelantero: true,

    // Iluminación
    farosTecnologia: 'LED',
    antinieblaDelantero: false,
    intermitentesDinamicos: true,
    lavafaros: false,
    sensorLluvia: true,

    // Infoentretenimiento
    androidAuto: 'Inalámbrico',
    appleCarPlay: 'Inalámbrico',
    appRemotaOTA: true,
    audioMarca: 'Infinity',
    audioNumeroBocinas: '10',
    bluetooth: true,
    cargadorInalambrico: true,
    navegacionIntegrada: true,
    pantallaCentralTamano: '15.6', // pulgadas con rotación eléctrica
    pantallaCuadroTamano: '12.3', // pulgadas LCD
    puertosUSBA: '2',
    puertosUSBC: '2',
    wifiBordo: true,

    // Interior y confort
    ajusteElectricoConductor: true, // 8 posiciones + memoria
    ajusteElectricoPasajero: true, // 4 posiciones
    calefaccionAsientos: true,
    climatizadorZonas: '2',
    iluminacionAmbiental: true,
    materialAsientos: 'Cuero sintético premium',
    memoriaAsientos: true,
    techoPanoramico: true,
    terceraFilaAsientos: false,
    tomas12V: '1',
    ventilacionAsientos: true,
    vidriosElectricos: true,
    volanteMaterialAjustes: 'Tapizado premium multifunción',
    volanteCalefactable: false,
    espejoInteriorElectrocromico: true,
    cristalesAcusticos: true,
    parabrisasCalefactable: true,

    // Off-road (SUV capabilities)
    esOffroad: false,
    controlDescenso: true, // HDC
    modosConduccion: 'Snow, Normal, ECO, Sport',

    // Comercial
    precioLista: '179990000', // $179.990.000 COP
    garantiaVehiculo: '6 años o 150.000 km',
    garantiaBateria: '8 años o 150.000 km',
    origenPaisPlanta: 'China',

    // Metadatos
    observaciones: 'BYD Song Plus DM-i 1.5T 2025 Facelift - SUV híbrido enchufable de 5 plazas con batería Blade de 18.3 kWh. Autonomía eléctrica de 105 km y autonomía total de 1,105 km. Equipado con pantalla rotatoria de 15.6", sistema Infinity de 10 bocinas, y múltiples sistemas ADAS. Motor turbo 1.5L (128.8 HP) combinado con motor eléctrico (201 HP) para 261 HP totales.',
    aplicabilidadFlags: 'PHEV,SUV,Híbrido,2025',

    // WiseMetrics (valores sugeridos basados en características)
    wiseMetricsDiversión: '8', // Mejor rendimiento con motor turbo
    wiseMetricsTecnología: '9', // Pantalla rotatoria, DiLink, ADAS completo
    wiseMetricsImpactoAmbiental: '9', // PHEV con 105km eléctricos
    wiseMetricsFiabilidad: '8', // BYD es líder en híbridos
    wiseMetricsCalidadPrecio: '9', // Excelente relación calidad-precio
    wiseMetricsComodidad: '8', // 5 plazas, asientos ventilados/calefactados
    wiseMetricsUsabilidad: '10', // 1,105km autonomía total, muy versátil
    wiseMetricsEficiencia: '10', // Híbrido enchufable muy eficiente
    wiseMetricsPrestigio: '7', // BYD en crecimiento
    wiseMetricsCalidadInterior: '8', // Cuero premium, Infinity audio, buenas terminaciones
};

export type VehicleFormData = typeof songPlusVehicleData;
