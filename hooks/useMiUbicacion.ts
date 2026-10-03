'use client';

// La ubicación de la persona, SOLO cuando la pide (botón "¿Qué tan cerca
// estás?"). Se queda en su navegador: se usa para calcular distancias aquí y
// nunca se manda al servidor. Se recuerda durante la visita (sessionStorage).

import { useCallback, useEffect, useState } from 'react';
import type { Coordenadas } from '@/lib/distancia';

const CLAVE = 'wise.ubicacion';
type Estado = 'sin-pedir' | 'pidiendo' | 'lista' | 'negada' | 'no-disponible';

export function useMiUbicacion() {
  const [yo, setYo] = useState<Coordenadas | null>(null);
  const [estado, setEstado] = useState<Estado>('sin-pedir');

  useEffect(() => {
    try {
      const g = JSON.parse(sessionStorage.getItem(CLAVE) ?? 'null');
      if (g && typeof g.lat === 'number' && typeof g.lng === 'number') {
        setYo(g);
        setEstado('lista');
      }
    } catch {
      // sin almacenamiento: se vuelve a pedir
    }
  }, []);

  const pedir = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setEstado('no-disponible');
      return;
    }
    setEstado('pidiendo');
    navigator.geolocation.getCurrentPosition(
      p => {
        // Redondeada a ~100 m: de sobra para "a 3,2 km" y más privada
        const c = { lat: Math.round(p.coords.latitude * 1000) / 1000, lng: Math.round(p.coords.longitude * 1000) / 1000 };
        setYo(c);
        setEstado('lista');
        try {
          sessionStorage.setItem(CLAVE, JSON.stringify(c));
        } catch {
          // no pasa nada
        }
      },
      err => setEstado(err.code === err.PERMISSION_DENIED ? 'negada' : 'no-disponible'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 }
    );
  }, []);

  return { yo, estado, pedir };
}
