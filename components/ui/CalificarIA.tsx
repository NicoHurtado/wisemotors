'use client';

// ============================================================================
// "¿Te sirvió?" 👍 / 👎 para una respuesta de la IA (búsqueda o veredicto del
// comparador). Con 👎 se abre un campo opcional: qué esperaba encontrar. Es lo
// que el equipo lee en el panel (pestaña Calificaciones) para mejorar.
// Sin cuenta: el voto va con un id anónimo del navegador y se puede cambiar.
// ============================================================================

import { useEffect, useState } from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { getAuthToken } from '@/lib/admin-fetch';
import { sesionAnonima } from '@/lib/sesion-anonima';

export function CalificarIA({
  tipo,
  clave,
  detalle,
  pregunta = '¿Te sirvió esta respuesta?',
  oscuro = false,
}: {
  tipo: 'busqueda' | 'comparacion';
  /** Identifica la respuesta: la búsqueda, o los ids comparados. */
  clave: string;
  /** Lo que se le mostró (ids, tipo de consulta…), para entender la calificación. */
  detalle?: unknown;
  pregunta?: string;
  oscuro?: boolean;
}) {
  const guardado = `wise.calif.${tipo}.${clave.toLowerCase()}`;
  const [voto, setVoto] = useState<boolean | null>(null);
  const [comentario, setComentario] = useState('');
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(guardado);
      setVoto(v === 'si' ? true : v === 'no' ? false : null);
    } catch {
      setVoto(null);
    }
    setEnviado(false);
    setComentario('');
  }, [guardado]);

  async function enviar(util: boolean, texto?: string) {
    setVoto(util);
    try {
      localStorage.setItem(guardado, util ? 'si' : 'no');
    } catch {}
    const token = getAuthToken();
    await fetch('/api/calificaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ tipo, clave, util, comentario: texto, detalle, sesion: sesionAnonima() }),
    }).catch(() => {});
  }

  const boton = (activo: boolean) =>
    `inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
      activo ? 'border-wise bg-wise text-white' : oscuro ? 'border-white/20 text-white/80 hover:border-white' : 'border-linea text-tinta-2 hover:border-tinta hover:text-tinta'
    }`;

  return (
    <div className={`rounded-[22px] px-5 py-4 ${oscuro ? 'bg-white/5' : 'bg-blanco'}`}>
      <div className="flex flex-wrap items-center gap-3">
        <p className={`mr-auto text-[14px] ${oscuro ? 'text-white/80' : 'text-tinta'}`}>
          {voto === true ? '¡Gracias! Nos ayuda a mejorar.' : pregunta}
        </p>
        <button type="button" className={boton(voto === true)} aria-pressed={voto === true} aria-label="Sí me sirvió" onClick={() => enviar(true)}>
          <ThumbsUp className="h-4 w-4" />
        </button>
        <button type="button" className={boton(voto === false)} aria-pressed={voto === false} aria-label="No me sirvió" onClick={() => enviar(false)}>
          <ThumbsDown className="h-4 w-4" />
        </button>
      </div>
      {voto === false && !enviado && (
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={e => {
            e.preventDefault();
            enviar(false, comentario);
            setEnviado(true);
          }}
        >
          <input
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            maxLength={1000}
            placeholder="¿Qué esperabas encontrar? (opcional)"
            className={`h-10 min-w-[220px] flex-1 rounded-full border px-4 text-[14px] ${oscuro ? 'border-white/20 bg-transparent text-white placeholder:text-white/40' : 'border-linea bg-blanco'}`}
          />
          <button type="submit" className="pastilla pastilla--wise h-10 px-4 text-[13px]" disabled={!comentario.trim()}>
            Enviar
          </button>
        </form>
      )}
      {voto === false && enviado && (
        <p className={`mt-2 text-[13px] ${oscuro ? 'text-white/60' : 'text-tinta-2'}`}>Gracias. Lo revisamos para mejorar.</p>
      )}
    </div>
  );
}
