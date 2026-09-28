'use client';

interface VehicleSpecificationsFormProps {
  specifications: any;
  onSpecificationChange: (section: string, field: string, value: any) => void;
  fuelType: string;
  vehicleType?: string;
}

export function VehicleSpecificationsForm({ 
  specifications, 
  onSpecificationChange, 
  fuelType,
  vehicleType 
}: VehicleSpecificationsFormProps) {
  
  const handleChange = (section: string, field: string, value: any) => {
    onSpecificationChange(section, field, value);
  };

  return (
    <div className="space-y-8">
      {/* RENDIMIENTO Y VELOCIDAD */}
      <div className="border border-linea rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-tinta mb-4">⚡ Rendimiento y Velocidad</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Aceleración 0-100 km/h (s)
            </label>
            <input
              type="number"
              value={specifications.performance?.acceleration0to100 || ''}
              onChange={(e) => handleChange('performance', 'acceleration0to100', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.1"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Aceleración 0-200 km/h (s)
            </label>
            <input
              type="number"
              value={specifications.performance?.acceleration0to200 || ''}
              onChange={(e) => handleChange('performance', 'acceleration0to200', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.1"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Cuarto de milla (s)
            </label>
            <input
              type="number"
              value={specifications.performance?.quarterMile || ''}
              onChange={(e) => handleChange('performance', 'quarterMile', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.1"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Adelantamiento 80-120 km/h (s)
            </label>
            <input
              type="number"
              value={specifications.performance?.overtaking80to120 || ''}
              onChange={(e) => handleChange('performance', 'overtaking80to120', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.1"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Velocidad máxima (km/h)
            </label>
            <input
              type="number"
              value={specifications.performance?.maxSpeed || ''}
              onChange={(e) => handleChange('performance', 'maxSpeed', parseFloat(e.target.value) || 0)}
              min="0"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Potencia-peso (HP/ton)
            </label>
            <input
              type="number"
              value={specifications.performance?.powerToWeight || ''}
              onChange={(e) => handleChange('performance', 'powerToWeight', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.1"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={specifications.performance?.launchControl || false}
                onChange={(e) => handleChange('performance', 'launchControl', e.target.checked)}
                className="w-4 h-4 text-wise border-linea rounded focus:ring-wise"
              />
              <span className="text-sm font-medium text-tinta/80">Control de lanzamiento</span>
            </label>
          </div>
        </div>
      </div>

      {/* CHASIS Y SUSPENSIÓN */}
      <div className="border border-linea rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-tinta mb-4">🔧 Chasis y Suspensión</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Altura libre al suelo (cm)
            </label>
            <input
              type="number"
              value={specifications.chassis?.groundClearance || ''}
              onChange={(e) => handleChange('chassis', 'groundClearance', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.1"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Distancia de frenado 100-0 km/h (m)
            </label>
            <input
              type="number"
              value={specifications.chassis?.brakingDistance100to0 || ''}
              onChange={(e) => handleChange('chassis', 'brakingDistance100to0', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.1"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Aceleración lateral máxima (g)
            </label>
            <input
              type="number"
              value={specifications.chassis?.maxLateralAcceleration || ''}
              onChange={(e) => handleChange('chassis', 'maxLateralAcceleration', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.1"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Aceleración longitudinal máxima (g)
            </label>
            <input
              type="number"
              value={specifications.chassis?.maxLongitudinalAcceleration || ''}
              onChange={(e) => handleChange('chassis', 'maxLongitudinalAcceleration', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.1"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Tipo de setup de suspensión
            </label>
            <select
              value={specifications.chassis?.suspensionSetup || ''}
              onChange={(e) => handleChange('chassis', 'suspensionSetup', e.target.value)}
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            >
              <option value="">Seleccionar tipo</option>
              <option value="McPherson">McPherson</option>
              <option value="Doble Wishbone">Doble Wishbone</option>
              <option value="Multilink">Multilink</option>
              <option value="Suspensión de eje rígido">Suspensión de eje rígido</option>
              <option value="Suspensión neumática">Suspensión neumática</option>
              <option value="Suspensión adaptativa">Suspensión adaptativa</option>
              <option value="Suspensión magnetorheológica">Suspensión magnetorheológica</option>
            </select>
          </div>
        </div>
      </div>

      {/* CAPACIDADES OFF-ROAD - Solo se muestra si el tipo de vehículo es Todoterreno */}
      {vehicleType === 'Todoterreno' && (
        <div className="border border-linea rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-tinta mb-4">🏔️ Capacidades Off-Road</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-tinta/80 mb-2">
                Ángulo de aproximación (°)
              </label>
              <input
                type="number"
                value={specifications.offRoad?.approachAngle || ''}
                onChange={(e) => handleChange('offRoad', 'approachAngle', parseFloat(e.target.value) || 0)}
                min="0"
                max="90"
                step="0.1"
                className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-tinta/80 mb-2">
                Ángulo de salida (°)
              </label>
              <input
                type="number"
                value={specifications.offRoad?.departureAngle || ''}
                onChange={(e) => handleChange('offRoad', 'departureAngle', parseFloat(e.target.value) || 0)}
                min="0"
                max="90"
                step="0.1"
                className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-tinta/80 mb-2">
                Ángulo de paso (°)
              </label>
              <input
                type="number"
                value={specifications.offRoad?.breakoverAngle || ''}
                onChange={(e) => handleChange('offRoad', 'breakoverAngle', parseFloat(e.target.value) || 0)}
                min="0"
                max="90"
                step="0.1"
                className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-tinta/80 mb-2">
                Profundidad de vadeo (cm)
              </label>
              <input
                type="number"
                value={specifications.offRoad?.wadingDepth || ''}
                onChange={(e) => handleChange('offRoad', 'wadingDepth', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-tinta/80 mb-2">
                Altura de vadeo (cm)
              </label>
              <input
                type="number"
                value={specifications.offRoad?.wadingHeight || ''}
                onChange={(e) => handleChange('offRoad', 'wadingHeight', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* PESO Y CARGA */}
      <div className="border border-linea rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-tinta mb-4">⚖️ Peso y Carga</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Peso bruto combinado (kg)
            </label>
            <input
              type="number"
              value={specifications.weight?.grossCombinedWeight || ''}
              onChange={(e) => handleChange('weight', 'grossCombinedWeight', parseFloat(e.target.value) || 0)}
              min="0"
              step="1"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Carga útil (kg)
            </label>
            <input
              type="number"
              value={specifications.weight?.payload || ''}
              onChange={(e) => handleChange('weight', 'payload', parseFloat(e.target.value) || 0)}
              min="0"
              step="1"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Capacidad de remolque (kg)
            </label>
            <input
              type="number"
              value={specifications.weight?.towingCapacity || ''}
              onChange={(e) => handleChange('weight', 'towingCapacity', parseFloat(e.target.value) || 0)}
              min="0"
              step="1"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Volumen de caja de carga (L)
            </label>
            <input
              type="number"
              value={specifications.weight?.cargoBoxVolume || ''}
              onChange={(e) => handleChange('weight', 'cargoBoxVolume', parseFloat(e.target.value) || 0)}
              min="0"
              step="1"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* DIMENSIONES */}
      <div className="border border-linea rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-tinta mb-4">📏 Dimensiones</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Longitud (m)
            </label>
            <input
              type="number"
              value={specifications.dimensions?.length || ''}
              onChange={(e) => handleChange('dimensions', 'length', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Ancho (m)
            </label>
            <input
              type="number"
              value={specifications.dimensions?.width || ''}
              onChange={(e) => handleChange('dimensions', 'width', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Altura (m)
            </label>
            <input
              type="number"
              value={specifications.dimensions?.height || ''}
              onChange={(e) => handleChange('dimensions', 'height', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Distancia entre ejes (m)
            </label>
            <input
              type="number"
              value={specifications.dimensions?.wheelbase || ''}
              onChange={(e) => handleChange('dimensions', 'wheelbase', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Peso en vacío (kg)
            </label>
            <input
              type="number"
              value={specifications.dimensions?.curbWeight || ''}
              onChange={(e) => handleChange('dimensions', 'curbWeight', parseFloat(e.target.value) || 0)}
              min="0"
              step="1"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Capacidad de carga (L)
            </label>
            <input
              type="number"
              value={specifications.dimensions?.cargoCapacity || ''}
              onChange={(e) => handleChange('dimensions', 'cargoCapacity', parseFloat(e.target.value) || 0)}
              min="0"
              step="1"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
        </div>
      </div>

      {/* INTERIOR */}
      <div className="border border-linea rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-tinta mb-4">🛋️ Interior</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Maletero con asientos abatidos (L)
            </label>
            <input
              type="number"
              value={specifications.interior?.trunkCapacitySeatsDown || ''}
              onChange={(e) => handleChange('interior', 'trunkCapacitySeatsDown', parseFloat(e.target.value) || 0)}
              min="0"
              step="1"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Número de filas de asientos
            </label>
            <input
              type="number"
              value={specifications.interior?.seatRows || ''}
              onChange={(e) => handleChange('interior', 'seatRows', parseInt(e.target.value) || 0)}
              min="1"
              max="4"
              step="1"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Capacidad de carga interior (L)
            </label>
            <input
              type="number"
              value={specifications.interior?.interiorCargoCapacity || ''}
              onChange={(e) => handleChange('interior', 'interiorCargoCapacity', parseFloat(e.target.value) || 0)}
              min="0"
              step="1"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Capacidad de pasajeros
            </label>
            <input
              type="number"
              value={specifications.interior?.passengerCapacity || ''}
              onChange={(e) => handleChange('interior', 'passengerCapacity', parseInt(e.target.value) || 0)}
              min="1"
              max="12"
              step="1"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* SEGURIDAD */}
      <div className="border border-linea rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-tinta mb-4">🛡️ Seguridad</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Número de airbags
            </label>
            <input
              type="number"
              value={specifications.safety?.airbags || ''}
              onChange={(e) => handleChange('safety', 'airbags', parseInt(e.target.value) || 0)}
              min="0"
              max="20"
              step="1"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Calificación NCAP (0-5 estrellas)
            </label>
            <input
              type="number"
              value={specifications.safety?.ncapRating || ''}
              onChange={(e) => handleChange('safety', 'ncapRating', parseInt(e.target.value) || 0)}
              min="0"
              max="5"
              step="1"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Puntuación seguridad adultos (0-100)
            </label>
            <input
              type="number"
              value={specifications.safety?.adultSafetyScore || ''}
              onChange={(e) => handleChange('safety', 'adultSafetyScore', parseInt(e.target.value) || 0)}
              min="0"
              max="100"
              step="1"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Puntuación seguridad niños (0-100)
            </label>
            <input
              type="number"
              value={specifications.safety?.childSafetyScore || ''}
              onChange={(e) => handleChange('safety', 'childSafetyScore', parseInt(e.target.value) || 0)}
              min="0"
              max="100"
              step="1"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Puntuación sistemas asistencia (0-100)
            </label>
            <input
              type="number"
              value={specifications.safety?.assistanceScore || ''}
              onChange={(e) => handleChange('safety', 'assistanceScore', parseInt(e.target.value) || 0)}
              min="0"
              max="100"
              step="1"
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
        </div>

        {/* Checkboxes de seguridad */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.safety?.stabilityControl || false}
              onChange={(e) => handleChange('safety', 'stabilityControl', e.target.checked)}
              className="w-4 h-4 text-wise border-linea rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-tinta/80">Control de estabilidad</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.safety?.tractionControl || false}
              onChange={(e) => handleChange('safety', 'tractionControl', e.target.checked)}
              className="w-4 h-4 text-wise border-linea rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-tinta/80">Control de tracción</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.safety?.autonomousEmergencyBraking || false}
              onChange={(e) => handleChange('safety', 'autonomousEmergencyBraking', e.target.checked)}
              className="w-4 h-4 text-wise border-linea rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-tinta/80">Frenado de emergencia autónomo</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.safety?.forwardCollisionWarning || false}
              onChange={(e) => handleChange('safety', 'forwardCollisionWarning', e.target.checked)}
              className="w-4 h-4 text-wise border-linea rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-tinta/80">Advertencia de colisión frontal</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.safety?.laneAssist || false}
              onChange={(e) => handleChange('safety', 'laneAssist', e.target.checked)}
              className="w-4 h-4 text-wise border-linea rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-tinta/80">Asistente de carril</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.safety?.adaptiveCruiseControl || false}
              onChange={(e) => handleChange('safety', 'adaptiveCruiseControl', e.target.checked)}
              className="w-4 h-4 text-wise border-linea rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-tinta/80">Control de crucero adaptativo</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.safety?.blindSpotDetection || false}
              onChange={(e) => handleChange('safety', 'blindSpotDetection', e.target.checked)}
              className="w-4 h-4 text-wise border-linea rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-tinta/80">Detección de punto ciego</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.safety?.crossTrafficAlert || false}
              onChange={(e) => handleChange('safety', 'crossTrafficAlert', e.target.checked)}
              className="w-4 h-4 text-wise border-linea rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-tinta/80">Alerta de tráfico cruzado</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.safety?.fatigueMonitor || false}
              onChange={(e) => handleChange('safety', 'fatigueMonitor', e.target.checked)}
              className="w-4 h-4 text-wise border-linea rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-tinta/80">Monitor de fatiga</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.safety?.tirePressureMonitoring || false}
              onChange={(e) => handleChange('safety', 'tirePressureMonitoring', e.target.checked)}
              className="w-4 h-4 text-wise border-linea rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-tinta/80">Monitoreo de presión de neumáticos</span>
          </label>
        </div>
      </div>

      {/* ILUMINACIÓN */}
      <div className="border border-linea rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-tinta mb-4">💡 Iluminación</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-tinta/80 mb-2">
              Tipo de faros
            </label>
            <select
              value={specifications.lighting?.headlightType || ''}
              onChange={(e) => handleChange('lighting', 'headlightType', e.target.value)}
              className="w-full px-3 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
            >
              <option value="">Seleccionar tipo</option>
              <option value="Halógeno">Halógeno</option>
              <option value="Xenón">Xenón</option>
              <option value="LED">LED</option>
              <option value="Laser">Laser</option>
              <option value="Matrix LED">Matrix LED</option>
            </select>
          </div>
          
        </div>
      </div>

      {/* SISTEMAS DE ASISTENCIA */}
      <div className="border border-linea rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-tinta mb-4">🚗 Sistemas de Asistencia</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.assistance?.brakeAssist || false}
              onChange={(e) => handleChange('assistance', 'brakeAssist', e.target.checked)}
              className="w-4 h-4 text-wise border-linea rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-tinta/80">Asistencia de frenado</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.assistance?.hillStartAssist || false}
              onChange={(e) => handleChange('assistance', 'hillStartAssist', e.target.checked)}
              className="w-4 h-4 text-wise border-linea rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-tinta/80">Asistente de arranque en pendiente</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.assistance?.reverseCamera || false}
              onChange={(e) => handleChange('assistance', 'reverseCamera', e.target.checked)}
              className="w-4 h-4 text-wise border-linea rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-tinta/80">Cámara de reversa</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.assistance?.parkingSensors || false}
              onChange={(e) => handleChange('assistance', 'parkingSensors', e.target.checked)}
              className="w-4 h-4 text-wise border-linea rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-tinta/80">Sensores de estacionamiento</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.assistance?.cameras360 || false}
              onChange={(e) => handleChange('assistance', 'cameras360', e.target.checked)}
              className="w-4 h-4 text-wise border-linea rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-tinta/80">Cámaras 360°</span>
          </label>
        </div>
      </div>

      {/* CONFORT */}
      <div className="border border-linea rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-tinta mb-4">♨️ Confort</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.comfort?.airConditioning || false}
              onChange={(e) => handleChange('comfort', 'airConditioning', e.target.checked)}
              className="w-4 h-4 text-wise border-linea rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-tinta/80">Aire acondicionado</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.comfort?.automaticClimateControl || false}
              onChange={(e) => handleChange('comfort', 'automaticClimateControl', e.target.checked)}
              className="w-4 h-4 text-wise border-linea rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-tinta/80">Control automático de clima</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.comfort?.heatedSeats || false}
              onChange={(e) => handleChange('comfort', 'heatedSeats', e.target.checked)}
              className="w-4 h-4 text-wise border-linea rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-tinta/80">Asientos calefaccionados</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.comfort?.ventilatedSeats || false}
              onChange={(e) => handleChange('comfort', 'ventilatedSeats', e.target.checked)}
              className="w-4 h-4 text-wise border-linea rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-tinta/80">Asientos ventilados</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.comfort?.massageSeats || false}
              onChange={(e) => handleChange('comfort', 'massageSeats', e.target.checked)}
              className="w-4 h-4 text-wise border-linea rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-tinta/80">Asientos con masaje</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.comfort?.automaticHighBeam || false}
              onChange={(e) => handleChange('comfort', 'automaticHighBeam', e.target.checked)}
              className="w-4 h-4 text-wise border-linea rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-tinta/80">Luz alta automática</span>
          </label>
        </div>
      </div>

      {/* TECNOLOGÍA */}
      <div className="border border-linea rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-tinta mb-4">💻 Tecnología</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.technology?.bluetooth || false}
              onChange={(e) => handleChange('technology', 'bluetooth', e.target.checked)}
              className="w-4 h-4 text-wise border-linea rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-tinta/80">Bluetooth</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.technology?.touchscreen || false}
              onChange={(e) => handleChange('technology', 'touchscreen', e.target.checked)}
              className="w-4 h-4 text-wise border-linea rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-tinta/80">Pantalla táctil</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.technology?.navigation || false}
              onChange={(e) => handleChange('technology', 'navigation', e.target.checked)}
              className="w-4 h-4 text-wise border-linea rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-tinta/80">Sistema de navegación</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.technology?.wirelessCharger || false}
              onChange={(e) => handleChange('technology', 'wirelessCharger', e.target.checked)}
              className="w-4 h-4 text-wise border-linea rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-tinta/80">Cargador inalámbrico</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.technology?.startStop || false}
              onChange={(e) => handleChange('technology', 'startStop', e.target.checked)}
              className="w-4 h-4 text-wise border-linea rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-tinta/80">Sistema start-stop</span>
          </label>
        </div>
      </div>
    </div>
  );
}
