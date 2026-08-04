'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { CompareMatrix } from '@/components/compare/CompareMatrix';
import { CompareRadar } from '@/components/compare/CompareRadar';
import { CompareIntelligence } from '@/components/compare/CompareIntelligence';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { Brain, Car, Check, Heart, LayoutGrid, Radar, Sparkles } from 'lucide-react';

// ============================================================================
// Comparador.
//
// El anterior arrancaba con una tarjeta de selección con checkboxes y cuatro
// pestañas antes de mostrar un solo dato. Aquí la selección es una tira de
// fichas que se prenden y apagan, y la comparación empieza de una.
// ============================================================================

type Vista = 'matriz' | 'radar' | 'ia';

const MAX_COMPARAR = 5;

const VISTAS: { clave: Vista; texto: string; icono: typeof LayoutGrid }[] = [
  { clave: 'matriz', texto: 'Dato por dato', icono: LayoutGrid },
  { clave: 'radar', texto: 'Radar', icono: Radar },
  { clave: 'ia', texto: 'Análisis IA', icono: Brain },
];

/** Pantalla vacía con la misma materialidad que el resto del sitio. */
function Vacio({
  titulo,
  texto,
  children,
}: {
  titulo: string;
  texto: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <div className="glass mx-auto flex h-16 w-16 items-center justify-center rounded-2xl">
        <Car className="h-7 w-7 text-wise" strokeWidth={1.5} />
      </div>
      <h1 className="mt-6 text-[30px] font-semibold leading-tight tracking-[-0.03em] text-foreground">
        {titulo}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">{texto}</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">{children}</div>
    </div>
  );
}

export default function ComparePage() {
  const { user } = useAuth();
  const { favorites, loading } = useFavorites();
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [vista, setVista] = useState<Vista>('matriz');

  useEffect(() => {
    // Arranca con los primeros favoritos ya marcados: nadie quiere hacer clic
    // cinco veces antes de ver una comparación.
    setSeleccionados(favorites.slice(0, MAX_COMPARAR).map(v => v.id));
  }, [favorites]);

  const alternar = (id: string) => {
    setSeleccionados(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < MAX_COMPARAR
          ? [...prev, id]
          : prev
    );
  };

  const datos = useMemo(
    () => favorites.filter(v => seleccionados.includes(v.id)),
    [favorites, seleccionados]
  );

  if (!user) {
    return (
      <Vacio
        titulo="Compara tus favoritos"
        texto="Necesitas una cuenta para guardar vehículos y compararlos entre sí."
      >
        <Button asChild variant="wise">
          <Link href="/login">Iniciar sesión</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/register">Crear cuenta</Link>
        </Button>
      </Vacio>
    );
  }

  if (loading && favorites.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-wise/20 border-t-wise" />
        <p className="mt-4 text-[15px] text-muted-foreground">Cargando tus favoritos…</p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <Vacio
        titulo="Todavía no tienes favoritos"
        texto="Marca con el corazón los vehículos que te interesen y aquí los podrás comparar dato por dato."
      >
        <Button asChild variant="wise">
          <Link href="/vehicles">Explorar vehículos</Link>
        </Button>
      </Vacio>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 md:px-6">
      {/* Encabezado */}
      <header className="mb-8">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-wise">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
          Comparador
        </p>
        <h1 className="mt-2 text-[34px] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground md:text-[44px]">
          Lado a lado, sin adornos
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Solo se comparan los datos que al menos dos de tus vehículos tienen. Lo que no aplica a un
          tren motriz se dice; lo que falta, también.
        </p>
      </header>

      {/* Tira de selección */}
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            <Heart className="h-3.5 w-3.5" strokeWidth={2} />
            Tus favoritos
          </h2>
          <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
            {seleccionados.length}/{MAX_COMPARAR}
          </span>
        </div>

        <div className="flex snap-x gap-3 overflow-x-auto pb-2">
          {favorites.map(v => {
            const activo = seleccionados.includes(v.id);
            const lleno = !activo && seleccionados.length >= MAX_COMPARAR;
            return (
              <button
                key={v.id}
                onClick={() => alternar(v.id)}
                disabled={lleno}
                aria-pressed={activo}
                className={`glass relative w-[200px] shrink-0 snap-start rounded-2xl px-4 py-3.5 text-left transition-transform duration-200 ${
                  activo ? 'ring-2 ring-wise/60' : 'opacity-60 hover:opacity-100'
                } ${lleno ? 'cursor-not-allowed opacity-30' : 'hover:-translate-y-0.5'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-foreground">
                      {v.brand} {v.model}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      {v.year} · {v.fuelType}
                    </p>
                  </div>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors ${
                      activo ? 'bg-wise text-white' : 'bg-foreground/[0.07]'
                    }`}
                  >
                    {activo && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                </div>
                <p className="mt-2 font-mono text-[14px] font-bold tabular-nums text-foreground">
                  {formatPrice(v.price)}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {datos.length < 2 ? (
        <div className="glass rounded-3xl p-10 text-center">
          <p className="text-[15px] font-semibold text-foreground">
            Marca al menos dos vehículos
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[14px] text-muted-foreground">
            Con uno solo no hay nada que contrastar.
          </p>
        </div>
      ) : (
        <>
          {/* Selector de vista: pastilla de vidrio, no una barra de pestañas */}
          <div className="glass mb-5 inline-flex gap-1 rounded-full p-1">
            {VISTAS.map(v => {
              const Icono = v.icono;
              const activa = vista === v.clave;
              return (
                <button
                  key={v.clave}
                  onClick={() => setVista(v.clave)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
                    activa
                      ? 'bg-wise text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icono className="h-3.5 w-3.5" strokeWidth={2} />
                  {v.texto}
                </button>
              );
            })}
          </div>

          {vista === 'matriz' && <CompareMatrix vehicles={datos as any} />}
          {vista === 'radar' && <CompareRadar vehicles={datos as any} />}
          {vista === 'ia' && <CompareIntelligence vehicles={datos as any} />}
        </>
      )}
    </div>
  );
}
