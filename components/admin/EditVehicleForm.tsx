'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Car, Save, X } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { WiseMetricsForm } from './WiseMetricsForm';

interface Dealer {
  id: string;
  name: string;
  location: string;
}

interface EditVehicleFormProps {
  vehicleId: string;
}

export function EditVehicleForm({ vehicleId }: EditVehicleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dealers, setDealerships] = useState<Dealer[]>([]);
  const [selectedDealers, setSelectedDealers] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [thumbnailIndex, setThumbnailIndex] = useState<number>(0);

  // Estado del formulario - organizado por categorías del documento
  const [formData, setFormData] = useState({
    // Identificación
    marca: '',
    modelo: '',
    añoModelo: new Date().getFullYear(),
    carrocería: '',
    plazas: '',
    puertas: '',
    versionTrim: '',

    // Motorización y tren motriz
    alimentacion: '',
    cilindrada: '',
    numeroCilindros: '',
    combustible: '',
    modosConduccion: '',
    octanajeRecomendado: '',
    arquitecturaMotorTermico: '',
    potenciaMaxEV: '',
    potenciaMaxMotorTermico: '',
    potenciaMaxSistemaHibrido: '',
    torqueMaxEV: '',
    torqueMaxMotorTermico: '',
    torqueMaxSistemaHibrido: '',
    traccion: '',
    startStop: false,
    launchControl: false,

    // Transmisión
    tipoTransmision: '',
    sistemaTransmision: '',
    numeroMarchas: '',
    modoRemolque: false,
    paddleShifters: false,
    torqueVectoring: false,
    traccionInteligenteOnDemand: false,

    // Dimensiones y capacidades
    largo: '',
    ancho: '',
    alto: '',
    pesoOrdenMarcha: '',
    distanciaEntreEjes: '',
    radioGiro: '',
    capacidadBaulMaxima: '',
    capacidadBaulMinima: '',
    capacidadTecho: '',
    cargaUtil: '',
    despejeSuelo: '',

    // Eficiencia y consumo
    consumoMixto: '',
    capacidadTanque: '',
    autonomiaOficial: '',
    costoEnergia100km: '',
    ahorro5Anos: '',
    mpgeCiudad: '',
    mpgeCarretera: '',
    mpgeCombinado: '',
    motorAutostop: false,

    // Batería y carga
    capacidadBrutaBateria: '',
    cargadorOBCAC: '',
    conduccionOnePedal: false,
    regeneracionNiveles: '',
    tiempo0100AC: '',
    tiempo1080DC: '',
    highPowerChargingTimes: '',
    v2hV2g: false,
    potenciaV2hV2g: '',

    // Chasis, frenos y dirección
    suspensionDelantera: '',
    suspensionTrasera: '',
    amortiguacionAdaptativa: false,
    materialDiscos: '',
    tipoPinzasFreno: '',

    // Prestaciones
    aceleracion0100: '',
    aceleracion0200: '',
    aceleracion060: '',
    aceleracion5080: '',
    aceleracion80120: '',
    aceleracionLateralMaxima: '',
    aceleracionLongitudinalMaxima: '',
    frenado1000: '',
    velocidadMaxima: '',
    relacionPesoPotencia: '',
    cuartoMilla: '',

    // Seguridad pasiva y estructural
    numeroAirbags: '',
    euroNCAPEstrellas: '',
    euroNCAPAdulto: '',
    euroNCAPPeaton: '',
    euroNCAPAsistencias: '',
    latinNCAPEstrellas: '',
    isofixTopTether: false,

    // ADAS (asistencias activas)
    acc: false,
    aeb: false,
    bsm: false,
    camara360: false,
    farosAdaptativos: false,
    lka: false,
    lucesAltasAutomaticas: false,
    parkAssist: false,
    sensoresEstacionamientoDelantero: false,

    // Iluminación y visibilidad
    antinieblaDelantero: false,
    farosTecnologia: '',
    intermitentesDinamicos: false,
    lavafaros: false,
    sensorLluvia: false,

    // Infoentretenimiento y conectividad
    androidAuto: '',
    appleCarPlay: '',
    appRemotaOTA: false,
    audioMarca: '',
    audioNumeroBocinas: '',
    bluetooth: false,
    cargadorInalambrico: false,
    navegacionIntegrada: false,
    pantallaCentralTamano: '',
    pantallaCuadroTamano: '',
    potenciaAmplificador: false,
    puertosUSBA: '',
    puertosUSBC: '',
    wifiBordo: false,

    // Interior y confort
    ajusteElectricoConductor: '',
    ajusteElectricoPasajero: '',
    calefaccionAsientos: false,
    climatizadorZonas: '',
    cristalesAcusticos: false,
    iluminacionAmbiental: false,
    masajeAsientos: false,
    materialAsientos: '',
    memoriaAsientos: false,
    parabrisasCalefactable: false,
    segundaFilaCorrediza: false,
    techoPanoramico: false,
    terceraFilaAsientos: false,
    tomas12V120V: '',
    tomacorrienteEnCaja: false,
    ventilacionAsientos: false,
    vidriosElectricos: false,
    volanteMaterialAjustes: '',
    volanteCalefactable: false,
    espejoInteriorElectrocromico: false,

    // Off-road y 4x4
    esOffroad: false,
    controlDescenso: false,
    controlTraccionOffRoad: false,

    // Comercial
    precioLista: '',
    garantiaVehiculo: '',
    garantiaBateria: '',
    asistenciaCarretera: '',
    intervaloMantenimiento: '',
    costoMantenimiento3Primeros: '',
    financiacionCuotaEstimada: '',
    origenPaisPlanta: '',

    // Metadatos
    aplicabilidadFlags: '',
    observaciones: '',

    // WiseMetrics
    wiseMetricsDiversión: '',
    wiseMetricsTecnología: '',
    wiseMetricsImpactoAmbiental: '',
    wiseMetricsFiabilidad: '',
    wiseMetricsCalidadPrecio: '',
    wiseMetricsComodidad: '',
    wiseMetricsUsabilidad: '',
    wiseMetricsEficiencia: '',
    wiseMetricsPrestigio: '',
    wiseMetricsCalidadInterior: '',
  });

  // Función para mapear fuelType del vehículo al formato del formulario
  const mapFuelTypeToFormFormat = (fuelType: string | undefined): string => {
    if (!fuelType) return '';
    const map: Record<string, string> = {
      'Gasolina': 'Gasolina',
      'Diesel': 'Diésel',
      'Diésel': 'Diésel',
      'Eléctrico': 'Eléctrico',
      'Híbrido': 'Híbrido',
      'Híbrido Enchufable': 'Híbrido Enchufable',
      'GNV': 'GNV',
      'Etanol': 'Etanol',
    };
    return map[fuelType] || fuelType;
  };

  // Cargar vehículo existente y concesionarios
  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);

        // Cargar vehículo
        const vehicleResponse = await fetch(`/api/vehicles/${vehicleId}`);
        if (vehicleResponse.ok) {
          const vehicleData = await vehicleResponse.json();

          // Mapear datos del vehículo al formData
          const specs = vehicleData.specifications || {};

          // Obtener combustible desde powertrain o fuelType del vehículo
          const combustibleFromSpecs = specs.powertrain?.combustible;
          const combustibleFromVehicle = mapFuelTypeToFormFormat(vehicleData.fuelType);
          const combustible = combustibleFromSpecs || combustibleFromVehicle || '';

          setFormData({
            // Identificación
            marca: specs.identification?.marca || '',
            modelo: specs.identification?.modelo || '',
            añoModelo: specs.identification?.añoModelo || new Date().getFullYear(),
            carrocería: specs.identification?.carrocería || '',
            plazas: specs.identification?.plazas?.toString() || '',
            puertas: specs.identification?.puertas?.toString() || '',
            versionTrim: specs.identification?.versionTrim || '',

            // Motorización y tren motriz
            alimentacion: specs.powertrain?.alimentacion || '',
            cilindrada: specs.powertrain?.cilindrada?.toString() || '',
            numeroCilindros: specs.powertrain?.numeroCilindros?.toString() || '',
            combustible: combustible,
            modosConduccion: specs.comfort?.modosConduccion || specs.powertrain?.modosConduccion || '',
            octanajeRecomendado: specs.powertrain?.octanajeRecomendado?.toString() || '',
            arquitecturaMotorTermico: specs.powertrain?.arquitecturaMotorTermico || '',
            potenciaMaxEV: specs.powertrain?.potenciaMaxEV?.toString() || '',
            potenciaMaxMotorTermico: specs.powertrain?.potenciaMaxMotorTermico?.toString() || '',
            potenciaMaxSistemaHibrido: specs.powertrain?.potenciaMaxSistemaHibrido?.toString() || '',
            torqueMaxEV: specs.powertrain?.torqueMaxEV?.toString() || '',
            torqueMaxMotorTermico: specs.powertrain?.torqueMaxMotorTermico?.toString() || '',
            torqueMaxSistemaHibrido: specs.powertrain?.torqueMaxSistemaHibrido?.toString() || '',
            launchControl: specs.powertrain?.launchControl || false,

            // Transmisión
            traccion: specs.transmission?.traccion || specs.powertrain?.traccion || '',
            tipoTransmision: specs.transmission?.tipoTransmision || '',
            sistemaTransmision: specs.transmission?.sistemaTransmision || '',
            numeroMarchas: specs.transmission?.numeroMarchas?.toString() || '',
            modoRemolque: specs.transmission?.modoRemolque || false,
            paddleShifters: specs.transmission?.paddleShifters || false,
            torqueVectoring: specs.transmission?.torqueVectoring || false,
            traccionInteligenteOnDemand: specs.transmission?.traccionInteligenteOnDemand || false,

            // Dimensiones y capacidades
            largo: specs.dimensions?.length?.toString() || '',
            ancho: specs.dimensions?.width?.toString() || '',
            alto: specs.dimensions?.height?.toString() || '',
            pesoOrdenMarcha: specs.dimensions?.curbWeight?.toString() || '',
            distanciaEntreEjes: specs.dimensions?.wheelbase?.toString() || '',
            radioGiro: specs.dimensions?.turningRadius?.toString() || '',
            capacidadBaulMaxima: specs.dimensions?.cargoCapacity?.toString() || '',
            capacidadBaulMinima: specs.dimensions?.cargoCapacityMin?.toString() || '',
            capacidadTecho: specs.dimensions?.roofCapacity?.toString() || '',
            cargaUtil: specs.weight?.payload?.toString() || '',
            despejeSuelo: specs.chassis?.groundClearance?.toString() || '',

            // Eficiencia y consumo
            consumoMixto: specs.efficiency?.consumoMixto?.toString() || '',
            capacidadTanque: specs.efficiency?.capacidadTanque?.toString() || '',
            autonomiaOficial: specs.efficiency?.autonomiaOficial?.toString() || '',
            costoEnergia100km: specs.efficiency?.costoEnergia100km?.toString() || '',
            ahorro5Anos: specs.efficiency?.ahorro5Anos?.toString() || '',
            mpgeCiudad: specs.efficiency?.mpgeCiudad?.toString() || '',
            mpgeCarretera: specs.efficiency?.mpgeCarretera?.toString() || '',
            mpgeCombinado: specs.efficiency?.mpgeCombinado?.toString() || '',
            motorAutostop: specs.efficiency?.motorAutostop || false,

            // Batería y carga
            capacidadBrutaBateria: specs.battery?.capacidadBrutaBateria?.toString() || '',
            cargadorOBCAC: specs.battery?.cargadorOBCAC?.toString() || '',
            conduccionOnePedal: specs.battery?.conduccionOnePedal || false,
            regeneracionNiveles: specs.battery?.regeneracionNiveles?.toString() || '',
            tiempo0100AC: specs.battery?.tiempo0100AC?.toString() || '',
            tiempo1080DC: specs.battery?.tiempo1080DC?.toString() || '',
            highPowerChargingTimes: specs.battery?.highPowerChargingTimes || '',
            v2hV2g: specs.battery?.v2hV2g || false,
            potenciaV2hV2g: specs.battery?.potenciaV2hV2g?.toString() || '',

            // Chasis, frenos y dirección
            suspensionDelantera: specs.chassis?.suspensionDelantera || '',
            suspensionTrasera: specs.chassis?.suspensionTrasera || '',
            amortiguacionAdaptativa: specs.chassis?.amortiguacionAdaptativa || false,
            materialDiscos: specs.chassis?.materialDiscos || '',
            tipoPinzasFreno: specs.chassis?.tipoPinzasFreno || '',

            // Prestaciones
            aceleracion0100: specs.performance?.acceleration0to100?.toString() || '',
            aceleracion0200: specs.performance?.acceleration0to200?.toString() || '',
            aceleracion060: specs.performance?.acceleration0to60?.toString() || '',
            aceleracion5080: specs.performance?.acceleration50to80?.toString() || '',
            aceleracion80120: specs.performance?.overtaking80to120?.toString() || '',
            aceleracionLateralMaxima: specs.performance?.maxLateralAcceleration?.toString() || '',
            aceleracionLongitudinalMaxima: specs.performance?.maxLongitudinalAcceleration?.toString() || '',
            frenado1000: specs.performance?.brakingDistance100to0?.toString() || '',
            velocidadMaxima: specs.performance?.maxSpeed?.toString() || '',
            relacionPesoPotencia: specs.performance?.powerToWeight?.toString() || '',
            cuartoMilla: specs.performance?.quarterMile?.toString() || '',

            // Seguridad pasiva y estructural
            numeroAirbags: specs.safety?.airbags?.toString() || '',
            euroNCAPEstrellas: specs.safety?.ncapRating?.toString() || '',
            euroNCAPAdulto: specs.safety?.adultSafetyScore?.toString() || '',
            euroNCAPPeaton: specs.safety?.pedestrianScore?.toString() || '',
            euroNCAPAsistencias: specs.safety?.assistanceScore?.toString() || '',
            latinNCAPEstrellas: specs.safety?.latinNCAPRating?.toString() || '',
            isofixTopTether: false,

            // ADAS (asistencias activas)
            acc: specs.adas?.acc || false,
            aeb: specs.adas?.aeb || false,
            bsm: specs.adas?.bsm || false,
            camara360: specs.adas?.camara360 || false,
            farosAdaptativos: specs.adas?.farosAdaptativos || false,
            lka: specs.adas?.lka || false,
            lucesAltasAutomaticas: specs.adas?.lucesAltasAutomaticas || false,
            parkAssist: specs.adas?.parkAssist || false,
            sensoresEstacionamientoDelantero: specs.adas?.sensoresEstacionamientoDelantero || false,

            // Iluminación y visibilidad
            antinieblaDelantero: specs.lighting?.antinieblaDelantero || false,
            farosTecnologia: specs.lighting?.headlightType || '',
            intermitentesDinamicos: specs.lighting?.intermitentesDinamicos || false,
            lavafaros: specs.lighting?.lavafaros || false,
            sensorLluvia: specs.comfort?.sensorLluvia || specs.lighting?.sensorLluvia || false,

            // Infoentretenimiento y conectividad
            androidAuto: specs.infotainment?.androidAuto || '',
            appleCarPlay: specs.infotainment?.appleCarPlay || '',
            appRemotaOTA: specs.infotainment?.appRemotaOTA || false,
            audioMarca: specs.infotainment?.audioMarca || '',
            audioNumeroBocinas: specs.infotainment?.audioNumeroBocinas?.toString() || '',
            bluetooth: specs.infotainment?.bluetooth || false,
            cargadorInalambrico: specs.infotainment?.cargadorInalambrico || false,
            navegacionIntegrada: specs.infotainment?.navegacionIntegrada || false,
            pantallaCentralTamano: specs.infotainment?.pantallaCentralTamano?.toString() || '',
            pantallaCuadroTamano: specs.infotainment?.pantallaCuadroTamano?.toString() || '',
            potenciaAmplificador: specs.infotainment?.potenciaAmplificador || false,
            puertosUSBA: specs.infotainment?.puertosUSBA?.toString() || '',
            puertosUSBC: specs.infotainment?.puertosUSBC?.toString() || '',
            wifiBordo: specs.infotainment?.wifiBordo || false,

            // Interior y confort
            ajusteElectricoConductor: specs.comfort?.ajusteElectricoConductor?.toString() || '',
            ajusteElectricoPasajero: specs.comfort?.ajusteElectricoPasajero?.toString() || '',
            calefaccionAsientos: specs.comfort?.calefaccionAsientos || false,
            climatizadorZonas: specs.comfort?.climatizadorZonas?.toString() || '',
            cristalesAcusticos: specs.comfort?.cristalesAcusticos || false,
            iluminacionAmbiental: specs.comfort?.iluminacionAmbiental || false,
            masajeAsientos: specs.comfort?.masajeAsientos || false,
            materialAsientos: specs.comfort?.materialAsientos || '',
            memoriaAsientos: specs.comfort?.memoriaAsientos || false,
            parabrisasCalefactable: specs.comfort?.parabrisasCalefactable || false,
            segundaFilaCorrediza: specs.comfort?.segundaFilaCorrediza || false,
            techoPanoramico: specs.comfort?.techoPanoramico || false,
            terceraFilaAsientos: specs.comfort?.terceraFilaAsientos || false,
            tomas12V120V: specs.comfort?.tomas12V120V?.toString() || '',
            tomacorrienteEnCaja: specs.comfort?.tomacorrienteEnCaja || false,
            ventilacionAsientos: specs.comfort?.ventilacionAsientos || false,
            vidriosElectricos: specs.comfort?.vidriosElectricos || false,
            volanteMaterialAjustes: specs.comfort?.volanteMaterialAjustes || '',
            volanteCalefactable: specs.comfort?.volanteCalefactable || false,
            espejoInteriorElectrocromico: specs.comfort?.espejoInteriorElectrocromico || false,
            startStop: specs.comfort?.startStop || specs.powertrain?.startStop || false,

            // Off-road y 4x4
            esOffroad: specs.offRoad?.esOffroad || specs.metadata?.esOffroad || false,
            controlDescenso: specs.offRoad?.controlDescenso || false,
            controlTraccionOffRoad: specs.offRoad?.controlTraccionOffRoad || false,

            // Comercial
            precioLista: specs.commercial?.precioLista?.toString() || vehicleData.price?.toString() || '',
            garantiaVehiculo: specs.commercial?.garantiaVehiculo || '',
            garantiaBateria: specs.commercial?.garantiaBateria || '',
            asistenciaCarretera: specs.commercial?.asistenciaCarretera?.toString() || '',
            intervaloMantenimiento: specs.commercial?.intervaloMantenimiento || '',
            costoMantenimiento3Primeros: specs.commercial?.costoMantenimiento3Primeros?.toString() || '',
            financiacionCuotaEstimada: specs.commercial?.financiacionCuotaEstimada?.toString() || '',
            origenPaisPlanta: specs.commercial?.origenPaisPlanta || '',

            // Metadatos
            aplicabilidadFlags: specs.metadata?.aplicabilidadFlags || '',
            observaciones: specs.metadata?.observaciones || '',

            // WiseMetrics
            wiseMetricsDiversión: specs.wisemetrics?.drivingFun?.toString() || '',
            wiseMetricsTecnología: specs.wisemetrics?.technology?.toString() || '',
            wiseMetricsImpactoAmbiental: specs.wisemetrics?.environmentalImpact?.toString() || '',
            wiseMetricsFiabilidad: specs.wisemetrics?.reliability?.toString() || '',
            wiseMetricsCalidadPrecio: specs.wisemetrics?.qualityPriceRatio?.toString() || '',
            wiseMetricsComodidad: specs.wisemetrics?.comfort?.toString() || '',
            wiseMetricsUsabilidad: specs.wisemetrics?.usability?.toString() || '',
            wiseMetricsEficiencia: specs.wisemetrics?.efficiency?.toString() || '',
            wiseMetricsPrestigio: specs.wisemetrics?.prestige?.toString() || '',
            wiseMetricsCalidadInterior: specs.wisemetrics?.interiorQuality?.toString() || '',
          });

          // Cargar concesionarios seleccionados
          if (vehicleData.vehicleDealers) {
            setSelectedDealers(vehicleData.vehicleDealers.map((vd: any) => vd.dealerId));
          }

          // Cargar imágenes
          if (vehicleData.images) {
            const coverImg = vehicleData.images.find((img: any) => img.type === 'cover');
            const galleryImgs = vehicleData.images
              .filter((img: any) => img.type === 'gallery')
              .sort((a: any, b: any) => a.order - b.order)
              .map((img: any) => img.url);

            const thumbnailImg = vehicleData.images.find((img: any) => img.isThumbnail);
            const thumbnailIdx = thumbnailImg ?
              vehicleData.images
                .filter((img: any) => img.type === 'gallery')
                .sort((a: any, b: any) => a.order - b.order)
                .findIndex((img: any) => img.id === thumbnailImg.id) : 0;

            setCoverImage(coverImg?.url || '');
            setGalleryImages(galleryImgs);
            setThumbnailIndex(thumbnailIdx >= 0 ? thumbnailIdx : 0);
          }
        }

        // Cargar concesionarios
        const dealersResponse = await fetch('/api/dealers');
        if (dealersResponse.ok) {
          const data = await dealersResponse.json();
          setDealerships(data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Error al cargar los datos del vehículo');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [vehicleId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const toggleDealer = (dealerId: string) => {
    setSelectedDealers(prev =>
      prev.includes(dealerId)
        ? prev.filter(id => id !== dealerId)
        : [...prev, dealerId]
    );
  };

  const handleSpecificationChange = (section: string, field: string, value: any) => {
    if (section === 'wisemetrics') {
      // Mapear los campos de wisemetrics
      const fieldMap: Record<string, string> = {
        'drivingFun': 'wiseMetricsDiversión',
        'technology': 'wiseMetricsTecnología',
        'environmentalImpact': 'wiseMetricsImpactoAmbiental',
        'reliability': 'wiseMetricsFiabilidad',
        'qualityPriceRatio': 'wiseMetricsCalidadPrecio',
        'comfort': 'wiseMetricsComodidad',
        'usability': 'wiseMetricsUsabilidad',
        'efficiency': 'wiseMetricsEficiencia',
        'prestige': 'wiseMetricsPrestigio',
        'interiorQuality': 'wiseMetricsCalidadInterior',
      };
      const mappedField = fieldMap[field];
      if (mappedField) {
        setFormData(prev => ({
          ...prev,
          [mappedField]: value
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Organizar datos según el schema esperado
      const specifications = {
        identification: {
          marca: formData.marca,
          modelo: formData.modelo,
          añoModelo: formData.añoModelo ? parseInt(formData.añoModelo.toString()) : undefined,
          carrocería: formData.carrocería,
          plazas: formData.plazas ? parseInt(formData.plazas) : undefined,
          puertas: formData.puertas ? parseInt(formData.puertas) : undefined,
          versionTrim: formData.versionTrim,
        },
        powertrain: {
          alimentacion: formData.alimentacion,
          cilindrada: formData.cilindrada ? parseFloat(formData.cilindrada) : undefined,
          numeroCilindros: formData.numeroCilindros ? parseInt(formData.numeroCilindros) : undefined,
          combustible: formData.combustible,
          octanajeRecomendado: formData.octanajeRecomendado ? parseFloat(formData.octanajeRecomendado) : undefined,
          arquitecturaMotorTermico: formData.arquitecturaMotorTermico || undefined,
          potenciaMaxEV: formData.potenciaMaxEV ? parseFloat(formData.potenciaMaxEV) : undefined,
          potenciaMaxMotorTermico: formData.potenciaMaxMotorTermico ? parseFloat(formData.potenciaMaxMotorTermico) : undefined,
          potenciaMaxSistemaHibrido: formData.potenciaMaxSistemaHibrido ? parseFloat(formData.potenciaMaxSistemaHibrido) : undefined,
          torqueMaxEV: formData.torqueMaxEV ? parseFloat(formData.torqueMaxEV) : undefined,
          torqueMaxMotorTermico: formData.torqueMaxMotorTermico ? parseFloat(formData.torqueMaxMotorTermico) : undefined,
          torqueMaxSistemaHibrido: formData.torqueMaxSistemaHibrido ? parseFloat(formData.torqueMaxSistemaHibrido) : undefined,
          launchControl: formData.launchControl,
        },
        transmission: {
          traccion: formData.traccion,
          tipoTransmision: formData.tipoTransmision,
          sistemaTransmision: formData.tipoTransmision === 'Automático' ? formData.sistemaTransmision : undefined,
          numeroMarchas: formData.numeroMarchas ? parseInt(formData.numeroMarchas) : undefined,
          modoRemolque: formData.tipoTransmision === 'Automático' ? formData.modoRemolque : undefined,
          paddleShifters: formData.tipoTransmision === 'Automático' ? formData.paddleShifters : undefined,
          torqueVectoring: formData.tipoTransmision === 'Automático' ? formData.torqueVectoring : undefined,
          traccionInteligenteOnDemand: formData.tipoTransmision === 'Automático' ? formData.traccionInteligenteOnDemand : undefined,
        },
        dimensions: {
          length: formData.largo ? parseFloat(formData.largo) : undefined,
          width: formData.ancho ? parseFloat(formData.ancho) : undefined,
          height: formData.alto ? parseFloat(formData.alto) : undefined,
          curbWeight: formData.pesoOrdenMarcha ? parseFloat(formData.pesoOrdenMarcha) : undefined,
          wheelbase: formData.distanciaEntreEjes ? parseFloat(formData.distanciaEntreEjes) : undefined,
          cargoCapacity: formData.capacidadBaulMaxima ? parseFloat(formData.capacidadBaulMaxima) : undefined,
          cargoCapacityMin: formData.capacidadBaulMinima ? parseFloat(formData.capacidadBaulMinima) : undefined,
          roofCapacity: formData.capacidadTecho ? parseFloat(formData.capacidadTecho) : undefined,
          turningRadius: formData.radioGiro ? parseFloat(formData.radioGiro) : undefined,
        },
        weight: {
          payload: formData.cargaUtil ? parseFloat(formData.cargaUtil) : undefined,
        },
        interior: {
          trunkCapacitySeatsDown: formData.capacidadBaulMaxima ? parseFloat(formData.capacidadBaulMaxima) : undefined,
          trunkCapacityMin: formData.capacidadBaulMinima ? parseFloat(formData.capacidadBaulMinima) : undefined,
          passengerCapacity: formData.plazas ? parseInt(formData.plazas) : undefined,
        },
        efficiency: {
          consumoMixto: formData.consumoMixto ? parseFloat(formData.consumoMixto) : undefined,
          capacidadTanque: formData.capacidadTanque ? parseFloat(formData.capacidadTanque) : undefined,
          autonomiaOficial: formData.autonomiaOficial ? parseFloat(formData.autonomiaOficial) : undefined,
          costoEnergia100km: formData.costoEnergia100km || undefined,
          ahorro5Anos: formData.ahorro5Anos ? parseFloat(formData.ahorro5Anos) : undefined,
          mpgeCiudad: formData.mpgeCiudad ? parseFloat(formData.mpgeCiudad) : undefined,
          mpgeCarretera: formData.mpgeCarretera ? parseFloat(formData.mpgeCarretera) : undefined,
          mpgeCombinado: formData.mpgeCombinado ? parseFloat(formData.mpgeCombinado) : undefined,
          motorAutostop: formData.motorAutostop,
        },
        battery: {
          capacidadBrutaBateria: formData.capacidadBrutaBateria ? parseFloat(formData.capacidadBrutaBateria) : undefined,
          cargadorOBCAC: formData.cargadorOBCAC ? parseFloat(formData.cargadorOBCAC) : undefined,
          conduccionOnePedal: formData.conduccionOnePedal,
          regeneracionNiveles: formData.regeneracionNiveles ? parseInt(formData.regeneracionNiveles) : undefined,
          tiempo0100AC: formData.tiempo0100AC ? parseFloat(formData.tiempo0100AC) : undefined,
          tiempo1080DC: formData.tiempo1080DC ? parseFloat(formData.tiempo1080DC) : undefined,
          highPowerChargingTimes: formData.highPowerChargingTimes || undefined,
          v2hV2g: formData.v2hV2g,
          potenciaV2hV2g: formData.potenciaV2hV2g ? parseFloat(formData.potenciaV2hV2g) : undefined,
        },
        chassis: {
          groundClearance: formData.despejeSuelo ? parseFloat(formData.despejeSuelo) : undefined,
          suspensionDelantera: formData.suspensionDelantera,
          suspensionTrasera: formData.suspensionTrasera,
          amortiguacionAdaptativa: formData.amortiguacionAdaptativa,
          materialDiscos: formData.materialDiscos,
          tipoPinzasFreno: formData.tipoPinzasFreno,
        },
        performance: {
          acceleration0to100: formData.aceleracion0100 || undefined,
          acceleration0to200: formData.aceleracion0200 || undefined,
          acceleration50to80: formData.aceleracion5080 || undefined,
          overtaking80to120: formData.aceleracion80120 || undefined,
          maxLateralAcceleration: formData.aceleracionLateralMaxima || undefined,
          maxLongitudinalAcceleration: formData.aceleracionLongitudinalMaxima || undefined,
          brakingDistance100to0: formData.frenado1000 || undefined,
          maxSpeed: formData.velocidadMaxima || undefined,
          powerToWeight: formData.relacionPesoPotencia || undefined,
          quarterMile: formData.cuartoMilla || undefined,
          launchControl: formData.launchControl,
        },
        safety: {
          airbags: formData.numeroAirbags ? parseInt(formData.numeroAirbags) : undefined,
          ncapRating: formData.euroNCAPEstrellas ? parseInt(formData.euroNCAPEstrellas) : undefined,
          adultSafetyScore: formData.euroNCAPAdulto ? parseFloat(formData.euroNCAPAdulto) : undefined,
          pedestrianScore: formData.euroNCAPPeaton ? parseFloat(formData.euroNCAPPeaton) : undefined,
          assistanceScore: formData.euroNCAPAsistencias ? parseFloat(formData.euroNCAPAsistencias) : undefined,
          latinNCAPRating: formData.latinNCAPEstrellas ? parseInt(formData.latinNCAPEstrellas) : undefined,
        },
        adas: {
          acc: formData.acc,
          aeb: formData.aeb,
          bsm: formData.bsm,
          camara360: formData.camara360,
          farosAdaptativos: formData.farosAdaptativos,
          lka: formData.lka,
          lucesAltasAutomaticas: formData.lucesAltasAutomaticas,
          parkAssist: formData.parkAssist,
          sensoresEstacionamientoDelantero: formData.sensoresEstacionamientoDelantero,
        },
        lighting: {
          headlightType: formData.farosTecnologia,
          antinieblaDelantero: formData.antinieblaDelantero,
          intermitentesDinamicos: formData.intermitentesDinamicos,
          lavafaros: formData.lavafaros,
        },
        infotainment: {
          androidAuto: formData.androidAuto,
          appleCarPlay: formData.appleCarPlay,
          appRemotaOTA: formData.appRemotaOTA,
          audioMarca: formData.audioMarca,
          audioNumeroBocinas: formData.audioNumeroBocinas ? parseInt(formData.audioNumeroBocinas) : undefined,
          bluetooth: formData.bluetooth,
          cargadorInalambrico: formData.cargadorInalambrico,
          navegacionIntegrada: formData.navegacionIntegrada,
          pantallaCentralTamano: formData.pantallaCentralTamano ? parseFloat(formData.pantallaCentralTamano) : undefined,
          pantallaCuadroTamano: formData.pantallaCuadroTamano ? parseFloat(formData.pantallaCuadroTamano) : undefined,
          potenciaAmplificador: formData.potenciaAmplificador,
          puertosUSBA: formData.puertosUSBA ? parseInt(formData.puertosUSBA) : undefined,
          puertosUSBC: formData.puertosUSBC ? parseInt(formData.puertosUSBC) : undefined,
          wifiBordo: formData.wifiBordo,
        },
        comfort: {
          ajusteElectricoConductor: formData.ajusteElectricoConductor ? parseInt(formData.ajusteElectricoConductor) : undefined,
          ajusteElectricoPasajero: formData.ajusteElectricoPasajero ? parseInt(formData.ajusteElectricoPasajero) : undefined,
          calefaccionAsientos: formData.calefaccionAsientos,
          climatizadorZonas: formData.climatizadorZonas ? parseInt(formData.climatizadorZonas) : undefined,
          cristalesAcusticos: formData.cristalesAcusticos,
          iluminacionAmbiental: formData.iluminacionAmbiental,
          masajeAsientos: formData.masajeAsientos,
          materialAsientos: formData.materialAsientos,
          memoriaAsientos: formData.memoriaAsientos,
          parabrisasCalefactable: formData.parabrisasCalefactable,
          segundaFilaCorrediza: formData.segundaFilaCorrediza,
          techoPanoramico: formData.techoPanoramico,
          terceraFilaAsientos: formData.terceraFilaAsientos,
          tomas12V120V: formData.tomas12V120V ? parseInt(formData.tomas12V120V) : undefined,
          tomacorrienteEnCaja: formData.tomacorrienteEnCaja,
          ventilacionAsientos: formData.ventilacionAsientos,
          vidriosElectricos: formData.vidriosElectricos,
          volanteMaterialAjustes: formData.volanteMaterialAjustes,
          volanteCalefactable: formData.volanteCalefactable,
          espejoInteriorElectrocromico: formData.espejoInteriorElectrocromico,
          startStop: formData.startStop,
          modosConduccion: formData.modosConduccion,
          sensorLluvia: formData.sensorLluvia,
        },
        offRoad: {
          esOffroad: formData.esOffroad,
          controlDescenso: formData.controlDescenso,
          controlTraccionOffRoad: formData.controlTraccionOffRoad,
        },
        commercial: {
          precioLista: formData.precioLista ? parseFloat(formData.precioLista) : undefined,
          garantiaVehiculo: formData.garantiaVehiculo,
          garantiaBateria: formData.garantiaBateria,
          asistenciaCarretera: formData.asistenciaCarretera ? parseFloat(formData.asistenciaCarretera) : undefined,
          intervaloMantenimiento: formData.intervaloMantenimiento,
          costoMantenimiento3Primeros: formData.costoMantenimiento3Primeros ? parseFloat(formData.costoMantenimiento3Primeros) : undefined,
          financiacionCuotaEstimada: formData.financiacionCuotaEstimada ? parseFloat(formData.financiacionCuotaEstimada) : undefined,
          origenPaisPlanta: formData.origenPaisPlanta,
        },
        metadata: {
          aplicabilidadFlags: formData.aplicabilidadFlags,
          observaciones: formData.observaciones,
        },
        wisemetrics: {
          drivingFun: formData.wiseMetricsDiversión ? parseInt(formData.wiseMetricsDiversión.toString()) : undefined,
          technology: formData.wiseMetricsTecnología ? parseInt(formData.wiseMetricsTecnología.toString()) : undefined,
          environmentalImpact: formData.wiseMetricsImpactoAmbiental ? parseInt(formData.wiseMetricsImpactoAmbiental.toString()) : undefined,
          reliability: formData.wiseMetricsFiabilidad ? parseInt(formData.wiseMetricsFiabilidad.toString()) : undefined,
          qualityPriceRatio: formData.wiseMetricsCalidadPrecio ? parseInt(formData.wiseMetricsCalidadPrecio.toString()) : undefined,
          comfort: formData.wiseMetricsComodidad ? parseInt(formData.wiseMetricsComodidad.toString()) : undefined,
          usability: formData.wiseMetricsUsabilidad ? parseInt(formData.wiseMetricsUsabilidad.toString()) : undefined,
          efficiency: formData.wiseMetricsEficiencia ? parseInt(formData.wiseMetricsEficiencia.toString()) : undefined,
          prestige: formData.wiseMetricsPrestigio ? parseInt(formData.wiseMetricsPrestigio.toString()) : undefined,
          interiorQuality: formData.wiseMetricsCalidadInterior ? parseInt(formData.wiseMetricsCalidadInterior.toString()) : undefined,
        },
      };

      // Limpiar especificaciones vacías
      const cleanSpecifications = (obj: any, key?: string): any => {
        // Preservar wisemetrics sin limpieza
        if (key === 'wisemetrics') {
          return obj;
        }

        if (obj === null || obj === undefined) return undefined;
        if (typeof obj === 'string' && obj.trim() === '') return undefined;
        if (typeof obj === 'number' && isNaN(obj)) return undefined;
        if (Array.isArray(obj)) {
          const filtered = obj.filter(item => item !== null && item !== undefined && item !== '');
          return filtered.length > 0 ? filtered : undefined;
        }
        if (typeof obj === 'object') {
          const cleaned: any = {};
          for (const [objKey, value] of Object.entries(obj)) {
            const cleanedValue = cleanSpecifications(value, objKey);
            if (cleanedValue !== undefined && cleanedValue !== null && cleanedValue !== '') {
              cleaned[objKey] = cleanedValue;
            }
          }
          return Object.keys(cleaned).length > 0 ? cleaned : undefined;
        }
        return obj;
      };

      let cleanedSpecs = cleanSpecifications(specifications);

      // Añadir wisemetrics a las especificaciones (asegurar que siempre se incluya)
      if (specifications.wisemetrics) {
        if (!cleanedSpecs) {
          cleanedSpecs = {};
        }
        cleanedSpecs.wisemetrics = specifications.wisemetrics;
      }

      // Mapear carrocería a tipo válido
      const mapCarroceriaToType = (carroceria: string): 'Sedán' | 'SUV' | 'Pickup' | 'Deportivo' | 'Wagon' | 'Hatchback' | 'Convertible' => {
        const map: Record<string, 'Sedán' | 'SUV' | 'Pickup' | 'Deportivo' | 'Wagon' | 'Hatchback' | 'Convertible'> = {
          'Sedán': 'Sedán',
          'SUV': 'SUV',
          'Pick-up': 'Pickup',
          'Pickup': 'Pickup',
          'Deportivo': 'Deportivo',
          'Wagon': 'Wagon',
          'Hatchback': 'Hatchback',
          'Convertible': 'Convertible',
        };
        return map[carroceria] || 'Sedán';
      };

      // Mapear combustible a tipo válido
      const mapCombustibleToFuelType = (combustible: string): 'Gasolina' | 'Diesel' | 'Eléctrico' | 'Híbrido' | 'Híbrido Enchufable' => {
        const map: Record<string, 'Gasolina' | 'Diesel' | 'Eléctrico' | 'Híbrido' | 'Híbrido Enchufable'> = {
          'Gasolina': 'Gasolina',
          'Diésel': 'Diesel',
          'Diesel': 'Diesel',
          'Eléctrico': 'Eléctrico',
          'Híbrido': 'Híbrido',
          'Híbrido Enchufable': 'Híbrido Enchufable',
        };
        return map[combustible] || 'Gasolina';
      };

      // Mapear vehicleType según el tipo de carrocería
      const mapVehicleType = (carroceria: string, type: string): 'Automóvil' | 'Deportivo' | 'Todoterreno' | 'Lujo' | 'Económico' => {
        if (type === 'SUV' || type === 'Pickup') {
          return 'Todoterreno';
        }
        if (type === 'Deportivo') {
          return 'Deportivo';
        }
        // Por defecto, la mayoría son automóviles
        return 'Automóvil';
      };

      const vehicleType = mapVehicleType(formData.carrocería, mapCarroceriaToType(formData.carrocería));

      const vehicleData = {
        brand: formData.marca,
        model: formData.modelo,
        year: formData.añoModelo,
        price: formData.precioLista ? parseFloat(formData.precioLista) : 0,
        type: mapCarroceriaToType(formData.carrocería),
        vehicleType: vehicleType,
        fuelType: mapCombustibleToFuelType(formData.combustible),
        specifications: cleanedSpecs || {},
        dealerIds: selectedDealers,
        coverImage,
        galleryImages,
        thumbnailIndex
      };

      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleData),
      });

      if (response.ok) {
        const updatedVehicle = await response.json();
        alert('✅ Vehículo actualizado exitosamente!');
        router.push(`/admin/vehicles/${vehicleId}`);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);

        // Mostrar errores de validación detallados
        if (errorData.details && Array.isArray(errorData.details)) {
          const errorMessages = errorData.details.map((err: any) => {
            const path = err.path.join(' > ');
            return `• ${path}: ${err.message}`;
          }).join('\n');

          alert(`❌ Error de validación:\n\n${errorMessages}\n\nRevisa los campos marcados y asegúrate de que todos los valores sean correctos.`);
        } else {
          alert(`❌ Error: ${errorData.error || 'Error al actualizar el vehículo'}\n\nRevisa la consola del navegador para más detalles.`);
        }
      }
    } catch (error) {
      console.error('Error updating vehicle:', error);
      alert('❌ Error inesperado al actualizar el vehículo.\n\nRevisa la consola del navegador para más detalles.');
    } finally {
      setLoading(false);
    }
  };

  // Función para determinar si un campo debe mostrarse basándose en aplicabilidad
  const shouldShowField = (aplicabilidad: string | string[]): boolean => {
    if (!aplicabilidad || aplicabilidad === 'Todos' || aplicabilidad === '—') return true;

    const carroceria = formData.carrocería;
    const combustible = formData.combustible;
    const aplicabilidades = Array.isArray(aplicabilidad) ? aplicabilidad : [aplicabilidad];

    // Si no hay carrocería seleccionada, verificar solo por combustible
    if (!carroceria) {
      // Si requiere carrocería específica, verificar si es offroad
      const requiereCarroceria = aplicabilidades.some(apl =>
        apl.includes('SUV') || apl.includes('Pick-up') || apl.includes('Deportivo') || apl === '4x4' || apl === 'SUV/4x4'
      );
      // Si requiere carrocería pero el vehículo está marcado como offroad, permitir mostrar campos 4x4
      if (requiereCarroceria) {
        const esOffroad = (formData as any).esOffroad;
        if (esOffroad && (aplicabilidades.includes('4x4') || aplicabilidades.includes('SUV/4x4'))) {
          // Permitir mostrar si es offroad y la aplicabilidad es 4x4 o SUV/4x4
          return true;
        } else {
          return false;
        }
      }

      // Verificar aplicabilidades de combustible
      return aplicabilidades.some(apl => {
        if (apl === 'Todos' || apl === '—') return true;
        if (apl === 'Premium') return true;

        if (combustible) {
          if (apl === 'EV' && combustible === 'Eléctrico') return true;
          if (apl === 'EV/PHEV' && (combustible === 'Eléctrico' || combustible === 'Híbrido Enchufable')) return true;
          if (apl === 'EV/Premium' && combustible === 'Eléctrico') return true;
          if (apl === 'ICE/HEV/PHE' && (combustible === 'Gasolina' || combustible === 'Diésel' || combustible === 'GNV' || combustible === 'Etanol' || combustible === 'Híbrido' || combustible === 'Híbrido Enchufable')) return true;
          if (apl === 'ICE/HEV' && (combustible === 'Gasolina' || combustible === 'Diésel' || combustible === 'GNV' || combustible === 'Etanol' || combustible === 'Híbrido')) return true;
          if (apl === 'HEV/PHEV' && (combustible === 'Híbrido' || combustible === 'Híbrido Enchufable')) return true;
          if (apl === 'PHEV' && combustible === 'Híbrido Enchufable') return true;
        } else {
          // Si no hay combustible, no mostrar campos que requieren combustible específico
          if (apl.includes('EV') || apl.includes('ICE') || apl.includes('HEV') || apl.includes('PHE')) {
            return false;
          }
        }

        return false;
      });
    }

    // Verificar si alguna aplicabilidad coincide
    return aplicabilidades.some(apl => {
      // Si es "Todos", siempre se muestra
      if (apl === 'Todos' || apl === '—') return true;

      // Premium: Por ahora se muestra siempre (no hay forma de determinar si es premium solo por carrocería)
      if (apl === 'Premium') return true;

      // Verificar aplicabilidades específicas de carrocería
      if (apl.includes('SUV') && carroceria === 'SUV') return true;
      if (apl.includes('Pick-up') && carroceria === 'Pick-up') return true;
      if (apl.includes('Deportivo') && carroceria === 'Deportivo') return true;
      // Para campos 4x4 y SUV/4x4, también verificar si el vehículo está marcado como offroad
      const esOffroad = (formData as any).esOffroad;
      if (apl === '4x4') {
        if (esOffroad || carroceria === 'SUV' || carroceria === 'Pick-up') return true;
      }
      if (apl === 'SUV/4x4') {
        if (esOffroad || carroceria === 'SUV') return true;
      }
      if (apl === 'SUV/Deportivo' && (carroceria === 'SUV' || carroceria === 'Deportivo')) return true;
      if (apl === 'Pick-up/SUV' && (carroceria === 'Pick-up' || carroceria === 'SUV')) return true;

      // Verificar aplicabilidades de combustible (solo si hay combustible seleccionado)
      if (combustible) {
        if (apl === 'EV' && combustible === 'Eléctrico') return true;
        if (apl === 'EV/PHEV' && (combustible === 'Eléctrico' || combustible === 'Híbrido Enchufable')) return true;
        // EV/Premium: requiere que sea Eléctrico (Premium se muestra siempre)
        if (apl === 'EV/Premium' && combustible === 'Eléctrico') return true;
        if (apl === 'ICE/HEV/PHE' && (combustible === 'Gasolina' || combustible === 'Diésel' || combustible === 'GNV' || combustible === 'Etanol' || combustible === 'Híbrido' || combustible === 'Híbrido Enchufable')) return true;
        if (apl === 'ICE/HEV' && (combustible === 'Gasolina' || combustible === 'Diésel' || combustible === 'GNV' || combustible === 'Etanol' || combustible === 'Híbrido')) return true;
        if (apl === 'HEV/PHEV' && (combustible === 'Híbrido' || combustible === 'Híbrido Enchufable')) return true;
        if (apl === 'PHEV' && combustible === 'Híbrido Enchufable') return true;
      } else {
        // Si no hay combustible seleccionado, no mostrar campos que requieren combustible específico
        if (apl.includes('EV') || apl.includes('ICE') || apl.includes('HEV') || apl.includes('PHE')) {
          // Si requiere combustible específico pero no hay combustible seleccionado, no mostrar
          return false;
        }
      }

      return false;
    });
  };

  const renderField = (name: string, label: string, type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea' = 'text', options?: string[], unit?: string, aplicabilidad?: string | string[]) => {
    // Si hay aplicabilidad definida, verificar si debe mostrarse
    // Si no hay aplicabilidad definida, siempre mostrar (se asume "Todos")
    if (aplicabilidad !== undefined && !shouldShowField(aplicabilidad)) {
      return null;
    }

    return (
      <div key={name}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {unit && `(${unit})`}
        </label>
        {type === 'checkbox' ? (
          <input
            type="checkbox"
            name={name}
            checked={(formData as any)[name] as boolean}
            onChange={handleChange}
            className="w-5 h-5 text-wise border-gray-300 rounded focus:ring-wise"
          />
        ) : type === 'select' ? (
          <select
            name={name}
            value={(formData as any)[name] as string}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
          >
            <option value="">Seleccionar...</option>
            {options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            name={name}
            value={(formData as any)[name] as string}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
          />
        ) : (
          <input
            type={type}
            name={name}
            value={(formData as any)[name] as string}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
            step={type === 'number' ? 'any' : undefined}
          />
        )}
      </div>
    );
  };

  // Mostrar loader mientras se cargan los datos
  if (initialLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wise mb-4"></div>
          <p className="text-gray-600">Cargando datos del vehículo...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
      {/* Foto de Portada */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Car className="w-5 h-5 mr-2 text-wise" />
          Foto de Portada
        </h2>
        <ImageUpload
          images={coverImage ? [coverImage] : []}
          onImagesChange={(images) => setCoverImage(images[0] || '')}
          maxImages={1}
          type="cover"
          label="Selecciona la foto principal del vehículo"
        />
      </div>

      {/* Galería de Fotos */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Car className="w-5 h-5 mr-2 text-wise" />
          Galería de Fotos
        </h2>
        <ImageUpload
          images={galleryImages}
          onImagesChange={setGalleryImages}
          maxImages={10}
          type="gallery"
          label="Sube fotos adicionales para la galería del vehículo"
          thumbnailIndex={thumbnailIndex}
          onThumbnailChange={setThumbnailIndex}
        />
      </div>

      {/* Identificación */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Car className="w-5 h-5 mr-2 text-wise" />
          Identificación
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderField('marca', 'Marca', 'text', undefined)}
          {renderField('modelo', 'Modelo', 'text', undefined)}
          {renderField('añoModelo', 'Año Modelo', 'number', undefined, 'AAAA')}
          {renderField('carrocería', 'Carrocería', 'select', ['Sedán', 'SUV', 'Pick-up', 'Hatchback', 'Wagon', 'Convertible', 'Deportivo'])}
          {renderField('versionTrim', 'Versión/Trim', 'text', undefined)}
        </div>
      </div>

      {/* Motorización */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Car className="w-5 h-5 mr-2 text-wise" />
          Motorización
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderField('alimentacion', 'Alimentación', 'text', undefined)}
          {renderField('cilindrada', 'Cilindrada', 'number', undefined, 'L', 'ICE/HEV/PHE')}
          {renderField('numeroCilindros', 'Número de cilindros', 'number', undefined, undefined, 'ICE/HEV/PHE')}
          {renderField('combustible', 'Combustible', 'select', ['Gasolina', 'Diésel', 'GNV', 'Etanol', 'Eléctrico', 'Híbrido', 'Híbrido Enchufable'], undefined, 'Todos')}
          {renderField('octanajeRecomendado', 'Octanaje recomendado', 'number', undefined, 'RON', 'ICE/HEV/PHE')}
          {renderField('arquitecturaMotorTermico', 'Arquitectura motor térmico', 'select', ['En línea', 'V', 'Boxer', 'W'], undefined, 'ICE/HEV/PHE')}
          {renderField('potenciaMaxEV', 'Potencia máx. (EV)', 'number', undefined, 'kW; HP', 'EV')}
          {renderField('potenciaMaxMotorTermico', 'Potencia máx. (motor térmico)', 'number', undefined, 'kW; HP', 'ICE/HEV/PHE')}
          {renderField('potenciaMaxSistemaHibrido', 'Potencia máx. (sistema híbrido)', 'number', undefined, 'kW; HP', 'HEV/PHEV')}
          {renderField('torqueMaxEV', 'Torque máx. (EV)', 'number', undefined, 'Nm', 'EV')}
          {renderField('torqueMaxMotorTermico', 'Torque máx. (motor térmico)', 'number', undefined, 'Nm', 'ICE/HEV/PHE')}
          {renderField('torqueMaxSistemaHibrido', 'Torque máx. (sistema híbrido)', 'number', undefined, 'Nm', 'HEV/PHEV')}
          {renderField('launchControl', 'Launch control', 'checkbox', undefined, undefined, 'Deportivo')}
        </div>
      </div>

      {/* Transmisión */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Car className="w-5 h-5 mr-2 text-wise" />
          Transmisión
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderField('traccion', 'Tracción', 'select', ['FWD', 'RWD', 'AWD', '4WD'], undefined, 'Todos')}
          {renderField('tipoTransmision', 'Tipo de transmisión', 'select', ['Manual', 'Automático'], undefined, 'ICE/HEV/PHE')}
          {renderField('numeroMarchas', 'Número de marchas', 'number', undefined, undefined, 'ICE/HEV/PHE')}
          {formData.tipoTransmision === 'Automático' && renderField('sistemaTransmision', 'Sistema de transmisión', 'select', ['Convertidor de torque', 'DualClutch', 'CVT', 'AMT'], undefined, 'ICE/HEV/PHE')}
          {formData.tipoTransmision === 'Automático' && renderField('modoRemolque', 'Modo remolque/arrastre', 'checkbox', undefined, undefined, 'Pick-up/SUV')}
          {formData.tipoTransmision === 'Automático' && renderField('paddleShifters', 'Paddle shifters', 'checkbox', undefined, undefined, 'Deportivo')}
          {formData.tipoTransmision === 'Automático' && renderField('torqueVectoring', 'Torque Vectoring', 'checkbox', undefined, undefined, 'SUV/Deportivo')}
          {formData.tipoTransmision === 'Automático' && renderField('traccionInteligenteOnDemand', 'Tracción inteligente On-Demand', 'checkbox', undefined, undefined, 'SUV')}
        </div>
      </div>

      {/* Dimensiones y capacidades */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Car className="w-5 h-5 mr-2 text-wise" />
          Dimensiones y Capacidades
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderField('largo', 'Largo', 'number', undefined, 'mm')}
          {renderField('ancho', 'Ancho (sin espejos)', 'number', undefined, 'mm')}
          {renderField('alto', 'Alto', 'number', undefined, 'mm')}
          {renderField('pesoOrdenMarcha', 'Peso en orden de marcha', 'number', undefined, 'kg')}
          {renderField('distanciaEntreEjes', 'Distancia entre ejes', 'number', undefined, 'mm')}
          {renderField('radioGiro', 'Radio de giro (pared a pared)', 'number', undefined, 'm')}
          {renderField('plazas', 'Plazas', 'number', undefined)}
          {renderField('puertas', 'Puertas', 'number', undefined)}
          {renderField('capacidadBaulMaxima', 'Capacidad de baúl (máxima)', 'number', undefined, 'L')}
          {renderField('capacidadBaulMinima', 'Capacidad de baúl (mínima)', 'number', undefined, 'L')}
          {renderField('capacidadTecho', 'Capacidad de techo/barras', 'number', undefined, 'kg', 'SUV')}
          {renderField('cargaUtil', 'Carga útil (payload)', 'number', undefined, 'kg', 'Todos')}
          {renderField('despejeSuelo', 'Despeje al suelo', 'number', undefined, 'mm', 'SUV/Pick-up')}
        </div>
      </div>

      {/* Eficiencia y consumo */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Car className="w-5 h-5 mr-2 text-wise" />
          Eficiencia y Consumo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderField('consumoMixto', 'Consumo mixto', 'number', undefined, 'L/100 km; kWh/100 km')}
          {renderField('capacidadTanque', 'Capacidad de tanque combustible', 'number', undefined, 'L', 'ICE/HEV/PHE')}
          {renderField('autonomiaOficial', 'Autonomía oficial', 'number', undefined, 'km', 'EV/PHEV')}
          {renderField('costoEnergia100km', 'Costo de energía por 100 km', 'text', undefined, 'COP')}
          {renderField('ahorro5Anos', 'Ahorro a 3 años', 'number', undefined, 'COP')}
          {renderField('mpgeCombinado', 'KMGe combinado', 'number', undefined, 'kmge', 'EV/PHEV')}
          {renderField('motorAutostop', 'Motor autostop', 'checkbox', undefined, undefined, 'Todos')}
        </div>
      </div>

      {/* Batería y carga */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Car className="w-5 h-5 mr-2 text-wise" />
          Batería y Carga
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Para híbridos (no enchufables), mostrar 5 campos específicos */}
          {formData.combustible === 'Híbrido' ? (
            <>
              {renderField('capacidadBrutaBateria', 'Capacidad bruta batería (kWh)', 'number', undefined, 'kWh')}
              {renderField('regeneracionNiveles', 'Regeneración (niveles)', 'number')}
              {renderField('conduccionOnePedal', 'Conducción One-Pedal', 'checkbox')}
              {renderField('v2hV2g', 'V2H/V2G (bidireccional)', 'checkbox')}
              {renderField('potenciaV2hV2g', 'V2H/V2G Potencia (kW)', 'number', undefined, 'kW')}
            </>
          ) : (
            <>
              {/* Para eléctricos e híbridos enchufables, mostrar exactamente 9 campos */}
              {renderField('capacidadBrutaBateria', 'Capacidad bruta batería (kWh)', 'number', undefined, 'kWh')}
              {renderField('cargadorOBCAC', 'Cargador a bordo (OBC) AC (kW)', 'number', undefined, 'kW')}
              {renderField('conduccionOnePedal', 'Conducción One-Pedal', 'checkbox')}
              {renderField('regeneracionNiveles', 'Regeneración (niveles)', 'number')}
              {renderField('tiempo0100AC', 'Tiempo 0-100% (AC) (h)', 'number', undefined, 'h')}
              {renderField('tiempo1080DC', 'Tiempo 10-80% (DC) (min)', 'number', undefined, 'min')}
              {renderField('highPowerChargingTimes', 'High Power Charging times', 'text')}
              {renderField('v2hV2g', 'V2H/V2G (bidireccional)', 'checkbox')}
              {renderField('potenciaV2hV2g', 'V2H/V2G Potencia (kW)', 'number', undefined, 'kW')}
            </>
          )}
        </div>
      </div>

      {/* Chasis, frenos y dirección */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Car className="w-5 h-5 mr-2 text-wise" />
          Chasis, Frenos y Dirección
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderField('suspensionDelantera', 'Suspensión delantera', 'text', undefined)}
          {renderField('suspensionTrasera', 'Suspensión trasera', 'text', undefined)}
          {renderField('amortiguacionAdaptativa', 'Amortiguación adaptativa', 'checkbox', undefined, undefined, 'Premium')}
          {renderField('materialDiscos', 'Tipos de freno', 'text', undefined)}
          {renderField('tipoPinzasFreno', 'Tipo de pistones de freno', 'text', undefined)}
        </div>
      </div>

      {/* Prestaciones */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Car className="w-5 h-5 mr-2 text-wise" />
          Prestaciones
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderField('aceleracion0100', '0-100 km/h', 'text', undefined, 's')}
          {renderField('aceleracion0200', '0-200 km/h', 'text', undefined, 's')}
          {renderField('aceleracion5080', '50-80 km/h (recuperación)', 'text', undefined, 's')}
          {renderField('aceleracion80120', '80-120 km/h (adelantamiento)', 'text', undefined, 's')}
          {renderField('aceleracionLateralMaxima', 'Aceleración lateral máxima', 'text', undefined, 'g')}
          {renderField('aceleracionLongitudinalMaxima', 'Aceleración longitudinal máxima', 'text', undefined, 'g')}
          {renderField('frenado1000', 'Frenado 160-0 km/h', 'text', undefined, 'm')}
          {renderField('velocidadMaxima', 'Velocidad máxima', 'text', undefined, 'km/h')}
          {renderField('relacionPesoPotencia', 'Relación peso/potencia', 'text', undefined, 'HP/ton')}
          {renderField('cuartoMilla', '1/4 de milla (tiempo)', 'text', undefined, 's')}
        </div>
      </div>

      {/* Seguridad pasiva y estructural */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Car className="w-5 h-5 mr-2 text-wise" />
          Seguridad Pasiva y Estructural
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderField('numeroAirbags', 'Número total de airbags', 'number', undefined)}
          {renderField('euroNCAPEstrellas', 'Euro NCAP (estrellas)', 'number', undefined, '★')}
          {renderField('euroNCAPAdulto', 'Euro NCAP (Adulto %)', 'number', undefined, '%')}
          {renderField('euroNCAPPeaton', 'Euro NCAP (Peatón %)', 'number', undefined, '%')}
          {renderField('euroNCAPAsistencias', 'Euro NCAP (Asistencias %)', 'number', undefined, '%')}
          {renderField('latinNCAPEstrellas', 'Latin NCAP (estrellas)', 'number', undefined, '★')}
          {renderField('isofixTopTether', 'ISOFIX y Top Tether', 'checkbox')}
        </div>
      </div>

      {/* ADAS */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Car className="w-5 h-5 mr-2 text-wise" />
          ADAS (Asistencias Activas)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderField('acc', 'ACC (crucero adaptativo)', 'checkbox')}
          {renderField('aeb', 'AEB (frenado autónomo)', 'checkbox')}
          {renderField('bsm', 'BSM (punto ciego)', 'checkbox')}
          {renderField('camara360', 'Cámara 360°', 'checkbox')}
          {renderField('farosAdaptativos', 'Faros adaptativos (ADB)', 'checkbox')}
          {renderField('lka', 'LKA (asistente carril)', 'checkbox')}
          {renderField('lucesAltasAutomaticas', 'Luces altas automáticas', 'checkbox')}
          {renderField('parkAssist', 'Park Assist (autónomo)', 'checkbox')}
          {renderField('sensoresEstacionamientoDelantero', 'Sensores estacionamiento delantero', 'checkbox')}
        </div>
      </div>

      {/* Iluminación y visibilidad */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Car className="w-5 h-5 mr-2 text-wise" />
          Iluminación y Visibilidad
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderField('antinieblaDelantero', 'Antiniebla delantero', 'checkbox')}
          {renderField('farosTecnologia', 'Faros (tecnología)', 'select', ['LED', 'Matriz', 'Láser', 'halógeno'])}
          {renderField('intermitentesDinamicos', 'Intermitentes dinámicos', 'checkbox', undefined, undefined, 'Premium')}
          {renderField('lavafaros', 'Lavafaros', 'checkbox', undefined, undefined, 'Premium')}
        </div>
      </div>

      {/* Infoentretenimiento y conectividad */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Car className="w-5 h-5 mr-2 text-wise" />
          Infoentretenimiento y Conectividad
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderField('androidAuto', 'Android Auto', 'select', ['Cable', 'Inalámbrico', 'No aplica'])}
          {renderField('appleCarPlay', 'Apple CarPlay', 'select', ['Cable', 'Inalámbrico', 'No aplica'])}
          {renderField('appRemotaOTA', 'App remota / OTA', 'checkbox', undefined, undefined, 'EV/Premium')}
          {renderField('audioMarca', 'Audio (marca)', 'text', undefined)}
          {renderField('audioNumeroBocinas', 'Audio (número de bocinas)', 'number', undefined)}
          {renderField('bluetooth', 'Bluetooth', 'checkbox')}
          {renderField('cargadorInalambrico', 'Cargador inalámbrico', 'checkbox', undefined, undefined, 'Premium')}
          {renderField('navegacionIntegrada', 'Navegación integrada', 'checkbox', undefined, undefined, 'Premium')}
          {renderField('pantallaCentralTamano', 'Pantalla central (tamaño)', 'number', undefined, 'in')}
          {renderField('pantallaCuadroTamano', 'Pantalla de cuadro (tamaño)', 'number', undefined, 'in')}
          {renderField('potenciaAmplificador', 'Potencia de amplificador', 'checkbox', undefined, undefined, 'Premium')}
          {renderField('puertosUSBA', 'Puertos USB-A (cantidad)', 'number', undefined)}
          {renderField('puertosUSBC', 'Puertos USB-C (cantidad)', 'number', undefined)}
          {renderField('wifiBordo', 'Wi-Fi a bordo', 'checkbox', undefined, undefined, 'Premium')}
        </div>
      </div>

      {/* Interior y confort */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Car className="w-5 h-5 mr-2 text-wise" />
          Interior y Confort
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderField('ajusteElectricoConductor', 'Ajuste eléctrico conductor (vías)', 'number', undefined)}
          {renderField('ajusteElectricoPasajero', 'Ajuste eléctrico pasajero (vías)', 'number', undefined, undefined, 'Premium')}
          {renderField('calefaccionAsientos', 'Calefacción de asientos', 'checkbox', undefined, undefined, 'Premium')}
          {renderField('climatizadorZonas', 'Climatizador (zonas)', 'number', undefined, undefined, 'Todos')}
          {renderField('cristalesAcusticos', 'Cristales acústicos', 'checkbox', undefined, undefined, 'Premium')}
          {renderField('iluminacionAmbiental', 'Iluminación ambiental', 'checkbox', undefined, undefined, 'Premium')}
          {renderField('masajeAsientos', 'Masaje en asientos', 'checkbox', undefined, undefined, 'Premium')}
          {renderField('materialAsientos', 'Material de asientos', 'text', undefined, undefined, 'Todos')}
          {renderField('memoriaAsientos', 'Memoria de asientos', 'checkbox', undefined, undefined, 'Premium')}
          {renderField('parabrisasCalefactable', 'Parabrisas calefactable', 'checkbox', undefined, undefined, 'Premium')}
          {renderField('segundaFilaCorrediza', 'Segunda fila corrediza', 'checkbox', undefined, undefined, 'SUV')}
          {renderField('techoPanoramico', 'Techo panorámico', 'checkbox', undefined, undefined, 'Premium')}
          {renderField('terceraFilaAsientos', 'Tercera fila de asientos', 'checkbox', undefined, undefined, 'SUV')}
          {renderField('tomas12V120V', 'Tomas 12 V/120 V', 'number', undefined, undefined, 'Todos')}
          {renderField('tomacorrienteEnCaja', 'Tomacorriente en caja (pick-up)', 'checkbox', undefined, undefined, 'Pick-up')}
          {renderField('ventilacionAsientos', 'Ventilación de asientos', 'checkbox', undefined, undefined, 'Premium')}
          {renderField('vidriosElectricos', 'Vidrios automáticos', 'checkbox', undefined, undefined, 'Todos')}
          {renderField('volanteMaterialAjustes', 'Volante (material y ajustes)', 'text', undefined, undefined, 'Todos')}
          {renderField('volanteCalefactable', 'Volante calefactable', 'checkbox', undefined, undefined, 'Premium')}
          {renderField('espejoInteriorElectrocromico', 'Espejo interior electrocrómico', 'checkbox', undefined, undefined, 'Todos')}
          {renderField('startStop', 'Tecnología Keyless', 'checkbox', undefined, undefined, 'Todos')}
          {renderField('modosConduccion', 'Modos de conducción', 'text', undefined, undefined, 'Todos')}
          {renderField('sensorLluvia', 'Sensor de lluvia', 'checkbox')}
        </div>
      </div>

      {/* Off-road y 4x4 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Car className="w-5 h-5 mr-2 text-wise" />
          Off-road y 4x4
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderField('esOffroad', 'Vehículo Off-road', 'checkbox', undefined, undefined, 'Todos')}
          {renderField('controlDescenso', 'Control de descenso', 'checkbox', undefined, undefined, 'SUV/4x4')}
          {renderField('controlTraccionOffRoad', 'Control de tracción off-road', 'checkbox', undefined, undefined, '4x4')}
        </div>
      </div>

      {/* Comercial */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Car className="w-5 h-5 mr-2 text-wise" />
          Comercial
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderField('precioLista', 'Precio de lista', 'number', undefined, 'COP')}
          {renderField('garantiaVehiculo', 'Garantía vehículo', 'text', undefined)}
          {renderField('garantiaBateria', 'Garantía batería (EV/PHEV)', 'text', undefined, undefined, 'EV/PHEV')}
          {renderField('asistenciaCarretera', 'Asistencia en carretera', 'number', undefined, 'años')}
          {renderField('intervaloMantenimiento', 'Intervalo de mantenimiento', 'text', undefined)}
          {renderField('costoMantenimiento3Primeros', 'Costo mantenimiento (3 primeros)', 'number', undefined, 'COP')}
          {renderField('financiacionCuotaEstimada', 'Financiación (cuota estimada)', 'number', undefined, 'COP')}
          {renderField('origenPaisPlanta', 'Origen (país/planta)', 'text', undefined)}
        </div>
      </div>

      {/* Metadatos */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Car className="w-5 h-5 mr-2 text-wise" />
          Metadatos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderField('aplicabilidadFlags', 'Aplicabilidad (flags)', 'text', undefined)}
          {renderField('observaciones', 'Observaciones', 'textarea', undefined)}
        </div>
      </div>

      {/* WiseMetrics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Car className="w-5 h-5 mr-2 text-wise" />
          WiseMetrics
        </h2>
        <WiseMetricsForm
          specifications={{
            wisemetrics: {
              drivingFun: formData.wiseMetricsDiversión || '',
              technology: formData.wiseMetricsTecnología || '',
              environmentalImpact: formData.wiseMetricsImpactoAmbiental || '',
              reliability: formData.wiseMetricsFiabilidad || '',
              qualityPriceRatio: formData.wiseMetricsCalidadPrecio || '',
              comfort: formData.wiseMetricsComodidad || '',
              usability: formData.wiseMetricsUsabilidad || '',
              efficiency: formData.wiseMetricsEficiencia || '',
              prestige: formData.wiseMetricsPrestigio || '',
              interiorQuality: formData.wiseMetricsCalidadInterior || '',
            }
          }}
          onSpecificationChange={handleSpecificationChange}
        />
      </div>

      {/* Concesionarios */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Concesionarios Disponibles *
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dealers.map((dealer) => (
            <label key={dealer.id} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedDealers.includes(dealer.id)}
                onChange={() => toggleDealer(dealer.id)}
                className="w-4 h-4 text-wise border-gray-300 rounded focus:ring-wise"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">{dealer.name}</span>
                <p className="text-xs text-gray-500">{dealer.location}</p>
              </div>
            </label>
          ))}
        </div>

        {selectedDealers.length === 0 && (
          <p className="text-sm text-red-600 mt-2">
            Debe seleccionar al menos un concesionario
          </p>
        )}
      </div>

      {/* Botones de Acción */}
      <div className="flex items-center justify-end space-x-4 pt-8 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
        >
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </button>

        <button
          type="submit"
          disabled={loading || selectedDealers.length === 0}
          className="px-6 py-2 bg-wise text-white rounded-lg hover:bg-wise-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {loading ? 'Actualizando...' : 'Actualizar Vehículo'}
        </button>
      </div>
    </form>
  );
}
