import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function getFuelLabel(fuel: string): string {
  const fuelMap: Record<string, string> = {
    'GASOLINE': 'Gasolina',
    'DIESEL': 'Diesel',
    'HYBRID': 'HEV',
    'PHEV': 'PHEV',
    'EV': 'EV',
  };
  return fuelMap[fuel] || fuel;
}

export function getCategoryLabel(category?: string): string {
  if (!category) return 'Automóvil';
  
  const categoryMap: Record<string, string> = {
    'Deportivo': 'Deportivo',
    'SUV': 'SUV',
    'Sedan': 'Sedán',
    'Hatchback': 'Hatchback',
    'Pickup': 'Pickup',
    'Van': 'Van',
  };
  return categoryMap[category] || category;
}
