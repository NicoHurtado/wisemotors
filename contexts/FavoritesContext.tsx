'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface FavoriteVehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  fuelType: string;
  type: string;
  imageUrl: string | null;
  specifications?: any; // Agregar specifications
  match?: number;
  reasons?: string[];
}

interface FavoritesContextType {
  favorites: FavoriteVehicle[];
  loading: boolean;
  error: string | null;
  addToFavorites: (vehicleId: string) => Promise<void>;
  removeFromFavorites: (vehicleId: string) => Promise<void>;
  toggleFavorite: (vehicleId: string) => Promise<void>;
  isFavorite: (vehicleId: string) => boolean;
  refetch: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteVehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener token del localStorage
  const getToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }, []);

  // Obtener favoritos
  const fetchFavorites = useCallback(async () => {
    const token = getToken();
    if (!user || !token) {
      console.log('FavoritesContext: No user or token, clearing favorites');
      setFavorites([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('FavoritesContext: Fetching favorites for user:', user.id);

      const response = await fetch('/api/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('FavoritesContext: Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('FavoritesContext: Error response:', errorText);
        throw new Error('Error al cargar favoritos');
      }

      const data = await response.json();
      console.log('FavoritesContext: Fetched data:', data);
      
      // Transformar datos al formato esperado
      const transformedFavorites: FavoriteVehicle[] = data.favorites.map((fav: any) => ({
        id: fav.vehicle.id,
        brand: fav.vehicle.brand,
        model: fav.vehicle.model,
        year: fav.vehicle.year,
        price: fav.vehicle.price,
        fuelType: fav.vehicle.fuelType,
        type: fav.vehicle.type,
        imageUrl: fav.vehicle.images?.[0]?.url || null,
        specifications: fav.vehicle.specifications
      }));

      console.log('FavoritesContext: Transformed favorites:', transformedFavorites);
      setFavorites(transformedFavorites);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('FavoritesContext: Error fetching favorites:', err);
    } finally {
      setLoading(false);
    }
  }, [user, getToken]);

  // Añadir a favoritos
  const addToFavorites = useCallback(async (vehicleId: string) => {
    const token = getToken();
    if (!user || !token) {
      throw new Error('Debes estar registrado para añadir favoritos');
    }

    try {
      console.log('FavoritesContext: Adding vehicle to favorites:', vehicleId);
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vehicleId })
      });

      console.log('FavoritesContext: Add response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('FavoritesContext: Add error response:', errorData);
        throw new Error(errorData.error || 'Error al añadir a favoritos');
      }

      const result = await response.json();
      console.log('FavoritesContext: Add success result:', result);

      // Actualizar estado local inmediatamente
      const newFavorite = result.favorite;
      setFavorites(prev => [...prev, {
        id: newFavorite.vehicle.id,
        brand: newFavorite.vehicle.brand,
        model: newFavorite.vehicle.model,
        year: newFavorite.vehicle.year,
        price: newFavorite.vehicle.price,
        fuelType: newFavorite.vehicle.fuelType,
        type: newFavorite.vehicle.type,
        imageUrl: newFavorite.vehicle.images?.[0]?.url || null,
        specifications: newFavorite.vehicle.specifications
      }]);

      return;
    } catch (err) {
      console.error('FavoritesContext: Error adding to favorites:', err);
      throw err;
    }
  }, [user, getToken]);

  // Quitar de favoritos
  const removeFromFavorites = useCallback(async (vehicleId: string) => {
    const token = getToken();
    if (!user || !token) {
      throw new Error('Debes estar registrado para gestionar favoritos');
    }

    try {
      console.log('FavoritesContext: Removing vehicle from favorites:', vehicleId);
      const response = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vehicleId })
      });

      console.log('FavoritesContext: Remove response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('FavoritesContext: Remove error response:', errorData);
        throw new Error(errorData.error || 'Error al quitar de favoritos');
      }

      const result = await response.json();
      console.log('FavoritesContext: Remove success result:', result);

      // Actualizar estado local inmediatamente
      setFavorites(prev => prev.filter(fav => fav.id !== vehicleId));

      return;
    } catch (err) {
      console.error('FavoritesContext: Error removing from favorites:', err);
      throw err;
    }
  }, [user, getToken]);

  // Verificar si un vehículo está en favoritos
  const isFavorite = useCallback((vehicleId: string) => {
    const result = favorites.some(fav => fav.id === vehicleId);
    console.log('FavoritesContext: Checking if vehicle is favorite:', vehicleId, 'Result:', result);
    return result;
  }, [favorites]);

  // Toggle favorito
  const toggleFavorite = useCallback(async (vehicleId: string) => {
    try {
      console.log('FavoritesContext: Toggling favorite for vehicle:', vehicleId);
      if (isFavorite(vehicleId)) {
        console.log('FavoritesContext: Vehicle is favorite, removing...');
        await removeFromFavorites(vehicleId);
      } else {
        console.log('FavoritesContext: Vehicle is not favorite, adding...');
        await addToFavorites(vehicleId);
      }
    } catch (err) {
      console.error('FavoritesContext: Error toggling favorite:', err);
      throw err;
    }
  }, [isFavorite, addToFavorites, removeFromFavorites]);

  // Cargar favoritos al montar el componente
  useEffect(() => {
    const token = getToken();
    console.log('FavoritesContext: useEffect triggered, user:', user?.id, 'token:', !!token);
    fetchFavorites();
  }, [fetchFavorites, getToken]);

  const value: FavoritesContextType = {
    favorites,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
