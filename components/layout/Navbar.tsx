'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { User, LogOut, Heart, Target, Settings } from 'lucide-react';
import { useEffect } from 'react';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { isFullyAuthorized } = useAdmin();


  // Escuchar eventos de autenticación para actualizar inmediatamente
  useEffect(() => {
    const handleAuthLogin = () => {
      // El estado se actualiza automáticamente desde el contexto
    };

    const handleAuthLogout = () => {
      // El estado se actualiza automáticamente desde el contexto
    };

    window.addEventListener('auth:login', handleAuthLogin);
    window.addEventListener('auth:logout', handleAuthLogout);

    return () => {
      window.removeEventListener('auth:login', handleAuthLogin);
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  const handleLogout = () => {
    logout();
    // Redirigir a la página principal
    window.location.href = '/';
  };

  return (
    <nav className="bg-white border-b border-gray-100 shadow-softer">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold">
              <span className="text-wise">Wise</span>
              <span className="text-foreground">Motors</span>
            </span>
          </Link>

          {/* Navigation Links - Centered */}
          <div className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-wise transition-colors font-medium"
            >
              Inicio
            </Link>
            <Link 
              href="/vehicles" 
              className="text-gray-700 hover:text-wise transition-colors font-medium"
            >
              Vehículos
            </Link>
                  {isAuthenticated && (
        <>
          <Link
            href="/favorites"
            className="text-gray-700 hover:text-wise transition-colors font-medium flex items-center space-x-2"
          >
            <Heart className="w-4 h-4" />
            <span>Favoritos</span>
          </Link>
          <Link
            href="/compare"
            className="text-gray-700 hover:text-wise transition-colors font-medium flex items-center space-x-2"
          >
            <Target className="w-4 h-4" />
            <span>Comparar</span>
          </Link>
          
          {/* Dashboard solo para usuarios admin */}
          {isFullyAuthorized && (
            <Link
              href="/admin"
              className="text-gray-700 hover:text-wise transition-colors font-medium flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
          )}
        </>
      )}
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-gray-700">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">{user?.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar sesión
                </Button>
              </div>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">
                    Iniciar sesión
                  </Link>
                </Button>
                <Button variant="wise" asChild>
                  <Link href="/register">
                    Crear cuenta
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
