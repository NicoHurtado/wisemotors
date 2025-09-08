'use client';

import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { isFullyAuthorized, isAuthenticated, user } = useAdmin();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && isFullyAuthorized) {
      setIsAuthorized(true);
    } else if (isAuthenticated && !isFullyAuthorized) {
      // Usuario no está completamente autorizado, redirigir a home
      router.push('/');
    } else {
      // No hay usuario, redirigir a login
      router.push('/login');
    }
    
    setIsLoading(false);
  }, [isFullyAuthorized, isAuthenticated, user, router]);

  // Mostrar loading mientras se verifica
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-wise/5 to-wise/10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wise mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autorización de administrador...</p>
        </div>
      </div>
    );
  }

  // Si no está autorizado, no renderizar nada (ya se redirigió)
  if (!isAuthorized) {
    return null;
  }

  // Si está autorizado, mostrar solo el contenido del dashboard admin
  return (
    <div className="admin-dashboard-only">
      {children}
    </div>
  );
}
