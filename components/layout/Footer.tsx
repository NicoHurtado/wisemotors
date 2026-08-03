import Link from 'next/link';
import { Instagram, ArrowUpRight } from 'lucide-react';

const COLUMNAS = [
  {
    titulo: 'Explorar',
    enlaces: [
      { texto: 'Catálogo completo', href: '/vehicles' },
      { texto: 'Comparar vehículos', href: '/compare' },
      { texto: 'Favoritos', href: '/favorites' },
    ],
  },
  {
    titulo: 'Cuenta',
    enlaces: [
      { texto: 'Iniciar sesión', href: '/login' },
      { texto: 'Crear cuenta', href: '/register' },
    ],
  },
];

const CONTACTO = [
  { texto: '@wisemotors.co', href: 'https://instagram.com/wisemotors.co', externo: true },
  { texto: '+57 (310) 381 8615', href: 'tel:+573103818615', externo: false },
  { texto: 'wisemotorsco@gmail.com', href: 'mailto:wisemotorsco@gmail.com', externo: false },
];

export function Footer() {
  return (
    <footer className="relative mt-16 overflow-hidden px-3 pb-3 md:px-6 md:pb-4">
      <div className="glass relative mx-auto max-w-[1400px] overflow-hidden rounded-[1.75rem] px-6 pt-9 md:px-10">
        {/* Luz de acento: le da al vidrio algo que refractar en la esquina */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(136,28,183,0.18) 0%, transparent 70%)',
          }}
        />

        <div className="relative grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-12 md:gap-8">
          {/* Marca y propuesta */}
          <div className="col-span-2 md:col-span-5">
            <span className="text-[24px] font-semibold tracking-tight">
              <span className="text-wise">Wise</span>
              <span className="text-foreground">Motors</span>
            </span>
            <p className="mt-2 max-w-[38ch] text-[14px] leading-relaxed text-muted-foreground">
              Carros nuevos medidos contra el mercado colombiano, no contra el catálogo
              mundial.
            </p>

            <Link
              href="https://instagram.com/wisemotors.co"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-wise/10 text-wise hover:bg-wise hover:text-white"
              style={{
                transition:
                  'background-color var(--motion-instant) ease, color var(--motion-instant) ease',
              }}
              aria-label="Instagram de WiseMotors"
            >
              <Instagram className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </Link>
          </div>

          {/* Columnas de enlaces */}
          {COLUMNAS.map(columna => (
            <nav key={columna.titulo} className="md:col-span-2">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
                {columna.titulo}
              </h3>
              <ul className="space-y-2">
                {columna.enlaces.map(enlace => (
                  <li key={enlace.href}>
                    <Link
                      href={enlace.href}
                      className="text-[15px] text-foreground/70 hover:text-wise"
                      style={{ transition: 'color var(--motion-instant) ease' }}
                    >
                      {enlace.texto}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Contacto */}
          <div className="col-span-2 md:col-span-3">
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
              Contacto
            </h3>
            <ul className="space-y-2.5">
              {CONTACTO.map(item => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    target={item.externo ? '_blank' : undefined}
                    rel={item.externo ? 'noopener noreferrer' : undefined}
                    className="group inline-flex items-center gap-1 text-[15px] text-foreground/70 hover:text-wise"
                    style={{ transition: 'color var(--motion-instant) ease' }}
                  >
                    {item.texto}
                    {item.externo && (
                      <ArrowUpRight
                        className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100"
                        strokeWidth={2}
                        style={{ transition: 'opacity var(--motion-instant) ease' }}
                      />
                    )}
                  </Link>
                </li>
              ))}
              <li className="pt-1 text-[15px] text-muted-foreground">Medellín, Antioquia</li>
            </ul>
          </div>
        </div>

        {/* Barra inferior con el wordmark de marca de agua detrás, en vez de
            una franja aparte: ahorra una banda entera de alto. */}
        <div className="relative mt-8 border-t border-foreground/[0.07]">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -bottom-2 select-none whitespace-nowrap text-center font-semibold leading-none tracking-[-0.05em] text-wise/[0.06]"
            style={{ fontSize: 'clamp(2.5rem, 9vw, 6rem)' }}
          >
            WiseMotors
          </span>

          <div className="relative flex flex-col gap-1 py-5 text-[12px] text-muted-foreground md:flex-row md:items-center md:justify-between">
            <p>© 2026 WiseMotors. Todos los derechos reservados.</p>
            <p>Precios verificados contra la fuente del fabricante.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
