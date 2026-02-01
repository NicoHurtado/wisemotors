/**
 * BYD Tang - Datos técnicos extraídos del PDF oficial
 * Todos los datos provienen del documento técnico Tang.pdf
 */

export const tangVehicleData = {
    // Identificación básica
    marca: 'BYD',
    modelo: 'Tang',
    añoModelo: 2024,
    carrocería: 'SUV',
    plazas: '7',
    puertas: '5',
    versionTrim: 'EV',

    // Motorización y tren motriz
    alimentacion: 'Eléctrico',
    combustible: 'Eléctrico',
    potenciaMaxEV: '509', // HP combinado (241 HP delantero + 268 HP trasero)
    torqueMaxEV: '700', // Nm
    traccion: 'AWD',

    // Transmisión
    tipoTransmision: 'Automático',
    sistemaTransmision: 'Reducción directa',
    numeroMarchas: '1',

    // Dimensiones y capacidades (en mm y kg)
    largo: '4970',
    ancho: '1955',
    alto: '1745',
    distanciaEntreEjes: '2820',
    pesoOrdenMarcha: '2630',
    radioGiro: '5.9',
    despejeSuelo: '190',
    capacidadBaulMaxima: '940',
    capacidadBaulMinima: '235',
    cargaUtil: '3155', // Peso bruto - peso en orden de marcha

    // Batería y carga
    capacidadBrutaBateria: '108.8', // kWh
    tipoEntrada: 'EU Combo2',
    cargadorOBCAC: '11', // kW AC
    tiempo2080DC150KW: '30', // minutos (DC 170kW en el PDF, usando 150kW como aproximación)
    v2hV2g: true,
    potenciaV2hV2g: '3.3', // kW VTOL

    // Eficiencia y autonomía
    autonomiaOficial: '635', // km NEDC

    // Prestaciones
    aceleracion0100: '4.9', // segundos
    velocidadMaxima: '180', // km/h

    // Chasis y suspensión
    suspensionDelantera: 'McPherson con control electrónico DISUS-C',
    suspensionTrasera: 'Multi-brazo con control electrónico DISUS-C',
    amortiguacionAdaptativa: true,
    materialDiscos: 'Ventilados y perforados',
    tipoPinzasFreno: 'BREMBO 6 pistones delanteros',

    // Seguridad pasiva
    numeroAirbags: '6',
    isofixTopTether: true,

    // ADAS (Sistemas de asistencia)
    acc: true, // ACC-S&G
    aeb: true, // AEB
    bsm: true, // BSD
    camara360: true,
    farosAdaptativos: true,
    lka: true, // LKA
    lucesAltasAutomaticas: true,
    parkAssist: true,
    sensoresEstacionamientoDelantero: true,

    // Iluminación
    farosTecnologia: 'LED',
    antinieblaDelantero: false, // No mencionado en PDF
    intermitentesDinamicos: true,
    lavafaros: false,
    sensorLluvia: true,

    // Infoentretenimiento
    androidAuto: 'Estándar',
    appleCarPlay: 'Estándar',
    appRemotaOTA: true,
    audioMarca: 'Dynaudio',
    audioNumeroBocinas: '12',
    bluetooth: true,
    cargadorInalambrico: true,
    navegacionIntegrada: true,
    pantallaCentralTamano: '15.6', // pulgadas con rotación eléctrica
    pantallaCuadroTamano: '12.3', // pulgadas LCD
    puertosUSBA: '2',
    puertosUSBC: '1',
    wifiBordo: true,

    // Interior y confort
    ajusteElectricoConductor: true, // 8 posiciones
    ajusteElectricoPasajero: true, // 4 posiciones
    calefaccionAsientos: true,
    climatizadorZonas: '3',
    iluminacionAmbiental: true,
    materialAsientos: 'Cuero',
    memoriaAsientos: true, // 2 memorias para conductor
    techoPanoramico: true,
    terceraFilaAsientos: true,
    tomas12V: '1',
    ventilacionAsientos: true,
    vidriosElectricos: true,
    volanteMaterialAjustes: 'Multifunción con memoria y calefacción',
    volanteCalefactable: true,
    espejoInteriorElectrocromico: true,
    cristalesAcusticos: true,
    parabrisasCalefactable: true,

    // Off-road (SUV capabilities)
    esOffroad: false, // Es SUV urbano, no off-road extremo
    controlDescenso: true, // HDC
    modosConduccion: 'ECO, NORMAL, DEPORTIVO, NIEVE',

    // Comercial
    precioLista: '', // No especificado en PDF
    garantiaVehiculo: '', // No especificado en PDF
    garantiaBateria: '', // No especificado en PDF
    origenPaisPlanta: 'China',

    // Metadatos
    observaciones: 'BYD Tang - SUV eléctrico de 7 plazas con batería Blade de 108.8 kWh. Equipado con sistema DiLink, pantalla rotatoria de 15.6", audio Dynaudio de 12 bocinas, y múltiples sistemas ADAS. Suspensión adaptativa DISUS-C y frenos BREMBO.',
    aplicabilidadFlags: 'EV,SUV,Premium',

    // WiseMetrics (valores sugeridos basados en características)
    wiseMetricsDiversión: '8', // Buen rendimiento (4.9s 0-100)
    wiseMetricsTecnología: '9', // Pantalla rotatoria, DiLink, múltiples ADAS
    wiseMetricsImpactoAmbiental: '10', // 100% eléctrico
    wiseMetricsFiabilidad: '8', // BYD es líder en EVs
    wiseMetricsCalidadPrecio: '8', // Buena relación calidad-precio
    wiseMetricsComodidad: '9', // 7 plazas, asientos ventilados/calefactados
    wiseMetricsUsabilidad: '9', // 635km autonomía, carga rápida
    wiseMetricsEficiencia: '9', // Eléctrico con batería Blade
    wiseMetricsPrestigio: '7', // BYD en crecimiento
    wiseMetricsCalidadInterior: '8', // Cuero, Dynaudio, pantallas premium
};

export type VehicleFormData = typeof tangVehicleData;
