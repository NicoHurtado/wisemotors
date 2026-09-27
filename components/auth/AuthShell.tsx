// ============================================================================
// Carcasa de login y registro: showroom oscuro con el carro a la izquierda,
// formulario sobre papel a la derecha. En móvil, solo el formulario.
// ============================================================================

import Link from 'next/link';
import { CarRender } from '@/components/car/CarRender';
import { Logo } from '@/components/brand/Logo';

export function AuthShell({
  titulo,
  tenue,
  children,
  pie,
}: {
  titulo: string;
  tenue: string;
  children: React.ReactNode;
  pie: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-76px)] max-w-[1440px] gap-6 px-5 py-6 md:px-8 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden rounded-[36px] bg-showroom text-white lg:block">
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-[38%]"
          style={{ background: 'linear-gradient(170deg, #521672, #2a0a3d)' }}
        />
        <p aria-hidden className="t-display absolute left-8 top-[18%] text-[15vw] leading-none text-[#5b1a82] xl:text-[220px]">
          WISE
        </p>
        <div className="carro-entra absolute bottom-[22%] left-[6%] right-[-6%]">
          <CarRender car={{ brand: 'Wise', model: 'Estudio', type: 'SUV' }} className="aspect-[480/180] w-full" />
        </div>
        <div className="absolute inset-x-8 bottom-8 flex items-end justify-between gap-6">
          <p className="max-w-[26ch] text-[22px] font-semibold leading-tight tracking-[-0.03em]">
            Carros medidos contra Colombia. <span className="text-white/45">No contra el catálogo mundial.</span>
          </p>
          <Link href="/" aria-label="Inicio">
            <Logo oscuro soloMarca />
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-center py-10">
        <div className="sube w-full max-w-[440px]">
          <h1 className="t-titulo text-[44px] md:text-[56px]">
            {titulo} <span className="text-tinta-2/50">{tenue}</span>
          </h1>
          <div className="mt-10">{children}</div>
          <div className="mt-8 text-[15px] text-tinta-2">{pie}</div>
        </div>
      </div>
    </div>
  );
}
