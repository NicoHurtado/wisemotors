import { z } from 'zod';

export const dealerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  location: z.string().min(1, 'La ubicación es requerida'),
  address: z.string().min(1, 'La dirección es requerida'),
  phone: z.string().min(1, 'El teléfono es requerido'),
  email: z.string().email('Email inválido'),
  status: z.enum(['Activo', 'Inactivo', 'En construcción']).default('Activo'),
});

export const dealerUpdateSchema = dealerSchema.partial();

export type DealerInput = z.infer<typeof dealerSchema>;
export type DealerUpdateInput = z.infer<typeof dealerUpdateSchema>;
