import { SearchParams } from './types';

export const routes = {
  home: '/',
  vehicles: '/vehicles',
  favorites: '/favorites',
  admin: '/admin',
  login: '/login',
} as const;

export function buildVehicleSearchUrl(params: SearchParams): string {
  const searchParams = new URLSearchParams();
  
  if (params.q) searchParams.set('q', params.q);
  if (params.fuel) searchParams.set('fuel', params.fuel);
  if (params.category) searchParams.set('category', params.category);
  if (params.minPrice) searchParams.set('minPrice', params.minPrice);
  if (params.maxPrice) searchParams.set('maxPrice', params.maxPrice);
  if (params.year) searchParams.set('year', params.year);
  
  const queryString = searchParams.toString();
  return queryString ? `${routes.vehicles}?${queryString}` : routes.vehicles;
}

export function getVehicleDetailUrl(id: string): string {
  return `${routes.vehicles}/${id}`;
}

export function getFavoriteToggleUrl(id: string): string {
  return `/api/vehicles/${id}/favorite`;
}
