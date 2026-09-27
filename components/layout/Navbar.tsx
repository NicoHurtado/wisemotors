'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { User, LogOut, Heart, Settings, Menu, X, MessageSquare, Home, CarFront, Swords, Sparkles } from 'lucide-react';
import { LiquidTabs, type LiquidTab } from '@/components/layout/LiquidTabs';
import { useEffect, useState } from 'react';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { isFullyAuthorized } = useAdmin();
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [condensada, setCondensada] = useState(false);

  // La barra gana el vidrio al despegarse del tope. Un solo rAF por frame.
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        setCondensada(window.scrollY > 12);
        frame = 0;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Cerrar el menú móvil al cambiar de ruta
  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    setMenuAbierto(false);
    window.location.href = '/';
  };

  const enlaces: LiquidTab[] = [
    { href: '/', texto: 'Inicio', icono: Home },
    { href: '/vehicles', texto: 'Vehículos', icono: CarFront },
    ...(isAuthenticated
      ? [
          { href: '/favorites', texto: 'Favoritos', icono: Heart },
          { href: '/compare', texto: 'Comparar', icono: Swords },
        ]
      : []),
  ];

  const enlacesAdmin = isFullyAuthorized
    ? [
        { href: '/admin/ingest', texto: 'Subir con IA', icono: Sparkles },
        { href: '/admin', texto: 'Panel', icono: Settings },
        { href: '/admin/whatsapp-leads', texto: 'Leads', icono: MessageSquare },
      ]
    : [];

  const esActivo = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  // La pestaña activa es la de ruta más específica ("/admin/ingest" gana a "/admin").
  const activo =
    enlaces
      .filter(e => esActivo(e.href))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null;

  return (
    <nav className="sticky top-0 z-40 px-3 pt-3 md:px-6 md:pt-4">
      {/* Barra flotante: vidrio siempre presente. Al bajar se estrecha y la
          sombra se profundiza, así el cambio se siente sin que rebote. */}
      <div
        className="glass-bar relative mx-auto rounded-2xl px-4 md:px-6"
        style={{
          maxWidth: condensada ? '1080px' : '1400px',
          transition: 'max-width 420ms var(--ease-out-strong)',
        }}
      >
        <div className="grid h-14 grid-cols-[auto_1fr_auto] items-center gap-4 md:h-16">
          <Link href="/" className="text-[22px] font-semibold tracking-tight">
            <span className="text-wise">Wise</span>
            <span className="text-foreground">Motors</span>
          </Link>

          {/* Centro: pestañas Liquid Glass con lente que se desliza */}
          <div className="hidden items-center justify-center gap-2 md:flex">
            <LiquidTabs tabs={enlaces} activo={activo} />

            {enlacesAdmin.length > 0 && (
              <>
                <span className="mx-1 h-5 w-px self-center bg-gray-200" aria-hidden />
                {enlacesAdmin.map(enlace => {
                  const Icono = enlace.icono;
                  const activoAdmin =
                    enlace.href === '/admin' ? pathname === '/admin' : pathname.startsWith(enlace.href);
                  return (
                    <Link
                      key={enlace.href}
                      href={enlace.href}
                      aria-current={activoAdmin ? 'page' : undefined}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium hover:text-wise ${activoAdmin ? 'text-wise' : 'text-gray-500'}`}
                      style={{ transition: 'color var(--motion-instant) ease' }}
                    >
                      <Icono className="h-4 w-4" strokeWidth={1.75} />
                      <span className="hidden lg:inline">{enlace.texto}</span>
                    </Link>
                  );
                })}
              </>
            )}
          </div>

          {/* Derecha: sesión */}
          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated ? (
              <>
                <span className="flex items-center gap-2 text-[14px] text-gray-600">
                  <User className="h-4 w-4" strokeWidth={1.75} />
                  {user?.username}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-600"
                >
                  <LogOut className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
                  Salir
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Iniciar sesión</Link>
                </Button>
                <Button variant="wise" size="sm" className="rounded-full px-4" asChild>
                  <Link href="/register">Crear cuenta</Link>
                </Button>
              </>
            )}
          </div>

          <button
            className="justify-self-end rounded-lg p-2 text-gray-700 hover:bg-gray-100 md:hidden"
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-expanded={menuAbierto}
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          >
            {menuAbierto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>


      {/* Menú móvil: también sobre vidrio */}
      {menuAbierto && (
        <div className="glass-bar relative mt-2 rounded-2xl md:hidden">
          <div className="space-y-1 p-3">
            {enlacesAdmin.map(enlace => {
              const Icono = enlace.icono;
              const activo = esActivo(enlace.href);
              return (
                <Link
                  key={enlace.href}
                  href={enlace.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[15px] font-medium"
                  style={{ color: activo ? '#881cb7' : '#374151' }}
                >
                  {Icono && <Icono className="h-4 w-4" strokeWidth={1.75} />}
                  {enlace.texto}
                </Link>
              );
            })}

            <div className={enlacesAdmin.length ? 'mt-3 border-t border-gray-200 pt-3' : ''}>
              {isAuthenticated ? (
                <>
                  <span className="flex items-center gap-2 px-3 py-2 text-[15px] text-gray-600">
                    <User className="h-4 w-4" strokeWidth={1.75} />
                    {user?.username}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full justify-start text-gray-600 hover:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" strokeWidth={1.75} />
                    Cerrar sesión
                  </Button>
                </>
              ) : (
                <div className="space-y-2">
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href="/login">Iniciar sesión</Link>
                  </Button>
                  <Button variant="wise" size="sm" className="w-full rounded-full" asChild>
                    <Link href="/register">Crear cuenta</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dock móvil: las pestañas principales viven abajo, al alcance del pulgar */}
      <div
        className="fixed inset-x-3 z-40 md:hidden"
        style={{ bottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <LiquidTabs tabs={enlaces} activo={activo} variante="dock" />
      </div>
    </nav>
  );
}
