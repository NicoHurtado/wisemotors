// Sistema optimizado de comparación de vehículos
// Arquitectura: Precompute + Deterministic Analysis + LLM Rerank
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
import { computeVehicleFeatures, getMarketStats, generateVehicleTags } from './features';
import type { VehicleFeatures } from './features';
import { getValidImageUrl, createImagePlaceholder } from '@/lib/utils/imageUtils';

// Interfaces
export interface VehicleComparisonData {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  fuelType: string;
  type: string;
  specifications: any;
  features: VehicleFeatures;
  tags: string[];
  imageUrl: string;
}

export interface ComparisonCategory {
  name: string;
  weight: number;
  vehicles: Array<{
    vehicleId: string;
    score: number;
    value: number | string;
    explanation: string;
  }>;
}

export interface ComparisonAnalysis {
  categories: ComparisonCategory[];
  winner: {
    overall: string;
    byCategory: Record<string, string>;
  };
  summary: {
    vehicleId: string;
    pros: string[];
    cons: string[];
    recommendation: string;
    score: number;
  }[];
  keyDifferences?: string[];
}

export interface ProfileRecommendation {
  profile: string;
  vehicle: string;
  reason: string;
}

export interface OptimizedComparisonResult {
  analysis: ComparisonAnalysis;
  profileRecommendations: ProfileRecommendation[];
  meta: {
    processingTime: number;
    cacheHit: boolean;
    tokensUsed: number;
  };
}

// Cache persistente en memoria con validación de vehículos
const comparisonCache = new Map<string, {
  result: OptimizedComparisonResult;
  vehicleIds: string[];
  timestamp: number;
}>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hora - más tiempo para evitar regeneraciones innecesarias

// Función para limpiar cache expirado
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, cached] of Array.from(comparisonCache.entries())) {
    if (now - cached.timestamp > CACHE_TTL) {
      comparisonCache.delete(key);
      console.log(`🗑️ Cache CLEANED: Eliminada entrada expirada para vehículos [${cached.vehicleIds.join(', ')}]`);
    }
  }
}

// Función para limpiar cache específico por vehículos
export function clearComparisonCache(vehicleIds?: string[]) {
  if (vehicleIds) {
    const cacheKey = vehicleIds.sort().join('-');
    if (comparisonCache.has(cacheKey)) {
      comparisonCache.delete(cacheKey);
      console.log(`🗑️ Cache CLEARED: Eliminada entrada específica para vehículos [${vehicleIds.join(', ')}]`);
    }
  } else {
    comparisonCache.clear();
    console.log(`🗑️ Cache CLEARED: Eliminado todo el cache de comparaciones`);
  }
}

export async function getOptimizedComparison(
  vehicleIds: string[]
): Promise<OptimizedComparisonResult> {
  const startTime = Date.now();

  try {
    // 0. Limpiar cache expirado periódicamente
    if (Math.random() < 0.1) { // 10% de probabilidad de limpiar
      cleanExpiredCache();
    }

    // 0.1. Forzar limpieza de cache tras actualizaciones (versión 5.1 - ANTI-ESPEJO)
    const LOGIC_VERSION = '5.1'; // Prohibe efecto espejo con ejemplos explícitos
    const versionKey = `comparison_logic_version`;
    const currentVersion = comparisonCache.get(versionKey);

    if (!currentVersion || (currentVersion as any).version !== LOGIC_VERSION) {
      console.log(`🔄 Actualizando lógica de comparación a versión ${LOGIC_VERSION}`);
      clearComparisonCache(); // Limpiar todo el cache
      comparisonCache.set(versionKey, { version: LOGIC_VERSION, timestamp: Date.now() } as any);
    }

    // 1. Verificar cache con validación de vehículos
    const cacheKey = vehicleIds.sort().join('-');
    const cached = comparisonCache.get(cacheKey);

    if (cached &&
      (Date.now() - cached.timestamp < CACHE_TTL) &&
      JSON.stringify(cached.vehicleIds.sort()) === JSON.stringify(vehicleIds.sort())) {

      console.log(`🎯 Cache HIT: Comparación encontrada para vehículos [${vehicleIds.join(', ')}]`);
      return {
        ...cached.result,
        meta: {
          ...cached.result.meta,
          cacheHit: true,
          processingTime: Date.now() - startTime
        }
      };
    }

    console.log(`🔄 Cache MISS: Generando nueva comparación para vehículos [${vehicleIds.join(', ')}]`);

    // 2. Obtener datos y precomputar features
    const vehicles = await getVehiclesWithFeatures(vehicleIds);

    if (vehicles.length === 0) {
      throw new Error('No vehicles found for comparison');
    }

    // 3. Análisis 100% con IA (eliminar sistema determinístico)
    const { analysis, profileRecommendations, tokensUsed } = await generatePureAIComparison(vehicles);

    const result: OptimizedComparisonResult = {
      analysis,
      profileRecommendations,
      meta: {
        processingTime: Date.now() - startTime,
        cacheHit: false,
        tokensUsed
      }
    };

    // Guardar en cache con metadatos
    comparisonCache.set(cacheKey, {
      result,
      vehicleIds: [...vehicleIds], // Copia para validación
      timestamp: Date.now()
    });

    console.log(`💾 Cache SAVED: Comparación guardada para vehículos [${vehicleIds.join(', ')}]`);

    return result;

  } catch (error) {
    console.error('Error in getOptimizedComparison:', error);

    // Fallback completo: análisis determinístico sin LLM
    try {
      const vehicles = await getVehiclesWithFeatures(vehicleIds);
      const deterministicAnalysis = generateDeterministicComparison(vehicles);

      return {
        analysis: deterministicAnalysis,
        profileRecommendations: generateFallbackProfileRecommendations(vehicles),
        meta: {
          processingTime: Date.now() - startTime,
          cacheHit: false,
          tokensUsed: 0
        }
      };
    } catch (fallbackError) {
      console.error('Error in fallback comparison:', fallbackError);
      throw new Error('Failed to generate vehicle comparison');
    }
  }
}

// Paso 1: Obtener vehículos con features precomputadas
async function getVehiclesWithFeatures(vehicleIds: string[]): Promise<VehicleComparisonData[]> {
  const vehicles = await prisma.vehicle.findMany({
    where: { id: { in: vehicleIds } },
    include: { images: true }
  });

  const marketStats = await getMarketStats();

  return vehicles.map(vehicle => {
    const features = computeVehicleFeatures(vehicle, marketStats);
    const tags = generateVehicleTags(vehicle, features);

    // Obtener imagen válida
    const rawImageUrl = vehicle.images?.[0]?.url || null;
    const validImageUrl = getValidImageUrl(rawImageUrl);
    const finalImageUrl = validImageUrl || createImagePlaceholder(vehicle.brand, vehicle.model);

    return {
      id: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      price: vehicle.price,
      fuelType: vehicle.fuelType,
      type: vehicle.type,
      specifications: vehicle.specifications,
      features,
      tags,
      imageUrl: finalImageUrl
    };
  });
}

// Nueva función: Análisis 100% con IA usando datos reales
async function generatePureAIComparison(vehicles: VehicleComparisonData[]): Promise<{
  analysis: ComparisonAnalysis,
  profileRecommendations: ProfileRecommendation[],
  tokensUsed: number
}> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Fallback simple sin rankings complicados
    return generateSimpleFallback(vehicles);
  }

  // Crear payload compacto - SOLO CAMPOS CON DATOS REALES (sin N/A)
  const vehicleData = vehicles.map(vehicle => {
    const specs = vehicle.specifications ? JSON.parse(vehicle.specifications) : {};
    const priceMillions = Math.round(vehicle.price / 1000000);

    // Extraer características adicionales para un análisis más rico
    const safetyFeatures = [
      specs.safety?.stabilityControl ? 'Control de estabilidad' : null,
      specs.safety?.tractionControl ? 'Control de tracción' : null,
      specs.safety?.brakeAssist ? 'Asistente de frenado' : null,
      specs.safety?.isofix ? 'Anclajes ISOFIX' : null
    ].filter(Boolean).slice(0, 3);

    const techFeatures = [
      specs.technology?.touchscreen ? `Pantalla ${specs.technology.touchscreenSize || ''}` : null,
      specs.technology?.appleCarplay ? 'Apple CarPlay' : null,
      specs.technology?.androidAuto ? 'Android Auto' : null,
      specs.technology?.wirelessCharging ? 'Carga inalámbrica' : null,
      specs.comfort?.keylessEntry ? 'Llave inteligente' : null
    ].filter(Boolean).slice(0, 3);

    // Construir array de características SOLO con datos reales
    const dataPoints: string[] = [];
    dataPoints.push(`💰 Precio: $${priceMillions}M`);
    dataPoints.push(`🏎️ Tipo: ${vehicle.type} | Combustible: ${vehicle.fuelType}`);

    const power = specs.performance?.maxPower || specs.combustion?.maxPower;
    const torque = specs.performance?.maxTorque || specs.combustion?.maxTorque;
    if (power) dataPoints.push(`⚡ Potencia: ${power}hp${torque ? ` / ${torque}Nm` : ''}`);

    const acceleration = specs.performance?.acceleration0to100;
    if (acceleration) dataPoints.push(`🏁 0-100km/h: ${acceleration}s`);

    const consumption = specs.combustion?.cityConsumption || specs.hybrid?.cityConsumption;
    if (consumption) dataPoints.push(`⛽ Consumo: ${consumption}L/100km`);

    const trunk = specs.dimensions?.cargoVolume || specs.dimensions?.trunkCapacity;
    const groundClearance = specs.chassis?.groundClearance;
    if (trunk || groundClearance) {
      let dimStr = '📦';
      if (trunk) dimStr += ` Baúl: ${trunk}L`;
      if (groundClearance) dimStr += ` | Altura: ${groundClearance}mm`;
      dataPoints.push(dimStr);
    }

    const airbags = specs.safety?.airbags;
    if (airbags && airbags >= 6) dataPoints.push(`🛡️ Airbags: ${airbags}`);

    if (safetyFeatures.length > 0) dataPoints.push(`✅ Seguridad: ${safetyFeatures.join(', ')}`);
    if (techFeatures.length > 0) dataPoints.push(`📱 Tech: ${techFeatures.join(', ')}`);

    const electricRange = specs.electric?.electricRange;
    if (electricRange) dataPoints.push(`🔋 Autonomía: ${electricRange}km`);

    return {
      id: vehicle.id,
      name: `${vehicle.brand} ${vehicle.model}`,
      year: vehicle.year,
      dataPoints
    };
  });

  const systemPrompt = `Eres el consultor automotriz más experto de Colombia.

REGLA #1 - PROHIBIDO EL EFECTO ESPEJO:
❌ INCORRECTO (Espejo):
   - Vehículo A PRO: "Aceleración rápida de 6.5s"
   - Vehículo B CON: "Aceleración más lenta de 9.6s"

✅ CORRECTO (Diverso):
   - Vehículo A PRO: "Aceleración rápida de 6.5s"  
   - Vehículo B CON: "Precio elevado de $280M" (métrica DIFERENTE)

Si mencionas un atributo (ej: aceleración) como PRO de un vehículo, NO puedes usar ese mismo atributo como CON de otro.

OTRAS REGLAS:
- Genera EXACTAMENTE 3 pros y 3 cons por vehículo.
- Usa cifras reales: "$250M", "177mm", "6.5s".
- NO menciones datos faltantes. Si no hay info, busca otro punto.
- Scores: 0-100 reflejando calidad-precio.`;

  const userPrompt = `COMPARA ESTOS VEHÍCULOS (recuerda: SIN EFECTO ESPEJO):

${vehicleData.map(v => `
🚗 ${v.name} (${v.year}) - ID: ${v.id}
${v.dataPoints.join('\n   ')}
`).join('\n')}

IMPORTANTE: 
- USA LOS IDs EXACTOS: ${vehicleData.map(v => v.id).join(', ')}
- Cada ventaja/desventaja debe usar una MÉTRICA DIFERENTE.
- Si usas "aceleración" para uno, NO la uses para el otro.


Responde EXACTAMENTE en este formato JSON (sin texto adicional):
{
  "vehicles": [
    {
      "id": "${vehicleData[0]?.id}",
      "pros": ["Ventaja específica con números", "Segunda ventaja", "Tercera ventaja"],
      "cons": ["Desventaja específica con números", "Segunda desventaja", "Tercera desventaja"],
      "recommendation": "Ideal para [tipo de usuario] por [razón específica con números]",
      "score": 85
    },
    {
      "id": "${vehicleData[1]?.id}",
      "pros": ["Ventaja específica con números", "Segunda ventaja", "Tercera ventaja"],
      "cons": ["Desventaja específica con números", "Segunda desventaja", "Tercera desventaja"],
      "recommendation": "Perfecto para [tipo de usuario] por [razón específica con números]",
      "score": 92
    }
  ],
  "keyDifferences": [
    "Cada uno de estos vehículos tiene una personalidad muy definida: mientras que el [Vehículo A] se destaca por su enfoque hacia [característica principal], el [Vehículo B] toma un camino completamente diferente priorizando [otra característica]. Si lo que buscas es [situación específica], claramente el [Vehículo A] será tu mejor aliado, pero si tus necesidades van más hacia [situación diferente], el [Vehículo B] te va a dar exactamente lo que necesitas.",
    "La diferencia más notable entre estos modelos radica en [aspecto clave fundamental]. El [Vehículo A] ofrece una experiencia que se centra en [ventaja específica], algo que realmente marca la diferencia cuando [contexto de uso]. Por otro lado, el [Vehículo B] ha sido diseñado pensando en [ventaja diferente], lo que lo convierte en la opción ideal para quienes [otro contexto de uso].",
    "Para el día a día, la elección entre estos vehículos depende mucho de tu estilo de vida. Si eres de los que [tipo de uso/persona], definitivamente vas a aprovechar mejor lo que ofrece el [Vehículo A]. Pero si tu rutina es más [otro tipo de uso], el [Vehículo B] se adapta perfectamente a lo que necesitas, especialmente por [razón específica]."
  ],
  "profiles": [
    {
      "name": "[Categoría más apropiada: Performance/Familiar/Económico/Tecnología/Lujo]",
      "vehicle": "${vehicleData[0]?.id}",
      "reason": "Razón específica por qué este vehículo es el mejor en esta categoría"
    },
    {
      "name": "[Categoría más apropiada: Performance/Familiar/Económico/Tecnología/Lujo]", 
      "vehicle": "${vehicleData[1]?.id}",
      "reason": "Razón específica por qué este vehículo es el mejor en esta categoría"
    }${vehicleData.length > 2 ? `,
    {
      "name": "[Categoría más apropiada: Performance/Familiar/Económico/Tecnología/Lujo]",
      "vehicle": "${vehicleData[2]?.id}",
      "reason": "Razón específica por qué este vehículo es el mejor en esta categoría"
    }` : ''}${vehicleData.length > 3 ? `,
    {
      "name": "[Categoría más apropiada: Performance/Familiar/Económico/Tecnología/Lujo]",
      "vehicle": "${vehicleData[3]?.id}",
      "reason": "Razón específica por qué este vehículo es el mejor en esta categoría"
    }` : ''}${vehicleData.length > 4 ? `,
    {
      "name": "[Categoría más apropiada: Performance/Familiar/Económico/Tecnología/Lujo]",
      "vehicle": "${vehicleData[4]?.id}",
      "reason": "Razón específica por qué este vehículo es el mejor en esta categoría"
    }` : ''}
  ]
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log('🤖 Respuesta cruda de IA:', content);

    let result;
    try {
      result = JSON.parse(content);
      console.log('✅ JSON parseado exitosamente:', result);
    } catch (parseError) {
      console.error('❌ Error parsing JSON de IA:', parseError);
      console.log('📄 Contenido que falló:', content);
      throw new Error('IA devolvió JSON inválido');
    }

    // Validar estructura de respuesta
    if (!result.vehicles || !Array.isArray(result.vehicles)) {
      console.error('❌ Estructura inválida - no hay vehicles array:', result);
      throw new Error('IA devolvió estructura inválida');
    }

    console.log('🔍 Vehicles encontrados:', result.vehicles.length);
    result.vehicles.forEach((v: any, i: number) => {
      console.log(`  Vehicle ${i + 1}:`, {
        id: v.id,
        prosCount: v.pros?.length || 0,
        consCount: v.cons?.length || 0,
        hasRecommendation: !!v.recommendation,
        score: v.score
      });
    });

    // Transformar al formato esperado
    const analysis: ComparisonAnalysis = {
      categories: [], // No necesitamos categorías con IA
      winner: {
        overall: result.vehicles[0]?.id || '',
        byCategory: {}
      },
      summary: result.vehicles.map((v: any) => ({
        vehicleId: v.id,
        pros: v.pros || [],
        cons: v.cons || [],
        recommendation: v.recommendation || 'Análisis en proceso',
        score: typeof v.score === 'number' ? v.score / 100 : 0.75
      })),
      keyDifferences: result.keyDifferences || []
    };

    console.log('📊 Analysis generado:', {
      summaryCount: analysis.summary.length,
      winner: analysis.winner.overall,
      keyDifferencesCount: analysis.keyDifferences?.length || 0,
      keyDifferences: analysis.keyDifferences || []
    });

    const profileRecommendations: ProfileRecommendation[] = result.profiles.map((p: any) => ({
      profile: p.name,
      vehicle: p.vehicle,
      reason: p.reason
    }));

    return {
      analysis,
      profileRecommendations,
      tokensUsed: data.usage?.total_tokens || 0
    };

  } catch (error) {
    console.error('Error en IA pura:', error);
    return generateSimpleFallback(vehicles);
  }
}

// Fallback simple sin IA
function generateSimpleFallback(vehicles: VehicleComparisonData[]): {
  analysis: ComparisonAnalysis,
  profileRecommendations: ProfileRecommendation[],
  tokensUsed: number
} {
  const summary = vehicles.map(vehicle => {
    const specs = vehicle.specifications ? JSON.parse(vehicle.specifications) : {};
    const priceMillions = Math.round(vehicle.price / 1000000);
    const power = specs.performance?.maxPower || specs.combustion?.maxPower;
    const consumption = specs.combustion?.cityConsumption || specs.hybrid?.cityConsumption;

    // Generar ventajas simples basadas en datos reales
    const pros: string[] = [];
    if (power > 400) pros.push(`Alta potencia: ${power}hp para rendimiento superior`);
    if (vehicle.year >= 2020) pros.push(`Modelo reciente: ${vehicle.year} con tecnología actual`);
    if (vehicle.price < 200000000) pros.push(`Precio competitivo: $${priceMillions}M en su categoría`);

    // Generar desventajas simples
    const cons: string[] = [];
    if (vehicle.price > 400000000) cons.push(`Precio muy alto: $${priceMillions}M, inversión considerable`);
    if (consumption && typeof consumption === 'number' && consumption > 12) cons.push(`Alto consumo: ${consumption}L/100km en ciudad`);
    if (vehicle.year && vehicle.year < 2018) cons.push(`Modelo anterior: ${vehicle.year}, tecnología menos actual`);

    // Asegurar al menos 2 ventajas
    if (pros.length < 2) {
      pros.push(`${vehicle.type} ${vehicle.fuelType}: configuración versátil`);
    }
    if (pros.length < 2) {
      pros.push(`Marca confiable: ${vehicle.brand} con reputación establecida`);
    }

    // Asegurar al menos 1 desventaja
    if (cons.length === 0) {
      cons.push(`Características específicas: puede no adaptarse a todos los usos`);
    }

    return {
      vehicleId: vehicle.id,
      pros: pros.slice(0, 3),
      cons: cons.slice(0, 3),
      recommendation: `Recomendado para quienes buscan un ${vehicle.type.toLowerCase()} ${vehicle.fuelType.toLowerCase()} con ${power ? `${power}hp` : 'características balanceadas'}`,
      score: 0.75 // Score neutro
    };
  });

  return {
    analysis: {
      categories: [],
      winner: { overall: vehicles[0]?.id || '', byCategory: {} },
      summary
    },
    profileRecommendations: [
      { profile: 'General', vehicle: vehicles[0]?.id || '', reason: 'Opción equilibrada para diversos usos' }
    ],
    tokensUsed: 0
  };
}

// Paso 2: Análisis determinístico basado en features (DEPRECATED - mantener para fallback)
function generateDeterministicComparison(vehicles: VehicleComparisonData[]): ComparisonAnalysis {
  const categories: ComparisonCategory[] = [
    generatePerformanceCategory(vehicles),
    generateEfficiencyCategory(vehicles),
    generateSafetyCategory(vehicles),
    generateComfortCategory(vehicles),
    generateTechnologyCategory(vehicles),
    generateValueCategory(vehicles)
  ];

  // Calcular ganadores por categoría
  const byCategory: Record<string, string> = {};
  categories.forEach(category => {
    const winner = category.vehicles.reduce((best, current) =>
      current.score > best.score ? current : best
    );
    byCategory[category.name] = winner.vehicleId;
  });

  // Calcular ganador general (promedio ponderado)
  const overallScores = vehicles.map(vehicle => {
    const totalScore = categories.reduce((sum, category) => {
      const vehicleScore = category.vehicles.find(v => v.vehicleId === vehicle.id)?.score || 0;
      return sum + (vehicleScore * category.weight);
    }, 0);

    return { vehicleId: vehicle.id, score: totalScore };
  });

  const overallWinner = overallScores.reduce((best, current) =>
    current.score > best.score ? current : best
  );

  // Generar resúmenes básicos con comparaciones inteligentes y únicas
  const summary = generateSmartComparison(vehicles, overallScores);

  return {
    categories,
    winner: {
      overall: overallWinner.vehicleId,
      byCategory
    },
    summary
  };
}

// Funciones auxiliares para categorías
function generatePerformanceCategory(vehicles: VehicleComparisonData[]): ComparisonCategory {
  return {
    name: 'Rendimiento',
    weight: 0.25,
    vehicles: vehicles.map(vehicle => ({
      vehicleId: vehicle.id,
      score: vehicle.features.performance_score,
      value: `${Math.round(vehicle.features.power_to_weight_norm * 100)}hp/ton`,
      explanation: `Potencia/peso optimizada para ${vehicle.fuelType.toLowerCase()}`
    }))
  };
}

function generateEfficiencyCategory(vehicles: VehicleComparisonData[]): ComparisonCategory {
  return {
    name: 'Eficiencia',
    weight: 0.20,
    vehicles: vehicles.map(vehicle => ({
      vehicleId: vehicle.id,
      score: vehicle.features.efficiency_score,
      value: vehicle.fuelType === 'Eléctrico' ?
        `${Math.round(vehicle.features.electric_range)}km` :
        `${Math.round(100 - vehicle.features.consumption_score * 100)}%`,
      explanation: `Optimizado para ${vehicle.features.usage_urban > 0.7 ? 'ciudad' : 'carretera'}`
    }))
  };
}

function generateSafetyCategory(vehicles: VehicleComparisonData[]): ComparisonCategory {
  return {
    name: 'Seguridad',
    weight: 0.20,
    vehicles: vehicles.map(vehicle => ({
      vehicleId: vehicle.id,
      score: vehicle.features.safety_score,
      value: `${Math.round(vehicle.features.safety_score * 100)}%`,
      explanation: 'Basado en sistemas de seguridad activa y pasiva'
    }))
  };
}

function generateComfortCategory(vehicles: VehicleComparisonData[]): ComparisonCategory {
  return {
    name: 'Confort',
    weight: 0.15,
    vehicles: vehicles.map(vehicle => ({
      vehicleId: vehicle.id,
      score: vehicle.features.comfort_score,
      value: `${Math.round(vehicle.features.comfort_score * 100)}%`,
      explanation: 'Equipamiento y características de confort'
    }))
  };
}

function generateTechnologyCategory(vehicles: VehicleComparisonData[]): ComparisonCategory {
  return {
    name: 'Tecnología',
    weight: 0.10,
    vehicles: vehicles.map(vehicle => ({
      vehicleId: vehicle.id,
      score: vehicle.features.tech_score,
      value: `${Math.round(vehicle.features.tech_score * 100)}%`,
      explanation: 'Conectividad y sistemas inteligentes'
    }))
  };
}

function generateValueCategory(vehicles: VehicleComparisonData[]): ComparisonCategory {
  return {
    name: 'Valor',
    weight: 0.10,
    vehicles: vehicles.map(vehicle => ({
      vehicleId: vehicle.id,
      score: vehicle.features.value_score,
      value: `${Math.round(vehicle.features.value_score * 100)}%`,
      explanation: 'Relación calidad-precio en el mercado'
    }))
  };
}

// Paso 3: Mejora con LLM (contexto ultracompacto)
async function enhanceWithLLM(
  vehicles: VehicleComparisonData[],
  deterministicAnalysis: ComparisonAnalysis
): Promise<{ analysis: ComparisonAnalysis, profileRecommendations: ProfileRecommendation[], tokensUsed: number }> {

  // Crear payload mínimo
  const compactVehicles = vehicles.map(v => ({
    id: v.id,
    name: `${v.brand} ${v.model}`,
    year: v.year,
    price: v.price,
    fuel: v.fuelType,
    type: v.type,
    brand: v.brand, // Prestigio de marca
    scores: {
      performance: Math.round(v.features.performance_score * 100),
      efficiency: Math.round(v.features.efficiency_score * 100),
      safety: Math.round(v.features.safety_score * 100),
      comfort: Math.round(v.features.comfort_score * 100),
      tech: Math.round(v.features.tech_score * 100),
      value: Math.round(v.features.value_score * 100)
    },
    tags: v.tags.slice(0, 5), // Más tags para más contexto
    // Aspectos adicionales para análisis más rico
    priceRange: v.price > 500000000 ? 'ultra-lujo' : v.price > 300000000 ? 'lujo' : v.price > 200000000 ? 'premium' : v.price > 100000000 ? 'medio' : 'accesible',
    isRecent: v.year >= 2022,
    isLuxuryBrand: ['Mercedes', 'BMW', 'Audi', 'Porsche', 'Ferrari', 'Lamborghini', 'Maserati', 'Jaguar', 'Land Rover', 'Volvo', 'Lexus', 'Acura', 'Infiniti', 'Genesis', 'Tesla'].includes(v.brand),
    isSportsCar: ['Deportivo', 'Convertible'].includes(v.type),
    isFamilyOriented: ['SUV', 'Sedán', 'Wagon'].includes(v.type),
    isEcoFriendly: ['Eléctrico', 'Híbrido', 'Híbrido Enchufable'].includes(v.fuelType)
  }));

  const prompt = `Eres un experto automotriz colombiano. Analiza esta comparación de vehículos y genera análisis COMPARATIVOS detallados:

VEHÍCULOS: ${JSON.stringify(compactVehicles)}

GANADOR GENERAL: ${deterministicAnalysis.winner.overall}

INSTRUCCIONES CRÍTICAS:
1. Los pros/cons deben ser COMPARATIVOS: "Mayor potencia que X vehículos", "Precio más alto que Y vehículos"
2. NO inventes cálculos de costos anuales irreales
3. Compara cada vehículo CONTRA los otros en la lista
4. Usa datos reales de las especificaciones
5. Sé específico: "510hp vs 2 vehículos con menos potencia" no "potencia alta"
6. EXPLORA TODAS LAS FACETAS: rendimiento, diseño, tecnología, confort, seguridad, prestigio, experiencia de conducción
7. Si un dato no está disponible, NO digas "no especificado" - enfócate en otras características relevantes
8. Varía los temas: no todo es consumo y precio - habla de estilo, deportividad, lujo, practicidad, innovación

Responde en JSON:
{
  "enhanced_summaries": [
    {
      "vehicleId": "id",
      "pros": ["Diseño más deportivo que los otros dos modelos", "Tecnología de conducción autónoma superior", "Experiencia de manejo más emocionante que sus competidores"],
      "cons": ["Espacio trasero menor comparado con el rival familiar", "Mantenimiento más costoso que las opciones económicas", "Menor altura al suelo que los vehículos todoterreno"],
      "recommendation": "Ideal para entusiastas que priorizan experiencia de conducción sobre practicidad familiar"
    }
  ],
  "profile_recommendations": [
    {
      "profile": "Familiar",
      "vehicle": "Marca Modelo",
      "reason": "Por qué es mejor para familias vs los otros vehículos"
    },
    {
      "profile": "Performance",
      "vehicle": "Marca Modelo", 
      "reason": "Por qué es mejor para entusiastas vs los otros vehículos"
    },
    {
      "profile": "Económico",
      "vehicle": "Marca Modelo",
      "reason": "Por qué es mejor para economía vs los otros vehículos"
    },
    {
      "profile": "Tecnología",
      "vehicle": "Marca Modelo",
      "reason": "Por qué es mejor para tecnología vs los otros vehículos"
    }
  ]
}`;

  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OPENAI_API_KEY no configurada, usando análisis determinístico');
      throw new Error('OpenAI API key not configured');
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Modelo más económico
      messages: [
        {
          role: "system",
          content: "Eres un experto automotriz colombiano. Genera análisis específicos, concisos y basados en datos reales. Usa números concretos y contexto local."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2, // Más determinístico para consistencia
      max_tokens: 800, // Límite más estricto para reducir costos
      top_p: 0.9, // Control de diversidad
      frequency_penalty: 0.1, // Evitar repeticiones
      presence_penalty: 0.1 // Fomentar variedad
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const result = JSON.parse(content);

    // Combinar análisis determinístico con mejoras del LLM
    const enhancedAnalysis = {
      ...deterministicAnalysis,
      summary: deterministicAnalysis.summary.map(summary => {
        const enhanced = result.enhanced_summaries?.find(
          (e: any) => e.vehicleId === summary.vehicleId
        );

        return enhanced ? {
          ...summary,
          pros: enhanced.pros || summary.pros,
          cons: enhanced.cons || summary.cons,
          recommendation: enhanced.recommendation || summary.recommendation
        } : summary;
      })
    };

    return {
      analysis: enhancedAnalysis,
      profileRecommendations: result.profile_recommendations || [],
      tokensUsed: response.usage?.total_tokens || 0
    };

  } catch (error) {
    console.error('Error enhancing with LLM:', error);

    // Fallback: devolver análisis determinístico
    return {
      analysis: deterministicAnalysis,
      profileRecommendations: generateFallbackProfileRecommendations(vehicles),
      tokensUsed: 0
    };
  }
}

// Función principal para generar comparación inteligente y única
function generateSmartComparison(vehicles: VehicleComparisonData[], overallScores: Array<{ vehicleId: string, score: number }>): Array<{
  vehicleId: string;
  pros: string[];
  cons: string[];
  recommendation: string;
  score: number;
}> {
  // 1. Análisis global de todos los vehículos
  const globalAnalysis = analyzeGlobalVehicleData(vehicles);

  // 2. Generar ranking de características
  const rankings = generateCharacteristicRankings(vehicles, globalAnalysis);

  // 3. Asignar ventajas/desventajas únicas a cada vehículo
  const vehicleAnalysis = vehicles.map(vehicle => {
    const vehicleRankings = rankings[vehicle.id];
    const pros = generateUniquePros(vehicle, vehicleRankings, globalAnalysis);
    const cons = generateUniqueCons(vehicle, vehicleRankings, globalAnalysis);

    return {
      vehicleId: vehicle.id,
      pros,
      cons,
      recommendation: generateBasicRecommendation(vehicle),
      score: overallScores.find(s => s.vehicleId === vehicle.id)?.score || 0
    };
  });

  return vehicleAnalysis;
}

// Análisis global de todos los vehículos
function analyzeGlobalVehicleData(vehicles: VehicleComparisonData[]): {
  priceRange: { min: number; max: number; avg: number };
  powerRange: { min: number; max: number; avg: number };
  consumptionRange: { min: number; max: number; avg: number };
  airbagsRange: { min: number; max: number; avg: number };
  yearRange: { min: number; max: number; avg: number };
  fuelTypes: string[];
  vehicleTypes: string[];
} {
  const prices = vehicles.map(v => v.price);
  const powers = vehicles.map(v => {
    const specs = v.specifications ? JSON.parse(v.specifications) : {};
    return specs.performance?.maxPower || specs.combustion?.maxPower || 0;
  }).filter(p => p > 0);

  const consumptions = vehicles.map(v => {
    const specs = v.specifications ? JSON.parse(v.specifications) : {};
    return specs.combustion?.cityConsumption || specs.hybrid?.cityConsumption || 0;
  }).filter(c => c > 0);

  const airbags = vehicles.map(v => {
    const specs = v.specifications ? JSON.parse(v.specifications) : {};
    return specs.safety?.airbags || 0;
  }).filter(a => a > 0);

  const years = vehicles.map(v => v.year);
  const fuelTypes = Array.from(new Set(vehicles.map(v => v.fuelType)));
  const vehicleTypes = Array.from(new Set(vehicles.map(v => v.type)));

  return {
    priceRange: {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((a, b) => a + b, 0) / prices.length
    },
    powerRange: powers.length > 0 ? {
      min: Math.min(...powers),
      max: Math.max(...powers),
      avg: powers.reduce((a, b) => a + b, 0) / powers.length
    } : { min: 0, max: 0, avg: 0 },
    consumptionRange: consumptions.length > 0 ? {
      min: Math.min(...consumptions),
      max: Math.max(...consumptions),
      avg: consumptions.reduce((a, b) => a + b, 0) / consumptions.length
    } : { min: 0, max: 0, avg: 0 },
    airbagsRange: airbags.length > 0 ? {
      min: Math.min(...airbags),
      max: Math.max(...airbags),
      avg: airbags.reduce((a, b) => a + b, 0) / airbags.length
    } : { min: 0, max: 0, avg: 0 },
    yearRange: {
      min: Math.min(...years),
      max: Math.max(...years),
      avg: years.reduce((a, b) => a + b, 0) / years.length
    },
    fuelTypes,
    vehicleTypes
  };
}

// Generar rankings de características para cada vehículo
function generateCharacteristicRankings(vehicles: VehicleComparisonData[], globalAnalysis: any): Record<string, {
  price: number; // 1 = más barato, vehicles.length = más caro
  power: number; // 1 = más potente, vehicles.length = menos potente
  efficiency: number; // 1 = más eficiente, vehicles.length = menos eficiente
  safety: number; // 1 = más seguro, vehicles.length = menos seguro
  year: number; // 1 = más nuevo, vehicles.length = más viejo
  uniqueness: number; // 1 = más único, vehicles.length = más común
}> {
  const rankings: Record<string, any> = {};

  // Ranking por precio (ascendente - más barato = mejor ranking)
  const priceSorted = [...vehicles].sort((a, b) => a.price - b.price);
  priceSorted.forEach((vehicle, index) => {
    if (!rankings[vehicle.id]) rankings[vehicle.id] = {};
    rankings[vehicle.id].price = index + 1;
  });

  // Ranking por potencia (descendente - más potente = mejor ranking)
  const powerSorted = [...vehicles].sort((a, b) => {
    const aPower = a.specifications ? JSON.parse(a.specifications) : {};
    const bPower = b.specifications ? JSON.parse(b.specifications) : {};
    const aPowerValue = aPower.performance?.maxPower || aPower.combustion?.maxPower || 0;
    const bPowerValue = bPower.performance?.maxPower || bPower.combustion?.maxPower || 0;
    return bPowerValue - aPowerValue;
  });
  powerSorted.forEach((vehicle, index) => {
    if (!rankings[vehicle.id]) rankings[vehicle.id] = {};
    rankings[vehicle.id].power = index + 1;
  });

  // Ranking por eficiencia (ascendente - menos consumo = mejor ranking)
  const efficiencySorted = [...vehicles].sort((a, b) => {
    const aConsumption = a.specifications ? JSON.parse(a.specifications) : {};
    const bConsumption = b.specifications ? JSON.parse(b.specifications) : {};
    const aConsumptionValue = aConsumption.combustion?.cityConsumption || aConsumption.hybrid?.cityConsumption || 999;
    const bConsumptionValue = bConsumption.combustion?.cityConsumption || bConsumption.hybrid?.cityConsumption || 999;
    return aConsumptionValue - bConsumptionValue;
  });
  efficiencySorted.forEach((vehicle, index) => {
    if (!rankings[vehicle.id]) rankings[vehicle.id] = {};
    rankings[vehicle.id].efficiency = index + 1;
  });

  // Ranking por seguridad (descendente - más airbags = mejor ranking)
  const safetySorted = [...vehicles].sort((a, b) => {
    const aSafety = a.specifications ? JSON.parse(a.specifications) : {};
    const bSafety = b.specifications ? JSON.parse(b.specifications) : {};
    const aAirbags = aSafety.safety?.airbags || 0;
    const bAirbags = bSafety.safety?.airbags || 0;
    return bAirbags - aAirbags;
  });
  safetySorted.forEach((vehicle, index) => {
    if (!rankings[vehicle.id]) rankings[vehicle.id] = {};
    rankings[vehicle.id].safety = index + 1;
  });

  // Ranking por año (descendente - más nuevo = mejor ranking)
  const yearSorted = [...vehicles].sort((a, b) => b.year - a.year);
  yearSorted.forEach((vehicle, index) => {
    if (!rankings[vehicle.id]) rankings[vehicle.id] = {};
    rankings[vehicle.id].year = index + 1;
  });

  // Ranking por unicidad (combinación de características únicas)
  vehicles.forEach(vehicle => {
    if (!rankings[vehicle.id]) rankings[vehicle.id] = {};

    let uniquenessScore = 0;
    const specs = vehicle.specifications ? JSON.parse(vehicle.specifications) : {};

    // Único por tipo de combustible
    const sameFuelType = vehicles.filter(v => v.fuelType === vehicle.fuelType).length;
    if (sameFuelType === 1) uniquenessScore += 3;

    // Único por tipo de vehículo
    const sameVehicleType = vehicles.filter(v => v.type === vehicle.type).length;
    if (sameVehicleType === 1) uniquenessScore += 2;

    // Único por características especiales
    if (vehicle.fuelType === 'Eléctrico') uniquenessScore += 2;
    if (specs.performance?.allWheelDrive) uniquenessScore += 1;
    if (specs.technology?.headUpDisplay) uniquenessScore += 1;

    rankings[vehicle.id].uniqueness = uniquenessScore;
  });

  // Convertir unicidad a ranking (más único = mejor ranking)
  const uniquenessSorted = [...vehicles].sort((a, b) => rankings[b.id].uniqueness - rankings[a.id].uniqueness);
  uniquenessSorted.forEach((vehicle, index) => {
    rankings[vehicle.id].uniqueness = index + 1;
  });

  return rankings;
}

// Generar ventajas únicas basadas en rankings
function generateUniquePros(vehicle: VehicleComparisonData, rankings: any, globalAnalysis: any): string[] {
  const pros: string[] = [];
  const specs = vehicle.specifications ? JSON.parse(vehicle.specifications) : {};
  const priceMillions = Math.round(vehicle.price / 1000000);

  const totalVehicles = Object.keys(rankings).length;

  // Ventaja de precio (SOLO para vehículos realmente accesibles o competitivos)
  if (rankings.price <= Math.ceil(totalVehicles / 2)) {
    // SOLO mencionar precio como ventaja si realmente es accesible
    if (vehicle.price < 100000000) { // Menos de 100M - realmente accesible
      pros.push(`Precio accesible: $${priceMillions}M, ${rankings.price === 1 ? 'el más económico' : 'uno de los más baratos'} de la comparación`);
    } else if (vehicle.price < 200000000) { // Entre 100M y 200M - competitivo
      pros.push(`Precio competitivo: $${priceMillions}M, ${rankings.price === 1 ? 'el más económico' : 'mejor precio'} en esta categoría premium`);
    }
    // NO mencionar precio como ventaja para vehículos de más de $200M
  }

  // Ventaja de potencia (top 3 más potentes o mejor que promedio)
  if (rankings.power <= Math.ceil(totalVehicles / 2)) {
    const power = specs.performance?.maxPower || specs.combustion?.maxPower;
    if (power) {
      pros.push(`Buena potencia: ${power}hp, ${rankings.power === 1 ? 'el más potente' : 'uno de los más potentes'} de la comparación`);
    }
  }

  // Ventaja de eficiencia (SOLO si realmente es eficiente)
  if (rankings.efficiency <= Math.ceil(totalVehicles / 2)) {
    const consumption = specs.combustion?.cityConsumption || specs.hybrid?.cityConsumption;
    if (consumption && consumption < 8.0) { // Solo si consume menos de 8L/100km
      pros.push(`Eficiencia destacada: ${consumption}L/100km, ${rankings.efficiency === 1 ? 'el más eficiente' : 'uno de los más eficientes'} de la comparación`);
    } else if (vehicle.fuelType === 'Eléctrico') {
      const range = specs.electric?.electricRange;
      if (range) {
        pros.push(`Tecnología eléctrica: ${range}km de autonomía sin emisiones, único en la comparación`);
      }
    }
    // NO mencionar eficiencia si consume más de 8L/100km
  }

  // Ventaja de seguridad (top 3 más seguros o mejor que promedio)
  if (rankings.safety <= Math.ceil(totalVehicles / 2)) {
    const airbags = specs.safety?.airbags;
    if (airbags) {
      pros.push(`Seguridad sólida: ${airbags} airbags, ${rankings.safety === 1 ? 'el más seguro' : 'uno de los más seguros'} de la comparación`);
    }
  }

  // Ventaja de año (más nuevo o mejor que promedio)
  if (rankings.year <= Math.ceil(totalVehicles / 2)) {
    pros.push(`Modelo actualizado: ${vehicle.year}, ${rankings.year === 1 ? 'el más reciente' : 'uno de los más recientes'} de la comparación`);
  }

  // Ventajas específicas por tipo de vehículo (más específicas)
  if (vehicle.type === 'SUV') {
    const height = specs.dimensions?.height;
    if (height && height > 1600) {
      pros.push(`Altura de manejo superior: ${height}mm para mejor visibilidad y comando en carretera`);
    } else {
      pros.push(`Versatilidad SUV: mayor espacio de carga y capacidad para terrenos irregulares`);
    }
  } else if (vehicle.type === 'Deportivo') {
    const acceleration = specs.performance?.acceleration0to100;
    if (acceleration && acceleration < 5.0) {
      pros.push(`Aceleración excepcional: 0-100 km/h en ${acceleration}s, rendimiento de supercarro`);
    } else {
      pros.push(`Diseño deportivo puro: aerodinámica y características optimizadas para rendimiento`);
    }
  } else if (vehicle.type === 'Sedán') {
    const length = specs.dimensions?.length;
    if (length && length > 4500) {
      pros.push(`Espacio interior generoso: ${length}mm de longitud para máximo confort de pasajeros`);
    } else {
      pros.push(`Equilibrio perfecto: combina elegancia, confort y eficiencia en un diseño clásico`);
    }
  }

  // Ventajas específicas por tipo de combustible (más detalladas)
  if (vehicle.fuelType === 'Eléctrico') {
    const range = specs.electric?.electricRange;
    if (range && range > 500) {
      pros.push(`Autonomía eléctrica excepcional: ${range}km sin emisiones, ideal para viajes largos`);
    } else if (range) {
      pros.push(`Tecnología eléctrica: ${range}km de autonomía con cero emisiones y costo operativo mínimo`);
    } else {
      pros.push(`Movilidad sostenible: tecnología eléctrica con mantenimiento mínimo y operación silenciosa`);
    }
  } else if (vehicle.fuelType === 'Híbrido') {
    const cityConsumption = specs.hybrid?.cityConsumption;
    if (cityConsumption && cityConsumption < 5.0) {
      pros.push(`Eficiencia híbrida excepcional: ${cityConsumption}L/100km en ciudad, ideal para Medellín`);
    } else {
      pros.push(`Tecnología híbrida inteligente: combina eficiencia eléctrica con autonomía de gasolina`);
    }
  } else if (vehicle.fuelType === 'Gasolina') {
    const power = specs.performance?.maxPower || specs.combustion?.maxPower;
    if (power && power > 400) {
      pros.push(`Potencia de gasolina pura: ${power}hp para rendimiento sin compromiso y sonido auténtico`);
    } else {
      pros.push(`Confiabilidad probada: tecnología de gasolina madura con red de servicio completa en Colombia`);
    }
  }

  // Ventajas por características específicas
  const hasTouchscreen = specs.technology?.touchscreen;
  const hasNavigation = specs.technology?.navigation;
  const hasBluetooth = specs.technology?.bluetooth;

  if (hasTouchscreen && hasNavigation && hasBluetooth) {
    pros.push(`Tecnología completa: pantalla táctil, GPS y conectividad moderna`);
  } else if (hasNavigation) {
    pros.push(`Navegación integrada: GPS incorporado para direcciones sin smartphone`);
  }

  // Ventajas específicas para vehículos de lujo (cuando no hay precio o eficiencia)
  if (pros.length < 2 && vehicle.price > 200000000) {
    const acceleration = specs.performance?.acceleration0to100;
    const maxSpeed = specs.performance?.maxSpeed;
    const power = specs.performance?.maxPower || specs.combustion?.maxPower;

    if (acceleration && acceleration < 5.0) {
      pros.push(`Aceleración excepcional: 0-100 km/h en ${acceleration}s, rendimiento de supercarro`);
    }

    if (maxSpeed && maxSpeed > 250) {
      pros.push(`Velocidad máxima: ${maxSpeed} km/h, diseñado para circuito`);
    }

    if (power && power > 400) {
      pros.push(`Motor de alto rendimiento: ${power}hp de potencia pura para experiencias extremas`);
    }

    if (vehicle.brand === 'Porsche' || vehicle.brand === 'Ferrari' || vehicle.brand === 'McLaren') {
      pros.push(`Prestigio exclusivo: legado de ${vehicle.brand} en deportivos de alto rendimiento`);
    }

    if (vehicle.year >= 2020) {
      pros.push(`Tecnología moderna: ${vehicle.year} con sistemas avanzados de última generación`);
    }
  }

  // Asegurar al menos 2 ventajas por vehículo (para vehículos normales)
  if (pros.length < 2 && vehicle.price <= 200000000) {
    // Ventajas adicionales basadas en características generales
    if (vehicle.price < globalAnalysis.priceRange.avg) {
      pros.push(`Precio competitivo: $${priceMillions}M por debajo del promedio de $${Math.round(globalAnalysis.priceRange.avg / 1000000)}M`);
    }

    if (vehicle.year >= globalAnalysis.yearRange.avg) {
      pros.push(`Modelo actual: ${vehicle.year} igual o superior al promedio de ${Math.round(globalAnalysis.yearRange.avg)}`);
    }

    // Ventaja genérica si no hay suficientes específicas
    if (pros.length < 2) {
      pros.push(`Equilibrio general: características balanceadas para uso diario`);
    }
  }

  return pros.slice(0, 3);
}

// Generar desventajas únicas basadas en rankings
function generateUniqueCons(vehicle: VehicleComparisonData, rankings: any, globalAnalysis: any): string[] {
  const cons: string[] = [];
  const specs = vehicle.specifications ? JSON.parse(vehicle.specifications) : {};
  const priceMillions = Math.round(vehicle.price / 1000000);

  const totalVehicles = Object.keys(rankings).length;

  // Desventaja de precio (contextualizada según precio real)
  if (rankings.price >= Math.ceil(totalVehicles / 2)) {
    // Contextualizar según precio real en el mercado
    if (vehicle.price > 400000000) { // Más de 400M - súper lujo
      cons.push(`Precio muy elevado: $${priceMillions}M, vehículo de súper lujo ${rankings.price === totalVehicles ? 'el más costoso' : 'uno de los más costosos'} del mercado`);
    } else if (vehicle.price > 200000000) { // Entre 200M y 400M - premium
      cons.push(`Precio premium: $${priceMillions}M, ${rankings.price === totalVehicles ? 'el más caro' : 'uno de los más caros'} en esta categoría de lujo`);
    } else if (vehicle.price > 100000000) { // Entre 100M y 200M - medio-alto
      cons.push(`Precio elevado: $${priceMillions}M, ${rankings.price === totalVehicles ? 'el más costoso' : 'uno de los más costosos'} de esta comparación`);
    } else { // Menos de 100M pero aún caro dentro del grupo
      cons.push(`Precio alto: $${priceMillions}M, ${rankings.price === totalVehicles ? 'el más caro' : 'uno de los más caros'} de las opciones económicas`);
    }
  }

  // Desventaja de potencia (menos potente que el promedio o bottom 3)
  if (rankings.power >= Math.ceil(totalVehicles / 2)) {
    const power = specs.performance?.maxPower || specs.combustion?.maxPower;
    if (power) {
      cons.push(`Menor potencia: ${power}hp, ${rankings.power === totalVehicles ? 'el menos potente' : 'uno de los menos potentes'} de la comparación`);
    }
  }

  // Desventaja de eficiencia (SOLO si realmente consume mucho)
  if (rankings.efficiency >= Math.ceil(totalVehicles / 2)) {
    const consumption = specs.combustion?.cityConsumption || specs.hybrid?.cityConsumption;
    if (consumption && consumption > 10.0) { // Solo si consume MÁS de 10L/100km
      cons.push(`Consumo elevado: ${consumption}L/100km vulnerable a aumentos de precio de combustible`);
    } else if (vehicle.fuelType === 'Eléctrico') {
      const range = specs.electric?.electricRange;
      if (range && range < 300) { // Solo si la autonomía es realmente limitada
        cons.push(`Autonomía limitada: ${range}km insuficiente para viajes largos sin paradas`);
      }
    }
    // NO mencionar eficiencia como desventaja si no consume realmente mucho
  }

  // Desventaja de seguridad (menos seguro que el promedio o bottom 3)
  if (rankings.safety >= Math.ceil(totalVehicles / 2)) {
    const airbags = specs.safety?.airbags;
    if (airbags) {
      cons.push(`Menos airbags: ${airbags} airbags, ${rankings.safety === totalVehicles ? 'el menos seguro' : 'uno de los menos seguros'} de la comparación`);
    }
  }

  // Desventaja de año (más viejo que el promedio)
  if (rankings.year >= Math.ceil(totalVehicles / 2)) {
    cons.push(`Modelo más antiguo: ${vehicle.year}, ${rankings.year === totalVehicles ? 'el menos actualizado' : 'menos actualizado'} de la comparación`);
  }

  // Desventajas específicas por tipo de vehículo
  if (vehicle.type === 'Deportivo') {
    cons.push(`Menos práctico: diseño deportivo sacrifica espacio familiar vs otros vehículos`);
  } else if (vehicle.type === 'Sedán' && globalAnalysis.vehicleTypes.includes('SUV')) {
    cons.push(`Menos versátil: espacio limitado vs SUV para carga y pasajeros`);
  } else if (vehicle.type === 'SUV' && globalAnalysis.vehicleTypes.includes('Deportivo')) {
    cons.push(`Menos deportivo: enfoque familiar vs vehículos deportivos de alto rendimiento`);
  }

  // Desventajas específicas por tipo de combustible
  if (vehicle.fuelType === 'Eléctrico') {
    cons.push(`Infraestructura limitada: red de carga aún en desarrollo en Colombia`);
  } else if (vehicle.fuelType === 'Gasolina') {
    const consumption = specs.combustion?.cityConsumption;
    if (consumption && consumption > 10) {
      cons.push(`Consumo elevado: ${consumption}L/100km vulnerable a aumentos de precio de combustible`);
    }
  } else if (vehicle.fuelType === 'Híbrido') {
    cons.push(`Complejidad mecánica: mantenimiento especializado aumenta costos operativos`);
  }

  // Desventajas por características específicas
  const hasTouchscreen = specs.technology?.touchscreen;
  const hasNavigation = specs.technology?.navigation;
  const hasBluetooth = specs.technology?.bluetooth;

  if (!hasTouchscreen && !hasNavigation && !hasBluetooth) {
    cons.push(`Tecnología básica: sin conectividad moderna vs vehículos con equipamiento avanzado`);
  } else if (!hasNavigation) {
    cons.push(`Sin navegación GPS: dependencia total del smartphone para direcciones`);
  }

  // Asegurar al menos 2 desventajas por vehículo
  if (cons.length < 2) {
    // Desventajas adicionales basadas en características generales
    if (vehicle.price > globalAnalysis.priceRange.avg) {
      cons.push(`Precio por encima del promedio: $${priceMillions}M vs promedio de $${Math.round(globalAnalysis.priceRange.avg / 1000000)}M`);
    }

    if (vehicle.year < globalAnalysis.yearRange.avg) {
      cons.push(`Modelo menos reciente: ${vehicle.year} vs promedio de ${Math.round(globalAnalysis.yearRange.avg)}`);
    }

    // Desventaja genérica si no hay suficientes específicas
    if (cons.length < 2) {
      cons.push(`Características promedio: sin ventajas destacadas vs vehículos especializados`);
    }
  }

  return cons.slice(0, 3);
}

// Funciones auxiliares para generar pros/cons relativos
function generateRelativePros(vehicle: VehicleComparisonData, allVehicles: VehicleComparisonData[]): string[] {
  const pros: string[] = [];
  const specs = vehicle.specifications ? JSON.parse(vehicle.specifications) : {};
  const priceMillions = Math.round(vehicle.price / 1000000);

  // Comparar con otros vehículos
  const otherVehicles = allVehicles.filter(v => v.id !== vehicle.id);

  // Ventaja de precio
  const cheaperThan = otherVehicles.filter(v => vehicle.price < v.price);
  if (cheaperThan.length > 0) {
    const avgOtherPrice = Math.round(cheaperThan.reduce((sum, v) => sum + v.price, 0) / cheaperThan.length / 1000000);
    pros.push(`Precio más accesible: $${priceMillions}M vs promedio de $${avgOtherPrice}M de los otros vehículos`);
  }

  // Ventaja de potencia
  const vehiclePower = specs.performance?.maxPower || specs.combustion?.maxPower;
  if (vehiclePower) {
    const morePowerfulThan = otherVehicles.filter(v => {
      const otherPower = v.specifications ? JSON.parse(v.specifications) : {};
      const otherPowerValue = otherPower.performance?.maxPower || otherPower.combustion?.maxPower;
      return otherPowerValue && vehiclePower > otherPowerValue;
    });

    if (morePowerfulThan.length > 0) {
      pros.push(`Mayor potencia: ${vehiclePower}hp supera a ${morePowerfulThan.length} de los ${otherVehicles.length} vehículos comparados`);
    }
  }

  // Ventaja de eficiencia
  const vehicleConsumption = specs.combustion?.cityConsumption || specs.hybrid?.cityConsumption;
  if (vehicleConsumption) {
    const moreEfficientThan = otherVehicles.filter(v => {
      const otherSpecs = v.specifications ? JSON.parse(v.specifications) : {};
      const otherConsumption = otherSpecs.combustion?.cityConsumption || otherSpecs.hybrid?.cityConsumption;
      return otherConsumption && vehicleConsumption < otherConsumption;
    });

    if (moreEfficientThan.length > 0) {
      pros.push(`Mejor eficiencia: ${vehicleConsumption}L/100km vs ${moreEfficientThan.length} vehículos con mayor consumo`);
    }
  }

  // Ventaja de seguridad
  const vehicleAirbags = specs.safety?.airbags;
  if (vehicleAirbags) {
    const saferThan = otherVehicles.filter(v => {
      const otherSpecs = v.specifications ? JSON.parse(v.specifications) : {};
      const otherAirbags = otherSpecs.safety?.airbags;
      return otherAirbags && vehicleAirbags > otherAirbags;
    });

    if (saferThan.length > 0) {
      pros.push(`Más airbags: ${vehicleAirbags} vs ${saferThan.length} vehículos con menos protección`);
    }
  }

  // Ventaja de autonomía eléctrica
  if (vehicle.fuelType === 'Eléctrico') {
    const vehicleRange = specs.electric?.electricRange;
    if (vehicleRange) {
      const electricOthers = otherVehicles.filter(v => v.fuelType === 'Eléctrico');
      if (electricOthers.length > 0) {
        const hasBetterRange = electricOthers.filter(v => {
          const otherSpecs = v.specifications ? JSON.parse(v.specifications) : {};
          const otherRange = otherSpecs.electric?.electricRange;
          return otherRange && vehicleRange > otherRange;
        });

        if (hasBetterRange.length > 0) {
          pros.push(`Mayor autonomía eléctrica: ${vehicleRange}km vs otros vehículos eléctricos`);
        }
      } else {
        pros.push(`Único eléctrico: ${vehicleRange}km de autonomía sin emisiones vs vehículos de combustión`);
      }
    }
  }

  // Ventaja de año (más nuevo)
  const newerThan = otherVehicles.filter(v => vehicle.year > v.year);
  if (newerThan.length > 0) {
    pros.push(`Más reciente: modelo ${vehicle.year} vs ${newerThan.length} vehículos de años anteriores`);
  }

  // Ventaja de tipo de vehículo específico
  if (vehicle.type === 'SUV') {
    const nonSUVs = otherVehicles.filter(v => v.type !== 'SUV');
    if (nonSUVs.length > 0) {
      pros.push(`Único SUV: mayor espacio y versatilidad vs ${nonSUVs.length} vehículos de otros tipos`);
    }
  }

  return pros.slice(0, 3);
}

function generateRelativeCons(vehicle: VehicleComparisonData, allVehicles: VehicleComparisonData[]): string[] {
  const cons: string[] = [];
  const specs = vehicle.specifications ? JSON.parse(vehicle.specifications) : {};
  const priceMillions = Math.round(vehicle.price / 1000000);

  // Comparar con otros vehículos
  const otherVehicles = allVehicles.filter(v => v.id !== vehicle.id);

  // Desventaja de precio
  const moreExpensiveThan = otherVehicles.filter(v => vehicle.price > v.price);
  if (moreExpensiveThan.length > 0) {
    const avgOtherPrice = Math.round(moreExpensiveThan.reduce((sum, v) => sum + v.price, 0) / moreExpensiveThan.length / 1000000);
    cons.push(`Precio más alto: $${priceMillions}M vs promedio de $${avgOtherPrice}M de los otros vehículos`);
  }

  // Desventaja de potencia
  const vehiclePower = specs.performance?.maxPower || specs.combustion?.maxPower;
  if (vehiclePower) {
    const lessPowerfulThan = otherVehicles.filter(v => {
      const otherSpecs = v.specifications ? JSON.parse(v.specifications) : {};
      const otherPower = otherSpecs.performance?.maxPower || otherSpecs.combustion?.maxPower;
      return otherPower && vehiclePower < otherPower;
    });

    if (lessPowerfulThan.length > 0) {
      cons.push(`Menor potencia: ${vehiclePower}hp vs ${lessPowerfulThan.length} vehículos más potentes`);
    }
  }

  // Desventaja de eficiencia
  const vehicleConsumption = specs.combustion?.cityConsumption || specs.hybrid?.cityConsumption;
  if (vehicleConsumption) {
    const lessEfficientThan = otherVehicles.filter(v => {
      const otherSpecs = v.specifications ? JSON.parse(v.specifications) : {};
      const otherConsumption = otherSpecs.combustion?.cityConsumption || otherSpecs.hybrid?.cityConsumption;
      return otherConsumption && vehicleConsumption > otherConsumption;
    });

    if (lessEfficientThan.length > 0) {
      cons.push(`Mayor consumo: ${vehicleConsumption}L/100km vs ${lessEfficientThan.length} vehículos más eficientes`);
    }
  }

  // Desventaja de seguridad
  const vehicleAirbags = specs.safety?.airbags;
  if (vehicleAirbags) {
    const lessSafeThan = otherVehicles.filter(v => {
      const otherSpecs = v.specifications ? JSON.parse(v.specifications) : {};
      const otherAirbags = otherSpecs.safety?.airbags;
      return otherAirbags && vehicleAirbags < otherAirbags;
    });

    if (lessSafeThan.length > 0) {
      cons.push(`Menos airbags: ${vehicleAirbags} vs ${lessSafeThan.length} vehículos con más protección`);
    }
  }

  // Desventaja de autonomía eléctrica
  if (vehicle.fuelType === 'Eléctrico') {
    const vehicleRange = specs.electric?.electricRange;
    if (vehicleRange) {
      const electricOthers = otherVehicles.filter(v => v.fuelType === 'Eléctrico');
      if (electricOthers.length > 0) {
        const hasWorseRange = electricOthers.filter(v => {
          const otherSpecs = v.specifications ? JSON.parse(v.specifications) : {};
          const otherRange = otherSpecs.electric?.electricRange;
          return otherRange && vehicleRange < otherRange;
        });

        if (hasWorseRange.length > 0) {
          cons.push(`Menor autonomía eléctrica: ${vehicleRange}km vs otros vehículos eléctricos`);
        }
      }
    }
  }

  // Desventaja de año (más viejo)
  const olderThan = otherVehicles.filter(v => vehicle.year < v.year);
  if (olderThan.length > 0) {
    cons.push(`Modelo más antiguo: ${vehicle.year} vs ${olderThan.length} vehículos más recientes`);
  }

  // Desventaja de tipo de vehículo
  if (vehicle.type === 'Deportivo') {
    const nonSporty = otherVehicles.filter(v => v.type !== 'Deportivo');
    if (nonSporty.length > 0) {
      cons.push(`Menos práctico: diseño deportivo vs ${nonSporty.length} vehículos más familiares`);
    }
  }

  return cons.slice(0, 3);
}

// Funciones auxiliares para generar pros/cons detallados (mantener para compatibilidad)
function generatePros(vehicle: VehicleComparisonData): string[] {
  const pros: string[] = [];
  const specs = vehicle.specifications ? JSON.parse(vehicle.specifications) : {};
  const priceMillions = Math.round(vehicle.price / 1000000);

  // Pros específicos de rendimiento con datos concretos
  if (vehicle.features.performance_score > 0.8) {
    const power = specs.performance?.maxPower || specs.combustion?.maxPower;
    const acceleration = specs.performance?.acceleration0to100;
    const torque = specs.performance?.maxTorque;

    if (power && acceleration) {
      pros.push(`Potencia excepcional de ${power}hp con aceleración 0-100km/h en solo ${acceleration}s`);
      if (torque) {
        pros.push(`Torque máximo de ${torque}Nm para respuesta inmediata en cualquier situación`);
      }
    } else if (power) {
      pros.push(`Motor potente de ${power}hp que supera ampliamente el promedio de su segmento`);
    } else {
      pros.push('Rendimiento deportivo superior con características de alta gama');
    }
  }

  // Pros específicos de eficiencia con datos concretos
  if (vehicle.features.efficiency_score > 0.8) {
    const consumption = specs.combustion?.cityConsumption || specs.hybrid?.cityConsumption;
    const highwayConsumption = specs.combustion?.highwayConsumption;

    if (consumption) {
      pros.push(`Consumo ultra eficiente de ${consumption}L/100km en ciudad, significativamente mejor que el promedio del segmento`);
      if (highwayConsumption && highwayConsumption < consumption) {
        pros.push(`Aún más eficiente en carretera: ${highwayConsumption}L/100km para viajes largos`);
      }
    } else if (vehicle.fuelType === 'Eléctrico') {
      const range = specs.electric?.electricRange;
      const chargingTime = specs.electric?.chargingTime;
      if (range) {
        pros.push(`Autonomía eléctrica de ${range}km sin emisiones, equivalente a 3-4 días de uso urbano típico`);
        if (chargingTime) {
          pros.push(`Recarga rápida en ${chargingTime} minutos para 80% de batería`);
        }
      } else {
        pros.push('Operación 100% eléctrica eliminando costos de combustible y mantenimiento de motor');
      }
    }
  }

  // Pros específicos de seguridad con datos concretos
  if (vehicle.features.safety_score > 0.8) {
    const airbags = specs.safety?.airbags;
    const hasStability = specs.safety?.stabilityControl;
    const hasLaneAssist = specs.safety?.laneAssist;
    const hasBlindSpot = specs.safety?.blindSpotMonitoring;
    const hasAutoBrake = specs.safety?.automaticEmergencyBraking;

    let safetyFeatures = [];
    if (airbags >= 8) safetyFeatures.push(`${airbags} airbags de última generación`);
    if (hasStability) safetyFeatures.push('control electrónico de estabilidad');
    if (hasLaneAssist) safetyFeatures.push('asistente de mantenimiento de carril');
    if (hasBlindSpot) safetyFeatures.push('monitoreo de punto ciego');
    if (hasAutoBrake) safetyFeatures.push('frenado automático de emergencia');

    if (safetyFeatures.length > 0) {
      pros.push(`Seguridad premium con ${safetyFeatures.join(', ')} para máxima protección familiar`);
    } else {
      pros.push('Sistemas de seguridad avanzados que superan estándares internacionales');
    }
  }

  // Pros específicos de tecnología con datos concretos
  if (vehicle.features.tech_score > 0.7) {
    let techFeatures = [];
    const screenSize = specs.technology?.screenSize;
    const hasWireless = specs.technology?.wirelessCharging;
    const hasCarPlay = specs.technology?.appleCarPlay;
    const hasAndroid = specs.technology?.androidAuto;

    if (screenSize) techFeatures.push(`pantalla táctil de ${screenSize}"`);
    if (specs.technology?.navigation) techFeatures.push('navegación GPS con mapas actualizados');
    if (hasCarPlay || hasAndroid) techFeatures.push('integración completa con smartphone');
    if (hasWireless) techFeatures.push('carga inalámbrica para dispositivos');
    if (specs.technology?.bluetooth) techFeatures.push('conectividad Bluetooth 5.0');

    if (techFeatures.length > 0) {
      pros.push(`Tecnología de vanguardia: ${techFeatures.join(', ')} para conectividad total`);
    } else {
      pros.push('Equipamiento tecnológico completo con las últimas innovaciones');
    }
  }

  // Pros específicos por tipo de combustible con contexto colombiano
  if (vehicle.fuelType === 'Eléctrico') {
    pros.push('Cero emisiones locales contribuyendo a un aire más limpio en Bogotá y principales ciudades');
    pros.push('Mantenimiento mínimo: sin cambios de aceite, filtros o correas, reduciendo costos operativos');
  } else if (vehicle.fuelType === 'Híbrido') {
    pros.push('Tecnología híbrida que combina eficiencia eléctrica con la confiabilidad de motor convencional');
    pros.push('Ideal para el tráfico colombiano: motor eléctrico en bajas velocidades, gasolina en carretera');
  }

  // Pros específicos de valor con contexto de mercado
  if (vehicle.features.value_score > 0.7) {
    const segmentAvg = getSegmentAveragePrice(vehicle.type, vehicle.year);
    if (segmentAvg && vehicle.price < segmentAvg) {
      const savings = Math.round((segmentAvg - vehicle.price) / 1000000);
      pros.push(`Excelente valor: $${priceMillions}M vs promedio de segmento $${Math.round(segmentAvg / 1000000)}M (ahorro de $${savings}M)`);
    } else {
      pros.push(`Precio competitivo de $${priceMillions}M con equipamiento superior a su categoría`);
    }
  }

  // Pros específicos de confort y practicidad
  if (vehicle.features.comfort_score > 0.8) {
    const seats = specs.comfort?.seats;
    const cargo = specs.dimensions?.cargoVolume;
    const hasAC = specs.comfort?.airConditioning;
    const hasHeatedSeats = specs.comfort?.heatedSeats;

    let comfortFeatures = [];
    if (seats >= 5) comfortFeatures.push(`${seats} asientos cómodos`);
    if (cargo && cargo > 400) comfortFeatures.push(`${cargo}L de espacio de carga`);
    if (hasAC) comfortFeatures.push('aire acondicionado automático');
    if (hasHeatedSeats) comfortFeatures.push('asientos calefaccionados');

    if (comfortFeatures.length > 0) {
      pros.push(`Máximo confort con ${comfortFeatures.join(', ')} para viajes largos`);
    } else {
      pros.push('Interior premium diseñado para comodidad en todos los viajes');
    }
  }

  return pros.slice(0, 3);
}

function generateCons(vehicle: VehicleComparisonData): string[] {
  const cons: string[] = [];
  const specs = vehicle.specifications ? JSON.parse(vehicle.specifications) : {};
  const priceMillions = Math.round(vehicle.price / 1000000);

  // Cons específicos de rendimiento con datos concretos
  if (vehicle.features.performance_score < 0.4) {
    const power = specs.performance?.maxPower || specs.combustion?.maxPower;
    const acceleration = specs.performance?.acceleration0to100;
    const torque = specs.performance?.maxTorque;

    if (power && power < 150) {
      cons.push(`Potencia limitada de ${power}hp insuficiente para adelantamientos seguros en carretera`);
    } else if (acceleration && acceleration > 12) {
      cons.push(`Aceleración lenta de ${acceleration}s para 0-100km/h, por debajo de estándares actuales`);
    } else if (torque && torque < 200) {
      cons.push(`Torque de solo ${torque}Nm insuficiente para carga o remolque`);
    } else {
      cons.push('Rendimiento general por debajo del promedio de su segmento y año');
    }
  }

  // Cons específicos de eficiencia con impacto económico
  if (vehicle.features.efficiency_score < 0.4) {
    const consumption = specs.combustion?.cityConsumption;
    const highwayConsumption = specs.combustion?.highwayConsumption;

    if (consumption && consumption > 10) {
      cons.push(`Consumo elevado de ${consumption}L/100km en ciudad, por encima del promedio del segmento`);
      if (highwayConsumption && highwayConsumption > consumption) {
        cons.push(`Aún peor en carretera: ${highwayConsumption}L/100km aumenta costos de viajes largos`);
      }
    } else {
      cons.push('Eficiencia de combustible inferior a competidores, impactando presupuesto familiar');
    }
  }

  // Cons específicos de precio con contexto de mercado
  if (vehicle.features.value_score < 0.4) {
    const segmentAvg = getSegmentAveragePrice(vehicle.type, vehicle.year);
    if (vehicle.price > 300000000) {
      cons.push(`Precio premium de $${priceMillions}M limita accesibilidad para la mayoría de compradores`);
    } else if (segmentAvg && vehicle.price > segmentAvg * 1.2) {
      const overprice = Math.round((vehicle.price - segmentAvg) / 1000000);
      cons.push(`Sobreprecio de $${overprice}M vs promedio de segmento, sin justificación clara`);
    } else {
      cons.push('Relación precio-equipamiento desfavorable comparado con alternativas del mercado');
    }
  }

  // Cons específicos por tipo de combustible con contexto colombiano
  if (vehicle.fuelType === 'Eléctrico') {
    const range = specs.electric?.electricRange;
    const chargingTime = specs.electric?.chargingTime;

    if (range && range < 300) {
      cons.push(`Autonomía limitada de ${range}km insuficiente para viajes interurbanos sin paradas`);
    } else {
      cons.push('Infraestructura de carga limitada en Colombia, especialmente fuera de ciudades principales');
    }

    if (chargingTime && chargingTime > 60) {
      cons.push(`Tiempo de recarga lento de ${chargingTime} minutos limita flexibilidad de uso`);
    }

    cons.push('Inversión inicial alta sin garantía de red de carga confiable en todo el país');
  } else if (vehicle.fuelType === 'Gasolina') {
    const consumption = specs.combustion?.cityConsumption;
    if (consumption && consumption > 12) {
      cons.push(`Consumo alto de ${consumption}L/100km en ciudad, vulnerable a aumentos de precio de combustible`);
    }
    cons.push('Emisiones contaminantes contribuyen a problemas ambientales urbanos');
    cons.push('Dependencia total de combustibles fósiles con precios volátiles');
  } else if (vehicle.fuelType === 'Híbrido') {
    cons.push('Complejidad mecánica dual aumenta costos de mantenimiento especializado');
    cons.push('Sobreprecio híbrido de $10-20M vs versión gasolina sin garantía de ahorro proporcional');
  }

  // Cons específicos de seguridad con datos concretos
  if (vehicle.features.safety_score < 0.6) {
    const airbags = specs.safety?.airbags;
    const hasStability = specs.safety?.stabilityControl;
    const hasLaneAssist = specs.safety?.laneAssist;

    if (airbags && airbags < 6) {
      cons.push(`Solo ${airbags} airbags, por debajo de los 6-8 estándar en vehículos modernos`);
    } else if (!hasStability) {
      cons.push('Falta control de estabilidad, sistema de seguridad fundamental en carreteras colombianas');
    } else if (!hasLaneAssist) {
      cons.push('Sin asistencias de conducción modernas como mantenimiento de carril o frenado automático');
    } else {
      cons.push('Sistemas de seguridad básicos sin tecnologías avanzadas de protección');
    }
  }

  // Cons específicos de tecnología
  if (vehicle.features.tech_score < 0.5) {
    const hasTouchscreen = specs.technology?.touchscreen;
    const hasNavigation = specs.technology?.navigation;
    const hasBluetooth = specs.technology?.bluetooth;

    if (!hasTouchscreen && !hasNavigation && !hasBluetooth) {
      cons.push('Equipamiento tecnológico básico sin conectividad moderna o pantalla táctil');
    } else if (!hasNavigation) {
      cons.push('Sin navegación GPS integrada, dependencia total del smartphone para direcciones');
    } else if (!hasBluetooth) {
      cons.push('Sin conectividad Bluetooth, limitando integración con dispositivos móviles');
    }
  }

  // Cons específicos de confort y practicidad
  if (vehicle.features.comfort_score < 0.5) {
    const seats = specs.comfort?.seats;
    const cargo = specs.dimensions?.cargoVolume;
    const hasAC = specs.comfort?.airConditioning;

    if (seats && seats < 5) {
      cons.push(`Solo ${seats} asientos, limitando capacidad para familias o grupos`);
    }
    if (cargo && cargo < 300) {
      cons.push(`Espacio de carga limitado de ${cargo}L insuficiente para equipaje familiar`);
    }
    if (!hasAC) {
      cons.push('Sin aire acondicionado, incomodidad en clima tropical colombiano');
    }
  }

  // Cons específicos de mantenimiento y confiabilidad
  const maintenanceCost = getMaintenanceCost(vehicle.brand, vehicle.year);
  if (maintenanceCost > 5000000) { // Más de 5M anuales
    cons.push(`Mantenimiento costoso estimado en $${Math.round(maintenanceCost / 1000000)}M anuales, típico de marcas premium`);
  }

  return cons.slice(0, 3);
}

// Funciones auxiliares para análisis de mercado
function getSegmentAveragePrice(type: string, year: number): number | null {
  // Precios promedio por segmento en Colombia (datos aproximados)
  const segmentPrices: Record<string, number> = {
    'Sedán': 180000000,
    'SUV': 220000000,
    'Hatchback': 150000000,
    'Deportivo': 350000000,
    'Wagon': 200000000,
    'Pickup': 250000000
  };

  const basePrice = segmentPrices[type] || 200000000;

  // Ajustar por año (vehículos más nuevos son más caros)
  const yearMultiplier = 1 + ((year - 2020) * 0.05);

  return Math.round(basePrice * yearMultiplier);
}

function getMaintenanceCost(brand: string, year: number): number {
  // Costos de mantenimiento anual estimados por marca (en pesos colombianos)
  const brandCosts: Record<string, number> = {
    'Toyota': 3000000,
    'Honda': 3200000,
    'Nissan': 3500000,
    'Hyundai': 2800000,
    'Kia': 2900000,
    'Mazda': 3800000,
    'Volkswagen': 4500000,
    'Ford': 4200000,
    'Chevrolet': 4000000,
    'BMW': 8000000,
    'Mercedes-Benz': 9000000,
    'Audi': 8500000,
    'Porsche': 12000000,
    'Tesla': 2000000, // Mantenimiento eléctrico mínimo
    'Lexus': 7000000,
    'Infiniti': 7500000,
    'Acura': 6500000
  };

  const baseCost = brandCosts[brand] || 4000000;

  // Ajustar por año (vehículos más nuevos tienen garantía)
  const yearMultiplier = year >= 2022 ? 0.7 : 1.0;

  return Math.round(baseCost * yearMultiplier);
}

function generateBasicRecommendation(vehicle: VehicleComparisonData): string {
  const specs = vehicle.specifications ? JSON.parse(vehicle.specifications) : {};
  const priceMillions = Math.round(vehicle.price / 1000000);
  const maintenanceCost = getMaintenanceCost(vehicle.brand, vehicle.year);
  const segmentAvg = getSegmentAveragePrice(vehicle.type, vehicle.year);

  // Recomendación basada en rendimiento y contexto de precio
  if (vehicle.features.performance_score > 0.8) {
    const power = specs.performance?.maxPower || specs.combustion?.maxPower;
    const acceleration = specs.performance?.acceleration0to100;

    // Contextualizar según precio para ser consistente
    if (vehicle.price > 400000000) { // Súper lujo
      if (power && acceleration && acceleration < 4.0) {
        return `Obra maestra de ingeniería: ${power}hp y 0-100 km/h en ${acceleration}s representan la cumbre del rendimiento automotriz mundial`;
      } else if (power && power > 500) {
        return `Supercarro exclusivo: ${power}hp de potencia brutal, diseñado para quienes buscan la experiencia de conducción más extrema`;
      } else {
        return `Vehículo de colección: rendimiento excepcional y exclusividad que solo unos pocos pueden poseer`;
      }
    } else if (vehicle.price > 200000000) { // Premium
      if (power && acceleration) {
        return `Deportivo premium: ${power}hp y 0-100 km/h en ${acceleration}s combinan rendimiento serio con lujo refinado`;
      } else {
        return `Ideal para conductores exigentes: rendimiento deportivo con el prestigio y calidad de una marca premium`;
      }
    } else { // Deportivo accesible
      if (power && acceleration) {
        return `Diversión accesible: ${power}hp y 0-100 km/h en ${acceleration}s ofrecen emociones deportivas sin sacrificar la practicidad`;
      } else {
        return `Perfecto para entusiastas: rendimiento deportivo genuino en un paquete más accesible para uso diario`;
      }
    }
  }

  if (vehicle.features.efficiency_score > 0.8) {
    const consumption = specs.combustion?.cityConsumption || specs.hybrid?.cityConsumption;
    const range = specs.electric?.electricRange;

    if (consumption) {
      return `Excelente para uso diario eficiente: ${consumption}L/100km en ciudad, significativamente mejor que el promedio del segmento`;
    } else if (vehicle.fuelType === 'Eléctrico' && range) {
      return `Ideal para conciencia ambiental: ${range}km de autonomía eléctrica elimina costos de combustible y contribuye a un futuro sostenible`;
    } else if (vehicle.fuelType === 'Híbrido') {
      return `Perfecto para el tráfico colombiano: tecnología híbrida optimiza consumo en ciudad y carretera, reduciendo costos operativos significativamente`;
    } else {
      return `Recomendado para máxima eficiencia: diseño optimizado para minimizar consumo sin sacrificar prestaciones esenciales`;
    }
  }

  if (vehicle.features.safety_score > 0.8) {
    const airbags = specs.safety?.airbags;
    const hasStability = specs.safety?.stabilityControl;
    const hasLaneAssist = specs.safety?.laneAssist;

    let safetyFeatures = [];
    if (airbags >= 8) safetyFeatures.push(`${airbags} airbags`);
    if (hasStability) safetyFeatures.push('control de estabilidad');
    if (hasLaneAssist) safetyFeatures.push('asistente de carril');

    if (safetyFeatures.length > 0) {
      return `Ideal para familias: ${safetyFeatures.join(', ')} y sistemas de seguridad avanzados brindan máxima protección para los seres queridos`;
    } else {
      return `Recomendado para seguridad familiar: equipamiento de protección que supera estándares de seguridad modernos`;
    }
  }

  if (vehicle.features.value_score > 0.8) {
    // Contextualizar el "valor" según el rango de precio
    if (vehicle.price > 400000000) { // Súper lujo
      return `Inversión exclusiva: $${priceMillions}M por un vehículo que combina prestigio absoluto, tecnología avanzada y exclusividad mundial`;
    } else if (vehicle.price > 200000000) { // Premium
      return `Lujo justificado: $${priceMillions}M por equipamiento premium, ingeniería superior y la experiencia de marca de prestigio`;
    } else if (segmentAvg && vehicle.price < segmentAvg) {
      const savings = Math.round((segmentAvg - vehicle.price) / 1000000);
      return `Excelente oportunidad: $${priceMillions}M vs promedio de segmento $${Math.round(segmentAvg / 1000000)}M, ahorrando $${savings}M sin comprometer equipamiento esencial`;
    } else {
      return `Equilibrio inteligente: $${priceMillions}M con equipamiento completo y confiabilidad probada de ${vehicle.brand}`;
    }
  }

  if (vehicle.features.comfort_score > 0.8) {
    const seats = specs.comfort?.seats;
    const cargo = specs.dimensions?.cargoVolume;

    let comfortFeatures = [];
    if (seats >= 5) comfortFeatures.push(`${seats} asientos`);
    if (cargo && cargo > 400) comfortFeatures.push(`${cargo}L de carga`);

    if (comfortFeatures.length > 0) {
      return `Perfecto para viajes familiares: ${comfortFeatures.join(', ')} y confort premium garantizan comodidad en trayectos largos`;
    } else {
      return `Ideal para confort: interior diseñado para máxima comodidad en uso diario y viajes ocasionales`;
    }
  }

  if (vehicle.features.tech_score > 0.8) {
    const screenSize = specs.technology?.screenSize;
    const hasCarPlay = specs.technology?.appleCarPlay;
    const hasAndroid = specs.technology?.androidAuto;

    let techFeatures = [];
    if (screenSize) techFeatures.push(`pantalla ${screenSize}"`);
    if (hasCarPlay || hasAndroid) techFeatures.push('integración smartphone');
    if (specs.technology?.navigation) techFeatures.push('GPS integrado');

    if (techFeatures.length > 0) {
      return `Ideal para tecnología: ${techFeatures.join(', ')} y conectividad moderna mantienen al conductor siempre conectado`;
    } else {
      return `Recomendado para entusiastas de la tecnología: equipamiento digital completo para la conducción moderna`;
    }
  }

  // Recomendación general basada en características principales
  const usage = vehicle.features.usage_urban > 0.7 ? 'urbano' : 'mixto';
  const fuelAdvantage = vehicle.fuelType === 'Eléctrico' ? 'cero emisiones' :
    vehicle.fuelType === 'Híbrido' ? 'máxima eficiencia' : 'confiabilidad probada';

  return `Opción versátil para uso ${usage}: ${fuelAdvantage} con balance equilibrado entre prestaciones, eficiencia y precio de $${priceMillions}M`;
}

function generateFallbackProfileRecommendations(vehicles: VehicleComparisonData[]): ProfileRecommendation[] {
  const recommendations: ProfileRecommendation[] = [];

  // Calcular scores detallados para cada perfil
  const profileScores = vehicles.map(vehicle => ({
    vehicle,
    family: calculateDetailedFamilyScore(vehicle),
    economic: calculateDetailedEconomicScore(vehicle),
    performance: calculateDetailedPerformanceScore(vehicle),
    technology: calculateDetailedTechnologyScore(vehicle)
  }));

  // Ordenar por cada perfil y tomar el mejor
  const familyBest = profileScores.sort((a, b) => b.family - a.family)[0];
  const economicBest = profileScores.sort((a, b) => b.economic - a.economic)[0];
  const performanceBest = profileScores.sort((a, b) => b.performance - a.performance)[0];
  const technologyBest = profileScores.sort((a, b) => b.technology - a.technology)[0];

  // Asegurar que no se repitan vehículos (diversidad)
  const usedVehicles = new Set<string>();

  // Familiar - prioridad alta
  if (!usedVehicles.has(familyBest.vehicle.id)) {
    recommendations.push({
      profile: 'Familiar',
      vehicle: `${familyBest.vehicle.brand} ${familyBest.vehicle.model}`,
      reason: getFamilyReason(familyBest.vehicle)
    });
    usedVehicles.add(familyBest.vehicle.id);
  }

  // Económico - prioridad alta
  if (!usedVehicles.has(economicBest.vehicle.id)) {
    recommendations.push({
      profile: 'Económico',
      vehicle: `${economicBest.vehicle.brand} ${economicBest.vehicle.model}`,
      reason: getEconomicReason(economicBest.vehicle)
    });
    usedVehicles.add(economicBest.vehicle.id);
  }

  // Performance - solo si hay variedad y no se repite
  if (vehicles.length > 2 && !usedVehicles.has(performanceBest.vehicle.id)) {
    recommendations.push({
      profile: 'Performance',
      vehicle: `${performanceBest.vehicle.brand} ${performanceBest.vehicle.model}`,
      reason: getPerformanceReason(performanceBest.vehicle)
    });
    usedVehicles.add(performanceBest.vehicle.id);
  }

  // Tecnología - solo si hay variedad y no se repite
  if (vehicles.length > 2 && !usedVehicles.has(technologyBest.vehicle.id)) {
    recommendations.push({
      profile: 'Tecnología',
      vehicle: `${technologyBest.vehicle.brand} ${technologyBest.vehicle.model}`,
      reason: getTechnologyReason(technologyBest.vehicle)
    });
    usedVehicles.add(technologyBest.vehicle.id);
  }

  // Si aún hay perfiles sin asignar, buscar segundos mejores
  if (recommendations.length < 4) {
    const remainingProfiles = ['Performance', 'Tecnología'].filter(profile =>
      !recommendations.some(r => r.profile === profile)
    );

    for (const profile of remainingProfiles) {
      const availableVehicles = profileScores.filter(p => !usedVehicles.has(p.vehicle.id));
      if (availableVehicles.length > 0) {
        const best = availableVehicles.sort((a, b) => {
          const profileKey = profile.toLowerCase() as 'family' | 'economic' | 'performance' | 'technology';
          return (b[profileKey] as number) - (a[profileKey] as number);
        })[0];
        recommendations.push({
          profile,
          vehicle: `${best.vehicle.brand} ${best.vehicle.model}`,
          reason: getProfileReason(best.vehicle, profile)
        });
        usedVehicles.add(best.vehicle.id);
      }
    }
  }

  return recommendations;
}

// Funciones auxiliares para razones específicas por perfil
function getPerformanceReason(vehicle: VehicleComparisonData): string {
  const reasons = [];
  const specs = vehicle.specifications ? JSON.parse(vehicle.specifications) : {};

  // Razones específicas de rendimiento
  const power = specs.performance?.maxPower || specs.combustion?.maxPower;
  const acceleration = specs.performance?.acceleration0to100;
  const torque = specs.performance?.maxTorque;
  const topSpeed = specs.performance?.topSpeed;

  if (power && acceleration) {
    reasons.push(`${power}hp con 0-100km/h en ${acceleration}s`);
  } else if (power) {
    reasons.push(`${power}hp de potencia`);
  }

  if (torque && torque > 300) {
    reasons.push(`${torque}Nm de torque`);
  }

  if (topSpeed && topSpeed > 200) {
    reasons.push(`velocidad máxima de ${topSpeed}km/h`);
  }

  // Razones por tipo de vehículo
  if (vehicle.type === 'Deportivo') {
    reasons.push('diseño deportivo');
  } else if (vehicle.type === 'Sedán' && power > 200) {
    reasons.push('sedán deportivo');
  }

  // Razones por características especiales
  if (specs.performance?.allWheelDrive) {
    reasons.push('tracción integral');
  }
  if (specs.performance?.sportMode) {
    reasons.push('modo deportivo');
  }

  // Construir frase dinámica
  if (reasons.length >= 3) {
    return `Máximo rendimiento: ${reasons.slice(0, 2).join(', ')} y ${reasons[2]}`;
  } else if (reasons.length === 2) {
    return `Combina ${reasons[0]} con ${reasons[1]}`;
  } else if (reasons.length === 1) {
    return `Destacado por su ${reasons[0]}`;
  } else {
    return 'Mejor rendimiento deportivo de la comparación';
  }
}

function getTechnologyReason(vehicle: VehicleComparisonData): string {
  const reasons = [];
  const specs = vehicle.specifications ? JSON.parse(vehicle.specifications) : {};

  // Razones específicas de tecnología
  const screenSize = specs.technology?.screenSize;
  const hasCarPlay = specs.technology?.appleCarPlay;
  const hasAndroid = specs.technology?.androidAuto;
  const hasWireless = specs.technology?.wirelessCharging;
  const hasNavigation = specs.technology?.navigation;
  const hasBluetooth = specs.technology?.bluetooth;

  if (screenSize) {
    reasons.push(`pantalla táctil de ${screenSize}"`);
  }

  if (hasCarPlay && hasAndroid) {
    reasons.push('Apple CarPlay y Android Auto');
  } else if (hasCarPlay) {
    reasons.push('Apple CarPlay');
  } else if (hasAndroid) {
    reasons.push('Android Auto');
  }

  if (hasWireless) {
    reasons.push('carga inalámbrica');
  }

  if (hasNavigation) {
    reasons.push('navegación GPS integrada');
  }

  if (hasBluetooth) {
    reasons.push('conectividad Bluetooth 5.0');
  }

  // Razones por características avanzadas
  if (specs.technology?.voiceControl) {
    reasons.push('control por voz');
  }
  if (specs.technology?.headUpDisplay) {
    reasons.push('proyección en parabrisas');
  }
  if (specs.technology?.adaptiveCruise) {
    reasons.push('crucero adaptativo');
  }
  if (specs.technology?.parkingAssist) {
    reasons.push('asistente de estacionamiento');
  }

  // Razones por marca tecnológica
  const techBrands = ['Tesla', 'BMW', 'Audi', 'Mercedes-Benz', 'Porsche'];
  if (techBrands.includes(vehicle.brand)) {
    reasons.push('innovación ' + vehicle.brand);
  }

  // Construir frase dinámica
  if (reasons.length >= 3) {
    return `Tecnología de vanguardia: ${reasons.slice(0, 2).join(', ')} y ${reasons[2]}`;
  } else if (reasons.length === 2) {
    return `Combina ${reasons[0]} con ${reasons[1]}`;
  } else if (reasons.length === 1) {
    return `Destacado por su ${reasons[0]}`;
  } else {
    return 'Mejor equipamiento tecnológico de la comparación';
  }
}

// Funciones de scoring detalladas por perfil
function calculateDetailedFamilyScore(vehicle: VehicleComparisonData): number {
  let score = 0;
  const specs = vehicle.specifications ? JSON.parse(vehicle.specifications) : {};

  // Tipo de vehículo (40% del score)
  if (vehicle.type === 'SUV') score += 0.4;
  else if (vehicle.type === 'Sedán') score += 0.3;
  else if (vehicle.type === 'Hatchback') score += 0.2;
  else if (vehicle.type === 'Deportivo') score -= 0.3;

  // Seguridad (30% del score)
  score += vehicle.features.safety_score * 0.3;

  // Confort (20% del score)
  score += vehicle.features.comfort_score * 0.2;

  // Espacio y practicidad (10% del score)
  if (specs.dimensions?.length > 4.5) score += 0.05;
  if (specs.dimensions?.width > 1.8) score += 0.03;
  if (specs.dimensions?.height > 1.5) score += 0.02;

  // Características familiares específicas
  if (specs.comfort?.airConditioning) score += 0.02;
  if (specs.comfort?.heatedSeats) score += 0.01;
  if (specs.safety?.airbags >= 6) score += 0.02;
  if (specs.safety?.stabilityControl) score += 0.01;

  return Math.max(0, Math.min(1, score));
}

function calculateDetailedEconomicScore(vehicle: VehicleComparisonData): number {
  let score = 0;
  const specs = vehicle.specifications ? JSON.parse(vehicle.specifications) : {};

  // Eficiencia de combustible (40% del score)
  score += vehicle.features.efficiency_score * 0.4;

  // Valor por precio (30% del score)
  score += vehicle.features.value_score * 0.3;

  // Tipo de vehículo económico (20% del score)
  if (vehicle.type === 'Hatchback') score += 0.2;
  else if (vehicle.type === 'Sedán') score += 0.15;
  else if (vehicle.type === 'SUV') score += 0.1;
  else if (vehicle.type === 'Deportivo') score -= 0.3;

  // Costo de mantenimiento estimado (10% del score)
  const maintenanceScore = getMaintenanceCost(vehicle.brand, vehicle.price);
  score += (1 - maintenanceScore) * 0.1;

  // Penalizaciones por precio alto
  if (vehicle.price > 300000000) score -= 0.2;
  else if (vehicle.price > 200000000) score -= 0.1;

  return Math.max(0, Math.min(1, score));
}

function calculateDetailedPerformanceScore(vehicle: VehicleComparisonData): number {
  let score = 0;
  const specs = vehicle.specifications ? JSON.parse(vehicle.specifications) : {};

  // Rendimiento general (50% del score)
  score += vehicle.features.performance_score * 0.5;

  // Potencia específica (30% del score)
  const power = specs.performance?.maxPower || specs.combustion?.maxPower || 0;
  if (power > 300) score += 0.2;
  else if (power > 200) score += 0.15;
  else if (power > 150) score += 0.1;

  // Aceleración (20% del score)
  const acceleration = specs.performance?.acceleration0to100 || 10;
  if (acceleration < 5) score += 0.2;
  else if (acceleration < 7) score += 0.15;
  else if (acceleration < 9) score += 0.1;

  // Características deportivas
  if (specs.performance?.allWheelDrive) score += 0.05;
  if (specs.performance?.sportMode) score += 0.03;
  if (vehicle.type === 'Deportivo') score += 0.02;

  return Math.max(0, Math.min(1, score));
}

function calculateDetailedTechnologyScore(vehicle: VehicleComparisonData): number {
  let score = 0;
  const specs = vehicle.specifications ? JSON.parse(vehicle.specifications) : {};

  // Score de tecnología base (40% del score)
  score += vehicle.features.tech_score * 0.4;

  // Características tecnológicas específicas (60% del score)
  if (specs.technology?.touchscreen) score += 0.1;
  if (specs.technology?.navigation) score += 0.1;
  if (specs.technology?.bluetooth) score += 0.05;
  if (specs.technology?.headUpDisplay) score += 0.1;
  if (specs.technology?.wirelessCharging) score += 0.05;
  if (specs.technology?.appleCarPlay) score += 0.05;
  if (specs.technology?.androidAuto) score += 0.05;
  if (specs.technology?.voiceControl) score += 0.05;
  if (specs.technology?.adaptiveCruiseControl) score += 0.05;
  if (specs.technology?.laneAssist) score += 0.05;
  if (specs.technology?.parkingAssist) score += 0.05;
  if (specs.technology?.blindSpotMonitoring) score += 0.05;

  // Tecnología de propulsión
  if (vehicle.fuelType === 'Eléctrico') score += 0.1;
  else if (vehicle.fuelType === 'Híbrido') score += 0.05;

  return Math.max(0, Math.min(1, score));
}

// Funciones auxiliares para cálculo de scores por perfil (mantener para compatibilidad)
function calculateFamilyScore(vehicle: VehicleComparisonData): number {
  return calculateDetailedFamilyScore(vehicle);
}

function calculateEconomicScore(vehicle: VehicleComparisonData): number {
  return calculateDetailedEconomicScore(vehicle);
}

function getFamilyReason(vehicle: VehicleComparisonData): string {
  const reasons = [];
  const specs = vehicle.specifications ? JSON.parse(vehicle.specifications) : {};

  // Razones específicas por tipo
  if (vehicle.type === 'SUV') {
    reasons.push('espacio amplio');
    if (specs.chassis?.groundClearance > 0.15) reasons.push('altura para caminos difíciles');
  } else if (vehicle.type === 'Sedán') {
    reasons.push('comodidad en viajes largos');
    if (specs.dimensions?.length > 4.5) reasons.push('espacio interior generoso');
  }

  // Razones por características de seguridad
  if (specs.safety?.airbags >= 6) reasons.push('múltiples airbags');
  if (specs.safety?.stabilityControl) reasons.push('control de estabilidad');

  // Razones por confort
  if (specs.comfort?.airConditioning) reasons.push('aire acondicionado');
  if (specs.comfort?.heatedSeats) reasons.push('asientos calefaccionados');

  // Razones por precio/practicidad
  if (vehicle.price < 200000000) reasons.push('precio accesible para familias');
  if (vehicle.fuelType === 'Híbrido') reasons.push('eficiencia para el uso diario');

  // Construir frase dinámica
  if (reasons.length >= 3) {
    return `Ideal por su ${reasons.slice(0, 2).join(', ')} y ${reasons[2]}`;
  } else if (reasons.length === 2) {
    return `Combina ${reasons[0]} con ${reasons[1]}`;
  } else if (reasons.length === 1) {
    return `Destacado por su ${reasons[0]}`;
  } else {
    return 'Mejor opción disponible para uso familiar';
  }
}

function getEconomicReason(vehicle: VehicleComparisonData): string {
  const reasons = [];
  const specs = vehicle.specifications ? JSON.parse(vehicle.specifications) : {};

  // Razones específicas por combustible y consumo
  if (vehicle.fuelType === 'Híbrido') {
    const consumption = specs.combustion?.cityConsumption || specs.hybrid?.cityConsumption;
    if (consumption && consumption < 6) {
      reasons.push('consumo ultra bajo de ' + consumption + 'L/100km');
    } else {
      reasons.push('tecnología híbrida eficiente');
    }
  } else if (vehicle.fuelType === 'Eléctrico') {
    const range = specs.electric?.electricRange;
    if (range && range > 300) {
      reasons.push('autonomía de ' + range + 'km sin combustible');
    } else {
      reasons.push('cero costos de combustible');
    }
  } else {
    const consumption = specs.combustion?.cityConsumption;
    if (consumption && consumption < 8) {
      reasons.push('consumo moderado de ' + consumption + 'L/100km');
    }
  }

  // Razones por precio
  if (vehicle.price < 100000000) {
    reasons.push('precio muy accesible');
  } else if (vehicle.price < 150000000) {
    reasons.push('excelente relación calidad-precio');
  }

  // Razones por tipo y practicidad
  if (vehicle.type === 'Hatchback') {
    reasons.push('fácil estacionamiento y maniobrabilidad');
  } else if (vehicle.type === 'Sedán' && vehicle.price < 200000000) {
    reasons.push('equilibrio entre confort y economía');
  }

  // Razones por mantenimiento (basado en marca)
  const economicBrands = ['Honda', 'Toyota', 'Nissan', 'Hyundai', 'Kia'];
  if (economicBrands.includes(vehicle.brand)) {
    reasons.push('bajo costo de mantenimiento');
  }

  // Construir frase dinámica
  if (reasons.length >= 3) {
    return `Económico por su ${reasons.slice(0, 2).join(', ')} y ${reasons[2]}`;
  } else if (reasons.length === 2) {
    return `Combina ${reasons[0]} con ${reasons[1]}`;
  } else if (reasons.length === 1) {
    return `Destacado por su ${reasons[0]}`;
  } else {
    return 'Mejor valor económico disponible';
  }
}

// Función genérica para obtener razones por perfil
function getProfileReason(vehicle: VehicleComparisonData, profile: string): string {
  switch (profile) {
    case 'Familiar':
      return getFamilyReason(vehicle);
    case 'Económico':
      return getEconomicReason(vehicle);
    case 'Performance':
      return getPerformanceReason(vehicle);
    case 'Tecnología':
      return getTechnologyReason(vehicle);
    default:
      return `Mejor opción para perfil ${profile}`;
  }
}
