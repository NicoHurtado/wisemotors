'use client';

// ============================================================================
// "Complementar con IA" en un carro publicado: pegas un texto (una
// investigación larga hecha con otra IA, una ficha copiada, una nota de prensa)
// y la IA de WiseMotors lo reparte en los campos. Nada se guarda hasta que
// eliges qué aplicar: lo nuevo viene marcado, lo distinto al dato actual no.
// ============================================================================

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { adminFetch, mensajeDeErrorDeAuth } from '@/lib/admin-fetch';
import type { Propuesta } from '@/lib/ingest/complementar';

const mostrar = (v: unknown, unidad: string | null) =>
  v === true ? 'Sí' : v === false ? 'No' : v === null || v === undefined ? '—' : `${typeof v === 'number' ? new Intl.NumberFormat('es-CO').format(v) : v}${unidad ? ` ${unidad}` : ''}`;

const PISTA = `Ejemplo de lo que puedes pedirle a otra IA y pegar aquí:
"Dame la ficha técnica completa del <carro> <versión> <año> vendido en Colombia: potencia, torque, 0-100, velocidad máxima, consumo en km/galón, tanque, dimensiones, baúl, peso, altura al piso, medida de llantas, tracción, airbags, estrellas Latin NCAP, asistencias de manejo y equipamiento de tecnología y confort. Con las fuentes."`;

export function ComplementarIA({ vehicleId, onAplicado }: { vehicleId: string; onAplicado: () => void }) {
  const [texto, setTexto] = useState('');
  const [estado, setEstado] = useState<'escribiendo' | 'leyendo' | 'propuesta' | 'aplicando'>('escribiendo');
  const [propuestas, setPropuestas] = useState<Propuesta[]>([]);
  const [marcadas, setMarcadas] = useState<Record<string, boolean>>({});
  const [aviso, setAviso] = useState('');
  const [error, setError] = useState('');

  async function leer() {
    setEstado('leyendo');
    setError('');
    setAviso('');
    try {
      const res = await adminFetch(`/api/admin/vehicles/${vehicleId}/complementar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(mensajeDeErrorDeAuth(res) ?? data.error ?? 'No se pudo leer el texto');
      const lista: Propuesta[] = data.propuestas;
      setPropuestas(lista);
      setMarcadas(Object.fromEntries(lista.map(p => [p.key, p.estado === 'nuevo'])));
      setAviso(
        [
          lista.length === 0 ? 'El texto no trae datos de este carro que encajen en los campos.' : '',
          data.descartadosPorVersion ? `${data.descartadosPorVersion} datos eran de otra versión y se descartaron.` : '',
          data.truncado ? 'El texto era muy largo: se leyeron los primeros ~75.000 caracteres.' : '',
        ]
          .filter(Boolean)
          .join(' ')
      );
      setEstado('propuesta');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
      setEstado('escribiendo');
    }
  }

  async function aplicar() {
    const hechos = propuestas.filter(p => marcadas[p.key]).map(p => ({ key: p.key, valor: p.valor }));
    if (hechos.length === 0) return;
    setEstado('aplicando');
    setError('');
    try {
      const res = await adminFetch(`/api/admin/vehicles/${vehicleId}/complementar/aplicar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hechos }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(mensajeDeErrorDeAuth(res) ?? data.error ?? 'No se pudo aplicar');
      setAviso(`Listo: ${data.escritos} datos guardados en la ficha.`);
      setPropuestas([]);
      setTexto('');
      setEstado('escribiendo');
      onAplicado();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
      setEstado('propuesta');
    }
  }

  const n = propuestas.filter(p => marcadas[p.key]).length;
  const cuenta = (e: Propuesta['estado']) => propuestas.filter(p => p.estado === e).length;

  return (
    <div className="rounded-[28px] border border-linea bg-blanco p-6">
      <h3 className="flex items-center gap-2 font-bold text-tinta">
        <Sparkles className="h-5 w-5 text-wise" /> Complementar con IA
      </h3>
      <p className="mt-1 text-sm text-tinta-2">
        ¿Le falta información? Investiga con otra IA (con más tiempo y búsqueda) o copia una ficha, pega el texto aquí y
        WiseMotors lo reparte en los campos. Solo se toma lo que el texto dice; tú eliges qué guardar.
      </p>

      {estado !== 'propuesta' && estado !== 'aplicando' && (
        <>
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            rows={8}
            placeholder={PISTA}
            className="mt-4 w-full rounded-xl border border-linea px-4 py-3 text-[14px] leading-relaxed focus:border-wise focus:ring-2 focus:ring-wise"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-tinta-2">{texto.length.toLocaleString('es-CO')} caracteres</span>
            <button type="button" className="pastilla pastilla--wise h-11 px-5" disabled={texto.trim().length < 40 || estado === 'leyendo'} onClick={leer}>
              {estado === 'leyendo' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Leyendo el texto…
                </>
              ) : (
                'Repartir en los campos'
              )}
            </button>
          </div>
        </>
      )}

      {(estado === 'propuesta' || estado === 'aplicando') && (
        <div className="mt-4">
          <p className="text-sm text-tinta-2">
            {cuenta('nuevo')} nuevos · {cuenta('distinto')} distintos a lo que hay · {cuenta('igual')} iguales. Lo distinto viene
            desmarcado: compáralo antes de reemplazar.
          </p>
          <ul className="mt-3 divide-y divide-linea">
            {propuestas.map(p => (
              <li key={p.key} className={`flex flex-wrap items-start gap-3 py-2.5 ${p.estado === 'igual' ? 'opacity-50' : ''}`}>
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[#881cb7]"
                  checked={!!marcadas[p.key]}
                  disabled={p.estado === 'igual'}
                  onChange={e => setMarcadas({ ...marcadas, [p.key]: e.target.checked })}
                  aria-label={p.etiqueta}
                />
                <div className="min-w-[220px] flex-1">
                  <p className="text-[14px]">
                    <span className="font-medium">{p.etiqueta}</span>{' '}
                    <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] ${p.estado === 'nuevo' ? 'bg-wise text-white' : p.estado === 'distinto' ? 'bg-[#efe4f7] text-wise' : 'bg-papel text-tinta-2'}`}>
                      {p.estado}
                    </span>
                  </p>
                  <p className="text-[12px] italic text-tinta-2">“{p.cita}”</p>
                </div>
                <div className="text-right text-[14px]">
                  <p className="font-semibold">{mostrar(p.valor, p.unidad)}</p>
                  {p.estado === 'distinto' && <p className="text-[12px] text-tinta-2">hoy: {mostrar(p.actual, p.unidad)}</p>}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button type="button" className="pastilla h-11 px-5" disabled={estado === 'aplicando'} onClick={() => setEstado('escribiendo')}>
              Volver al texto
            </button>
            <button type="button" className="pastilla pastilla--wise h-11 px-5" disabled={n === 0 || estado === 'aplicando'} onClick={aplicar}>
              {estado === 'aplicando' ? <Loader2 className="h-4 w-4 animate-spin" /> : `Guardar ${n} datos`}
            </button>
          </div>
        </div>
      )}

      {aviso && <p className="mt-3 rounded-xl bg-papel p-3 text-sm text-tinta">{aviso}</p>}
      {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
