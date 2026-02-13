'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
  specifications?: any;
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

  const getToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }, []);

  // Memoize the set of favorite IDs for O(1) lookup
  const favoriteIds = useMemo(() => new Set(favorites.map(f => f.id)), [favorites]);

  const fetchFavorites = useCallback(async () => {
    const token = getToken();
    if (!user || !token) {
      setFavorites([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('auth:logout'));
        setFavorites([]);
        return;
      }

      if (!response.ok) {
        throw new Error('Error al cargar favoritos');
      }

      const data = await response.json();

      const transformedFavorites: FavoriteVehicle[] = data.favorites.map((fav: any) => {
        const thumbnailImage = fav.vehicle.images?.find((img: any) => img.isThumbnail)?.url ||
          fav.vehicle.images?.find((img: any) => img.type === 'gallery')?.url ||
          fav.vehicle.images?.[0]?.url || null;

        return {
          id: fav.vehicle.id,
          brand: fav.vehicle.brand,
          model: fav.vehicle.model,
          year: fav.vehicle.year,
          price: fav.vehicle.price,
          fuelType: fav.vehicle.fuelType,
          type: fav.vehicle.type,
          imageUrl: thumbnailImage,
          specifications: fav.vehicle.specifications
        };
      });

      setFavorites(transformedFavorites);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [user, getToken]);

  const addToFavorites = useCallback(async (vehicleId: string) => {
    const token = getToken();
    if (!user || !token) {
      throw new Error('Debes estar registrado para añadir favoritos');
    }

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vehicleId })
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('auth:logout'));
        throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      }

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          const errorText = await response.text();
          throw new Error(`Error ${response.status}: ${errorText || 'Error al añadir a favoritos'}`);
        }
        throw new Error(errorData.error || `Error ${response.status}: Error al añadir a favoritos`);
      }

      const result = await response.json();
      const newFavorite = result.favorite;

      const thumbnailImage = newFavorite.vehicle.images?.find((img: any) => img.isThumbnail)?.url ||
        newFavorite.vehicle.images?.find((img: any) => img.type === 'gallery')?.url ||
        newFavorite.vehicle.images?.[0]?.url || null;

      setFavorites(prev => [...prev, {
        id: newFavorite.vehicle.id,
        brand: newFavorite.vehicle.brand,
        model: newFavorite.vehicle.model,
        year: newFavorite.vehicle.year,
        price: newFavorite.vehicle.price,
        fuelType: newFavorite.vehicle.fuelType,
        type: newFavorite.vehicle.type,
        imageUrl: thumbnailImage,
        specifications: newFavorite.vehicle.specifications
      }]);
    } catch (err) {
      throw err;
    }
  }, [user, getToken]);

  const removeFromFavorites = useCallback(async (vehicleId: string) => {
    const token = getToken();
    if (!user || !token) {
      throw new Error('Debes estar registrado para gestionar favoritos');
    }

    try {
      const response = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vehicleId })
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('auth:logout'));
        throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      }

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          const errorText = await response.text();
          throw new Error(`Error ${response.status}: ${errorText || 'Error al quitar de favoritos'}`);
        }
        throw new Error(errorData.error || `Error ${response.status}: Error al quitar de favoritos`);
      }

      // Optimistic update - remove immediately
      setFavorites(prev => prev.filter(fav => fav.id !== vehicleId));
    } catch (err) {
      throw err;
    }
  }, [user, getToken]);

  const isFavorite = useCallback((vehicleId: string) => {
    return favoriteIds.has(vehicleId);
  }, [favoriteIds]);

  const toggleFavorite = useCallback(async (vehicleId: string) => {
    if (isFavorite(vehicleId)) {
      await removeFromFavorites(vehicleId);
    } else {
      await addToFavorites(vehicleId);
    }
  }, [isFavorite, addToFavorites, removeFromFavorites]);

  // Only fetch when user changes (login/logout)
  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<FavoritesContextType>(() => ({
    favorites,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavorites
  }), [favorites, loading, error, addToFavorites, removeFromFavorites, toggleFavorite, isFavorite, fetchFavorites]);

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
