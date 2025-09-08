'use client';

interface WiseMetricsFormProps {
  specifications: any;
  onSpecificationChange: (section: string, field: string, value: any) => void;
}

export function WiseMetricsForm({ 
  specifications, 
  onSpecificationChange 
}: WiseMetricsFormProps) {
  
  const handleChange = (section: string, field: string, value: any) => {
    onSpecificationChange(section, field, value);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">⭐ WiseMetrics - Métricas de Evaluación</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Diversión al conducir (0-100)
          </label>
          <input
            type="number"
            value={specifications.wisemetrics?.drivingFun || 50}
            onChange={(e) => handleChange('wisemetrics', 'drivingFun', parseInt(e.target.value) || 50)}
            min="0"
            max="100"
            step="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tecnología/Conectividad (0-100)
          </label>
          <input
            type="number"
            value={specifications.wisemetrics?.technology || 50}
            onChange={(e) => handleChange('wisemetrics', 'technology', parseInt(e.target.value) || 50)}
            min="0"
            max="100"
            step="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Impacto ambiental (0-100)
          </label>
          <input
            type="number"
            value={specifications.wisemetrics?.environmentalImpact || 50}
            onChange={(e) => handleChange('wisemetrics', 'environmentalImpact', parseInt(e.target.value) || 50)}
            min="0"
            max="100"
            step="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fiabilidad (0-100)
          </label>
          <input
            type="number"
            value={specifications.wisemetrics?.reliability || 50}
            onChange={(e) => handleChange('wisemetrics', 'reliability', parseInt(e.target.value) || 50)}
            min="0"
            max="100"
            step="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Relación calidad-precio (0-100)
          </label>
          <input
            type="number"
            value={specifications.wisemetrics?.qualityPriceRatio || 50}
            onChange={(e) => handleChange('wisemetrics', 'qualityPriceRatio', parseInt(e.target.value) || 50)}
            min="0"
            max="100"
            step="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comodidad (0-100)
          </label>
          <input
            type="number"
            value={specifications.wisemetrics?.comfort || 50}
            onChange={(e) => handleChange('wisemetrics', 'comfort', parseInt(e.target.value) || 50)}
            min="0"
            max="100"
            step="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Usabilidad (0-100)
          </label>
          <input
            type="number"
            value={specifications.wisemetrics?.usability || 50}
            onChange={(e) => handleChange('wisemetrics', 'usability', parseInt(e.target.value) || 50)}
            min="0"
            max="100"
            step="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Eficiencia (0-100)
          </label>
          <input
            type="number"
            value={specifications.wisemetrics?.efficiency || 50}
            onChange={(e) => handleChange('wisemetrics', 'efficiency', parseInt(e.target.value) || 50)}
            min="0"
            max="100"
            step="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prestigio (0-100)
          </label>
          <input
            type="number"
            value={specifications.wisemetrics?.prestige || 50}
            onChange={(e) => handleChange('wisemetrics', 'prestige', parseInt(e.target.value) || 50)}
            min="0"
            max="100"
            step="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
          />
        </div>
        
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Calidad del interior (0-100)
          </label>
          <input
            type="number"
            value={specifications.wisemetrics?.interiorQuality || 50}
            onChange={(e) => handleChange('wisemetrics', 'interiorQuality', parseInt(e.target.value) || 50)}
            min="0"
            max="100"
            step="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}
