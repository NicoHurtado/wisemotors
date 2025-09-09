'use client';

interface VehicleEngineFormProps {
  specifications: any;
  onSpecificationChange: (section: string, field: string, value: any) => void;
  fuelType: string;
}

export function VehicleEngineForm({ 
  specifications, 
  onSpecificationChange, 
  fuelType 
}: VehicleEngineFormProps) {
  
  const handleChange = (section: string, field: string, value: any) => {
    onSpecificationChange(section, field, value);
  };

  // Solo mostrar para vehículos de combustión
  if (fuelType === 'Eléctrico') {
    return (
      <div className="space-y-8">
        {/* ESPECIFICACIONES ELÉCTRICAS */}
        <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-r from-blue-50 to-blue-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span>Especificaciones Eléctricas</span>
            <button type="button" className="ml-auto text-gray-400 hover:text-gray-600">
              <span className="text-lg">▼</span>
            </button>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacidad de batería (kWh)
              </label>
              <input
                type="number"
                value={specifications.electric?.batteryCapacity || ''}
                onChange={(e) => handleChange('electric', 'batteryCapacity', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Autonomía teórica (km)
              </label>
              <input
                type="number"
                value={specifications.electric?.electricRange || ''}
                onChange={(e) => handleChange('electric', 'electricRange', parseFloat(e.target.value) || 0)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Autonomía teórica - Real carretera (km)
              </label>
              <input
                type="number"
                value={specifications.electric?.theoreticalRangeHighway || ''}
                onChange={(e) => handleChange('electric', 'theoreticalRangeHighway', parseFloat(e.target.value) || 0)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Autonomía teórica - Real ciudad (km)
              </label>
              <input
                type="number"
                value={specifications.electric?.theoreticalRangeCity || ''}
                onChange={(e) => handleChange('electric', 'theoreticalRangeCity', parseFloat(e.target.value) || 0)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Autonomía teórica - Real mixto (km)
              </label>
              <input
                type="number"
                value={specifications.electric?.theoreticalRangeMixed || ''}
                onChange={(e) => handleChange('electric', 'theoreticalRangeMixed', parseFloat(e.target.value) || 0)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consumo eléctrico ciudad (kWh/100 km)
              </label>
              <input
                type="number"
                value={specifications.electric?.cityElectricConsumption || ''}
                onChange={(e) => handleChange('electric', 'cityElectricConsumption', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consumo eléctrico carretera (kWh/100 km)
              </label>
              <input
                type="number"
                value={specifications.electric?.highwayElectricConsumption || ''}
                onChange={(e) => handleChange('electric', 'highwayElectricConsumption', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Autonomía real - Real carretera (km)
              </label>
              <input
                type="number"
                value={specifications.electric?.realRangeHighway || ''}
                onChange={(e) => handleChange('electric', 'realRangeHighway', parseFloat(e.target.value) || 0)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Autonomía real - Real ciudad (km)
              </label>
              <input
                type="number"
                value={specifications.electric?.realRangeCity || ''}
                onChange={(e) => handleChange('electric', 'realRangeCity', parseFloat(e.target.value) || 0)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Autonomía real - Real mixto (km)
              </label>
              <input
                type="number"
                value={specifications.electric?.realRangeMixed || ''}
                onChange={(e) => handleChange('electric', 'realRangeMixed', parseFloat(e.target.value) || 0)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiempo de carga AC (min)
              </label>
              <input
                type="number"
                value={specifications.electric?.acChargingTime || ''}
                onChange={(e) => handleChange('electric', 'acChargingTime', parseFloat(e.target.value) || 0)}
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiempo de carga DC (min)
              </label>
              <input
                type="number"
                value={specifications.electric?.dcChargingTime || ''}
                onChange={(e) => handleChange('electric', 'dcChargingTime', parseFloat(e.target.value) || 0)}
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiempo de carga 10-80% (min)
              </label>
              <input
                type="number"
                value={specifications.electric?.chargingTime1080 || ''}
                onChange={(e) => handleChange('electric', 'chargingTime1080', parseFloat(e.target.value) || 0)}
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Costo de cargador aproximadamente (COP)
              </label>
              <input
                type="number"
                value={specifications.electric?.homeChargerCost || ''}
                onChange={(e) => handleChange('electric', 'homeChargerCost', parseFloat(e.target.value) || 0)}
                min="0"
                step="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio de la batería (COP) <span className="text-gray-500 text-sm">(Opcional)</span>
              </label>
              <input
                type="number"
                value={specifications.electric?.batteryPrice || ''}
                onChange={(e) => handleChange('electric', 'batteryPrice', parseFloat(e.target.value) || 0)}
                min="0"
                step="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
          </div>
          
          <div className="mt-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={specifications.electric?.regenerativeBraking || false}
                onChange={(e) => handleChange('electric', 'regenerativeBraking', e.target.checked)}
                className="w-4 h-4 text-wise border-gray-300 rounded focus:ring-wise"
              />
              <span className="text-sm font-medium text-gray-700">Frenado regenerativo</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  // Solo mostrar para vehículos híbridos
  if (fuelType === 'Híbrido') {
    return (
      <div className="space-y-8">
        {/* ESPECIFICACIONES HÍBRIDAS */}
        <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-r from-wise/5 to-wise/10">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl text-green-600">♻️</span>
            <span>Sistema Híbrido</span>
            <button type="button" className="ml-auto text-gray-400 hover:text-gray-600">
              <span className="text-lg">▼</span>
            </button>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cilindraje (cc)
              </label>
              <input
                type="number"
                value={specifications.hybrid?.displacement || ''}
                onChange={(e) => handleChange('hybrid', 'displacement', parseFloat(e.target.value) || 0)}
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Potencia máxima (hp)
              </label>
              <input
                type="number"
                value={specifications.hybrid?.maxPower || ''}
                onChange={(e) => handleChange('hybrid', 'maxPower', parseFloat(e.target.value) || 0)}
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Torque máximo (Nm)
              </label>
              <input
                type="number"
                value={specifications.hybrid?.maxTorque || ''}
                onChange={(e) => handleChange('hybrid', 'maxTorque', parseFloat(e.target.value) || 0)}
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de transmisión
              </label>
              <select
                value={specifications.hybrid?.transmissionType || ''}
                onChange={(e) => handleChange('hybrid', 'transmissionType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              >
                <option value="">Seleccione</option>
                <option value="Manual">Manual</option>
                <option value="Automática">Automática</option>
                <option value="CVT">CVT</option>
                <option value="DCT">DCT</option>
                <option value="AMT">AMT</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacidad del tanque (L)
              </label>
              <input
                type="number"
                value={specifications.hybrid?.fuelTankCapacity || ''}
                onChange={(e) => handleChange('hybrid', 'fuelTankCapacity', parseFloat(e.target.value) || 0)}
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consumo carretera (L/100 km)
              </label>
              <input
                type="number"
                value={specifications.hybrid?.highwayConsumption || ''}
                onChange={(e) => handleChange('hybrid', 'highwayConsumption', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consumo ciudad (L/100 km)
              </label>
              <input
                type="number"
                value={specifications.hybrid?.cityConsumption || ''}
                onChange={(e) => handleChange('hybrid', 'cityConsumption', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacidad de batería (kWh)
              </label>
              <input
                type="number"
                value={specifications.hybrid?.batteryCapacity || ''}
                onChange={(e) => handleChange('hybrid', 'batteryCapacity', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={specifications.hybrid?.startStop || false}
                onChange={(e) => handleChange('hybrid', 'startStop', e.target.checked)}
                className="w-4 h-4 text-wise border-gray-300 rounded focus:ring-wise"
              />
              <span className="text-sm font-medium text-gray-700">Sistema Start-Stop</span>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={specifications.hybrid?.ecoMode || false}
                onChange={(e) => handleChange('hybrid', 'ecoMode', e.target.checked)}
                className="w-4 h-4 text-wise border-gray-300 rounded focus:ring-wise"
              />
              <span className="text-sm font-medium text-gray-700">Modo eco</span>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={specifications.hybrid?.regenerativeBraking || false}
                onChange={(e) => handleChange('hybrid', 'regenerativeBraking', e.target.checked)}
                className="w-4 h-4 text-wise border-gray-300 rounded focus:ring-wise"
              />
              <span className="text-sm font-medium text-gray-700">Frenado regenerativo</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  // Solo mostrar para vehículos híbridos enchufables
  if (fuelType === 'Híbrido Enchufable') {
    return (
      <div className="space-y-8">
        {/* ESPECIFICACIONES PHEV */}
        <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-r from-wise/5 to-wise/10">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🔌</span>
            <span>Sistema Híbrido Enchufable</span>
            <button type="button" className="ml-auto text-gray-400 hover:text-gray-600">
              <span className="text-lg">▼</span>
            </button>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cilindraje (cc)
              </label>
              <input
                type="number"
                value={specifications.phev?.displacement || ''}
                onChange={(e) => handleChange('phev', 'displacement', parseFloat(e.target.value) || 0)}
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Potencia máxima (hp)
              </label>
              <input
                type="number"
                value={specifications.phev?.maxPower || ''}
                onChange={(e) => handleChange('phev', 'maxPower', parseFloat(e.target.value) || 0)}
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Torque máximo (Nm)
              </label>
              <input
                type="number"
                value={specifications.phev?.maxTorque || ''}
                onChange={(e) => handleChange('phev', 'maxTorque', parseFloat(e.target.value) || 0)}
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de transmisión
              </label>
              <select
                value={specifications.phev?.transmissionType || ''}
                onChange={(e) => handleChange('phev', 'transmissionType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              >
                <option value="">Seleccione</option>
                <option value="Manual">Manual</option>
                <option value="Automática">Automática</option>
                <option value="CVT">CVT</option>
                <option value="DCT">DCT</option>
                <option value="AMT">AMT</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacidad del tanque (L)
              </label>
              <input
                type="number"
                value={specifications.phev?.fuelTankCapacity || ''}
                onChange={(e) => handleChange('phev', 'fuelTankCapacity', parseFloat(e.target.value) || 0)}
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consumo ciudad (L/100 km)
              </label>
              <input
                type="number"
                value={specifications.phev?.cityConsumption || ''}
                onChange={(e) => handleChange('phev', 'cityConsumption', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consumo carretera (L/100 km)
              </label>
              <input
                type="number"
                value={specifications.phev?.highwayConsumption || ''}
                onChange={(e) => handleChange('phev', 'highwayConsumption', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacidad de batería (kWh)
              </label>
              <input
                type="number"
                value={specifications.phev?.batteryCapacity || ''}
                onChange={(e) => handleChange('phev', 'batteryCapacity', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Autonomía eléctrica (km)
              </label>
              <input
                type="number"
                value={specifications.phev?.electricRange || ''}
                onChange={(e) => handleChange('phev', 'electricRange', parseFloat(e.target.value) || 0)}
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiempo de carga AC (min)
              </label>
              <input
                type="number"
                value={specifications.phev?.acChargingTime || ''}
                onChange={(e) => handleChange('phev', 'acChargingTime', parseFloat(e.target.value) || 0)}
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
                          <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiempo de carga DC (min)
                </label>
              <input
                type="number"
                value={specifications.phev?.dcChargingTime || ''}
                onChange={(e) => handleChange('phev', 'dcChargingTime', parseFloat(e.target.value) || 0)}
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Peso de la batería (kg)
              </label>
              <input
                type="number"
                value={specifications.phev?.batteryWeight || ''}
                onChange={(e) => handleChange('phev', 'batteryWeight', parseFloat(e.target.value) || 0)}
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Costo cargador domiciliario (COP)
              </label>
              <input
                type="number"
                value={specifications.phev?.homeChargerCost || ''}
                onChange={(e) => handleChange('phev', 'homeChargerCost', parseFloat(e.target.value) || 0)}
                min="0"
                step="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={specifications.phev?.regenerativeBraking || false}
                onChange={(e) => handleChange('phev', 'regenerativeBraking', e.target.checked)}
                className="w-4 h-4 text-wise border-gray-300 rounded focus:ring-wise"
              />
              <span className="text-sm font-medium text-gray-700">Frenado regenerativo</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  // Para vehículos de combustión (Gasolina y Diesel)
  return (
    <div className="space-y-8">
      {/* ESPECIFICACIONES DEL MOTOR */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔋 Especificaciones del Motor</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cilindraje (cc)
            </label>
            <input
              type="number"
              value={specifications.combustion?.displacement || ''}
              onChange={(e) => handleChange('combustion', 'displacement', parseFloat(e.target.value) || 0)}
              min="0"
              step="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Configuración del motor
            </label>
            <select
              value={specifications.combustion?.engineConfiguration || ''}
              onChange={(e) => handleChange('combustion', 'engineConfiguration', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
            >
              <option value="">Seleccionar configuración</option>
              <option value="En línea">En línea</option>
              <option value="V">V</option>
              <option value="Boxer">Boxer</option>
              <option value="W">W</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de inducción
            </label>
            <select
              value={specifications.combustion?.inductionType || ''}
              onChange={(e) => handleChange('combustion', 'inductionType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
            >
              <option value="">Seleccionar tipo</option>
              <option value="Natural">Natural</option>
              <option value="Turbo">Turbo</option>
              <option value="Supercargado">Supercargado</option>
              <option value="Biturbo">Biturbo</option>
              <option value="Electric turbo">Electric turbo</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Relación de compresión
            </label>
            <input
              type="number"
              value={specifications.combustion?.compressionRatio || ''}
              onChange={(e) => handleChange('combustion', 'compressionRatio', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Potencia máxima (HP)
            </label>
            <input
              type="number"
              value={specifications.combustion?.maxPower || ''}
              onChange={(e) => handleChange('combustion', 'maxPower', parseFloat(e.target.value) || 0)}
              min="0"
              step="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Torque máximo (Nm)
            </label>
            <input
              type="number"
              value={specifications.combustion?.maxTorque || ''}
              onChange={(e) => handleChange('combustion', 'maxTorque', parseFloat(e.target.value) || 0)}
              min="0"
              step="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Límite de RPM
            </label>
            <input
              type="number"
              value={specifications.combustion?.rpmLimit || ''}
              onChange={(e) => handleChange('combustion', 'rpmLimit', parseFloat(e.target.value) || 0)}
              min="0"
              step="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de transmisión
            </label>
            <select
              value={specifications.combustion?.transmissionType || ''}
              onChange={(e) => handleChange('combustion', 'transmissionType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
            >
              <option value="">Seleccionar tipo</option>
              <option value="Manual">Manual</option>
              <option value="Automática">Automática</option>
              <option value="CVT">CVT</option>
              <option value="DCT">DCT</option>
              <option value="AMT">AMT</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de marchas
            </label>
            <input
              type="number"
              value={specifications.combustion?.gears || ''}
              onChange={(e) => handleChange('combustion', 'gears', parseInt(e.target.value) || 0)}
              min="1"
              max="10"
              step="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capacidad del tanque (L)
            </label>
            <input
              type="number"
              value={specifications.combustion?.fuelTankCapacity || ''}
              onChange={(e) => handleChange('combustion', 'fuelTankCapacity', parseFloat(e.target.value) || 0)}
              min="0"
              step="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RPM de máximo torque
            </label>
            <input
              type="number"
              value={specifications.combustion?.powerAtRpm || ''}
              onChange={(e) => handleChange('combustion', 'powerAtRpm', parseFloat(e.target.value) || 0)}
              min="0"
              step="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Consumo en ciudad (L/100km)
            </label>
            <input
              type="number"
              value={specifications.combustion?.cityConsumption || ''}
              onChange={(e) => handleChange('combustion', 'cityConsumption', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Consumo en carretera (L/100km)
            </label>
            <input
              type="number"
              value={specifications.combustion?.highwayConsumption || ''}
              onChange={(e) => handleChange('combustion', 'highwayConsumption', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Consumo combinado (ciudad/carretera) (L/100km)
            </label>
            <input
              type="number"
              value={specifications.combustion?.combinedConsumption || ''}
              onChange={(e) => handleChange('combustion', 'combinedConsumption', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estándar de emisiones
            </label>
            <input
              type="text"
              value={specifications.combustion?.emissionStandard || ''}
              onChange={(e) => handleChange('combustion', 'emissionStandard', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
              placeholder="Euro 6, EPA Tier 3, etc."
            />
          </div>
        </div>
        
        {/* Características del motor */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.combustion?.turbo || false}
              onChange={(e) => handleChange('combustion', 'turbo', e.target.checked)}
              className="w-4 h-4 text-wise border-gray-300 rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-gray-700">Turbo</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.combustion?.supercharger || false}
              onChange={(e) => handleChange('combustion', 'supercharger', e.target.checked)}
              className="w-4 h-4 text-wise border-gray-300 rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-gray-700">Supercargador</span>
          </label>
          
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={specifications.combustion?.ecoMode || false}
              onChange={(e) => handleChange('combustion', 'ecoMode', e.target.checked)}
              className="w-4 h-4 text-wise border-gray-300 rounded focus:ring-wise"
            />
            <span className="text-sm font-medium text-gray-700">Modo ecológico</span>
          </label>
        </div>
      </div>
    </div>
  );
}
