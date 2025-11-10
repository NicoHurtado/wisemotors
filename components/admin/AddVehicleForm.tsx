'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Car, Save, X } from 'lucide-react';
import { ImageUpload } from './ImageUpload';

interface Dealer {
  id: string;
  name: string;
  location: string;
}

export function AddVehicleForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
    cicloTrabajo: '',
    cilindrada: '',
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
    numeroMarchas: '',
    modoRemolque: false,
    paddleShifters: false,
    torqueVectoring: false,
    traccionInteligenteOnDemand: false,

    // Dimensiones y pesos
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
    consumoCiudad: '',
    consumoCarretera: '',
    consumoMixto: '',
    capacidadTanque: '',
    autonomiaOficial: '',
    costoEnergia100km: '',
    ahorro5Anos: '',
    mpgeCiudad: '',
    mpgeCarretera: '',
    mpgeCombinado: '',

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
    materialMuelles: '',
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
    euroNCAPNino: '',
    euroNCAPPeaton: '',
    euroNCAPAsistencias: '',
    latinNCAPEstrellas: '',
    latinNCAPSubPuntajes: '',
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
    sensoresEstacionamientoDelantero: '',

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
    potenciaAmplificador: '',
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
  });

  // Cargar concesionarios
  useEffect(() => {
    const fetchDealerships = async () => {
      try {
        const response = await fetch('/api/dealers');
        if (response.ok) {
          const data = await response.json();
          setDealerships(data || []);
        }
      } catch (error) {
        console.error('Error fetching dealerships:', error);
      }
    };

    fetchDealerships();
  }, []);

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
          cicloTrabajo: formData.cicloTrabajo,
          cilindrada: formData.cilindrada ? parseFloat(formData.cilindrada) : undefined,
          combustible: formData.combustible,
          modosConduccion: formData.modosConduccion,
          octanajeRecomendado: formData.octanajeRecomendado ? parseFloat(formData.octanajeRecomendado) : undefined,
          arquitecturaMotorTermico: formData.arquitecturaMotorTermico || undefined,
          potenciaMaxEV: formData.potenciaMaxEV ? parseFloat(formData.potenciaMaxEV) : undefined,
          potenciaMaxMotorTermico: formData.potenciaMaxMotorTermico ? parseFloat(formData.potenciaMaxMotorTermico) : undefined,
          potenciaMaxSistemaHibrido: formData.potenciaMaxSistemaHibrido ? parseFloat(formData.potenciaMaxSistemaHibrido) : undefined,
          torqueMaxEV: formData.torqueMaxEV ? parseFloat(formData.torqueMaxEV) : undefined,
          torqueMaxMotorTermico: formData.torqueMaxMotorTermico ? parseFloat(formData.torqueMaxMotorTermico) : undefined,
          torqueMaxSistemaHibrido: formData.torqueMaxSistemaHibrido ? parseFloat(formData.torqueMaxSistemaHibrido) : undefined,
          traccion: formData.traccion,
          startStop: formData.startStop,
          launchControl: formData.launchControl,
        },
        transmission: {
          tipoTransmision: formData.tipoTransmision,
          numeroMarchas: formData.numeroMarchas ? parseInt(formData.numeroMarchas) : undefined,
          modoRemolque: formData.modoRemolque,
          paddleShifters: formData.paddleShifters,
          torqueVectoring: formData.torqueVectoring,
          traccionInteligenteOnDemand: formData.traccionInteligenteOnDemand,
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
          consumoCiudad: formData.consumoCiudad ? parseFloat(formData.consumoCiudad) : undefined,
          consumoCarretera: formData.consumoCarretera ? parseFloat(formData.consumoCarretera) : undefined,
          consumoMixto: formData.consumoMixto ? parseFloat(formData.consumoMixto) : undefined,
          capacidadTanque: formData.capacidadTanque ? parseFloat(formData.capacidadTanque) : undefined,
          autonomiaOficial: formData.autonomiaOficial ? parseFloat(formData.autonomiaOficial) : undefined,
          costoEnergia100km: formData.costoEnergia100km ? parseFloat(formData.costoEnergia100km) : undefined,
          ahorro5Anos: formData.ahorro5Anos ? parseFloat(formData.ahorro5Anos) : undefined,
          mpgeCiudad: formData.mpgeCiudad ? parseFloat(formData.mpgeCiudad) : undefined,
          mpgeCarretera: formData.mpgeCarretera ? parseFloat(formData.mpgeCarretera) : undefined,
          mpgeCombinado: formData.mpgeCombinado ? parseFloat(formData.mpgeCombinado) : undefined,
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
          materialMuelles: formData.materialMuelles,
          tipoPinzasFreno: formData.tipoPinzasFreno,
        },
        performance: {
          acceleration0to100: formData.aceleracion0100 ? parseFloat(formData.aceleracion0100) : undefined,
          acceleration0to200: formData.aceleracion0200 ? parseFloat(formData.aceleracion0200) : undefined,
          acceleration0to60: formData.aceleracion060 ? parseFloat(formData.aceleracion060) : undefined,
          acceleration50to80: formData.aceleracion5080 ? parseFloat(formData.aceleracion5080) : undefined,
          overtaking80to120: formData.aceleracion80120 ? parseFloat(formData.aceleracion80120) : undefined,
          maxLateralAcceleration: formData.aceleracionLateralMaxima ? parseFloat(formData.aceleracionLateralMaxima) : undefined,
          maxLongitudinalAcceleration: formData.aceleracionLongitudinalMaxima ? parseFloat(formData.aceleracionLongitudinalMaxima) : undefined,
          brakingDistance100to0: formData.frenado1000 ? parseFloat(formData.frenado1000) : undefined,
          maxSpeed: formData.velocidadMaxima ? parseFloat(formData.velocidadMaxima) : undefined,
          powerToWeight: formData.relacionPesoPotencia ? parseFloat(formData.relacionPesoPotencia) : undefined,
          quarterMile: formData.cuartoMilla ? parseFloat(formData.cuartoMilla) : undefined,
          launchControl: formData.launchControl,
        },
        safety: {
          airbags: formData.numeroAirbags ? parseInt(formData.numeroAirbags) : undefined,
          ncapRating: formData.euroNCAPEstrellas ? parseInt(formData.euroNCAPEstrellas) : undefined,
          adultSafetyScore: formData.euroNCAPAdulto ? parseFloat(formData.euroNCAPAdulto) : undefined,
          childSafetyScore: formData.euroNCAPNino ? parseFloat(formData.euroNCAPNino) : undefined,
          pedestrianScore: formData.euroNCAPPeaton ? parseFloat(formData.euroNCAPPeaton) : undefined,
          assistanceScore: formData.euroNCAPAsistencias ? parseFloat(formData.euroNCAPAsistencias) : undefined,
          latinNCAPRating: formData.latinNCAPEstrellas ? parseInt(formData.latinNCAPEstrellas) : undefined,
          latinNCAPSubScores: formData.latinNCAPSubPuntajes || undefined,
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
          sensoresEstacionamientoDelantero: formData.sensoresEstacionamientoDelantero ? parseInt(formData.sensoresEstacionamientoDelantero) : undefined,
        },
        lighting: {
          headlightType: formData.farosTecnologia,
          antinieblaDelantero: formData.antinieblaDelantero,
          intermitentesDinamicos: formData.intermitentesDinamicos,
          lavafaros: formData.lavafaros,
          sensorLluvia: formData.sensorLluvia,
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
          potenciaAmplificador: formData.potenciaAmplificador ? parseFloat(formData.potenciaAmplificador) : undefined,
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
        },
        offRoad: {
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
      };

      // Limpiar especificaciones vacías
      const cleanSpecifications = (obj: any): any => {
        if (obj === null || obj === undefined) return undefined;
        if (typeof obj === 'string' && obj.trim() === '') return undefined;
        if (typeof obj === 'number' && isNaN(obj)) return undefined;
        if (Array.isArray(obj)) {
          const filtered = obj.filter(item => item !== null && item !== undefined && item !== '');
          return filtered.length > 0 ? filtered : undefined;
        }
        if (typeof obj === 'object') {
          const cleaned: any = {};
          for (const [key, value] of Object.entries(obj)) {
            const cleanedValue = cleanSpecifications(value);
            if (cleanedValue !== undefined && cleanedValue !== null && cleanedValue !== '') {
              cleaned[key] = cleanedValue;
            }
          }
          return Object.keys(cleaned).length > 0 ? cleaned : undefined;
        }
        return obj;
      };

      const cleanedSpecs = cleanSpecifications(specifications);

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

      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleData),
      });

      if (response.ok) {
        const createdVehicle = await response.json();
        alert('Vehículo creado exitosamente!');
        router.push(`/admin`);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        alert(`Error: ${errorData.error || 'Error al crear el vehículo'}`);
      }
    } catch (error) {
      console.error('Error creating vehicle:', error);
      alert('Error al crear el vehículo');
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

    // Si no hay carrocería seleccionada, mostrar todos los campos (excepto los que requieren carrocería específica)
    if (!carroceria) {
      // Si requiere carrocería específica, no mostrar
      const requiereCarroceria = aplicabilidades.some(apl => 
        apl.includes('SUV') || apl.includes('Pick-up') || apl.includes('Deportivo') || apl === '4x4' || apl === 'SUV/4x4'
      );
      if (requiereCarroceria) return false;
      // Para el resto, mostrar si no requiere combustible específico o si el combustible coincide
      return true;
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
      if (apl === '4x4' && (carroceria === 'SUV' || carroceria === 'Pick-up')) return true;
      if (apl === 'SUV/4x4' && carroceria === 'SUV') return true;
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
          {renderField('plazas', 'Plazas', 'number', undefined)}
          {renderField('puertas', 'Puertas', 'number', undefined)}
          {renderField('versionTrim', 'Versión/Trim', 'text', undefined)}
        </div>
      </div>

      {/* Motorización y tren motriz */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Car className="w-5 h-5 mr-2 text-wise" />
          Motorización y Tren Motriz
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderField('alimentacion', 'Alimentación', 'text', undefined)}
          {renderField('cicloTrabajo', 'Ciclo de trabajo (Atkinson/Miller)', 'text', undefined, undefined, 'ICE/HEV')}
          {renderField('cilindrada', 'Cilindrada', 'number', undefined, 'L', 'ICE/HEV/PHE')}
          {renderField('combustible', 'Combustible', 'select', ['Gasolina', 'Diésel', 'GNV', 'Etanol', 'Eléctrico', 'Híbrido', 'Híbrido Enchufable'], undefined, 'Todos')}
          {renderField('modosConduccion', 'Modos de conducción', 'text', undefined, undefined, 'Todos')}
          {renderField('octanajeRecomendado', 'Octanaje recomendado', 'number', undefined, 'RON', 'ICE/HEV/PHE')}
          {renderField('arquitecturaMotorTermico', 'Arquitectura motor térmico', 'select', ['En línea', 'V', 'Boxer', 'W'], undefined, 'ICE/HEV/PHE')}
          {renderField('potenciaMaxEV', 'Potencia máx. (EV)', 'number', undefined, 'kW; HP', 'EV')}
          {renderField('potenciaMaxMotorTermico', 'Potencia máx. (motor térmico)', 'number', undefined, 'kW; HP', 'ICE/HEV/PHE')}
          {renderField('potenciaMaxSistemaHibrido', 'Potencia máx. (sistema híbrido)', 'number', undefined, 'kW; HP', 'HEV/PHEV')}
          {renderField('torqueMaxEV', 'Torque máx. (EV)', 'number', undefined, 'Nm', 'EV')}
          {renderField('torqueMaxMotorTermico', 'Torque máx. (motor térmico)', 'number', undefined, 'Nm', 'ICE/HEV/PHE')}
          {renderField('torqueMaxSistemaHibrido', 'Torque máx. (sistema híbrido)', 'number', undefined, 'Nm', 'HEV/PHEV')}
          {renderField('traccion', 'Tracción', 'select', ['FWD', 'RWD', 'AWD', '4WD'], undefined, 'Todos')}
          {renderField('startStop', 'Start/Stop', 'checkbox', undefined, undefined, 'ICE/HEV/PHE')}
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
          {renderField('tipoTransmision', 'Tipo de transmisión', 'select', ['MT', 'AT', 'CVT', 'DCT'], undefined, 'ICE/HEV/PHE')}
          {renderField('numeroMarchas', 'Número de marchas', 'number', undefined, undefined, 'ICE/HEV/PHE')}
          {renderField('modoRemolque', 'Modo remolque/arrastre', 'checkbox', undefined, undefined, 'Pick-up/SUV')}
          {renderField('paddleShifters', 'Paddle shifters', 'checkbox', undefined, undefined, 'Deportivo')}
          {renderField('torqueVectoring', 'Torque Vectoring', 'checkbox', undefined, undefined, 'SUV/Deportivo')}
          {renderField('traccionInteligenteOnDemand', 'Tracción inteligente On-Demand', 'checkbox', undefined, undefined, 'SUV')}
        </div>
      </div>

      {/* Dimensiones y pesos */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Car className="w-5 h-5 mr-2 text-wise" />
          Dimensiones y Pesos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderField('largo', 'Largo', 'number', undefined, 'mm')}
          {renderField('ancho', 'Ancho (sin espejos)', 'number', undefined, 'mm')}
          {renderField('alto', 'Alto', 'number', undefined, 'mm')}
          {renderField('pesoOrdenMarcha', 'Peso en orden de marcha', 'number', undefined, 'kg')}
          {renderField('distanciaEntreEjes', 'Distancia entre ejes', 'number', undefined, 'mm')}
          {renderField('radioGiro', 'Radio de giro (pared a pared)', 'number', undefined, 'm')}
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
          {renderField('consumoCiudad', 'Consumo ciudad', 'number', undefined, 'L/100 km; kWh/100 km')}
          {renderField('consumoCarretera', 'Consumo carretera', 'number', undefined, 'L/100 km; kWh/100 km')}
          {renderField('consumoMixto', 'Consumo mixto', 'number', undefined, 'L/100 km; kWh/100 km')}
          {renderField('capacidadTanque', 'Capacidad de tanque combustible', 'number', undefined, 'L', 'ICE/HEV/PHE')}
          {renderField('autonomiaOficial', 'Autonomía oficial', 'number', undefined, 'km', 'EV/PHEV')}
          {renderField('costoEnergia100km', 'Costo de energía por 100 km', 'number', undefined, 'COP')}
          {renderField('ahorro5Anos', 'Ahorro a 5 años', 'number', undefined, 'COP')}
          {renderField('mpgeCiudad', 'MPGe ciudad', 'number', undefined, 'mpge', 'EV/PHEV')}
          {renderField('mpgeCarretera', 'MPGe carretera', 'number', undefined, 'mpge', 'EV/PHEV')}
          {renderField('mpgeCombinado', 'MPGe combinado', 'number', undefined, 'mpge', 'EV/PHEV')}
        </div>
      </div>

      {/* Batería y carga */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Car className="w-5 h-5 mr-2 text-wise" />
          Batería y Carga
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderField('capacidadBrutaBateria', 'Capacidad bruta batería', 'number', undefined, 'kWh', 'EV/PHEV')}
          {renderField('cargadorOBCAC', 'Cargador a bordo (OBC) AC', 'number', undefined, 'kW', 'EV/PHEV')}
          {renderField('conduccionOnePedal', 'Conducción One-Pedal', 'checkbox', undefined, undefined, 'EV')}
          {renderField('regeneracionNiveles', 'Regeneración (niveles)', 'number', undefined, undefined, 'EV/PHEV')}
          {renderField('tiempo0100AC', 'Tiempo 0-100% (AC)', 'number', undefined, 'h', 'EV/PHEV')}
          {renderField('tiempo1080DC', 'Tiempo 10-80% (DC)', 'number', undefined, 'min', 'EV/PHEV')}
          {renderField('highPowerChargingTimes', 'High Power Charging times', 'text', undefined, undefined, 'EV/PHEV')}
          {renderField('v2hV2g', 'V2H/V2G (bidireccional)', 'checkbox', undefined, undefined, 'EV')}
          {renderField('potenciaV2hV2g', 'V2H/V2G Potencia', 'number', undefined, 'kW', 'EV')}
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
          {renderField('materialDiscos', 'Material de discos', 'text', undefined)}
          {renderField('materialMuelles', 'Material de muelles', 'text', undefined)}
          {renderField('tipoPinzasFreno', 'Tipo de pinzas de freno', 'text', undefined)}
        </div>
          </div>

      {/* Prestaciones */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Car className="w-5 h-5 mr-2 text-wise" />
          Prestaciones
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderField('aceleracion0100', '0-100 km/h', 'number', undefined, 's')}
          {renderField('aceleracion0200', '0-200 km/h', 'number', undefined, 's', 'Deportivo')}
          {renderField('aceleracion060', '0-60 mph', 'number', undefined, 's')}
          {renderField('aceleracion5080', '50-80 km/h (recuperación)', 'number', undefined, 's', 'ICE/HEV')}
          {renderField('aceleracion80120', '80-120 km/h (adelantamiento)', 'number', undefined, 's')}
          {renderField('aceleracionLateralMaxima', 'Aceleración lateral máxima', 'number', undefined, 'g', 'Deportivo/SUV')}
          {renderField('aceleracionLongitudinalMaxima', 'Aceleración longitudinal máxima', 'number', undefined, 'g', 'Deportivo')}
          {renderField('frenado1000', 'Frenado 100-0 km/h', 'number', undefined, 'm')}
          {renderField('velocidadMaxima', 'Velocidad máxima', 'number', undefined, 'km/h')}
          {renderField('relacionPesoPotencia', 'Relación peso/potencia', 'number', undefined, 'HP/ton')}
          {renderField('cuartoMilla', '1/4 de milla (tiempo)', 'number', undefined, 's', 'Deportivo')}
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
          {renderField('euroNCAPNino', 'Euro NCAP (Niño %)', 'number', undefined, '%')}
          {renderField('euroNCAPPeaton', 'Euro NCAP (Peatón %)', 'number', undefined, '%')}
          {renderField('euroNCAPAsistencias', 'Euro NCAP (Asistencias %)', 'number', undefined, '%')}
          {renderField('latinNCAPEstrellas', 'Latin NCAP (estrellas)', 'number', undefined, '★')}
          {renderField('latinNCAPSubPuntajes', 'Latin NCAP (sub-puntajes %)', 'text', undefined)}
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
          {renderField('sensoresEstacionamientoDelantero', 'Sensores estacionamiento delantero', 'number', undefined)}
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
          {renderField('sensorLluvia', 'Sensor de lluvia', 'checkbox')}
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
          {renderField('potenciaAmplificador', 'Potencia de amplificador', 'number', undefined, 'W', 'Premium')}
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
          {renderField('vidriosElectricos', 'Vidrios eléctricos (del/tras)', 'checkbox', undefined, undefined, 'Todos')}
          {renderField('volanteMaterialAjustes', 'Volante (material y ajustes)', 'text', undefined, undefined, 'Todos')}
          {renderField('volanteCalefactable', 'Volante calefactable', 'checkbox', undefined, undefined, 'Premium')}
          {renderField('espejoInteriorElectrocromico', 'Espejo interior electrocrómico', 'checkbox', undefined, undefined, 'Todos')}
        </div>
          </div>

      {/* Off-road y 4x4 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Car className="w-5 h-5 mr-2 text-wise" />
          Off-road y 4x4
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          {loading ? 'Creando...' : 'Crear Vehículo'}
        </button>
      </div>
    </form>
  );
}
