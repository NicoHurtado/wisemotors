import { useAuth } from '@/contexts/AuthContext';

export function useAdmin() {
  const { user } = useAuth();
  
  const isAdmin = user?.email === 'adminwise@wisemotors.co';
  const isAuthenticated = !!user;
  
  // Verificar que la contraseña sea la correcta para usuarios admin
  const isPasswordCorrect = () => {
    if (!isAdmin) return false;
    const storedPassword = localStorage.getItem('adminPassword');
    return storedPassword === 'OlartePedroNico';
  };
  
  const isFullyAuthorized = isAdmin && isPasswordCorrect();
  
  return {
    isAdmin,
    isAuthenticated,
    isFullyAuthorized,
    user
  };
}
