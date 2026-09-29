'use client';

// ============================================================================
// Calificaciones de la IA (👍/👎 de la búsqueda y del veredicto del
// comparador): cuánto sirve y, sobre todo, qué no sirvió y por qué. Las
// negativas van primero: son la lista de lo que hay que mejorar.
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { Loader2, ThumbsDown, ThumbsUp } from 'lucide-react';
import { adminFetch, mensajeDeErrorDeAuth } from '@/lib/admin-fetch';

interface Resumen {
  tipo: string;
  total: number;
  utiles: number;
  total30: number;
  utiles30: number;
}
interface Fila {
  id: string;
  tipo: string;
  clave: string;
  util: boolean;
  comentario: string | null;
  detalle: any;
  conCuenta: boolean;
  fecha: string;
}

const NOMBRE: Record<string, string> = { busqueda: 'Búsqueda con IA', comparacion: 'Veredicto del comparador' };
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)} %` : '—');

export function Calificaciones() {
  const [datos, setDatos] = useState<{ resumen: Resumen[]; lista: Fila[] } | null>(null);
  const [filtro, setFiltro] = useState<'no' | 'si' | 'todas'>('no');
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    const r = await adminFetch(`/api/admin/calificaciones${filtro === 'todas' ? '' : `?util=${filtro}`}`);
    const d = await r.json().catch(() => null);
    if (!r.ok) setError(mensajeDeErrorDeAuth(r) ?? d?.error ?? 'No se pudieron cargar');
    else setDatos(d);
  }, [filtro]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (error) return <p className="m-6 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>;
  if (!datos) {
    return (
      <div className="flex items-center gap-2 p-8 text-tinta-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid gap-4 md:grid-cols-2">
        {datos.resumen.map(r => (
          <div key={r.tipo} className="rounded-[22px] bg-papel p-5">
            <p className="text-[13px] text-tinta-2">{NOMBRE[r.tipo] ?? r.tipo}</p>
            <p className="mt-2 text-[44px] font-light leading-none tracking-[-0.05em]">{pct(r.utiles30, r.total30)}</p>
            <p className="mt-2 text-[13px] text-tinta-2">
              le sirvió a la gente en los últimos 30 días ({r.total30} votos) · histórico {pct(r.utiles, r.total)} de {r.total}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(
          [
            ['no', 'No sirvieron'],
            ['si', 'Sí sirvieron'],
            ['todas', 'Todas'],
          ] as const
        ).map(([k, t]) => (
          <button key={k} type="button" className="pastilla h-10 px-4" data-activa={filtro === k} onClick={() => setFiltro(k)}>
            {t}
          </button>
        ))}
      </div>

      {datos.lista.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-papel p-6 text-tinta-2">Todavía no hay calificaciones aquí.</p>
      ) : (
        <ul className="mt-4 divide-y divide-linea">
          {datos.lista.map(c => (
            <li key={c.id} className="flex flex-wrap items-start gap-3 py-3">
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${c.util ? 'bg-wise text-white' : 'bg-[#efe4f7] text-wise'}`}>
                {c.util ? <ThumbsUp className="h-4 w-4" /> : <ThumbsDown className="h-4 w-4" />}
              </span>
              <div className="min-w-[240px] flex-1">
                <p className="text-[14px]">
                  <span className="text-tinta-2">{c.tipo === 'busqueda' ? 'Buscó: ' : 'Comparó: '}</span>
                  <span className="font-medium">
                    {c.tipo === 'busqueda' ? `“${c.clave}”` : (c.detalle?.carros ?? []).join(' vs ') || c.clave}
                  </span>
                </p>
                {c.comentario && <p className="mt-1 text-[14px] text-tinta">Esperaba: {c.comentario}</p>}
                {c.detalle?.mostrados?.length > 0 && (
                  <p className="mt-1 text-[12px] text-tinta-2">Le mostramos: {c.detalle.mostrados.join(', ')}</p>
                )}
                {c.detalle?.titular && <p className="mt-1 text-[12px] text-tinta-2">Veredicto: {c.detalle.titular}</p>}
              </div>
              <span className="text-[12px] text-tinta-2">
                {new Date(c.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                {c.conCuenta ? ' · con cuenta' : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
