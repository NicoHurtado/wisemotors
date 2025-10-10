import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

export function useAdmin() {
  const { user, loading } = useAuth();
  const [isFullyAuthorized, setIsFullyAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  const isAdmin = user?.email === 'adminwise@wisemotors.co';
  const isAuthenticated = !!user;
  
  // Verificar autorización completa
  useEffect(() => {
    const checkAuthorization = () => {
      if (loading) {
        setIsChecking(true);
        return;
      }

      if (!isAuthenticated || !isAdmin) {
        setIsFullyAuthorized(false);
        setIsChecking(false);
        return;
      }

      // Para usuarios admin, verificar contraseña
      const storedPassword = localStorage.getItem('adminPassword');
      const isPasswordCorrect = storedPassword === 'OlartePedroNico';
      
      setIsFullyAuthorized(isPasswordCorrect);
      setIsChecking(false);
    };

    checkAuthorization();
  }, [user, loading, isAuthenticated, isAdmin]);
  
  return {
    isAdmin,
    isAuthenticated,
    isFullyAuthorized,
    isChecking,
    user
  };
}
