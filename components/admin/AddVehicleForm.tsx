'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Car, Save, X, Plus } from 'lucide-react';
import { VehicleSpecificationsForm } from './VehicleSpecificationsForm';
import { VehicleFeaturesForm } from './VehicleFeaturesForm';
import { VehicleEngineForm } from './VehicleEngineForm';

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

  // Estado del formulario
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    type: '',
    vehicleType: '',
    fuelType: '',
    history: '',
    wiseCategories: '',
    specifications: {
      performance: {
        acceleration0to100: '',
        acceleration0to200: '',
        quarterMile: '',
        overtaking80to120: '',
        maxSpeed: '',
        powerToWeight: '',
        launchControl: false
      },
      chassis: {
        groundClearance: '',
        brakingDistance100to0: '',
        maxLateralAcceleration: '',
        maxLongitudinalAcceleration: '',
        suspensionSetup: ''
      },
      offRoad: {
        approachAngle: '',
        departureAngle: '',
        breakoverAngle: '',
        wadingDepth: '',
        wadingHeight: ''
      },
      weight: {
        grossCombinedWeight: '',
        payload: '',
        towingCapacity: '',
        cargoBoxVolume: ''
      },
      dimensions: {
        length: '',
        width: '',
        height: '',
        wheelbase: '',
        curbWeight: ''
      },
      interior: {
        trunkCapacitySeatsDown: '',
        seatRows: '',
        interiorCargoCapacity: '',
        passengerCapacity: ''
      },
      safety: {
        airbags: '',
        ncapRating: '',
        adultSafetyScore: '',
        childSafetyScore: '',
        assistanceScore: '',
        brakingSystem: [],
        stabilityControl: false,
        tractionControl: false,
        autonomousEmergencyBraking: false,
        forwardCollisionWarning: false,
        laneAssist: false,
        adaptiveCruiseControl: false,
        blindSpotDetection: false,
        crossTrafficAlert: false,
        fatigueMonitor: false,
        tirePressureMonitoring: false
      },
      lighting: {
        headlightType: ''
      },
      assistance: {
        brakeAssist: false,
        hillStartAssist: false,
        reverseCamera: false,
        parkingSensors: false,
        cameras360: false
      },
      comfort: {
        airConditioning: false,
        automaticClimateControl: false,
        heatedSeats: false,
        ventilatedSeats: false,
        massageSeats: false,
        automaticHighBeam: false
      },
      technology: {
        bluetooth: false,
        touchscreen: false,
        navigation: false,
        wirelessCharger: false,
        startStop: false,
        smartphoneIntegration: []
      },
      combustion: {
        displacement: '',
        engineConfiguration: '',
        inductionType: '',
        compressionRatio: '',
        maxPower: '',
        maxTorque: '',
        rpmLimit: '',
        powerAtRpm: '',
        cityConsumption: '',
        highwayConsumption: '',
        combinedConsumption: '',
        emissionStandard: '',
        ecoMode: false
      },
      electric: {
        cityElectricConsumption: '',
        highwayElectricConsumption: '',
        electricRange: '',
        theoreticalRangeHighway: '',
        theoreticalRangeCity: '',
        theoreticalRangeMixed: '',
        realRangeHighway: '',
        realRangeCity: '',
        realRangeMixed: '',
        acChargingTime: '',
        dcChargingTime: '',
        chargingTime1080: '',
        batteryCapacity: '',
        batteryPrice: '',
        homeChargerCost: '',
        chargingConvenienceIndex: '',
        regenerativeBraking: false
      },
      hybrid: {
        displacement: '',
        maxPower: '',
        maxTorque: '',
        transmissionType: '',
        gears: '',
        fuelTankCapacity: '',
        cityConsumption: '',
        highwayConsumption: '',
        batteryCapacity: '',
        regenerativeBraking: false,
        startStop: false,
        ecoMode: false
      },
      phev: {
        displacement: '',
        maxPower: '',
        maxTorque: '',
        transmissionType: '',
        gears: '',
        fuelTankCapacity: '',
        cityConsumption: '',
        highwayConsumption: '',
        batteryCapacity: '',
        electricRange: '',
        acChargingTime: '',
        dcChargingTime: '',
        regenerativeBraking: false,
        batteryWeight: '',
        homeChargerCost: '',
        chargingConvenienceIndex: ''
      }
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Limpiar especificaciones vacías
      const cleanSpecifications = Object.fromEntries(
        Object.entries(formData.specifications).map(([key, section]) => [
          key,
          Object.fromEntries(
            Object.entries(section).filter(([_, value]) => {
              if (Array.isArray(value)) {
                return value.length > 0;
              }
              if (typeof value === 'boolean') {
                return value === true;
              }
              return value !== '' && value !== null && value !== undefined;
            })
          )
        ]).filter(([_, section]) => Object.keys(section).length > 0)
      );

      const vehicleData = {
        brand: formData.brand,
        model: formData.model,
        year: parseInt(formData.year.toString()),
        price: parseFloat(formData.price),
        type: formData.type,
        vehicleType: formData.vehicleType,
        fuelType: formData.fuelType,
        history: formData.history || '',
        wiseCategories: formData.wiseCategories || '',
        specifications: cleanSpecifications,
        dealerIds: selectedDealers
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSpecificationChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [section]: {
          ...prev.specifications[section as keyof typeof prev.specifications],
          [field]: value
        }
      }
    }));
  };

  const toggleDealer = (dealerId: string) => {
    setSelectedDealers(prev => 
      prev.includes(dealerId) 
        ? prev.filter(id => id !== dealerId)
        : [...prev, dealerId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
      {/* Información Básica */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Car className="w-5 h-5 mr-2 text-wise" />
          Información Básica
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marca *
            </label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modelo *
            </label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Año *
            </label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              min="1900"
              max="2030"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="1000000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              placeholder="280000000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo Básico *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              required
            >
              <option value="">Seleccionar tipo</option>
              <option value="Sedán">Sedán</option>
              <option value="SUV">SUV</option>
              <option value="Pickup">Pickup</option>
              <option value="Deportivo">Deportivo</option>
              <option value="Wagon">Wagon</option>
              <option value="Hatchback">Hatchback</option>
              <option value="Convertible">Convertible</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Vehículo *
            </label>
            <select
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              required
            >
              <option value="">Seleccionar tipo</option>
              <option value="Automóvil">Automóvil</option>
              <option value="Deportivo">Deportivo</option>
              <option value="Todoterreno">Todoterreno</option>
              <option value="Lujo">Lujo</option>
              <option value="Económico">Económico</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Combustible *
            </label>
            <select
              name="fuelType"
              value={formData.fuelType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              required
            >
              <option value="">Seleccionar combustible</option>
              <option value="Gasolina">Gasolina</option>
              <option value="Diesel">Diesel</option>
              <option value="Eléctrico">Eléctrico</option>
              <option value="Híbrido">Híbrido</option>
              <option value="Híbrido Enchufable">Híbrido Enchufable</option>
            </select>
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Historial del Vehículo
            </label>
            <textarea
              name="history"
              value={formData.history}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              placeholder="Descripción del historial del vehículo..."
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wise Categories
            </label>
            <textarea
              name="wiseCategories"
              value={formData.wiseCategories}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              placeholder="Ej: Bueno para correr, Elegante para la noche, Perfecto para los niños..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Escribe las categorías separadas por comas. Estas aparecerán en la vista de detalle del vehículo.
            </p>
          </div>
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

      {/* Especificaciones Técnicas */}
      <VehicleSpecificationsForm
        specifications={formData.specifications}
        onSpecificationChange={handleSpecificationChange}
        fuelType={formData.fuelType}
        vehicleType={formData.vehicleType}
      />

      {/* Características del Vehículo */}
      <VehicleFeaturesForm
        specifications={formData.specifications}
        onSpecificationChange={handleSpecificationChange}
      />

      {/* Especificaciones del Motor */}
      <VehicleEngineForm
        specifications={formData.specifications}
        onSpecificationChange={handleSpecificationChange}
        fuelType={formData.fuelType}
      />

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
