// ============================================================================
// Cliente de Claude para la ingesta.
//
// Una sola puerta: pedirJson() manda un prompt y devuelve un objeto validado
// contra un esquema Zod (salida estructurada: el modelo no puede devolver JSON
// roto ni campos fuera del esquema). La validación de NEGOCIO — keys del
// registro, rangos físicos, citas — sigue en lib/ingest; esto solo garantiza
// la forma.
//
// Variables de entorno:
//   ANTHROPIC_API_KEY       obligatoria
//   ANTHROPIC_WORKSPACE_ID  solo si la clave no está atada a un workspace
// ============================================================================

import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import type { z } from 'zod/v4';

export const CLAUDE_MODEL = 'claude-opus-5';

let cliente: Anthropic | null = null;

function claude(): Anthropic {
  if (cliente) return cliente;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY no está definida: la ingesta necesita a Claude.');
  }
  const workspace = process.env.ANTHROPIC_WORKSPACE_ID;
  cliente = new Anthropic({
    defaultHeaders: workspace ? { 'anthropic-workspace-id': workspace } : undefined,
  });
  return cliente;
}

export async function pedirJson<T extends z.ZodType>(opts: {
  schema: T;
  prompt: string;
  system?: string;
  maxTokens?: number;
}): Promise<z.infer<T>> {
  const res = await claude().beta.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: opts.maxTokens ?? 16000,
    ...(opts.system ? { system: opts.system } : {}),
    messages: [{ role: 'user', content: opts.prompt }],
    output_config: { format: betaZodOutputFormat(opts.schema) },
    // Si el modelo declina por política, la API reintenta con otro modelo en
    // la misma llamada en vez de dejar el vehículo a medias.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
  });

  if (res.stop_reason === 'refusal') {
    throw new Error('Claude declinó la solicitud; revisar el texto de la fuente.');
  }
  if (res.stop_reason === 'max_tokens') {
    throw new Error('La respuesta de Claude se cortó por longitud (max_tokens).');
  }
  if (res.parsed_output == null) {
    throw new Error('Claude no devolvió un JSON válido para el esquema pedido.');
  }
  return res.parsed_output as z.infer<T>;
}
