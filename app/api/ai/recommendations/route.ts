import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt inválido' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY no configurada' }, { status: 500 });
    }

    // Traer vehículos base (limit para mantener contexto pequeño)
    const vehicles = await prisma.vehicle.findMany({
      include: { images: { orderBy: { order: 'asc' } } }
    });

    // Preparar contexto compacto para el modelo
    const vehicleSummaries = vehicles.map((v) => {
      let specs: any = {};
      try {
        specs = JSON.parse(v.specifications);
      } catch {}
      return {
        // Datos base del vehículo
        id: v.id,
        brand: v.brand,
        model: v.model,
        year: v.year,
        price: v.price,
        type: v.type,
        vehicleType: v.vehicleType,
        fuelType: v.fuelType,
        status: v.status,
        wiseCategories: v.wiseCategories,
        history: v.history,
        
        // Imágenes (solo metadatos necesarios)
        images: (v.images || []).map((img) => ({ url: img.url, type: img.type, alt: img.alt })),
        
        // TODAS las especificaciones conocidas (tal cual en BD)
        specifications: specs,
      };
    });

    const systemPrompt = `Eres un asistente de recomendaciones de vehículos. Debes escoger los 3 mejores vehículos basándote EXCLUSIVAMENTE en la lista proporcionada. No inventes datos ni modelos que no estén en la lista. Devuelve una salida estrictamente en JSON con el formato:
{
  "items": [
    {
      "id": "<vehicle id>",
      "match": 0-100,
      "reasons": ["corta justificación 1", "corta justificación 2"]
    }, { ... }, { ... }
  ]
}
La puntuación "match" debe justificar cómo se ajusta el vehículo al prompt considerando precio, tipo de vehículo, eficiencia/consumo, rendimiento y practicidad. Prioriza precisión sobre creatividad.`;

    const userContent = `PROMPT: ${prompt}\n\nVEHICLES_JSON: ${JSON.stringify({ vehicles: vehicleSummaries }).slice(0, 200000)}`;
    const body = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    } as any;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('OpenAI error:', text);
      return NextResponse.json({ error: 'Error al obtener recomendaciones' }, { status: 500 });
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch { parsed = {}; }

    const top = Array.isArray(parsed.items) ? parsed.items.slice(0, 3) : [];
    const idToMeta: Record<string, any> = Object.fromEntries(vehicles.map(v => [v.id, v]));
    const results = top
      .map((it: any, idx: number) => {
        const v = idToMeta[it.id];
        if (!v) return null;
        return {
          rank: idx + 1,
          match: Math.max(0, Math.min(100, Math.round(Number(it.match) || 0))),
          reasons: Array.isArray(it.reasons) ? it.reasons.slice(0, 4) : [],
          vehicle: {
            id: v.id,
            brand: v.brand,
            model: v.model,
            year: v.year,
            price: v.price,
            fuelType: v.fuelType,
            type: v.type,
            imageUrl: v.images?.[0]?.url || null,
          }
        };
      })
      .filter(Boolean);

    return NextResponse.json({ prompt, results });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}


