import { useAuth } from '@/contexts/AuthContext';

/**
 * Estado de administrador para la UI.
 *
 * Esto decide qué se *muestra*, no qué se *permite*: la autorización real vive en
 * el servidor (`requireAdmin` en `lib/api-auth.ts`), que relee el rol desde la base
 * de datos en cada petición. Aquí no puede haber ningún secreto — todo este archivo
 * viaja al navegador.
 */
export function useAdmin() {
  const { user, loading } = useAuth();

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  return {
    isAdmin,
    isAuthenticated,
    isFullyAuthorized: isAuthenticated && isAdmin,
    isChecking: loading,
    user,
  };
}
