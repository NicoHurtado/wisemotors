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
            value={specifications.wisemetrics?.drivingFun || ''}
            onChange={(e) => handleChange('wisemetrics', 'drivingFun', e.target.value ? parseInt(e.target.value) : '')}
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
            value={specifications.wisemetrics?.technology || ''}
            onChange={(e) => handleChange('wisemetrics', 'technology', e.target.value ? parseInt(e.target.value) : '')}
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
            value={specifications.wisemetrics?.environmentalImpact || ''}
            onChange={(e) => handleChange('wisemetrics', 'environmentalImpact', e.target.value ? parseInt(e.target.value) : '')}
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
            value={specifications.wisemetrics?.reliability || ''}
            onChange={(e) => handleChange('wisemetrics', 'reliability', e.target.value ? parseInt(e.target.value) : '')}
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
            value={specifications.wisemetrics?.qualityPriceRatio || ''}
            onChange={(e) => handleChange('wisemetrics', 'qualityPriceRatio', e.target.value ? parseInt(e.target.value) : '')}
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
            value={specifications.wisemetrics?.comfort || ''}
            onChange={(e) => handleChange('wisemetrics', 'comfort', e.target.value ? parseInt(e.target.value) : '')}
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
            value={specifications.wisemetrics?.usability || ''}
            onChange={(e) => handleChange('wisemetrics', 'usability', e.target.value ? parseInt(e.target.value) : '')}
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
            value={specifications.wisemetrics?.efficiency || ''}
            onChange={(e) => handleChange('wisemetrics', 'efficiency', e.target.value ? parseInt(e.target.value) : '')}
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
            value={specifications.wisemetrics?.prestige || ''}
            onChange={(e) => handleChange('wisemetrics', 'prestige', e.target.value ? parseInt(e.target.value) : '')}
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
            value={specifications.wisemetrics?.interiorQuality || ''}
            onChange={(e) => handleChange('wisemetrics', 'interiorQuality', e.target.value ? parseInt(e.target.value) : '')}
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
