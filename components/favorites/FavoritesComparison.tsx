'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { TarjetaCarro, type VehiculoTarjeta } from '@/components/car/TarjetaCarro';

// Tus favoritos: las mismas tarjetas del catálogo y un atajo al comparador.
export function FavoritesComparison() {
  const { user } = useAuth();
  const { favorites, loading } = useFavorites();

  const vacio = (titulo: string, texto: string, cta: React.ReactNode) => (
    <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-8 md:py-28">
      <div className="estudio rounded-[36px] px-8 py-16 md:px-16 md:py-24">
        <h1 className="t-titulo max-w-[14ch] text-[48px] md:text-[80px]">{titulo}</h1>
        <p className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-tinta-2">{texto}</p>
        <div className="mt-10 flex flex-wrap gap-3">{cta}</div>
      </div>
    </div>
  );

  if (!user) {
    return vacio(
      'Guarda los que te gusten.',
      'Con una cuenta guardas carros con el corazón y después los pones frente a frente.',
      <>
        <Link href="/register" className="pastilla pastilla--wise h-12 px-6">
          Crear cuenta <ArrowUpRight className="h-4 w-4" />
        </Link>
        <Link href="/login" className="pastilla h-12 px-6">
          Ya tengo cuenta
        </Link>
      </>
    );
  }

  if (!loading && favorites.length === 0) {
    return vacio(
      'Todavía no hay nada aquí.',
      'Toca el corazón en cualquier carro del catálogo y aparecerá en esta página.',
      <Link href="/vehicles" className="pastilla pastilla--tinta h-12 px-6">
        Ir al catálogo <ArrowUpRight className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-10 pt-10 md:px-8 md:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-linea pb-8">
        <h1 className="t-titulo text-[48px] md:text-[80px]">
          Favoritos <span className="t-ligero text-tinta-2/50">({favorites.length})</span>
        </h1>
        {favorites.length >= 2 && (
          <Link href="/compare" className="pastilla pastilla--wise h-12 px-6">
            Ponerlos frente a frente <ArrowUpRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading && favorites.length === 0
          ? Array.from({ length: 3 }, (_, i) => <div key={i} className="h-[380px] animate-pulse rounded-[28px] bg-tarjeta" />)
          : favorites.map((v, i) => <TarjetaCarro key={v.id} vehiculo={v as unknown as VehiculoTarjeta} indice={i} />)}
      </div>
    </div>
  );
}
