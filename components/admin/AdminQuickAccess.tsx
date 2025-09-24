'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Settings, Lock, Unlock } from 'lucide-react';

export function AdminQuickAccess() {
  const { user } = useAuth();
  const { isAdmin, isFullyAuthorized } = useAdmin();
  const router = useRouter();
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // No mostrar nada si no es admin
  if (!isAdmin) {
    return null;
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    // Simular verificación (en un caso real, esto debería ser verificado en el servidor)
    if (password === 'OlartePedroNico') {
      localStorage.setItem('adminPassword', password);
      // Recargar la página para que el contexto se actualice
      window.location.reload();
    } else {
      alert('Contraseña incorrecta');
    }

    setIsVerifying(false);
  };

  const handleDirectAccess = () => {
    if (isFullyAuthorized) {
      router.push('/admin');
    } else {
      setShowPasswordInput(true);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-wise" />
            <span className="text-sm font-medium text-gray-700">Admin</span>
            {isFullyAuthorized ? (
              <Unlock className="w-4 h-4 text-green-500" />
            ) : (
              <Lock className="w-4 h-4 text-yellow-500" />
            )}
          </div>
          
          {!showPasswordInput ? (
            <button
              onClick={handleDirectAccess}
              className="px-3 py-1 bg-wise text-white rounded-md hover:bg-wise-dark transition-colors text-sm"
            >
              {isFullyAuthorized ? 'Panel Admin' : 'Acceder'}
            </button>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="flex items-center gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña admin"
                className="px-2 py-1 border border-gray-300 rounded text-sm"
                required
              />
              <button
                type="submit"
                disabled={isVerifying}
                className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
              >
                {isVerifying ? '...' : 'OK'}
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordInput(false)}
                className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
              >
                Cancelar
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
