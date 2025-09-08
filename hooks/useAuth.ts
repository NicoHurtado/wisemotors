'use client';

import { useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Función para sincronizar el estado desde localStorage
  const syncUserFromStorage = useCallback(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('useAuth: Syncing user from localStorage:', parsedUser);
        setUser(parsedUser);
        return true;
      } catch (error) {
        console.error('Error parsing user data:', error);
        logout();
        return false;
      }
    } else {
      console.log('useAuth: No user data found in localStorage');
      setUser(null);
      return false;
    }
  }, []);

  useEffect(() => {
    // Verificar si hay un usuario en localStorage al cargar
    syncUserFromStorage();
    setLoading(false);
  }, [syncUserFromStorage]);

  const login = useCallback((userData: User, token: string) => {
    console.log('useAuth: Login called with userData:', userData);
    
    // Guardar en localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Actualizar estado inmediatamente
    setUser(userData);
    
    console.log('useAuth: User state updated, user:', userData);
    
    // Disparar un evento personalizado para notificar a otros componentes
    window.dispatchEvent(new CustomEvent('auth:login', { detail: userData }));
  }, []);

  const logout = useCallback(() => {
    console.log('useAuth: Logout called');
    
    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Limpiar estado
    setUser(null);
    
    console.log('useAuth: User state cleared');
    
    // Disparar un evento personalizado para notificar a otros componentes
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }, []);

  // Escuchar eventos de autenticación desde otras partes de la app
  useEffect(() => {
    const handleAuthLogin = (event: CustomEvent) => {
      console.log('useAuth: Received auth:login event:', event.detail);
      setUser(event.detail);
    };

    const handleAuthLogout = () => {
      console.log('useAuth: Received auth:logout event');
      setUser(null);
    };

    window.addEventListener('auth:login', handleAuthLogin as EventListener);
    window.addEventListener('auth:logout', handleAuthLogout);

    return () => {
      window.removeEventListener('auth:login', handleAuthLogin as EventListener);
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  console.log('useAuth: Current state - user:', user, 'isAuthenticated:', isAuthenticated);

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    syncUserFromStorage
  };
}
