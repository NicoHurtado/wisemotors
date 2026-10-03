'use client';

// ============================================================================
// Crear / editar un concesionario, en tres partes:
//   1. Datos (el teléfono celular hace que los leads le lleguen directo a WhatsApp)
//   2. Ubicación: se pega el link de Google Maps y se leen las coordenadas;
//      con ellas la página muestra el mapa, "Cómo llegar" y la distancia.
//   3. Los carros que vende (VehicleDealer): buscar, marcar, o "todos los Mazda".
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, MapPin, Search } from 'lucide-react';
import { adminFetch, mensajeDeErrorDeAuth } from '@/lib/admin-fetch';
import { urlMapaIncrustado } from '@/lib/mapas';

interface Carro {
  id: string;
  brand: string;
  model: string;
  year: number;
  type?: string;
}

const VACIO = { name: '', location: '', address: '', phone: '', email: '', status: 'Activo', mapsUrl: '', lat: '', lng: '', horario: '' };
type Datos = typeof VACIO;

const campo = 'w-full rounded-2xl border border-linea bg-blanco px-4 py-3 text-[15px] focus:border-wise focus:ring-2 focus:ring-wise';
const etiqueta = 'mb-2 block text-[13px] font-medium text-tinta/80';

export function FormConcesionario({ id }: { id?: string }) {
  const router = useRouter();
  const [datos, setDatos] = useState<Datos>(VACIO);
  const [carros, setCarros] = useState<Carro[]>([]);
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [filtro, setFiltro] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [leyendo, setLeyendo] = useState(false);
  const [aviso, setAviso] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const [rCarros, rDealer] = await Promise.all([
        fetch('/api/vehicles?limit=1000').then(r => (r.ok ? r.json() : { vehicles: [] })),
        id ? fetch(`/api/dealers/${id}`).then(r => (r.ok ? r.json() : null)) : Promise.resolve(null),
      ]);
      const lista: Carro[] = (rCarros.vehicles ?? []).map((v: any) => ({ id: v.id, brand: v.brand, model: v.model, year: v.year, type: v.type }));
      lista.sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`) || b.year - a.year);
      setCarros(lista);
      if (rDealer) {
        setDatos({
          name: rDealer.name ?? '',
          location: rDealer.location ?? '',
          address: rDealer.address ?? '',
          phone: rDealer.phone ?? '',
          email: rDealer.email ?? '',
          status: rDealer.status ?? 'Activo',
          mapsUrl: rDealer.mapsUrl ?? '',
          lat: rDealer.lat ?? '',
          lng: rDealer.lng ?? '',
          horario: rDealer.horario ?? '',
        });
        setMarcados(new Set(rDealer.vehicleIds ?? []));
      }
      setCargando(false);
    })().catch(() => {
      setError('No se pudieron cargar los datos');
      setCargando(false);
    });
  }, [id]);

  const cambiar = (k: keyof Datos) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setDatos(d => ({ ...d, [k]: e.target.value }));

  async function leerUbicacion() {
    setLeyendo(true);
    setError('');
    setAviso('');
    try {
      const r = await adminFetch('/api/admin/ubicacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: datos.mapsUrl }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(mensajeDeErrorDeAuth(r) ?? d.error ?? 'No se pudo leer la ubicación');
      setDatos(x => ({ ...x, lat: String(d.lat), lng: String(d.lng), name: x.name || d.nombre || '' }));
      setAviso(`Ubicación leída: ${Number(d.lat).toFixed(5)}, ${Number(d.lng).toFixed(5)}. Revisa en el mapa que el pin quedó en el concesionario.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLeyendo(false);
    }
  }

  const marcas = useMemo(() => {
    const m = new Map<string, Carro[]>();
    for (const c of carros) m.set(c.brand, [...(m.get(c.brand) ?? []), c]);
    return Array.from(m.entries());
  }, [carros]);
  const visibles = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    return q ? carros.filter(c => `${c.brand} ${c.model} ${c.year} ${c.type ?? ''}`.toLowerCase().includes(q)) : carros;
  }, [carros, filtro]);

  const alternar = (ids: string[], encender: boolean) =>
    setMarcados(prev => {
      const s = new Set(prev);
      for (const i of ids) {
        if (encender) s.add(i);
        else s.delete(i);
      }
      return s;
    });

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      const r = await adminFetch(id ? `/api/dealers/${id}` : '/api/dealers', {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...datos, vehicleIds: Array.from(marcados) }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        const detalle = Array.isArray(d.details) ? d.details.map((x: any) => x.message).join(' · ') : '';
        throw new Error(mensajeDeErrorDeAuth(r) ?? (detalle || d.error || 'No se pudo guardar'));
      }
      router.push(`/admin/dealerships/${d.id ?? id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center gap-2 p-8 text-tinta-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
      </div>
    );
  }

  const lat = parseFloat(datos.lat);
  const lng = parseFloat(datos.lng);
  const mapa = Number.isFinite(lat) && Number.isFinite(lng) ? urlMapaIncrustado({ name: datos.name, address: datos.address, location: datos.location, lat, lng }) : null;

  return (
    <form onSubmit={guardar} className="space-y-6">
      {/* 1. Datos */}
      <section className="rounded-[28px] bg-blanco p-6 md:p-8">
        <h2 className="text-[20px] font-semibold tracking-[-0.02em]">Datos</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <label className={etiqueta} htmlFor="c-nombre">Nombre *</label>
            <input id="c-nombre" className={campo} value={datos.name} onChange={cambiar('name')} placeholder="Mazda Autolarte El Poblado" required />
          </div>
          <div>
            <label className={etiqueta} htmlFor="c-ciudad">Ciudad *</label>
            <input id="c-ciudad" className={campo} value={datos.location} onChange={cambiar('location')} placeholder="Medellín" required />
          </div>
          <div className="md:col-span-2">
            <label className={etiqueta} htmlFor="c-dir">Dirección *</label>
            <input id="c-dir" className={campo} value={datos.address} onChange={cambiar('address')} placeholder="Cra. 43A #9 Sur-91" required />
          </div>
          <div>
            <label className={etiqueta} htmlFor="c-tel">Teléfono / WhatsApp *</label>
            <input id="c-tel" type="tel" className={campo} value={datos.phone} onChange={cambiar('phone')} placeholder="310 555 1234" required />
            <p className="mt-1.5 text-[12px] text-tinta-2">Si es un celular, los contactos de la página le llegan directo a su WhatsApp.</p>
          </div>
          <div>
            <label className={etiqueta} htmlFor="c-mail">Email *</label>
            <input id="c-mail" type="email" className={campo} value={datos.email} onChange={cambiar('email')} placeholder="ventas@concesionario.com" required />
          </div>
          <div>
            <label className={etiqueta} htmlFor="c-horario">Horario</label>
            <input id="c-horario" className={campo} value={datos.horario} onChange={cambiar('horario')} placeholder="L–V 8:00–18:00 · Sáb 9:00–14:00" />
          </div>
          <div>
            <label className={etiqueta} htmlFor="c-estado">Estado</label>
            <select id="c-estado" className={campo} value={datos.status} onChange={cambiar('status')}>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo (no se muestra en la página)</option>
              <option value="En construcción">En construcción</option>
            </select>
          </div>
        </div>
      </section>

      {/* 2. Ubicación */}
      <section className="rounded-[28px] bg-blanco p-6 md:p-8">
        <h2 className="flex items-center gap-2 text-[20px] font-semibold tracking-[-0.02em]">
          <MapPin className="h-5 w-5 text-wise" /> Ubicación
        </h2>
        <p className="mt-1 text-[14px] text-tinta-2">
          En Google Maps, busca el concesionario, toca <strong>Compartir</strong> y copia el link. Con eso la página muestra el mapa, el botón
          &quot;Cómo llegar&quot; y a cuántos km está cada persona.
        </p>
        <div className="mt-4 flex flex-col gap-2 md:flex-row">
          <input className={campo} value={datos.mapsUrl} onChange={cambiar('mapsUrl')} placeholder="https://maps.app.goo.gl/…" aria-label="Link de Google Maps" />
          <button type="button" className="pastilla pastilla--wise h-12 shrink-0 px-5" disabled={!datos.mapsUrl.trim() || leyendo} onClick={leerUbicacion}>
            {leyendo ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Leer ubicación'}
          </button>
        </div>
        <details className="mt-3 text-[13px] text-tinta-2">
          <summary className="cursor-pointer">Escribir las coordenadas a mano</summary>
          <div className="mt-3 grid max-w-[480px] grid-cols-2 gap-3">
            <input className={campo} value={datos.lat} onChange={cambiar('lat')} placeholder="Latitud (6.2087)" inputMode="decimal" aria-label="Latitud" />
            <input className={campo} value={datos.lng} onChange={cambiar('lng')} placeholder="Longitud (-75.5714)" inputMode="decimal" aria-label="Longitud" />
          </div>
        </details>
        {aviso && <p className="mt-3 rounded-xl bg-papel p-3 text-[13px]">{aviso}</p>}
        {mapa ? (
          <iframe title="Vista previa del mapa" src={mapa} className="mt-4 h-[300px] w-full rounded-[22px] border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        ) : (
          <p className="mt-4 rounded-[22px] bg-papel p-6 text-center text-[14px] text-tinta-2">Sin ubicación todavía: la página no mostrará mapa ni distancia.</p>
        )}
      </section>

      {/* 3. Carros que vende */}
      <section className="rounded-[28px] bg-blanco p-6 md:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[20px] font-semibold tracking-[-0.02em]">Carros que vende</h2>
          <span className="text-[14px] text-tinta-2">
            {marcados.size} de {carros.length} marcados
          </span>
        </div>
        <p className="mt-1 text-[14px] text-tinta-2">Aparece en la ficha de cada uno de estos carros, con su ubicación y el botón para contactarlo.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {marcas.map(([marca, lista]) => {
            const todos = lista.every(c => marcados.has(c.id));
            return (
              <button key={marca} type="button" className="pastilla h-10 px-4 text-[13px]" data-activa={todos} onClick={() => alternar(lista.map(c => c.id), !todos)}>
                {todos ? <Check className="h-3.5 w-3.5" /> : null} Todos los {marca} ({lista.length})
              </button>
            );
          })}
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-2" />
          <input className={`${campo} pl-10`} value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="Buscar: Mazda, CX-30, SUV, 2026…" aria-label="Buscar carros" />
        </div>
        {visibles.length > 0 && (
          <div className="mt-2 flex gap-3 text-[13px]">
            <button type="button" className="text-wise underline-offset-2 hover:underline" onClick={() => alternar(visibles.map(c => c.id), true)}>
              Marcar {filtro ? 'los que se ven' : 'todos'}
            </button>
            <button type="button" className="text-tinta-2 underline-offset-2 hover:underline" onClick={() => alternar(visibles.map(c => c.id), false)}>
              Desmarcar {filtro ? 'los que se ven' : 'todos'}
            </button>
          </div>
        )}

        <ul className="mt-3 grid max-h-[420px] gap-1 overflow-y-auto pr-1 md:grid-cols-2">
          {visibles.map(c => {
            const si = marcados.has(c.id);
            return (
              <li key={c.id}>
                <label className={`flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] ${si ? 'bg-wise/10' : 'hover:bg-papel'}`}>
                  <input type="checkbox" className="h-4 w-4 accent-[#881cb7]" checked={si} onChange={e => alternar([c.id], e.target.checked)} />
                  <span className="font-medium">
                    {c.brand} {c.model}
                  </span>
                  <span className="text-tinta-2">
                    {c.year}
                    {c.type ? ` · ${c.type}` : ''}
                  </span>
                </label>
              </li>
            );
          })}
          {visibles.length === 0 && <li className="p-3 text-[14px] text-tinta-2">Ningún carro coincide con “{filtro}”.</li>}
        </ul>
      </section>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" className="pastilla h-12 px-6" onClick={() => router.back()}>
          Cancelar
        </button>
        <button type="submit" className="pastilla pastilla--wise h-12 px-6" disabled={guardando}>
          {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : id ? 'Guardar cambios' : 'Crear concesionario'}
        </button>
      </div>
    </form>
  );
}
