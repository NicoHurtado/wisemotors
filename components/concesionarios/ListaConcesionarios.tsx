'use client';

// Todos los concesionarios; si la persona comparte su ubicación, del más
// cercano al más lejano (la distancia se calcula en su navegador).

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useMiUbicacion } from '@/hooks/useMiUbicacion';
import { porCercania } from '@/lib/distancia';
import { BotonCercania, TarjetaConcesionario, type Concesionario } from './piezas';

export function ListaConcesionarios({ lista }: { lista: (Concesionario & { carros: number })[] }) {
  const { yo, estado, pedir } = useMiUbicacion();
  const [q, setQ] = useState('');
  const visibles = useMemo(() => {
    const t = q.trim().toLowerCase();
    const filtrados = t ? lista.filter(c => `${c.name} ${c.location} ${c.address ?? ''}`.toLowerCase().includes(t)) : lista;
    return porCercania(filtrados, yo);
  }, [lista, q, yo]);

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-2" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Busca por nombre, ciudad o barrio"
            aria-label="Buscar concesionarios"
            className="h-12 w-full rounded-full border border-linea bg-blanco pl-11 pr-5 text-[15px] focus:border-tinta focus:outline-none"
          />
        </div>
        <BotonCercania estado={estado} pedir={pedir} />
      </div>
      {estado === 'lista' && <p className="mt-3 text-[13px] text-tinta-2">Ordenados del más cercano al más lejano. Tu ubicación no sale de tu navegador.</p>}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibles.map(c => (
          <TarjetaConcesionario key={c.id} c={c} yo={yo} carros={c.carros} />
        ))}
      </div>
      {visibles.length === 0 && <p className="mt-6 rounded-2xl bg-blanco p-6 text-tinta-2">Ningún concesionario coincide con “{q}”.</p>}
    </div>
  );
}
