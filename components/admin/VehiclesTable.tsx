'use client';

// ============================================================================
// Lista de vehículos del panel: miniatura, datos clave, estado del precio y
// acciones (ver, editar, eliminar). Sin "N/A": lo que no hay no se muestra.
// ============================================================================

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Eye, Pencil, Search, Sparkles, Trash2 } from 'lucide-react';
import { CarRender } from '@/components/car/CarRender';
import { adminFetch } from '@/lib/admin-fetch';
import { millones, specsDe } from '@/lib/vehiculo-datos';

interface Vehiculo {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  type: string;
  fuelType: string;
  specifications: unknown;
  images?: any[];
}

export function VehiclesTable() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [borrando, setBorrando] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/vehicles?limit=1000')
      .then(r => (r.ok ? r.json() : { vehicles: [] }))
      .then(d => setVehiculos(d.vehicles || []))
      .catch(() => setError('No se pudo cargar la lista de vehículos.'))
      .finally(() => setCargando(false));
  }, []);

  const eliminar = async (v: Vehiculo) => {
    if (!confirm(`¿Eliminar el ${v.brand} ${v.model} ${v.year}? No se puede deshacer.`)) return;
    setBorrando(v.id);
    setError('');
    try {
      const r = await adminFetch(`/api/vehicles/${v.id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error();
      setVehiculos(lista => lista.filter(x => x.id !== v.id));
    } catch {
      setError(`No se pudo eliminar el ${v.brand} ${v.model}. Revisa tu sesión e intenta de nuevo.`);
    } finally {
      setBorrando(null);
    }
  };

  const q = busqueda.trim().toLowerCase();
  const filtrados = vehiculos.filter(v => !q || `${v.brand} ${v.model} ${v.type} ${v.fuelType}`.toLowerCase().includes(q));

  return (
    <div className="p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-[20px] font-semibold tracking-[-0.03em]">
          Vehículos <span className="text-tinta-2/60">({filtrados.length})</span>
        </p>
        <label className="flex h-11 w-full items-center gap-2 rounded-full border border-linea bg-papel px-4 focus-within:border-tinta sm:w-72">
          <Search className="h-4 w-4 text-tinta-2" />
          <span className="sr-only">Buscar vehículos</span>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Marca, modelo o tipo"
            className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-tinta-2/70"
          />
        </label>
      </div>

      {error && <p className="mt-4 rounded-2xl bg-[#efe4f7] px-4 py-3 text-[14px]">{error}</p>}

      {cargando ? (
        <div className="mt-6 space-y-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-[20px] bg-tarjeta" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="estudio mt-6 rounded-[24px] px-6 py-14 text-center">
          <p className="text-[22px] font-semibold tracking-[-0.03em]">
            {q ? 'Nada coincide con esa búsqueda.' : 'Todavía no hay vehículos.'}
          </p>
          {!q && (
            <>
              <p className="mt-1 text-[14px] text-tinta-2">Escribe el nombre de un carro y la IA trae sus datos para que los revises.</p>
              <Link href="/admin/ingest" className="pastilla pastilla--wise mt-6 h-11 px-5">
                <Sparkles className="h-4 w-4" /> Subir el primero con IA
              </Link>
            </>
          )}
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-linea">
          {filtrados.map(v => {
            const estimado = Boolean(specsDe(v.specifications)?.commercial?.priceEstimated);
            return (
              <li key={v.id} className="grid grid-cols-[88px_1fr] items-center gap-4 py-3 md:grid-cols-[112px_1.4fr_1fr_1fr_auto]">
                <div className="estudio flex aspect-[16/10] items-center justify-center rounded-[14px] p-1.5">
                  <CarRender car={v as any} ajustado className="h-full w-full" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[16px] font-semibold tracking-[-0.02em]">
                    {v.brand} {v.model}
                  </p>
                  <p className="text-[13px] text-tinta-2">
                    {v.year} · {v.type} · {v.fuelType}
                  </p>
                </div>
                <div className="col-start-2 md:col-start-auto">
                  <p className="cifra text-[15px]">{millones(v.price)}</p>
                  {estimado && (
                    <span className="mt-1 inline-flex rounded-full bg-[#efe4f7] px-2 py-0.5 text-[11px] font-medium text-wise">Precio estimado</span>
                  )}
                </div>
                <Link
                  href={`/vehicles/${v.id}`}
                  className="col-start-2 inline-flex items-center gap-1 text-[13px] text-tinta-2 hover:text-tinta md:col-start-auto"
                >
                  Ver en la página <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <div className="col-start-2 flex gap-1.5 md:col-start-auto">
                  <Link href={`/admin/vehicles/${v.id}`} className="flecha flecha--fija h-10 w-10" aria-label={`Ver detalle del ${v.brand} ${v.model}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                  <Link href={`/admin/vehicles/${v.id}/edit`} className="flecha flecha--fija h-10 w-10" aria-label={`Editar el ${v.brand} ${v.model}`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => eliminar(v)}
                    disabled={borrando === v.id}
                    className="flecha flecha--fija h-10 w-10 hover:!border-[#e11d48] hover:!text-[#e11d48] disabled:opacity-40"
                    aria-label={`Eliminar el ${v.brand} ${v.model}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
