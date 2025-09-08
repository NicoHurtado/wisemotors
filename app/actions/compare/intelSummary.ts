'use server';

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface VehicleSpecs {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  fuelType: string;
  type: string;
  specifications: any;
}

interface AIAnalysis {
  vehicleId: string;
  pros: string[];
  cons: string[];
  recommendation: string;
  score: number;
}

interface ProfileRecommendation {
  profile: string;
  vehicle: string;
  reason: string;
}

export async function getIntelligentAnalysis(vehicles: VehicleSpecs[]): Promise<{
  analysis: AIAnalysis[];
  profileRecommendations: ProfileRecommendation[];
}> {
  try {
    // Crear un resumen detallado de cada vehículo para la IA
    const vehicleSummaries = vehicles.map(vehicle => {
      const specs = vehicle.specifications;
      
      // Extraer métricas clave
      const performance = {
        power: specs?.performance?.maxPower || specs?.combustion?.maxPower || specs?.hybrid?.maxPower || specs?.phev?.maxPower || 0,
        torque: specs?.combustion?.maxTorque || specs?.hybrid?.maxTorque || specs?.phev?.maxTorque || 0,
        acceleration: specs?.performance?.acceleration0to100 || 15,
        maxSpeed: specs?.performance?.maxSpeed || 150,
      };

      const efficiency = {
        cityConsumption: specs?.combustion?.cityConsumption || specs?.hybrid?.cityConsumption || specs?.phev?.cityConsumption || 0,
        highwayConsumption: specs?.combustion?.highwayConsumption || specs?.hybrid?.highwayConsumption || specs?.phev?.highwayConsumption || 0,
        electricRange: specs?.electric?.electricRange || specs?.phev?.electricRange || 0,
      };

      const features = {
        safety: {
          airbags: specs?.safety?.airbags || 0,
          stabilityControl: specs?.safety?.stabilityControl || false,
          laneAssist: specs?.safety?.laneAssist || false,
        },
        comfort: {
          airConditioning: specs?.comfort?.airConditioning || false,
          heatedSeats: specs?.comfort?.heatedSeats || false,
          ventilatedSeats: specs?.comfort?.ventilatedSeats || false,
        },
        technology: {
          bluetooth: specs?.technology?.bluetooth || false,
          touchscreen: specs?.technology?.touchscreen || false,
          navigation: specs?.technology?.navigation || false,
        }
      };

      return {
        id: vehicle.id,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        price: vehicle.price,
        fuelType: vehicle.fuelType,
        type: vehicle.type,
        performance,
        efficiency,
        features,
        wisemetrics: specs?.wisemetrics || {}
      };
    });

    // Prompt para análisis individual de cada vehículo
    const individualAnalysisPrompt = `
    Analiza este vehículo y proporciona:
    1. 3-4 ventajas principales basadas en sus especificaciones reales
    2. 2-3 desventajas o limitaciones reales
    3. Una recomendación personalizada en una frase
    4. Un score del 0-100 basado en relación calidad-precio y características

    Vehículo: ${JSON.stringify(vehicleSummaries, null, 2)}

    Responde en formato JSON:
    {
      "analysis": [
        {
          "vehicleId": "id",
          "pros": ["ventaja1", "ventaja2", "ventaja3"],
          "cons": ["desventaja1", "desventaja2"],
          "recommendation": "recomendación personalizada",
          "score": 85
        }
      ]
    }
    `;

    // Prompt para recomendaciones por perfil
    const profileRecommendationsPrompt = `
    Basándote en estos vehículos, recomienda cuál es mejor para cada perfil de conductor:

    Perfiles:
    - Familiar: Prioriza espacio, seguridad, confort y practicidad
    - Performance: Prioriza potencia, aceleración, manejo y deportividad
    - Economía: Prioriza eficiencia, bajo consumo, mantenimiento y precio
    - Tecnología: Prioriza features tecnológicos, seguridad avanzada e innovación

    Vehículos: ${JSON.stringify(vehicleSummaries, null, 2)}

    Responde en formato JSON:
    {
      "profileRecommendations": [
        {
          "profile": "Familiar",
          "vehicle": "Marca Modelo",
          "reason": "Razón específica basada en características reales"
        }
      ]
    }
    `;

    // Llamar a OpenAI para análisis individual
    const individualResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Eres un experto en automóviles que analiza vehículos basándose en sus especificaciones técnicas reales. Sé objetivo, preciso y basado en datos."
        },
        {
          role: "user",
          content: individualAnalysisPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    // Llamar a OpenAI para recomendaciones por perfil
    const profileResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Eres un asesor automotriz experto que recomienda vehículos según el perfil del conductor. Basa tus recomendaciones en las especificaciones reales de los vehículos."
        },
        {
          role: "user",
          content: profileRecommendationsPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    // Parsear respuestas
    let analysis: AIAnalysis[] = [];
    let profileRecommendations: ProfileRecommendation[] = [];

    try {
      const individualData = JSON.parse(individualResponse.choices[0].message.content || '{}');
      analysis = individualData.analysis || [];
    } catch (error) {
      console.error('Error parsing individual analysis:', error);
      // Fallback a análisis básico
      analysis = generateFallbackAnalysis(vehicles);
    }

    try {
      const profileData = JSON.parse(profileResponse.choices[0].message.content || '{}');
      profileRecommendations = profileData.profileRecommendations || [];
    } catch (error) {
      console.error('Error parsing profile recommendations:', error);
      // Fallback a recomendaciones básicas
      profileRecommendations = generateFallbackProfileRecommendations(vehicles);
    }

    return { analysis, profileRecommendations };

  } catch (error) {
    console.error('Error calling OpenAI:', error);
    
    // Fallback completo en caso de error
    return {
      analysis: generateFallbackAnalysis(vehicles),
      profileRecommendations: generateFallbackProfileRecommendations(vehicles)
    };
  }
}

// Función de fallback para análisis individual
function generateFallbackAnalysis(vehicles: VehicleSpecs[]): AIAnalysis[] {
  return vehicles.map(vehicle => {
    const specs = vehicle.specifications;
    
    let pros: string[] = [];
    let cons: string[] = [];
    let recommendation = '';
    let score = 70;

    if (vehicle.fuelType === 'Eléctrico') {
      pros.push('Cero emisiones y bajo costo de operación');
      pros.push('Aceleración instantánea y silencioso');
      cons.push('Tiempo de carga más largo');
      recommendation = 'Excelente opción para uso urbano y compromiso ambiental';
      score = 85;
    } else if (vehicle.fuelType === 'Híbrido') {
      pros.push('Eficiencia combinada gasolina-eléctrico');
      pros.push('Menor consumo en ciudad');
      cons.push('Precio inicial más alto');
      recommendation = 'Ideal para conductores que buscan eficiencia sin compromisos';
      score = 78;
    } else {
      pros.push('Rendimiento probado y confiable');
      pros.push('Fácil mantenimiento y repuestos');
      cons.push('Mayor consumo de combustible');
      recommendation = 'Opción tradicional confiable para uso diario';
      score = 72;
    }

    return {
      vehicleId: vehicle.id,
      pros: pros.slice(0, 4),
      cons: cons.slice(0, 3),
      recommendation,
      score: Math.max(0, Math.min(100, score))
    };
  });
}

// Función de fallback para recomendaciones por perfil
function generateFallbackProfileRecommendations(vehicles: VehicleSpecs[]): ProfileRecommendation[] {
  const profiles = [
    { profile: 'Familiar', icon: '👥' },
    { profile: 'Performance', icon: '🚀' },
    { profile: 'Economía', icon: '💰' },
    { profile: 'Tecnología', icon: '📱' }
  ];

  return profiles.map(profile => {
    // Lógica básica de selección
    let bestVehicle = vehicles[0];
    
    if (profile.profile === 'Performance') {
      bestVehicle = vehicles.find(v => v.type === 'Deportivo') || vehicles[0];
    } else if (profile.profile === 'Economía') {
      bestVehicle = vehicles.reduce((best, current) => 
        current.price < best.price ? current : best
      );
    } else if (profile.profile === 'Tecnología') {
      bestVehicle = vehicles.find(v => v.specifications?.technology) || vehicles[0];
    }

    return {
      profile: profile.profile,
      vehicle: `${bestVehicle.brand} ${bestVehicle.model}`,
      reason: `Seleccionado por características que se adaptan al perfil ${profile.profile}`
    };
  });
}








