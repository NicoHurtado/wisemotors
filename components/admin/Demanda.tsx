'use client';

// ============================================================================
// Demanda: qué está buscando la gente, agrupado por lo que quiere (necesidad ·
// carrocería · presupuesto). Es la base de los informes para concesionarios y
// marcas: "Descargar informe" baja SOLO agregados (sin texto libre).
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Download, Loader2, Minus } from 'lucide-react';
import { adminFetch, mensajeDeErrorDeAuth } from '@/lib/admin-fetch';

interface Grupo {
  clave: string;
  etiqueta: string;
  busquedas: number;
  personas: number;
  parte: number;
  anterior: number;
  presupuestoMediano: number | null;
  sinResultado: number;
  satisfaccion: number | null;
  votos: number;
  ejemplos: string[];
}
type Conteo = { nombre: string; n: number };
interface Resumen {
  dias: number;
  total: number;
  totalAnterior: number;
  personas: number;
  grupos: Grupo[];
  necesidades: Conteo[];
  carrocerias: Conteo[];
  presupuestos: Conteo[];
  combustibles: Conteo[];
  marcas: Conteo[];
  marcasFaltantes: Conteo[];
  ciudades: Conteo[];
  repetidas: { texto: string; n: number }[];
}

const fmt = (n: number) => new Intl.NumberFormat('es-CO').format(n);
const millones = (n: number) => `$${fmt(Math.round(n / 1e6))} M`;

function Tendencia({ ahora, antes }: { ahora: number; antes: number }) {
  if (!antes) return <span className="text-[12px] text-tinta-2">nuevo</span>;
  const cambio = (ahora - antes) / antes;
  const Icono = cambio > 0.05 ? ArrowUpRight : cambio < -0.05 ? ArrowDownRight : Minus;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[12px] ${cambio > 0.05 ? 'text-wise' : 'text-tinta-2'}`}>
      <Icono className="h-3.5 w-3.5" /> {cambio > 0 ? '+' : ''}
      {Math.round(cambio * 100)} %
    </span>
  );
}

function Lista({ titulo, filas, total }: { titulo: string; filas: Conteo[]; total: number }) {
  if (!filas.length) return null;
  return (
    <div className="rounded-[22px] bg-papel p-5">
      <p className="text-[13px] font-semibold">{titulo}</p>
      <ul className="mt-3 space-y-2">
        {filas.slice(0, 8).map(f => (
          <li key={f.nombre}>
            <div className="flex justify-between text-[13px]">
              <span>{f.nombre}</span>
              <span className="cifra text-tinta-2">{fmt(f.n)}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-tarjeta">
              <div className="h-full rounded-full bg-wise" style={{ width: `${Math.min(100, (f.n / Math.max(1, total)) * 100)}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Demanda() {
  const [dias, setDias] = useState(30);
  const [datos, setDatos] = useState<Resumen | null>(null);
  const [error, setError] = useState('');
  const [bajando, setBajando] = useState(false);

  const cargar = useCallback(async () => {
    setDatos(null);
    setError('');
    const r = await adminFetch(`/api/admin/demanda?dias=${dias}`);
    const d = await r.json().catch(() => null);
    if (!r.ok) setError(mensajeDeErrorDeAuth(r) ?? d?.error ?? 'No se pudo cargar la demanda');
    else setDatos(d);
  }, [dias]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function descargar() {
    setBajando(true);
    try {
      const r = await adminFetch(`/api/admin/demanda?dias=${dias}&formato=csv`);
      if (!r.ok) throw new Error(mensajeDeErrorDeAuth(r) ?? 'No se pudo generar el informe');
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = `demanda-wisemotors-${dias}d-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBajando(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-2">
        {[7, 30, 90].map(d => (
          <button key={d} type="button" className="pastilla h-10 px-4" data-activa={dias === d} onClick={() => setDias(d)}>
            Últimos {d} días
          </button>
        ))}
        <button type="button" className="pastilla ml-auto h-10 px-4" onClick={descargar} disabled={bajando || !datos?.total}>
          {bajando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Descargar informe (CSV)
        </button>
      </div>

      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!datos && !error && (
        <div className="flex items-center gap-2 p-8 text-tinta-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </div>
      )}

      {datos && datos.total === 0 && (
        <p className="mt-6 rounded-2xl bg-papel p-6 text-tinta-2">
          Todavía no hay búsquedas en este periodo. Cada búsqueda del buscador con IA se guarda aquí, agrupada por lo que la persona quiere.
        </p>
      )}

      {datos && datos.total > 0 && (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[22px] bg-papel p-5">
              <p className="text-[13px] text-tinta-2">Búsquedas</p>
              <p className="mt-2 text-[44px] font-light leading-none tracking-[-0.05em]">{fmt(datos.total)}</p>
              <p className="mt-2">
                <Tendencia ahora={datos.total} antes={datos.totalAnterior} /> <span className="text-[12px] text-tinta-2">vs. los {datos.dias} días anteriores</span>
              </p>
            </div>
            <div className="rounded-[22px] bg-papel p-5">
              <p className="text-[13px] text-tinta-2">Personas</p>
              <p className="mt-2 text-[44px] font-light leading-none tracking-[-0.05em]">{fmt(datos.personas)}</p>
              <p className="mt-2 text-[12px] text-tinta-2">navegadores distintos (anónimos)</p>
            </div>
            <div className="rounded-[22px] bg-papel p-5">
              <p className="text-[13px] text-tinta-2">Intenciones distintas</p>
              <p className="mt-2 text-[44px] font-light leading-none tracking-[-0.05em]">{fmt(datos.grupos.length)}</p>
              <p className="mt-2 text-[12px] text-tinta-2">necesidad · carrocería · presupuesto</p>
            </div>
          </div>

          <h3 className="mt-8 text-[18px] font-semibold tracking-[-0.02em]">Lo que quiere la gente</h3>
          <ul className="mt-3 divide-y divide-linea">
            {datos.grupos.map(g => (
              <li key={g.clave} className="grid gap-3 py-4 md:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <p className="text-[15px] font-medium">{g.etiqueta}</p>
                  <div className="mt-2 h-2 max-w-[520px] overflow-hidden rounded-full bg-tarjeta">
                    <div className="h-full rounded-full bg-wise" style={{ width: `${Math.max(2, g.parte * 100)}%` }} />
                  </div>
                  <p className="mt-2 truncate text-[12px] text-tinta-2">{g.ejemplos.map(e => `“${e}”`).join(' · ')}</p>
                </div>
                <div className="flex flex-wrap items-start gap-x-5 gap-y-1 text-[13px] md:justify-end md:text-right">
                  <span>
                    <span className="cifra font-semibold">{fmt(g.busquedas)}</span> {g.busquedas === 1 ? 'búsqueda' : 'búsquedas'} · {Math.round(g.parte * 100)} %
                  </span>
                  <span className="text-tinta-2">
                    {fmt(g.personas)} {g.personas === 1 ? 'persona' : 'personas'}
                  </span>
                  <Tendencia ahora={g.busquedas} antes={g.anterior} />
                  {g.presupuestoMediano !== null && <span className="text-tinta-2">mediana {millones(g.presupuestoMediano)}</span>}
                  {g.satisfaccion !== null && (
                    <span className="text-tinta-2">
                      👍 {Math.round(g.satisfaccion * 100)} % ({g.votos})
                    </span>
                  )}
                  {g.sinResultado > 0 && <span className="text-wise">{g.sinResultado} sin resultado exacto</span>}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Lista titulo="Necesidades" filas={datos.necesidades} total={datos.total} />
            <Lista titulo="Carrocería" filas={datos.carrocerias} total={datos.total} />
            <Lista titulo="Presupuesto" filas={datos.presupuestos} total={datos.total} />
            <Lista titulo="Ciudad (aproximada)" filas={datos.ciudades} total={datos.total} />
            <Lista titulo="Marcas que piden" filas={datos.marcas} total={datos.total} />
            <Lista titulo="Marcas que piden y NO tenemos" filas={datos.marcasFaltantes} total={datos.total} />
            <Lista titulo="Combustible" filas={datos.combustibles} total={datos.total} />
          </div>

          <h3 className="mt-8 text-[18px] font-semibold tracking-[-0.02em]">Búsquedas más repetidas</h3>
          <ol className="mt-3 grid gap-x-8 md:grid-cols-2">
            {datos.repetidas.map(r => (
              <li key={r.texto} className="flex justify-between gap-4 border-b border-linea py-2 text-[14px]">
                <span className="truncate">“{r.texto}”</span>
                <span className="cifra text-tinta-2">{fmt(r.n)}</span>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-[12px] text-tinta-2">
            El informe descargable lleva solo agregados por intención: nunca el texto de las búsquedas ni datos de personas.
          </p>
        </>
      )}
    </div>
  );
}
