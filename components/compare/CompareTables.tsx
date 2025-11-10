'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  COMPARE_SECTIONS, 
  VehicleComparisonData, 
  getFieldValue, 
  getFieldDisplayValue, 
  getWinnerIndex 
} from '@/lib/schemas/compareSchema';
import { Info, Trophy, Minus } from 'lucide-react';

interface CompareTablesProps {
  vehicles: VehicleComparisonData[];
}

export function CompareTables({ vehicles }: CompareTablesProps) {
  const [vehiclesWithSpecs, setVehiclesWithSpecs] = useState<VehicleComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['general']));

  useEffect(() => {
    const fetchVehicleSpecs = async () => {
      try {
        setLoading(true);
        
        // Usar las specifications reales del vehículo
        const vehiclesWithData = vehicles.map(vehicle => {
          // Parsear specifications si viene como string
          let specifications = vehicle.specifications;
          if (typeof specifications === 'string') {
            try {
              specifications = JSON.parse(specifications);
            } catch (parseError) {
              console.error('Error parseando specifications:', parseError);
              specifications = {};
            }
          }
          
          return {
            ...vehicle,
            specifications: specifications || {}
          };
        });

        console.log('🚗 Vehículos con specs:', vehiclesWithData);
        console.log('🔍 Primer vehículo specs:', vehiclesWithData[0]?.specifications);
        console.log('🔍 Performance del primer vehículo:', vehiclesWithData[0]?.specifications?.performance);
        setVehiclesWithSpecs(vehiclesWithData);
      } catch (error) {
        console.error('Error fetching vehicle specs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleSpecs();
  }, [vehicles]);

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  };

  const getFieldValueForComparison = (vehicle: VehicleComparisonData, fieldKey: string): any => {
    // Para campos especiales que están en el nivel raíz del vehículo
    if (fieldKey === 'brand') return vehicle.brand;
    if (fieldKey === 'model') return vehicle.model;
    if (fieldKey === 'year') return vehicle.year;
    if (fieldKey === 'price') return vehicle.price;
    if (fieldKey === 'fuelType') return vehicle.fuelType;
    if (fieldKey === 'type') return vehicle.type;
    
    // Para campos en specifications - buscar en múltiples ubicaciones
    const { specifications, fuelType } = vehicle;
    if (!specifications) return null;
    
    // Función helper para obtener valor desde una ruta
    const getValueFromPath = (path: string): any => {
      if (!specifications) return null;
      const keys = path.split('.');
      let value = specifications;
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return null;
        }
      }
      return value !== null && value !== undefined ? value : null;
    };
    
    // Mapeo de campos a ubicaciones reales en la base de datos
    // Los campos ahora coinciden exactamente con los nombres en VehicleDetail.tsx
    switch (fieldKey) {
      // Identificación
      case 'year':
        return vehicle.year || getValueFromPath('identification.añoModelo');
      case 'carroceria':
        return vehicle.type || getValueFromPath('identification.carrocería');
      case 'plazas':
        return getValueFromPath('identification.plazas') || getValueFromPath('interior.passengerCapacity');
      case 'puertas':
        return getValueFromPath('identification.puertas');
      case 'versionTrim':
        return getValueFromPath('identification.versionTrim');
      
      // Motorización - Eléctrica
      case 'potenciaMaxEV':
        return getValueFromPath('powertrain.potenciaMaxEV');
      case 'torqueMaxEV':
        return getValueFromPath('powertrain.torqueMaxEV');
      
      // Motorización - Híbrida/Combustión
      case 'alimentacion':
        return getValueFromPath('powertrain.alimentacion');
      case 'arquitecturaMotorTermico':
        return getValueFromPath('powertrain.arquitecturaMotorTermico');
      case 'cicloTrabajo':
        return getValueFromPath('powertrain.cicloTrabajo');
      case 'cilindrada':
        return getValueFromPath('powertrain.cilindrada');
      case 'combustible':
        return getValueFromPath('powertrain.combustible');
      case 'modosConduccion':
        return getValueFromPath('powertrain.modosConduccion');
      case 'octanajeRecomendado':
        return getValueFromPath('powertrain.octanajeRecomendado');
      case 'potenciaMaxMotorTermico':
        return getValueFromPath('powertrain.potenciaMaxMotorTermico');
      case 'potenciaMaxSistemaHibrido':
        return getValueFromPath('powertrain.potenciaMaxSistemaHibrido');
      case 'torqueMaxMotorTermico':
        return getValueFromPath('powertrain.torqueMaxMotorTermico');
      case 'torqueMaxSistemaHibrido':
        return getValueFromPath('powertrain.torqueMaxSistemaHibrido');
      case 'traccion':
        return getValueFromPath('powertrain.traccion');
      case 'startStop':
        return getValueFromPath('powertrain.startStop');
      case 'launchControl':
        return getValueFromPath('powertrain.launchControl') || getValueFromPath('performance.launchControl');
      
      // Transmisión
      case 'tipoTransmision':
        return getValueFromPath('transmission.tipoTransmision');
      case 'numeroMarchas':
        return getValueFromPath('transmission.numeroMarchas');
      case 'modoRemolque':
        return getValueFromPath('transmission.modoRemolque');
      case 'paddleShifters':
        return getValueFromPath('transmission.paddleShifters');
      case 'torqueVectoring':
        return getValueFromPath('transmission.torqueVectoring');
      case 'traccionInteligenteOnDemand':
        return getValueFromPath('transmission.traccionInteligenteOnDemand');
      
      // Batería
      case 'capacidadBrutaBateria':
        return getValueFromPath('battery.capacidadBrutaBateria');
      case 'cargadorOBCAC':
        return getValueFromPath('battery.cargadorOBCAC');
      case 'conduccionOnePedal':
        return getValueFromPath('battery.conduccionOnePedal');
      case 'highPowerChargingTimes':
        return getValueFromPath('battery.highPowerChargingTimes');
      case 'regeneracionNiveles':
        return getValueFromPath('battery.regeneracionNiveles');
      case 'tiempo0100AC':
        return getValueFromPath('battery.tiempo0100AC');
      case 'tiempo1080DC':
        return getValueFromPath('battery.tiempo1080DC');
      case 'v2hV2g':
        return getValueFromPath('battery.v2hV2g');
      case 'potenciaV2hV2g':
        return getValueFromPath('battery.potenciaV2hV2g');
      
      // Dimensiones
      case 'length':
        return getValueFromPath('dimensions.length');
      case 'width':
        return getValueFromPath('dimensions.width');
      case 'height':
        return getValueFromPath('dimensions.height');
      case 'wheelbase':
        return getValueFromPath('dimensions.wheelbase');
      case 'turningRadius':
        return getValueFromPath('dimensions.turningRadius');
      case 'curbWeight':
        return getValueFromPath('dimensions.curbWeight');
      case 'payload':
        return getValueFromPath('weight.payload');
      case 'cargoCapacity':
        return getValueFromPath('dimensions.cargoCapacity');
      case 'cargoCapacityMin':
        return getValueFromPath('dimensions.cargoCapacityMin');
      case 'roofCapacity':
        return getValueFromPath('dimensions.roofCapacity');
      
      // Eficiencia
      case 'consumoCiudad':
        return getValueFromPath('efficiency.consumoCiudad');
      case 'consumoCarretera':
        return getValueFromPath('efficiency.consumoCarretera');
      case 'consumoMixto':
        return getValueFromPath('efficiency.consumoMixto');
      case 'autonomiaOficial':
        return getValueFromPath('efficiency.autonomiaOficial');
      case 'capacidadTanque':
        return getValueFromPath('efficiency.capacidadTanque');
      case 'mpgeCiudad':
        return getValueFromPath('efficiency.mpgeCiudad');
      case 'mpgeCarretera':
        return getValueFromPath('efficiency.mpgeCarretera');
      case 'mpgeCombinado':
        return getValueFromPath('efficiency.mpgeCombinado');
      case 'ahorro5Anos':
        return getValueFromPath('efficiency.ahorro5Anos');
      case 'costoEnergia100km':
        return getValueFromPath('efficiency.costoEnergia100km');
      
      // Prestaciones
      case 'acceleration0to100':
        return getValueFromPath('performance.acceleration0to100') || getValueFromPath('performance.acceleration0100');
      case 'acceleration0to200':
        return getValueFromPath('performance.acceleration0to200');
      case 'acceleration0to60':
        return getValueFromPath('performance.acceleration0to60');
      case 'quarterMile':
        return getValueFromPath('performance.quarterMile');
      case 'acceleration50to80':
        return getValueFromPath('performance.acceleration50to80');
      case 'overtaking80to120':
        return getValueFromPath('performance.overtaking80to120');
      case 'maxSpeed':
        return getValueFromPath('performance.maxSpeed') || getValueFromPath('performance.topSpeed');
      case 'powerToWeight':
        return getValueFromPath('performance.powerToWeight');
      case 'maxLateralAcceleration':
        return getValueFromPath('performance.maxLateralAcceleration');
      case 'maxLongitudinalAcceleration':
        return getValueFromPath('performance.maxLongitudinalAcceleration');
      case 'brakingDistance100to0':
        return getValueFromPath('performance.brakingDistance100to0') || getValueFromPath('chassis.brakingDistance100to0');
      
      // Seguridad
      case 'airbags':
        return getValueFromPath('safety.airbags');
      case 'abs':
        return getValueFromPath('safety.abs');
      case 'esp':
        return getValueFromPath('safety.esp');
      case 'ncapRating':
        return getValueFromPath('safety.ncapRating');
      case 'adultSafetyScore':
        return getValueFromPath('safety.adultSafetyScore');
      case 'childSafetyScore':
        return getValueFromPath('safety.childSafetyScore');
      case 'pedestrianScore':
        return getValueFromPath('safety.pedestrianScore');
      case 'assistanceScore':
        return getValueFromPath('safety.assistanceScore');
      case 'latinNCAPRating':
        return getValueFromPath('safety.latinNCAPRating');
      case 'latinNCAPSubScores':
        return getValueFromPath('safety.latinNCAPSubScores');
      
      // ADAS
      case 'acc':
        return getValueFromPath('adas.acc') || getValueFromPath('adas.adaptiveCruiseControl');
      case 'aeb':
        return getValueFromPath('adas.aeb');
      case 'bsm':
        return getValueFromPath('adas.bsm') || getValueFromPath('adas.blindSpotMonitoring');
      case 'camara360':
        return getValueFromPath('adas.camara360');
      case 'farosAdaptativos':
        return getValueFromPath('adas.farosAdaptativos');
      case 'lka':
        return getValueFromPath('adas.lka') || getValueFromPath('adas.laneKeepingAssist');
      case 'lucesAltasAutomaticas':
        return getValueFromPath('adas.lucesAltasAutomaticas');
      case 'parkAssist':
        return getValueFromPath('adas.parkAssist');
      case 'sensoresEstacionamientoDelantero':
        return getValueFromPath('adas.sensoresEstacionamientoDelantero');
      
      // Chasis
      case 'amortiguacionAdaptativa':
        return getValueFromPath('chassis.amortiguacionAdaptativa');
      case 'materialDiscos':
        return getValueFromPath('chassis.materialDiscos');
      case 'materialMuelles':
        return getValueFromPath('chassis.materialMuelles');
      case 'suspensionDelantera':
        return getValueFromPath('chassis.suspensionDelantera');
      case 'suspensionTrasera':
        return getValueFromPath('chassis.suspensionTrasera');
      case 'tipoPinzasFreno':
        return getValueFromPath('chassis.tipoPinzasFreno');
      case 'groundClearance':
        return getValueFromPath('chassis.groundClearance');
      case 'controlDescenso':
        return getValueFromPath('offRoad.controlDescenso');
      case 'controlTraccionOffRoad':
        return getValueFromPath('offRoad.controlTraccionOffRoad');
      
      // Iluminación
      case 'antinieblaDelantero':
        return getValueFromPath('lighting.antinieblaDelantero');
      case 'headlightType':
        return getValueFromPath('lighting.headlightType');
      case 'intermitentesDinamicos':
        return getValueFromPath('lighting.intermitentesDinamicos');
      case 'lavafaros':
        return getValueFromPath('lighting.lavafaros');
      case 'sensorLluvia':
        return getValueFromPath('lighting.sensorLluvia');
      
      // Infotainment
      case 'pantallaCentralTamano':
        return getValueFromPath('infotainment.pantallaCentralTamano');
      case 'pantallaCuadroTamano':
        return getValueFromPath('infotainment.pantallaCuadroTamano');
      case 'androidAuto':
        return getValueFromPath('infotainment.androidAuto');
      case 'appleCarPlay':
        return getValueFromPath('infotainment.appleCarPlay') || getValueFromPath('infotainment.appleCarplay');
      case 'bluetooth':
        return getValueFromPath('infotainment.bluetooth');
      case 'wifiBordo':
        return getValueFromPath('infotainment.wifiBordo');
      case 'appRemotaOTA':
        return getValueFromPath('infotainment.appRemotaOTA');
      case 'navegacionIntegrada':
        return getValueFromPath('infotainment.navegacionIntegrada');
      case 'cargadorInalambrico':
        return getValueFromPath('infotainment.cargadorInalambrico');
      case 'audioMarca':
        return getValueFromPath('infotainment.audioMarca');
      case 'audioNumeroBocinas':
        return getValueFromPath('infotainment.audioNumeroBocinas');
      case 'potenciaAmplificador':
        return getValueFromPath('infotainment.potenciaAmplificador');
      case 'puertosUSBA':
        return getValueFromPath('infotainment.puertosUSBA');
      case 'puertosUSBC':
        return getValueFromPath('infotainment.puertosUSBC');
      
      // Confort
      case 'ajusteElectricoConductor':
        return getValueFromPath('comfort.ajusteElectricoConductor');
      case 'ajusteElectricoPasajero':
        return getValueFromPath('comfort.ajusteElectricoPasajero');
      case 'calefaccionAsientos':
        return getValueFromPath('comfort.calefaccionAsientos') || getValueFromPath('comfort.heatedSeats');
      case 'ventilacionAsientos':
        return getValueFromPath('comfort.ventilacionAsientos') || getValueFromPath('comfort.ventilatedSeats');
      case 'masajeAsientos':
        return getValueFromPath('comfort.masajeAsientos') || getValueFromPath('comfort.massageSeats');
      case 'memoriaAsientos':
        return getValueFromPath('comfort.memoriaAsientos');
      case 'materialAsientos':
        return getValueFromPath('comfort.materialAsientos');
      case 'climatizadorZonas':
        return getValueFromPath('comfort.climatizadorZonas');
      case 'airConditioning':
        return getValueFromPath('comfort.airConditioning');
      case 'cristalesAcusticos':
        return getValueFromPath('comfort.cristalesAcusticos');
      case 'parabrisasCalefactable':
        return getValueFromPath('comfort.parabrisasCalefactable');
      case 'iluminacionAmbiental':
        return getValueFromPath('comfort.iluminacionAmbiental');
      case 'techoPanoramico':
        return getValueFromPath('comfort.techoPanoramico') || getValueFromPath('comfort.sunroof');
      case 'segundaFilaCorrediza':
        return getValueFromPath('comfort.segundaFilaCorrediza');
      case 'terceraFilaAsientos':
        return getValueFromPath('comfort.terceraFilaAsientos');
      case 'vidriosElectricos':
        return getValueFromPath('comfort.vidriosElectricos');
      case 'espejoInteriorElectrocromico':
        return getValueFromPath('comfort.espejoInteriorElectrocromico');
      case 'volanteMaterialAjustes':
        return getValueFromPath('comfort.volanteMaterialAjustes');
      case 'volanteCalefactable':
        return getValueFromPath('comfort.volanteCalefactable');
      case 'tomas12V120V':
        return getValueFromPath('comfort.tomas12V120V');
      case 'tomacorrienteEnCaja':
        return getValueFromPath('comfort.tomacorrienteEnCaja');
      
      // Comercial
      case 'precioLista':
        return vehicle.price || getValueFromPath('commercial.precioLista');
      case 'garantiaVehiculo':
        return getValueFromPath('commercial.garantiaVehiculo');
      case 'garantiaBateria':
        return getValueFromPath('commercial.garantiaBateria');
      case 'asistenciaCarretera':
        return getValueFromPath('commercial.asistenciaCarretera');
      case 'intervaloMantenimiento':
        return getValueFromPath('commercial.intervaloMantenimiento');
      case 'costoMantenimiento3Primeros':
        return getValueFromPath('commercial.costoMantenimiento3Primeros');
      case 'financiacionCuotaEstimada':
        return getValueFromPath('commercial.financiacionCuotaEstimada');
      case 'origenPaisPlanta':
        return getValueFromPath('commercial.origenPaisPlanta');
      
      // WiseMetrics
      case 'drivingFun':
        return getValueFromPath('wisemetrics.drivingFun');
      case 'technology':
        return getValueFromPath('wisemetrics.technology');
      case 'environmentalImpact':
        return getValueFromPath('wisemetrics.environmentalImpact');
      case 'reliability':
        return getValueFromPath('wisemetrics.reliability');
      case 'qualityPriceRatio':
        return getValueFromPath('wisemetrics.qualityPriceRatio');
      case 'comfort':
        return getValueFromPath('wisemetrics.comfort');
      case 'usability':
        return getValueFromPath('wisemetrics.usability');
      case 'efficiency':
        return getValueFromPath('wisemetrics.efficiency');
      case 'prestige':
        return getValueFromPath('wisemetrics.prestige');
      
      default:
        // Intentar con la función original como fallback
        return getFieldValue(vehicle, fieldKey);
    }
  };

  const getFieldDisplayValueForComparison = (vehicle: VehicleComparisonData, field: any): string => {
    const value = getFieldValueForComparison(vehicle, field.key);
    
    if (value === null || value === undefined) {
      return '✗ No';
    }
    
    // Manejar arrays
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : '✗ No';
    }
    
    if (typeof value === 'boolean') {
      return value ? '✓ Sí' : '✗ No';
    }
    
    if (typeof value === 'number') {
      // Si el campo tiene formatter, usarlo
      if (field.formatter) {
        const formatted = field.formatter(value, vehicle.fuelType);
        if (formatted) return formatted;
      }
      
      // Formateo especial para precios y valores grandes en COP
      if (field.key === 'precioLista' || field.key === 'ahorro5Anos' || 
          field.key === 'costoMantenimiento3Primeros' || field.key === 'financiacionCuotaEstimada' || 
          field.key === 'costoEnergia100km') {
        return `$${new Intl.NumberFormat('es-CO').format(value)}`;
      }
      
      // Formateo para porcentajes
      if (field.unit === '%' || field.key.includes('Score')) {
        return `${value}%`;
      }
      
      // Formateo para estrellas (NCAP)
      if (field.key.includes('Rating') && field.unit !== '%') {
        return `${value} ⭐`;
      }
      
      // Formateo para unidades de tiempo
      if (field.unit === 'h' || field.unit === 's' || field.unit === 'min') {
        if (value < 10 && value % 1 !== 0) {
          return `${value.toFixed(1)} ${field.unit}`;
        }
        return `${Math.round(value)} ${field.unit}`;
      }
      
      // Formateo para números con decimales pequeños
      // Nota: si el campo tiene formatter, ya se aplicó arriba, así que esto solo aplica si no tiene formatter
      if (!field.formatter && value < 10 && value % 1 !== 0 && 
          (field.unit === 'L' || field.unit === 'kW' || field.unit === 'kWh' || 
           field.unit === 'm' || field.unit === 'g' || field.unit === 'MPGe' || 
           field.unit === 'RON' || field.unit === 'Nm')) {
        return `${value.toFixed(1)} ${field.unit}`;
      }
      
      // Formateo para números grandes con separadores (dimensiones, pesos, distancias)
      if (value > 1000 && (field.unit === 'mm' || field.unit === 'kg' || 
          field.unit === 'km' || field.unit === 'cc' || field.unit === 'Nm' || 
          field.unit === 'kW')) {
        return `${Math.round(value).toLocaleString('es-CO')} ${field.unit}`;
      }
      
      // Formateo para cilindrada en litros (mostrar con 1 decimal si es necesario)
      if (field.key === 'cilindrada' && field.unit === 'L') {
        if (value % 1 === 0) {
          return `${value} ${field.unit}`;
        }
        return `${value.toFixed(1)} ${field.unit}`;
      }
      
      // Formateo estándar con unidad
      if (field.unit) {
        return `${Math.round(value)} ${field.unit}`;
      }
      
      return value.toString();
    }
    
    // Para strings (como tipo de transmisión, alimentación, etc.)
    return value.toString();
  };

  const getWinnerIndexForComparison = (vehicles: VehicleComparisonData[], field: any): number | null => {
    const values = vehicles.map(v => getFieldValueForComparison(v, field.key));
    
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
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wise mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando especificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header de la vista */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Vista de Tablas por Categorías
        </h2>
        <p className="text-gray-600">
          Compara detalladamente cada especificación con ganadores resaltados
        </p>
      </div>

      {/* Agrupación por tipo de combustible si es mixto */}
      {vehiclesWithSpecs.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {Array.from(new Set(vehiclesWithSpecs.map(v => v.fuelType))).map(fuelType => (
              <Badge key={fuelType} variant="outline" className="text-sm">
                Grupo: {fuelType}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Tablas por sección */}
      {COMPARE_SECTIONS
        .filter(section => {
          // Obtener tipos de combustible de TODOS los vehículos (incluyendo null/undefined)
          // Necesitamos verificar TODOS, no solo los que tienen fuelType
          const allFuelTypes = vehiclesWithSpecs.map(v => v.fuelType);
          const fuelTypes = allFuelTypes
            .map(ft => (ft || '').toLowerCase().trim())
            .filter(ft => ft.length > 0);
          
          // Si algún vehículo no tiene fuelType válido, no mostrar secciones condicionales
          if (allFuelTypes.length !== fuelTypes.length || fuelTypes.length === 0) {
            // Solo mostrar secciones que no tienen conditional ni son batería/motorización
            if (section.key === 'battery' || section.key.startsWith('powertrain-')) {
              return false;
            }
            if (section.conditional) {
              return false;
            }
            return true;
          }
          
          // Para secciones de motorización: solo mostrar si TODOS los vehículos son del mismo tipo
          if (section.key.startsWith('powertrain-')) {
            // Verificar si TODOS los vehículos cumplen con el tipo de la sección
            const allMatch = fuelTypes.every(ft => {
              if (section.key === 'powertrain-electric') {
                return ft.includes('eléctrico') || ft.includes('electric');
              }
              if (section.key === 'powertrain-hybrid') {
                return ft.includes('híbrido') || ft.includes('hybrid');
              }
              if (section.key === 'powertrain-combustion') {
                return !ft.includes('eléctrico') && !ft.includes('electric') && 
                       !ft.includes('híbrido') && !ft.includes('hybrid');
              }
              return false;
            });
            
            return allMatch;
          }
          
          // Para sección de batería: solo mostrar si TODOS los vehículos son eléctricos o híbridos
          // Esta verificación debe ser EXPLÍCITA y ANTES que cualquier conditional
          if (section.key === 'battery') {
            // Verificar que TODOS sean eléctricos o híbridos
            // Si hay al menos uno que NO sea eléctrico ni híbrido, NO mostrar
            const allElectricOrHybrid = fuelTypes.every(ft => {
              const isElectric = ft.includes('eléctrico') || ft.includes('electric');
              const isHybrid = ft.includes('híbrido') || ft.includes('hybrid');
              const isElectricOrHybrid = isElectric || isHybrid;
              
              // Debug log para cada vehículo
              if (!isElectricOrHybrid) {
                console.log(`🔋 Vehículo con fuelType "${ft}" NO es eléctrico ni híbrido`);
              }
              
              return isElectricOrHybrid;
            });
            
            // Debug: log para ver qué está pasando
            console.log(`🔋 Sección batería - fuelTypes:`, fuelTypes, `| allElectricOrHybrid:`, allElectricOrHybrid);
            
            // IMPORTANTE: Si NO todos son eléctricos/híbridos, NO mostrar la sección
            return allElectricOrHybrid;
          }
          
          // Para otras secciones con conditional: verificar que al menos uno cumpla
          // (la sección de batería ya se manejó explícitamente arriba, así que no llegará aquí)
          if (section.conditional) {
            // Para otras secciones con conditional, verificar que al menos uno cumpla
            return fuelTypes.some(ft => section.conditional!(ft));
          }
          
          return true;
        })
        .filter(section => {
          // Verificar que la sección tenga al menos un campo con datos en alguno de los vehículos
          return section.fields.some(field => {
            return vehiclesWithSpecs.some(vehicle => {
              const value = getFieldValueForComparison(vehicle, field.key);
              return value !== null && value !== undefined;
            });
          });
        })
        .map((section) => {
          return (
            <Card key={section.key} className="overflow-hidden">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleSection(section.key)}
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{section.icon}</span>
                    <span>{section.label}</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    {expandedSections.has(section.key) ? <Minus className="w-4 h-4" /> : <span>Expandir</span>}
                  </Button>
                </CardTitle>
              </CardHeader>

              {expandedSections.has(section.key) && (
                <CardContent className="p-0">
                  <div className="overflow-x-auto responsive-table">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left p-2 md:p-4 font-semibold text-gray-900 bg-gray-50 min-w-[140px] md:min-w-[200px]">
                            <span className="text-xs md:text-sm">Especificación</span>
                          </th>
                          {vehiclesWithSpecs.map((vehicle, index) => (
                            <th key={vehicle.id} className="text-center p-2 md:p-4 font-semibold text-gray-900 bg-gray-50 min-w-[120px] md:min-w-[180px]">
                              <div className="text-xs md:text-sm font-bold">{vehicle.brand}</div>
                              <div className="text-xs text-gray-600">{vehicle.model}</div>
                              <div className="text-xs text-gray-500">{vehicle.year}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.fields
                          .filter(field => {
                            // Solo mostrar campos que tengan datos en al menos un vehículo
                            return vehiclesWithSpecs.some(vehicle => {
                              const value = getFieldValueForComparison(vehicle, field.key);
                              return value !== null && value !== undefined;
                            });
                          })
                          .map((field) => {
                          const winnerIndex = getWinnerIndexForComparison(vehiclesWithSpecs, field);
                          
                          return (
                            <tr key={field.key} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="p-2 md:p-4 font-medium text-gray-700">
                                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                                  <span className="text-xs md:text-sm">{field.label}</span>
                                  <div className="flex items-center gap-1">
                                    {field.unit && !field.formatter && (
                                      <span className="text-xs text-gray-500">({field.unit})</span>
                                    )}
                                    {field.formatter && (
                                      <span className="text-xs text-gray-500">(varía según tipo)</span>
                                    )}
                                    <div className="relative group">
                                      <Info className="w-3 h-3 md:w-4 md:h-4 text-gray-400 cursor-help" />
                                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        {field.better === 'higher' ? 'Mayor es mejor' : field.better === 'lower' ? 'Menor es mejor' : 'Característica'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              
                              {vehiclesWithSpecs.map((vehicle, index) => {
                                const value = getFieldDisplayValueForComparison(vehicle, field);
                                const isWinner = winnerIndex === index;
                                
                                return (
                                  <td 
                                    key={vehicle.id} 
                                    className={`p-2 md:p-4 text-center ${
                                      isWinner 
                                        ? 'bg-wise/10 border-2 border-wise/30 font-semibold' 
                                        : ''
                                    }`}
                                  >
                                    <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2">
                                      <span className={`text-xs md:text-sm ${value === '✗' || value === '✗ No' ? 'text-gray-400' : ''}`}>
                                        {value}
                                      </span>
                                      {isWinner && <Trophy className="w-3 h-3 md:w-4 md:h-4 text-wise" />}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}

      {/* Leyenda */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg"></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-wise/10 border-2 border-wise/30 rounded"></div>
              <span>Ganador</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">✗ No</span>
              <span>No disponible</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
