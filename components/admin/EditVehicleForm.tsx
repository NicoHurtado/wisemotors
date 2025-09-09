'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Car, Save, X, Loader2 } from 'lucide-react';
import { VehicleSpecificationsForm } from './VehicleSpecificationsForm';
import { VehicleFeaturesForm } from './VehicleFeaturesForm';
import { VehicleEngineForm } from './VehicleEngineForm';
import { WiseMetricsForm } from './WiseMetricsForm';
import { ImageUpload } from './ImageUpload';

interface Dealer {
  id: string;
  name: string;
  location: string;
}

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  type: string;
  vehicleType: string;
  fuelType: string;
  history: string;
  wiseCategories?: string;
  specifications: any;
  vehicleDealers: Array<{
    dealerId: string;
    dealer: {
      id: string;
      name: string;
    };
  }>;
  images?: Array<{
    id: string;
    url: string;
    type: string;
    order: number;
  }>;
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
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [coverImage, setCoverImage] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [thumbnailIndex, setThumbnailIndex] = useState<number>(0);

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
    status: 'Entrega Inmediata',
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
        curbWeight: '',
        cargoCapacity: ''
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
        turbo: false,
        supercharger: false,
        engineConfiguration: '',
        inductionType: '',
        compressionRatio: '',
        maxPower: '',
        maxTorque: '',
        rpmLimit: '',
        transmissionType: '',
        gears: '',
        fuelTankCapacity: '',
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
        engineConfiguration: '',
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
        engineConfiguration: '',
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
      },
      wisemetrics: {
        drivingFun: 50,
        technology: 50,
        environmentalImpact: 50,
        reliability: 50,
        qualityPriceRatio: 50,
        comfort: 50,
        usability: 50,
        efficiency: 50,
        prestige: 50,
        interiorQuality: 50
      }
    }
  });

  // Cargar vehículo y concesionarios
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar vehículo
        const vehicleResponse = await fetch(`/api/vehicles/${vehicleId}`);
        if (vehicleResponse.ok) {
          const vehicleData = await vehicleResponse.json();
          setVehicle(vehicleData);
          
          
          // Llenar formulario con datos del vehículo
          setFormData({
            brand: vehicleData.brand || '',
            model: vehicleData.model || '',
            year: vehicleData.year || new Date().getFullYear(),
            price: vehicleData.price?.toString() || '',
            type: vehicleData.type || '',
            vehicleType: vehicleData.vehicleType || '',
            fuelType: vehicleData.fuelType || '',
            history: vehicleData.history || '',
            wiseCategories: vehicleData.wiseCategories || '',
            status: vehicleData.status || 'Disponible',
            specifications: {
              ...formData.specifications,
              ...vehicleData.specifications
            }
          });

          // Llenar concesionarios seleccionados
          if (vehicleData.vehicleDealers) {
            setSelectedDealers(vehicleData.vehicleDealers.map((vd: any) => vd.dealerId));
          }

          // Llenar imágenes
          if (vehicleData.images) {
            const coverImg = vehicleData.images.find((img: any) => img.type === 'cover');
            const galleryImgs = vehicleData.images
              .filter((img: any) => img.type === 'gallery')
              .sort((a: any, b: any) => a.order - b.order)
              .map((img: any) => img.url);
            
            // Encontrar el índice de la imagen miniatura
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
          const dealersData = await dealersResponse.json();
          setDealerships(dealersData || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      
      // Limpiar especificaciones vacías
      const cleanSpecifications = Object.fromEntries(
        Object.entries(formData.specifications).map(([key, section]) => {
          // Para wisemetrics, no aplicar limpieza ya que contiene valores numéricos válidos
          if (key === 'wisemetrics') {
            return [key, section];
          }
          
          // Para otras secciones, aplicar limpieza normal
          const cleanedSection = Object.fromEntries(
            Object.entries(section).filter(([_, value]) => {
              if (Array.isArray(value)) {
                return value.length > 0;
              }
              if (typeof value === 'boolean') {
                return value === true;
              }
              return value !== '' && value !== null && value !== undefined;
            })
          );
          
          return [key, cleanedSection];
        }).filter(([_, section]) => {
          // Para wisemetrics, siempre incluirlo si existe
          if (section && typeof section === 'object' && 'drivingFun' in section) {
            return true;
          }
          // Para otras secciones, verificar que no estén vacías
          return Object.keys(section).length > 0;
        })
      );

      // Añadir wisemetrics a las especificaciones (por si acaso)
      if (formData.specifications.wisemetrics) {
        cleanSpecifications.wisemetrics = formData.specifications.wisemetrics;
      }

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
        status: formData.status,
        specifications: cleanSpecifications,
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
        alert('Vehículo actualizado exitosamente!');
        router.push('/admin');
      } else {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
        alert(`Error: ${errorData.error || 'Error al actualizar el vehículo'}`);
      }
    } catch (error) {
      console.error('❌ Error updating vehicle:', error);
      alert('Error al actualizar el vehículo');
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

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-wise mr-3" />
        <span className="text-gray-600">Cargando vehículo...</span>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <Car className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Vehículo no encontrado</h3>
        <p className="mt-1 text-sm text-gray-500">
          El vehículo que buscas no existe o ha sido eliminado.
        </p>
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
              max={new Date().getFullYear() + 1}
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
              step="1000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              required
            >
              <option value="Entrega Inmediata">Entrega Inmediata</option>
              <option value="En lista">En lista</option>
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
              placeholder="Describe el historial del vehículo..."
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

      {/* Concesionarios Disponibles */}
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
                className="h-4 w-4 text-wise focus:ring-wise border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                {dealer.name} ({dealer.location})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Especificaciones del Vehículo */}
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

      {/* WiseMetrics */}
      <WiseMetricsForm
        specifications={formData.specifications}
        onSpecificationChange={handleSpecificationChange}
      />

      {/* Botones de Acción */}
      <div className="flex justify-between items-center pt-8 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.push('/admin')}
          className="flex items-center px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <X className="w-5 h-5 mr-2" />
          Cancelar
        </button>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center px-6 py-3 bg-wise text-white rounded-lg hover:bg-wise/90 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Car className="w-5 h-5 mr-2" />
          )}
          Actualizar Vehículo
        </button>
      </div>
    </form>
  );
}
