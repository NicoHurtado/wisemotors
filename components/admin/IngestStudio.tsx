'use client';

// ============================================================================
// Estudio de ingesta: humano escribe marca/modelo/año/país → el pipeline trae
// un borrador → el humano acepta/rechaza/edita CAMPO POR CAMPO → publicar.
// Nada llega a la base sin pasar por esta pantalla.
// ============================================================================

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch, mensajeDeErrorDeAuth } from '@/lib/admin-fetch';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, AlertTriangle, CheckCircle2, XCircle, Sparkles } from 'lucide-react';

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

type Phase = 'form' | 'running' | 'review' | 'publishing' | 'done';

function host(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
}

function TierBadge({ tier }: { tier: number }) {
  const styles = tier === 1 ? 'bg-green-100 text-green-800' : tier === 2 ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800';
  const label = tier === 1 ? 'Fabricante' : tier === 2 ? 'Prensa' : 'Comunidad';
  return <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${styles}`}>T{tier} · {label}</span>;
}

export function IngestStudio() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('form');
  const [error, setError] = useState<string | null>(null);

  // Formulario
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [country, setCountry] = useState('CO');

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

  async function runPipeline(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPhase('running');
    try {
      const res = await adminFetch('/api/admin/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, model, year, country }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(mensajeDeErrorDeAuth(res) ?? data.error ?? 'Falló la ingesta');

      const d: Draft = data.draft;
      setDraft(d);
      // Por defecto: aceptado todo lo que no esté fuera de rango físico
      const initial: Record<string, boolean> = {};
      for (const f of d.facts) initial[f.key] = !f.outOfRange;
      setAccepted(initial);
      setEdited({});
      setPriceValue(d.price ? String(d.price.value) : '');
      setPhase('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
      setPhase('form');
    }
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
      setPhase('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
      setPhase('review');
    }
  }

  // ── Fase: formulario ──
  if (phase === 'form' || phase === 'running') {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-soft border border-gray-200 p-8">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-wise" />
          <h2 className="text-xl font-bold text-gray-900">Ingesta con IA</h2>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          El sistema busca en fuentes por confiabilidad (fabricante → prensa CO), extrae specs con cita
          textual y te deja aceptar o rechazar cada dato antes de publicar.
        </p>

        <form onSubmit={runPipeline} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input value={brand} onChange={e => setBrand(e.target.value)} required placeholder="Toyota"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-wise" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <input value={model} onChange={e => setModel(e.target.value)} required placeholder="Corolla Cross"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-wise" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
              <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value) || year)} required
                min={1990} max={new Date().getFullYear() + 2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-wise" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
              <select value={country} onChange={e => setCountry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wise focus:border-wise">
                <option value="CO">Colombia</option>
                <option value="MX">México</option>
                <option value="US">Estados Unidos</option>
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

          <Button type="submit" disabled={phase === 'running'} className="w-full bg-wise hover:bg-wise-dark">
            {phase === 'running'
              ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Buscando fuentes y extrayendo… (~30-60s)</span>
              : 'Buscar y extraer datos'}
          </Button>
        </form>
      </div>
    );
  }

  // ── Fase: publicado ──
  if (phase === 'done' && published) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-soft border border-gray-200 p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">{published.label} publicado</h2>
        <p className="text-sm text-gray-500 mb-6">Con los datos que aceptaste, su fuente y su cobertura calculada.</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => router.push(`/vehicles/${published.id}`)} className="bg-wise hover:bg-wise-dark">Ver ficha</Button>
          <Button variant="outline" onClick={() => { setPhase('form'); setDraft(null); setPublished(null); setBrand(''); setModel(''); }}>
            Ingestar otro
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
      <div className="bg-white rounded-2xl shadow-soft border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Revisión: {draft.brand} {draft.model} {draft.year}
          <span className="ml-3 text-sm font-normal text-gray-500">{acceptedCount} de {draft.facts.length} datos aceptados</span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Carrocería</label>
            <select value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
            <select value={draft.vehicleType} onChange={e => setDraft({ ...draft, vehicleType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tren motriz</label>
            <select value={draft.fuelType} onChange={e => setDraft({ ...draft, fuelType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {FUEL_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Advertencias del pipeline */}
      {draft.warningsEs.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          {draft.warningsEs.map((w, i) => (
            <p key={i} className="text-sm text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {w}
            </p>
          ))}
        </div>
      )}

      {/* Precio */}
      <div className={`rounded-2xl border p-6 ${draft.price?.estimated ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-200 shadow-soft'}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-900">Precio (COP)</h3>
          {draft.price?.estimated
            ? <span className="px-2 py-1 rounded-full bg-amber-200 text-amber-900 text-xs font-bold">ESTIMADO — verificar</span>
            : draft.price
              ? <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold">De fuente ({host(draft.price.sourceUrl ?? '')})</span>
              : <span className="px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold">Sin dato — ingresar a mano</span>}
        </div>
        <input value={priceValue} onChange={e => setPriceValue(e.target.value.replace(/[^\d]/g, ''))}
          placeholder="135000000" inputMode="numeric"
          className="w-full md:w-72 px-3 py-2 border border-gray-300 rounded-lg text-lg font-bold mb-2" />
        {priceValue && Number(priceValue) > 0 && (
          <p className="text-sm text-gray-600 mb-2">= ${Math.round(Number(priceValue) / 1_000_000)} millones</p>
        )}
        {draft.price && (
          <p className="text-sm text-gray-700 leading-relaxed">
            <span className="font-medium">Razonamiento:</span> {draft.price.reasoningEs}
            <span className="text-gray-400"> · confianza {Math.round(draft.price.confidence * 100)}%</span>
          </p>
        )}
      </div>

      {/* Fuentes consultadas */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-3">Fuentes consultadas</h3>
        <ul className="space-y-2">
          {draft.sourcesReport.map((s, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              {s.ok ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> : <XCircle className="w-4 h-4 text-gray-300 shrink-0" />}
              <TierBadge tier={s.tier} />
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-wise hover:underline flex items-center gap-1">
                {s.nameEs} <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-gray-400 truncate">{s.note}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Hechos por grupo */}
      {groups.map(([group, facts]) => (
        <div key={group} className="bg-white rounded-2xl shadow-soft border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-3">{group}</h3>
          <div className="divide-y divide-gray-100">
            {facts.map(f => (
              <div key={f.key} className={`py-3 flex flex-wrap items-start gap-3 ${!accepted[f.key] ? 'opacity-45' : ''}`}>
                <input type="checkbox" checked={!!accepted[f.key]}
                  onChange={e => setAccepted({ ...accepted, [f.key]: e.target.checked })}
                  className="mt-1 w-4 h-4 accent-[#881cb7]" />

                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 text-sm">{f.labelEs}</span>
                    <TierBadge tier={f.tier} />
                    <span className="text-[10px] text-gray-400">confianza {Math.round(f.confidence * 100)}%</span>
                    {f.conflict && <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px] font-semibold">fuentes en desacuerdo</span>}
                    {f.outOfRange && <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-semibold">fuera de rango físico</span>}
                  </div>
                  <p className="text-xs text-gray-400 italic mt-0.5">"{f.quote}" — {host(f.sourceUrl)}</p>
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
                        className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-right font-semibold" />
                      {f.unit && <span className="text-xs text-gray-400 shrink-0">{f.unit}</span>}
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
      <div className="sticky bottom-4 bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-gray-200 p-4 flex items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          Se publicará con <span className="font-bold">{acceptedCount} datos verificados</span>
          {draft.price?.estimated && Number(priceValue) > 0 && <span className="text-amber-700"> y precio estimado</span>}.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setPhase('form'); setDraft(null); }}>Descartar</Button>
          <Button onClick={publish} disabled={phase === 'publishing' || !priceValue || Number(priceValue) <= 0}
            className="bg-wise hover:bg-wise-dark">
            {phase === 'publishing'
              ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Publicando…</span>
              : 'Publicar vehículo'}
          </Button>
        </div>
      </div>
    </div>
  );
}
