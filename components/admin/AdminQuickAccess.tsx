'use client';

import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';

/**
 * Atajo al panel para administradores.
 *
 * Antes pedía una contraseña comparada contra una constante del bundle: cualquiera
 * con DevTools la leía, y de todos modos no protegía la API. El acceso real lo
 * decide `User.role` en el servidor, así que aquí solo queda el atajo.
 */
export function AdminQuickAccess() {
  const { isAdmin } = useAdmin();
  const router = useRouter();

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-wise" />
            <span className="text-sm font-medium text-gray-700">Admin</span>
          </div>

          <button
            onClick={() => router.push('/admin')}
            className="px-3 py-1 bg-wise text-white rounded-md hover:bg-wise-dark transition-colors text-sm"
          >
            Panel Admin
          </button>
        </div>
      </div>
    </div>
  );
}
