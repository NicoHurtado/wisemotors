'use client';

// ============================================================================
// Navegación.
//
// Pastillas (referencia Car Sell Center): la activa llena en tinta, el resto
// con borde. Sobre el showroom negro de la home arranca transparente y en
// blanco; al bajar se vuelve papel con desenfoque. En móvil, un menú de
// pantalla completa con los destinos en tipografía grande.
// ============================================================================

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Heart, LogOut, Menu, Search, Sparkles, User, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { Logo } from '@/components/brand/Logo';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { isFullyAuthorized } = useAdmin();
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [bajo, setBajo] = useState(false);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        // En la home, el hero ocupa ~una pantalla: la barra se aclara al salir de él.
        setBajo(window.scrollY > (pathname === '/' ? window.innerHeight * 0.82 : 8));
        frame = 0;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  useEffect(() => setAbierto(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = abierto ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [abierto]);

  const oscuro = pathname === '/' && !bajo;

  const enlaces = [
    { href: '/', texto: 'Inicio' },
    { href: '/vehicles', texto: 'Catálogo' },
    { href: '/compare', texto: 'Comparar' },
    ...(isAuthenticated ? [{ href: '/favorites', texto: 'Favoritos' }] : []),
  ];

  const activo = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  const salir = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500"
        style={{
          background: oscuro ? 'transparent' : 'rgba(241,240,243,0.78)',
          backdropFilter: oscuro ? 'none' : 'blur(18px) saturate(160%)',
          WebkitBackdropFilter: oscuro ? 'none' : 'blur(18px) saturate(160%)',
          borderBottom: `1px solid ${oscuro ? 'transparent' : 'rgba(14,12,17,0.06)'}`,
        }}
      >
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center gap-4 px-4 md:px-8">
          <Link href="/" aria-label="WiseMotors, inicio" className="shrink-0">
            <Logo oscuro={oscuro} />
          </Link>

          <nav className="ml-6 hidden items-center gap-2 lg:flex" aria-label="Principal">
            {enlaces.map(e => {
              const on = activo(e.href);
              return (
                <Link
                  key={e.href}
                  href={e.href}
                  aria-current={on ? 'page' : undefined}
                  className={`pastilla h-10 px-5 ${oscuro ? 'pastilla--oscura' : ''}`}
                  data-activa={on && !oscuro}
                  style={on && oscuro ? { background: '#fff', color: '#0e0c11', borderColor: '#fff' } : undefined}
                >
                  {e.texto}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <Link
              href="/vehicles"
              aria-label="Buscar en el catálogo"
              className={`flecha h-10 w-10 ${oscuro ? '!border-white/20 !bg-white/5 !text-white' : ''}`}
            >
              <Search className="h-4 w-4" />
            </Link>

            {isFullyAuthorized && (
              <>
                <Link href="/admin/ingest" className={`pastilla h-10 px-4 ${oscuro ? 'pastilla--oscura' : ''}`}>
                  <Sparkles className="h-4 w-4 text-wise" /> Subir con IA
                </Link>
                <Link href="/admin" className={`pastilla h-10 px-4 ${oscuro ? 'pastilla--oscura' : ''}`}>
                  Panel
                </Link>
              </>
            )}

            {isAuthenticated ? (
              <>
                <Link href="/favorites" aria-label="Favoritos" className={`flecha h-10 w-10 ${oscuro ? '!border-white/20 !bg-white/5 !text-white' : ''}`}>
                  <Heart className="h-4 w-4" />
                </Link>
                <span className={`pastilla h-10 cursor-default px-4 ${oscuro ? 'pastilla--oscura' : ''}`}>
                  <User className="h-4 w-4" /> {user?.username}
                </span>
                <button
                  onClick={salir}
                  aria-label="Cerrar sesión"
                  className={`flecha h-10 w-10 ${oscuro ? '!border-white/20 !bg-white/5 !text-white' : ''}`}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={`pastilla h-10 px-5 ${oscuro ? 'pastilla--oscura' : ''}`}>
                  Ingresar
                </Link>
                <Link href="/register" className="pastilla pastilla--wise h-10 px-5">
                  Crear cuenta <ArrowUpRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setAbierto(true)}
            className={`flecha ml-auto h-11 w-11 lg:hidden ${oscuro ? '!border-white/20 !bg-white/5 !text-white' : ''}`}
            aria-label="Abrir menú"
            aria-expanded={abierto}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Menú móvil: pantalla completa, destinos grandes */}
      {abierto && (
        <div className="menu-movil fixed inset-0 z-[60] flex flex-col bg-showroom px-5 pb-8 pt-5 text-white lg:hidden">
          <div className="flex items-center justify-between">
            <Logo oscuro />
            <button onClick={() => setAbierto(false)} className="flecha h-11 w-11 !border-white/20 !bg-white/5 !text-white" aria-label="Cerrar menú">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="mt-14 flex flex-col" aria-label="Principal">
            {[...enlaces, ...(isFullyAuthorized ? [{ href: '/admin/ingest', texto: 'Subir con IA' }, { href: '/admin', texto: 'Panel' }] : [])].map(
              (e, i) => (
                <Link
                  key={e.href}
                  href={e.href}
                  className="sube flex items-center justify-between border-b border-white/10 py-4 text-[40px] font-semibold tracking-[-0.04em]"
                  style={{ '--d': `${60 + i * 50}ms` } as React.CSSProperties}
                >
                  <span className={activo(e.href) ? 'text-wise-lila' : ''}>{e.texto}</span>
                  <ArrowUpRight className="h-7 w-7 text-white/40" />
                </Link>
              )
            )}
          </nav>

          <div className="mt-auto flex gap-3">
            {isAuthenticated ? (
              <button onClick={salir} className="pastilla pastilla--oscura h-12 flex-1 justify-center">
                <LogOut className="h-4 w-4" /> Cerrar sesión
              </button>
            ) : (
              <>
                <Link href="/login" className="pastilla pastilla--oscura h-12 flex-1 justify-center">
                  Ingresar
                </Link>
                <Link href="/register" className="pastilla pastilla--wise h-12 flex-1 justify-center">
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* La home arranca debajo de la barra (su hero la rellena); el resto necesita el espacio */}
      {pathname !== '/' && <div className="h-[76px]" aria-hidden />}
    </>
  );
}
