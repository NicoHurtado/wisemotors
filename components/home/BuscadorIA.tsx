'use client';

// ============================================================================
// Búsqueda en lenguaje natural: la puerta principal del producto.
// El placeholder se escribe solo con cosas que la gente de verdad dice.
// ============================================================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Sparkles } from 'lucide-react';

const EJEMPLOS = [
  'Una SUV para la familia que no gaste mucho',
  'Algo barato pero con fuerza para subir a Las Palmas',
  'Un eléctrico para moverme por Medellín',
  'Una pickup fuerte para la finca',
  'Carro seguro para mi papá, que ya está mayor',
  'Primer carro, fácil de parquear y económico',
];

const SUGERENCIAS = [
  { texto: 'Para la familia', q: 'Una SUV cómoda y segura para la familia' },
  { texto: 'Que gaste poco', q: 'Un carro que gaste muy poca gasolina' },
  { texto: 'Eléctrico', q: 'Un carro eléctrico para la ciudad' },
];

export function BuscadorIA({ inicial = '', oscuro = false }: { inicial?: string; oscuro?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState(inicial);
  const [ph, setPh] = useState('');
  const [i, setI] = useState(0);

  useEffect(() => setQ(inicial), [inicial]);

  // Máquina de escribir: escribe, espera, borra, siguiente.
  useEffect(() => {
    if (q) return;
    const texto = EJEMPLOS[i % EJEMPLOS.length];
    let n = 0;
    let borrando = false;
    let t: ReturnType<typeof setTimeout>;
    const paso = () => {
      if (!borrando) {
        n++;
        setPh(texto.slice(0, n));
        if (n >= texto.length) {
          borrando = true;
          t = setTimeout(paso, 2200);
          return;
        }
        t = setTimeout(paso, 38);
      } else {
        n--;
        setPh(texto.slice(0, n));
        if (n <= 0) {
          setI(x => x + 1);
          return;
        }
        t = setTimeout(paso, 16);
      }
    };
    t = setTimeout(paso, 300);
    return () => clearTimeout(t);
  }, [i, q]);

  const buscar = (texto: string) => {
    const limpio = texto.trim();
    if (!limpio) return;
    router.push(`/?q=${encodeURIComponent(limpio)}#resultados`);
  };

  return (
    <div>
      <form
        onSubmit={e => {
          e.preventDefault();
          buscar(q);
        }}
        className="group relative flex h-[62px] items-center rounded-full bg-blanco pl-5 pr-2 shadow-[0_24px_50px_-24px_rgba(0,0,0,0.6)] ring-1 ring-black/5 transition-shadow focus-within:ring-2 focus-within:ring-wise"
      >
        <Sparkles className="h-5 w-5 shrink-0 text-wise" />
        <label htmlFor="buscador-ia" className="sr-only">
          Describe el carro que necesitas
        </label>
        <input
          id="buscador-ia"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={ph || 'Describe cómo vas a usar el carro'}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-[16px] text-tinta outline-none placeholder:text-tinta-2/70"
          autoComplete="off"
        />
        <button
          type="submit"
          aria-label="Buscar"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-wise text-white transition-transform duration-300 hover:scale-105 active:scale-95"
        >
          <ArrowUpRight className="h-5 w-5 transition-transform duration-500 group-focus-within:rotate-45" />
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGERENCIAS.map(s => (
          <button
            key={s.texto}
            onClick={() => buscar(s.q)}
            className={`pastilla h-9 px-4 text-[13px] ${oscuro ? 'pastilla--oscura' : ''}`}
          >
            {s.texto}
          </button>
        ))}
      </div>
    </div>
  );
}
