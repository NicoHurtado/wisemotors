import { z } from 'zod';

const vacioANull = (v: unknown) => (v === '' || v === undefined ? null : v);

export const dealerSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  location: z.string().trim().min(1, 'La ciudad es requerida'),
  address: z.string().trim().min(1, 'La dirección es requerida'),
  phone: z.string().trim().min(1, 'El teléfono es requerido'),
  email: z.string().trim().email('Email inválido'),
  status: z.enum(['Activo', 'Inactivo', 'En construcción']).default('Activo'),
  // Ubicación: link de Google Maps + coordenadas leídas de él (o escritas a mano)
  mapsUrl: z.preprocess(vacioANull, z.string().trim().url('Link inválido').max(2000).nullable()).optional(),
  lat: z.preprocess(vacioANull, z.coerce.number().min(-90).max(90).nullable()).optional(),
  lng: z.preprocess(vacioANull, z.coerce.number().min(-180).max(180).nullable()).optional(),
  horario: z.preprocess(vacioANull, z.string().trim().max(200).nullable()).optional(),
  // Los carros que vende (VehicleDealer). Si viene, reemplaza la lista completa.
  vehicleIds: z.array(z.string().min(1)).max(2000).optional(),
});

export const dealerUpdateSchema = dealerSchema.partial();

export type DealerInput = z.infer<typeof dealerSchema>;
export type DealerUpdateInput = z.infer<typeof dealerUpdateSchema>;
