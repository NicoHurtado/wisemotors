'use client';

// ============================================================================
// Revisión de fotos en la ingesta: las recomendadas vienen marcadas y ya
// procesadas (sin fondo, recortadas, mirando a la derecha). El revisor quita,
// agrega otra candidata (se procesa al marcarla) o cambia la portada.
// ============================================================================

import { useState } from 'react';
import { AlertTriangle, Check, ExternalLink, FlipHorizontal2, Loader2, Star } from 'lucide-react';
import { adminFetch } from '@/lib/admin-fetch';

export interface FotoRevision {
  original: string;
  pagina: string;
  oficial: boolean;
  angulo: string;
  miraA: string;
  estudio: boolean;
  calidad: number;
  recomendada: boolean;
  procesada?: string;
  publicId?: string;
  recortada?: boolean;
  volteada?: boolean;
  error?: string;
  // Estado de la revisión
  /** publicIds de versiones anteriores (antes de voltear): se borran al publicar. */
  anteriores?: string[];
  usar: boolean;
  portada: boolean;
  procesando?: boolean;
}

const ETIQUETA: Record<string, string> = {
  lado: 'De lado',
  tres_cuartos_frente: '3/4 delantero',
  tres_cuartos_atras: '3/4 trasero',
  frente: 'De frente',
  atras: 'De atrás',
  interior: 'Interior',
  detalle: 'Detalle',
};

/** Estado inicial: recomendadas marcadas; portada = la de lado (o la primera recomendada). */
export function fotosIniciales(fotos: Omit<FotoRevision, 'usar' | 'portada'>[] | undefined): FotoRevision[] {
  const lista = (fotos ?? []).map(f => ({ ...f, usar: f.recomendada && !f.error, portada: false }));
  const portada = lista.find(f => f.usar && f.angulo === 'lado') ?? lista.find(f => f.usar);
  if (portada) portada.portada = true;
  return lista;
}

export function RevisionFotos({
  fotos,
  onChange,
}: {
  fotos: FotoRevision[];
  onChange: React.Dispatch<React.SetStateAction<FotoRevision[]>>;
}) {
  const [verTodas, setVerTodas] = useState(false);
  const visibles = verTodas ? fotos : fotos.filter(f => f.recomendada || f.usar);
  const usadas = fotos.filter(f => f.usar).length;

  const cambiar = (original: string, cambio: Partial<FotoRevision>, base: FotoRevision[]) =>
    base.map(f => (f.original === original ? { ...f, ...cambio } : f));

  async function alternar(f: FotoRevision) {
    if (f.usar) {
      onChange(prev => {
        let nuevas = cambiar(f.original, { usar: false, portada: false }, prev);
        // Si era la portada, pasa a la siguiente usada.
        if (f.portada) {
          const sig = nuevas.find(x => x.usar);
          if (sig) nuevas = cambiar(sig.original, { portada: true }, nuevas);
        }
        return nuevas;
      });
      return;
    }
    const sinPortada = !fotos.some(x => x.portada);
    if (f.procesada) {
      onChange(prev => cambiar(f.original, { usar: true, portada: sinPortada }, prev));
      return;
    }
    // Aún sin procesar: se procesa ahora (Cloudinary) antes de poder usarla.
    onChange(prev => cambiar(f.original, { usar: true, portada: sinPortada, procesando: true, error: undefined }, prev));
    try {
      const res = await adminFetch('/api/admin/ingest/foto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ original: f.original, angulo: f.angulo, miraA: f.miraA }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No se pudo procesar');
      onChange(prev => cambiar(f.original, { ...data, procesando: false }, prev));
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Error';
      onChange(prev => cambiar(f.original, { usar: false, portada: false, procesando: false, error }, prev));
    }
  }

  /** Vuelve a procesar la foto en espejo: todas las de lado deben mirar a la derecha. */
  async function voltear(f: FotoRevision) {
    onChange(prev => cambiar(f.original, { procesando: true, error: undefined }, prev));
    try {
      const res = await adminFetch('/api/admin/ingest/foto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ original: f.original, angulo: f.angulo, voltear: !f.volteada }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No se pudo voltear');
      if (data.procesada === f.procesada) throw new Error('Voltear necesita Cloudinary configurado');
      const anteriores = [...(f.anteriores ?? []), ...(f.publicId ? [f.publicId] : [])];
      onChange(prev => cambiar(f.original, { ...data, anteriores, procesando: false }, prev));
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Error';
      onChange(prev => cambiar(f.original, { procesando: false, error }, prev));
    }
  }

  function hacerPortada(f: FotoRevision) {
    onChange(prev => prev.map(x => ({ ...x, portada: x.original === f.original })));
  }

  return (
    <div className="bg-blanco rounded-[28px] border border-linea p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h3 className="font-bold text-tinta">Fotos</h3>
          <p className="mt-1 text-sm text-tinta-2">
            {fotos.length === 0
              ? 'No se encontraron fotos. Podrás subirlas a mano después de publicar.'
              : `${usadas} de ${fotos.length} se publicarán. La marcada con ★ es la portada. Las de lado deben mirar a la derecha: si no, voltéalas.`}
          </p>
        </div>
        {fotos.length > visibles.length || verTodas ? (
          <button onClick={() => setVerTodas(v => !v)} className="text-sm text-wise hover:underline">
            {verTodas ? 'Ver solo las recomendadas' : `Ver las ${fotos.length} candidatas`}
          </button>
        ) : null}
      </div>

      {visibles.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {visibles.map(f => (
            <div
              key={f.original}
              className={`overflow-hidden rounded-[20px] border transition-colors ${f.usar ? 'border-wise' : 'border-linea opacity-70'}`}
            >
              {/* Fondo blanco: así se verá en el catálogo */}
              <div className="relative flex aspect-[4/3] items-center justify-center bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.procesada ?? f.original} alt={ETIQUETA[f.angulo] ?? f.angulo} className="max-h-full max-w-full object-contain" loading="lazy" />
                {f.procesando && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                    <Loader2 className="h-5 w-5 animate-spin text-wise" />
                  </div>
                )}
                {f.portada && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-wise px-2 py-0.5 text-[11px] font-medium text-white">
                    <Star className="h-3 w-3" /> Portada
                  </span>
                )}
              </div>
              <div className="space-y-2 p-3">
                <div className="flex flex-wrap gap-1 text-[11px]">
                  <span className="rounded-full bg-tarjeta px-2 py-0.5 font-medium">{ETIQUETA[f.angulo] ?? f.angulo}</span>
                  {f.oficial && <span className="rounded-full bg-purple-100 px-2 py-0.5 text-purple-800">Oficial</span>}
                  {f.recomendada && <span className="rounded-full bg-[#efe4f7] px-2 py-0.5 text-wise">Recomendada</span>}
                  {f.procesada && f.recortada === false && f.angulo !== 'interior' && (
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-700">Con fondo</span>
                  )}
                </div>
                {f.error && (
                  <p className="flex items-start gap-1 text-[12px] text-rose-700">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {f.error}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => alternar(f)}
                    disabled={f.procesando}
                    className={`inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-full text-[12px] font-medium ${
                      f.usar ? 'bg-wise text-white' : 'border border-linea text-tinta hover:border-tinta'
                    }`}
                  >
                    {f.usar ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Usar
                      </>
                    ) : (
                      'Usar esta'
                    )}
                  </button>
                  {f.usar && f.procesada && !f.procesando && f.angulo !== 'interior' && (
                    <button onClick={() => voltear(f)} className="h-8 rounded-full border border-linea px-2 text-[12px] hover:border-tinta" title="Voltear (el carro debe mirar a la derecha)">
                      <FlipHorizontal2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {f.usar && !f.portada && !f.procesando && (
                    <button onClick={() => hacerPortada(f)} className="h-8 rounded-full border border-linea px-2 text-[12px] hover:border-tinta" title="Hacer portada">
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <a href={f.pagina} target="_blank" rel="noopener noreferrer" className="text-tinta-2 hover:text-tinta" title="Página de origen">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
