'use client';

import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { isFullyAuthorized, isAuthenticated, isChecking, user } = useAdmin();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // No hacer nada si aún se está verificando
    if (isChecking) {
      return;
    }

    if (isAuthenticated && isFullyAuthorized) {
      setIsAuthorized(true);
    } else if (isAuthenticated && !isFullyAuthorized) {
      // Usuario está logueado pero no es admin completamente autorizado
      // Verificar si es admin pero le falta la contraseña
      if (user?.email === 'adminwise@wisemotors.co') {
        // Es admin pero no tiene la contraseña correcta guardada
        // Redirigir a home en lugar de login
        router.push('/');
      } else {
        // No es admin, redirigir a home
        router.push('/');
      }
    } else {
      // No hay usuario logueado, redirigir a login
      router.push('/login');
    }
  }, [isFullyAuthorized, isAuthenticated, isChecking, user, router]);

  // Mostrar loading mientras se verifica
  if (isChecking) {
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
