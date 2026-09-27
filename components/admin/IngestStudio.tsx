'use client';

// ============================================================================
// Estudio de ingesta: el humano escribe una línea por vehículo ("Onix RS 2026")
// → la cola corre el pipeline uno a uno → cada borrador queda listo para que el
// humano acepte/rechace/edite CAMPO POR CAMPO → publicar.
// Nada llega a la base sin pasar por esta pantalla.
// ============================================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch, mensajeDeErrorDeAuth } from '@/lib/admin-fetch';
import { Button } from '@/components/ui/button';
import { parseVehicleList, type ParsedVehicleQuery } from '@/lib/ingest/parse-query';
import { Loader2, ExternalLink, AlertTriangle, CheckCircle2, XCircle, Sparkles, Clock, ChevronRight } from 'lucide-react';

const TYPES = ['Sedán', 'SUV', 'Pickup', 'Deportivo', 'Wagon', 'Hatchback', 'Convertible'];
const VEHICLE_TYPES = ['Automóvil', 'Deportivo', 'Todoterreno', 'Lujo', 'Económico'];
const FUEL_TYPES = ['Gasolina', 'Diesel', 'Eléctrico', 'Híbrido', 'Híbrido Enchufable'];

interface DraftFact {
  key: string;
  labelEs: string;
  unit?: string;
  displayGroup: string;
  value: number | string | boolean;
  confidence: number;
  sourceUrl: string;
  tier: number;
  quote: string;
  conflict: boolean;
  outOfRange: boolean;
  alternatives: { value: number | string | boolean; sourceUrl: string; tier: number }[];
}

interface Draft {
  brand: string;
  model: string;
  year: number;
  country: string;
  type: string;
  vehicleType: string;
  fuelType: string;
  price: { value: number; estimated: boolean; reasoningEs: string; sourceUrl?: string; confidence: number } | null;
  facts: DraftFact[];
  sourcesReport: { url: string; nameEs: string; tier: number; ok: boolean; note?: string }[];
  warningsEs: string[];
}

type Phase = 'form' | 'review' | 'publishing' | 'done';

type EstadoItem = 'en cola' | 'buscando' | 'listo' | 'error' | 'publicado';

interface ItemCola {
  id: number;
  raw: string;
  parsed: ParsedVehicleQuery;
  estado: EstadoItem;
  draft?: Draft;
  error?: string;
  publicadoId?: string;
}

const EJEMPLO = 'Onix RS 2026\nRenault Duster 2026\nBYD Dolphin Mini';

function host(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
}

function TierBadge({ tier }: { tier: number }) {
  const styles = tier === 1 ? 'bg-purple-100 text-purple-800' : tier === 2 ? 'bg-fuchsia-100 text-fuchsia-800' : 'bg-rose-100 text-rose-800';
  const label = tier === 1 ? 'Fabricante' : tier === 2 ? 'Prensa' : 'Comunidad';
  return <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${styles}`}>T{tier} · {label}</span>;
}

function EstadoIcono({ estado }: { estado: EstadoItem }) {
  if (estado === 'buscando') return <Loader2 className="w-4 h-4 text-wise animate-spin shrink-0" />;
  if (estado === 'listo') return <Sparkles className="w-4 h-4 text-wise shrink-0" />;
  if (estado === 'publicado') return <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />;
  if (estado === 'error') return <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />;
  return <Clock className="w-4 h-4 text-gray-300 shrink-0" />;
}

export function IngestStudio() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('form');
  const [error, setError] = useState<string | null>(null);

  // Cola: una línea por vehículo
  const [texto, setTexto] = useState('');
  const [country, setCountry] = useState('CO');
  const [cola, setCola] = useState<ItemCola[]>([]);
  const [abierto, setAbierto] = useState<number | null>(null);
  const siguienteId = useRef(1);
  const corriendo = useRef(false);

  const vistaPrevia = useMemo(() => parseVehicleList(texto), [texto]);

  // Borrador en revisión
  const [draft, setDraft] = useState<Draft | null>(null);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [priceValue, setPriceValue] = useState<string>('');
  const [published, setPublished] = useState<{ id: string; label: string } | null>(null);

  const groups = useMemo(() => {
    if (!draft) return [];
    const map = new Map<string, DraftFact[]>();
    for (const f of draft.facts) {
      const list = map.get(f.displayGroup) ?? [];
      list.push(f);
      map.set(f.displayGroup, list);
    }
    return Array.from(map.entries());
  }, [draft]);

  const acceptedCount = draft ? draft.facts.filter(f => accepted[f.key]).length : 0;

  function encolar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const nuevos: ItemCola[] = vistaPrevia
      .filter((l): l is { raw: string; parsed: ParsedVehicleQuery } => l.parsed !== null)
      .map(l => ({ id: siguienteId.current++, raw: l.raw, parsed: l.parsed, estado: 'en cola' }));
    if (nuevos.length === 0) {
      setError('Escribe al menos un vehículo, por ejemplo "Onix RS 2026".');
      return;
    }
    setCola(prev => [...prev, ...nuevos]);
    setTexto('');
  }

  // Un pipeline a la vez: cada uno hace ~6 fetch + varias llamadas LLM, y en
  // paralelo se pisan los límites de OpenAI y de los sitios de prensa.
  useEffect(() => {
    if (corriendo.current) return;
    const item = cola.find(i => i.estado === 'en cola');
    if (!item) return;
    corriendo.current = true;
    const actualizar = (cambio: Partial<ItemCola>) =>
      setCola(prev => prev.map(i => (i.id === item.id ? { ...i, ...cambio } : i)));
    actualizar({ estado: 'buscando' });

    (async () => {
      try {
        const res = await adminFetch('/api/admin/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand: item.parsed.brand,
            model: item.parsed.model,
            year: item.parsed.year,
            country,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(mensajeDeErrorDeAuth(res) ?? data.error ?? 'Falló la ingesta');
        actualizar({ estado: 'listo', draft: data.draft });
      } catch (err) {
        actualizar({ estado: 'error', error: err instanceof Error ? err.message : 'Error inesperado' });
      } finally {
        corriendo.current = false;
        // Dispara el siguiente: el efecto depende de `cola`, que acaba de cambiar.
        setCola(prev => [...prev]);
      }
    })();
  }, [cola, country]);

  function abrirRevision(item: ItemCola) {
    if (!item.draft) return;
    const d = item.draft;
    setAbierto(item.id);
    setDraft(d);
    // Por defecto: aceptado todo lo que no esté fuera de rango físico
    const initial: Record<string, boolean> = {};
    for (const f of d.facts) initial[f.key] = !f.outOfRange;
    setAccepted(initial);
    setEdited({});
    setPriceValue(d.price ? String(d.price.value) : '');
    setError(null);
    setPhase('review');
  }

  function volverACola() {
    setPhase('form');
    setDraft(null);
    setAbierto(null);
    setPublished(null);
  }

  function reintentar(id: number) {
    setCola(prev => prev.map(i => (i.id === id ? { ...i, estado: 'en cola', error: undefined } : i)));
  }

  function quitar(id: number) {
    setCola(prev => prev.filter(i => i.id !== id || i.estado === 'buscando'));
  }

  async function publish() {
    if (!draft) return;
    setError(null);
    setPhase('publishing');
    try {
      const facts = draft.facts
        .filter(f => accepted[f.key])
        .map(f => {
          let value: number | string | boolean = f.value;
          if (edited[f.key] !== undefined && edited[f.key] !== '') {
            value = typeof f.value === 'number' ? parseFloat(edited[f.key].replace(',', '.')) : edited[f.key];
          }
          return { key: f.key, value, confidence: f.confidence, sourceTier: f.tier, sourceUrl: f.sourceUrl };
        })
        .filter(f => !(typeof f.value === 'number' && !Number.isFinite(f.value)));

      const res = await adminFetch('/api/admin/ingest/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: draft.brand,
          model: draft.model,
          year: draft.year,
          type: draft.type,
          vehicleType: draft.vehicleType,
          fuelType: draft.fuelType,
          price: parseFloat(priceValue),
          priceEstimated: draft.price?.estimated ?? true,
          priceReasoningEs: draft.price?.reasoningEs ?? 'Precio ingresado a mano en la revisión.',
          facts,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(mensajeDeErrorDeAuth(res) ?? data.error ?? 'No se pudo publicar');

      setPublished({ id: data.vehicle.id, label: `${data.vehicle.brand} ${data.vehicle.model} ${data.vehicle.year}` });
      setCola(prev => prev.map(i => (i.id === abierto ? { ...i, estado: 'publicado', publicadoId: data.vehicle.id } : i)));
      setPhase('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
      setPhase('review');
    }
  }

  // ── Fase: cola ──
  if (phase === 'form') {
    const pendientes = cola.filter(i => i.estado === 'en cola' || i.estado === 'buscando').length;
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-blanco rounded-[28px] border border-linea p-8">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-wise" />
            <h2 className="text-xl font-bold text-tinta">¿Qué vehículos subimos?</h2>
          </div>
          <p className="text-sm text-tinta-2 mb-5">
            Uno por línea, como lo diría el concesionario: <span className="font-medium text-tinta/80">Onix RS 2026</span>.
            La IA busca en el fabricante y la prensa colombiana, extrae cada dato con su cita y te lo deja para
            verificar. Si no pones año, se asume el modelo vigente.
          </p>

          <form onSubmit={encolar} className="space-y-4">
            <textarea
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) encolar(e);
              }}
              rows={4}
              placeholder={EJEMPLO}
              className="w-full px-4 py-3 border border-linea rounded-xl text-[15px] leading-relaxed focus:ring-2 focus:ring-wise focus:border-wise"
            />

            {vistaPrevia.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {vistaPrevia.map(l => (
                  <span key={l.raw}
                    className={`px-2.5 py-1 rounded-full text-xs ${l.parsed ? 'bg-wise/10 text-wise' : 'bg-red-50 text-red-700'}`}>
                    {l.parsed
                      ? <>{l.parsed.brand || <span className="italic opacity-70">marca por IA</span>} · {l.parsed.model} · {l.parsed.year}{l.parsed.yearAssumed && ' (asumido)'}</>
                      : <>No entendí: {l.raw}</>}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              <select value={country} onChange={e => setCountry(e.target.value)}
                className="px-3 py-2 border border-linea rounded-lg text-sm focus:ring-2 focus:ring-wise focus:border-wise">
                <option value="CO">Colombia</option>
                <option value="MX">México</option>
                <option value="US">Estados Unidos</option>
              </select>
              <Button type="submit" variant="wise" className="flex-1">
                {vistaPrevia.length > 1 ? `Agregar ${vistaPrevia.length} a la cola` : 'Buscar y extraer datos'}
              </Button>
            </div>
          </form>

          {error && <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}
        </div>

        {cola.length > 0 && (
          <div className="bg-blanco rounded-[28px] border border-linea p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-tinta">Cola</h3>
              <span className="text-xs text-tinta-2">
                {pendientes > 0 ? `${pendientes} por procesar · ~45 s cada uno` : 'Todo procesado'}
              </span>
            </div>
            <ul className="divide-y divide-linea">
              {cola.map(item => (
                <li key={item.id} className="py-3 flex items-center gap-3">
                  <EstadoIcono estado={item.estado} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-tinta truncate">
                      {item.draft ? `${item.draft.brand} ${item.draft.model} ${item.draft.year}` : item.raw}
                    </p>
                    <p className="text-xs text-tinta-2 truncate">
                      {item.estado === 'listo' && item.draft
                        ? `${item.draft.facts.length} datos · ${item.draft.sourcesReport.filter(x => x.ok).length} fuentes${item.draft.warningsEs.length ? ` · ${item.draft.warningsEs.length} avisos` : ''}`
                        : item.estado === 'error'
                          ? item.error
                          : item.estado === 'buscando'
                            ? 'Buscando fuentes y extrayendo…'
                            : item.estado === 'publicado'
                              ? 'Publicado'
                              : 'Esperando turno'}
                    </p>
                  </div>
                  {item.estado === 'listo' && (
                    <Button size="sm" onClick={() => abrirRevision(item)} variant="wise">
                      Revisar <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                  {item.estado === 'publicado' && item.publicadoId && (
                    <Button size="sm" variant="outline" onClick={() => router.push(`/vehicles/${item.publicadoId}`)}>
                      Ver ficha
                    </Button>
                  )}
                  {item.estado === 'error' && (
                    <Button size="sm" variant="outline" onClick={() => reintentar(item.id)}>Reintentar</Button>
                  )}
                  {item.estado !== 'buscando' && item.estado !== 'publicado' && (
                    <button onClick={() => quitar(item.id)} aria-label="Quitar de la cola"
                      className="p-1 text-gray-300 hover:text-red-500">
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // ── Fase: publicado ──
  if (phase === 'done' && published) {
    return (
      <div className="max-w-xl mx-auto bg-blanco rounded-[28px] border border-linea p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-purple-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-tinta mb-2">{published.label} publicado</h2>
        <p className="text-sm text-tinta-2 mb-6">Con los datos que aceptaste, su fuente y su cobertura calculada.</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => router.push(`/vehicles/${published.id}`)} variant="wise">Ver ficha</Button>
          <Button variant="outline" onClick={volverACola}>
            {cola.some(i => i.estado === 'listo' || i.estado === 'en cola' || i.estado === 'buscando') ? 'Siguiente de la cola' : 'Subir otro'}
          </Button>
        </div>
      </div>
    );
  }

  // ── Fase: revisión ──
  if (!draft) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Identidad */}
      <div className="bg-blanco rounded-[28px] border border-linea p-6">
        <h2 className="text-lg font-bold text-tinta mb-4">
          Revisión: {draft.brand} {draft.model} {draft.year}
          <span className="ml-3 text-sm font-normal text-tinta-2">{acceptedCount} de {draft.facts.length} datos aceptados</span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-tinta-2 mb-1">Carrocería</label>
            <select value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value })}
              className="w-full px-3 py-2 border border-linea rounded-lg text-sm">
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-tinta-2 mb-1">Categoría</label>
            <select value={draft.vehicleType} onChange={e => setDraft({ ...draft, vehicleType: e.target.value })}
              className="w-full px-3 py-2 border border-linea rounded-lg text-sm">
              {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-tinta-2 mb-1">Tren motriz</label>
            <select value={draft.fuelType} onChange={e => setDraft({ ...draft, fuelType: e.target.value })}
              className="w-full px-3 py-2 border border-linea rounded-lg text-sm">
              {FUEL_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Advertencias del pipeline */}
      {draft.warningsEs.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
          {draft.warningsEs.map((w, i) => (
            <p key={i} className="text-sm text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {w}
            </p>
          ))}
        </div>
      )}

      {/* Precio */}
      <div className={`rounded-2xl border p-6 ${draft.price?.estimated ? 'bg-rose-50 border-rose-300' : 'bg-white border-linea shadow-soft'}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-tinta">Precio (COP)</h3>
          {draft.price?.estimated
            ? <span className="px-2 py-1 rounded-full bg-rose-200 text-rose-900 text-xs font-bold">ESTIMADO — verificar</span>
            : draft.price
              ? <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">De fuente ({host(draft.price.sourceUrl ?? '')})</span>
              : <span className="px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold">Sin dato — ingresar a mano</span>}
        </div>
        <input value={priceValue} onChange={e => setPriceValue(e.target.value.replace(/[^\d]/g, ''))}
          placeholder="135000000" inputMode="numeric"
          className="w-full md:w-72 px-3 py-2 border border-linea rounded-lg text-lg font-bold mb-2" />
        {priceValue && Number(priceValue) > 0 && (
          <p className="text-sm text-tinta-2 mb-2">= ${Math.round(Number(priceValue) / 1_000_000)} millones</p>
        )}
        {draft.price && (
          <p className="text-sm text-tinta/80 leading-relaxed">
            <span className="font-medium">Razonamiento:</span> {draft.price.reasoningEs}
            <span className="text-tinta-2/80"> · confianza {Math.round(draft.price.confidence * 100)}%</span>
          </p>
        )}
      </div>

      {/* Fuentes consultadas */}
      <div className="bg-blanco rounded-[28px] border border-linea p-6">
        <h3 className="font-bold text-tinta mb-3">Fuentes consultadas</h3>
        <ul className="space-y-2">
          {draft.sourcesReport.map((s, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              {s.ok ? <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" /> : <XCircle className="w-4 h-4 text-gray-300 shrink-0" />}
              <TierBadge tier={s.tier} />
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-wise hover:underline flex items-center gap-1">
                {s.nameEs} <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-tinta-2/80 truncate">{s.note}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Hechos por grupo */}
      {groups.map(([group, facts]) => (
        <div key={group} className="bg-blanco rounded-[28px] border border-linea p-6">
          <h3 className="font-bold text-tinta mb-3">{group}</h3>
          <div className="divide-y divide-linea">
            {facts.map(f => (
              <div key={f.key} className={`py-3 flex flex-wrap items-start gap-3 ${!accepted[f.key] ? 'opacity-45' : ''}`}>
                <input type="checkbox" checked={!!accepted[f.key]}
                  onChange={e => setAccepted({ ...accepted, [f.key]: e.target.checked })}
                  className="mt-1 w-4 h-4 accent-[#881cb7]" />

                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-tinta text-sm">{f.labelEs}</span>
                    <TierBadge tier={f.tier} />
                    <span className="text-[10px] text-tinta-2/80">confianza {Math.round(f.confidence * 100)}%</span>
                    {f.conflict && <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px] font-semibold">fuentes en desacuerdo</span>}
                    {f.outOfRange && <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-semibold">fuera de rango físico</span>}
                  </div>
                  <p className="text-xs text-tinta-2/80 italic mt-0.5">"{f.quote}" — {host(f.sourceUrl)}</p>
                  {f.alternatives.length > 0 && (
                    <p className="text-xs text-orange-600 mt-0.5">
                      Otras fuentes dicen: {f.alternatives.map(a => `${a.value} (${host(a.sourceUrl)})`).join(' · ')}
                    </p>
                  )}
                </div>

                <div className="w-40">
                  {typeof f.value === 'boolean' ? (
                    <span className="text-sm font-semibold">{f.value ? 'Sí' : 'No'}</span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <input
                        value={edited[f.key] ?? String(f.value)}
                        onChange={e => setEdited({ ...edited, [f.key]: e.target.value })}
                        className="w-full px-2 py-1 border border-linea rounded text-sm text-right font-semibold" />
                      {f.unit && <span className="text-xs text-tinta-2/80 shrink-0">{f.unit}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

      {/* Publicar */}
      <div className="sticky bottom-4 bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-linea p-4 flex items-center justify-between gap-4">
        <p className="text-sm text-tinta-2">
          Se publicará con <span className="font-bold">{acceptedCount} datos verificados</span>
          {draft.price?.estimated && Number(priceValue) > 0 && <span className="text-rose-700"> y precio estimado</span>}.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={volverACola}>Volver a la cola</Button>
          <Button onClick={publish} disabled={phase === 'publishing' || !priceValue || Number(priceValue) <= 0}
            variant="wise">
            {phase === 'publishing'
              ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Publicando…</span>
              : 'Publicar vehículo'}
          </Button>
        </div>
      </div>
    </div>
  );
}
