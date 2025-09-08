'use client';

interface VehicleFeaturesFormProps {
  specifications: any;
  onSpecificationChange: (section: string, field: string, value: any) => void;
}

export function VehicleFeaturesForm({ 
  specifications, 
  onSpecificationChange 
}: VehicleFeaturesFormProps) {
  
  const handleChange = (section: string, field: string, value: any) => {
    onSpecificationChange(section, field, value);
  };

  const handleArrayChange = (section: string, field: string, value: string, checked: boolean) => {
    const currentArray = specifications[section]?.[field] || [];
    let newArray;
    
    if (checked) {
      newArray = [...currentArray, value];
    } else {
      newArray = currentArray.filter((item: string) => item !== value);
    }
    
    onSpecificationChange(section, field, newArray);
  };

  return (
    <div className="space-y-8">
      {/* SISTEMA DE FRENADO */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🛡️ Sistema de Frenado</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de frenos
            </label>
            <select
              value={specifications.safety?.brakeType || ''}
              onChange={(e) => handleChange('safety', 'brakeType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
            >
              <option value="">Seleccionar tipo</option>
              <option value="Disco">Disco</option>
              <option value="Tambor">Tambor</option>
              <option value="Mixto">Mixto</option>
            </select>
          </div>
        </div>

        {/* Sistema de frenado */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">Sistema de frenado</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['ABS', 'EBD', 'BA'].map((system) => (
              <label key={system} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={specifications.safety?.brakingSystem?.includes(system) || false}
                  onChange={(e) => handleArrayChange('safety', 'brakingSystem', system, e.target.checked)}
                  className="w-4 h-4 text-wise border-gray-300 rounded focus:ring-wise"
                />
                <span className="text-sm text-gray-700">{system}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* INTEGRACIÓN DE SMARTPHONE */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📱 Integración de Smartphone</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Integración con smartphone</label>
            <div className="space-y-2">
              {['CarPlay', 'Android Auto'].map((integration) => (
                <label key={integration} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={specifications.technology?.smartphoneIntegration?.includes(integration) || false}
                    onChange={(e) => handleArrayChange('technology', 'smartphoneIntegration', integration, e.target.checked)}
                    className="w-4 h-4 text-wise border-gray-300 rounded focus:ring-wise"
                  />
                  <span className="text-sm text-gray-700">{integration}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
