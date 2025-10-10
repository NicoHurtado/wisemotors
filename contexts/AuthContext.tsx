'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Función para sincronizar el estado desde localStorage
  const syncUserFromStorage = useCallback(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        
        // El usuario ya tiene username del API
        
        setUser(parsedUser);
        
        // Si es admin, verificar que la contraseña esté guardada
        if (parsedUser.email === 'adminwise@wisemotors.co') {
          const adminPassword = localStorage.getItem('adminPassword');
          if (!adminPassword) {
            // Si no hay contraseña admin guardada, limpiar todo
            logout();
            return false;
          }
        }
        
        return true;
      } catch (error) {
        console.error('Error parsing user data:', error);
        logout();
        return false;
      }
    } else {
      setUser(null);
      return false;
    }
  }, []);

  const login = useCallback((userData: User, token: string) => {
    
    // Guardar en localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Actualizar estado inmediatamente
    setUser(userData);
    
    
    // Disparar un evento personalizado para notificar a otros componentes
    window.dispatchEvent(new CustomEvent('auth:login', { detail: userData }));
  }, []);

  const logout = useCallback(() => {
    
    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminPassword'); // Limpiar contraseña admin
    
    // Limpiar estado
    setUser(null);
    
    
    // Disparar un evento personalizado para notificar a otros componentes
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }, []);

  useEffect(() => {
    // Verificar si hay un usuario en localStorage al cargar
    syncUserFromStorage();
    setLoading(false);
  }, [syncUserFromStorage]);

  // Escuchar eventos de autenticación desde otras partes de la app
  useEffect(() => {
    const handleAuthLogin = (event: CustomEvent) => {
      setUser(event.detail);
    };

    const handleAuthLogout = () => {
      setUser(null);
    };

    window.addEventListener('auth:login', handleAuthLogin as EventListener);
    window.addEventListener('auth:logout', handleAuthLogout);

    return () => {
      window.removeEventListener('auth:login', handleAuthLogin as EventListener);
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.email === 'adminwise@wisemotors.co',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
