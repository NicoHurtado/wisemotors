'use client';

// ============================================================================
// Resultados de la búsqueda con IA, en el sistema "Estudio".
//
// El #1 no es una tarjeta más: va en grande sobre el estudio, con su afinidad
// y las razones en palabras de persona. El #2 y #3 en compacto; el resto en
// tarjetas del catálogo. Los resultados de la IA no traen fotos ni ficha, así
// que se cruzan por id con el catálogo que ya cargó la home.
// ============================================================================

import Link from 'next/link';
import { ArrowUpRight, Check } from 'lucide-react';
import { CarRender } from '@/components/car/CarRender';
import { TarjetaCarro, type VehiculoTarjeta } from '@/components/car/TarjetaCarro';
import { BuscadorIA } from '@/components/home/BuscadorIA';
import { datosClave, millones, palabraGigante, tresDatos } from '@/lib/vehiculo-datos';

/** Razones comparativas, calculadas con datos reales, frente a los otros del podio. */
function razonesRelativas(v: any, podio: any[]): string[] {
  if (podio.length < 2) return [];
  const out: string[] = [];
  const dato = (x: any, k: string) => datosClave(x).find(d => d.clave === k)?.numero ?? null;
  const mejor = (k: string, menor = false) => {
    const vals = podio.map(x => dato(x, k)).filter((n): n is number => n !== null);
    const mio = dato(v, k);
    if (mio === null || vals.length < 2) return false;
    return menor ? mio === Math.min(...vals) : mio === Math.max(...vals);
  };
  if (v.price === Math.min(...podio.map(x => x.price))) out.push(`El de menor precio de tus ${podio.length} mejores opciones`);
  if (mejor('consumo')) out.push('El que más rinde por galón de los tres');
  if (mejor('baul')) out.push('El baúl más grande de los tres');
  if (mejor('potencia')) out.push('El de más fuerza de los tres');
  return out;
}

interface Resultado {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  fuelType: string;
  type: string;
  matchPercentage?: number;
  reasons?: string[];
}

const REFINAR = ['más barato', 'con más espacio', 'más seguro', 'que gaste menos', 'eléctrico'];

export function ResultadosIA({
  resultados,
  consulta,
  catalogo,
  onRefinar,
}: {
  resultados: any;
  consulta: string;
  catalogo: VehiculoTarjeta[];
  onRefinar: (q: string) => void;
}) {
  const completar = (r: Resultado) => ({ ...catalogo.find(v => v.id === r.id), ...r }) as VehiculoTarjeta & Resultado;
  const top: (VehiculoTarjeta & Resultado)[] = (resultados.top_recommendations?.vehicles ?? []).map(completar);
  const resto: (VehiculoTarjeta & Resultado)[] = (resultados.all_matches?.vehicles ?? [])
    .map(completar)
    .filter((v: Resultado) => !top.some(t => t.id === v.id));

  // Consultas objetivas ("más de 200 hp") no tienen podio: es un filtro.
  const podio = top.length ? top : [];
  const [primero, ...escoltas] = podio;

  return (
    <div className="space-y-14">
      <div className="max-w-[640px]">
        <BuscadorIA inicial={consulta} />
      </div>
      {primero && (
        <div className="grid overflow-hidden rounded-[36px] bg-blanco lg:grid-cols-[1.25fr_1fr]">
          <div className="estudio relative flex min-h-[320px] items-center justify-center overflow-hidden p-8">
            <p
              aria-hidden
              className="t-display pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[clamp(110px,14vw,220px)] leading-none"
              style={{ color: 'transparent', WebkitTextStroke: '1.5px #cfcdd5' }}
            >
              {palabraGigante(primero.model, primero.brand)}
            </p>
            <span className="t-meta absolute left-6 top-6 rounded-full bg-tinta px-3 py-1.5 text-white">Tu mejor opción</span>
            <CarRender car={primero} prioridad className="carro-entra relative aspect-[480/190] w-full max-w-[620px]" />
          </div>
          <div className="flex flex-col p-8 md:p-10">
            <p className="text-[14px] text-tinta-2">{primero.brand}</p>
            <h3 className="t-titulo text-[40px] md:text-[52px]">{primero.model}</h3>
            <p className="mt-1 text-[14px] text-tinta-2">
              {primero.year} · {primero.fuelType} · {primero.type}
            </p>

            <div className="mt-8 flex items-end gap-8">
              {primero.matchPercentage != null && (
                <div>
                  <p className="t-ligero text-[64px] leading-none">
                    {primero.matchPercentage}
                    <span className="text-[28px] text-tinta-2">%</span>
                  </p>
                  <p className="mt-1 text-[13px] text-tinta-2">afinidad con lo que pediste</p>
                </div>
              )}
              <div>
                <p className="cifra text-[26px] font-semibold">{millones(primero.price)}</p>
                <p className="mt-1 text-[13px] text-tinta-2">precio de lista</p>
              </div>
            </div>

            {tresDatos(primero).length > 0 && (
              <div className="fila-datos mt-8 border-y border-linea py-4">
                {tresDatos(primero).map(d => (
                  <div key={d.clave} className="px-3 text-center first:pl-0 last:pr-0">
                    <p className="cifra text-[17px] font-semibold">
                      {d.valor}
                      {d.unidad && <span className="ml-0.5 text-[12px] font-normal text-tinta-2">{d.unidad}</span>}
                    </p>
                    <p className="mt-0.5 text-[12px] text-tinta-2">{d.etiqueta}</p>
                  </div>
                ))}
              </div>
            )}

            {[...razonesRelativas(primero, podio), ...(primero.reasons ?? [])].length ? (
              <ul className="mt-6 space-y-2.5">
                {Array.from(new Set([...razonesRelativas(primero, podio), ...(primero.reasons ?? [])])).slice(0, 4).map(r => (
                  <li key={r} className="flex items-start gap-3 text-[15px]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-wise" strokeWidth={2.5} />
                    {r}
                  </li>
                ))}
              </ul>
            ) : null}

            <Link href={`/vehicles/${primero.id}`} className="pastilla pastilla--wise mt-auto h-12 self-start px-6 max-lg:mt-8">
              Ver ficha completa <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {escoltas.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2">
          {escoltas.slice(0, 2).map((v, i) => (
            <Link
              key={v.id}
              href={`/vehicles/${v.id}`}
              className="group grid grid-cols-[1fr_1.1fr] items-center gap-4 overflow-hidden rounded-[28px] bg-blanco p-5 transition-shadow duration-500 hover:shadow-[0_30px_60px_-36px_rgba(14,12,17,0.5)]"
            >
              <div className="estudio flex aspect-[4/3] items-center justify-center rounded-[20px] p-3">
                <CarRender car={v} className="aspect-[480/180] w-full transition-transform duration-700 group-hover:translate-x-1 group-hover:scale-105" />
              </div>
              <div className="min-w-0">
                <p className="cifra text-[12px] text-tinta-2">#{i + 2}</p>
                <p className="truncate text-[22px] font-semibold tracking-[-0.03em]">
                  {v.brand} {v.model}
                </p>
                <p className="cifra mt-1 text-[16px]">{millones(v.price)}</p>
                {v.matchPercentage != null && (
                  <div className="mt-3">
                    <div className="h-1.5 overflow-hidden rounded-full bg-tarjeta">
                      <div className="h-full rounded-full bg-wise" style={{ width: `${v.matchPercentage}%` }} />
                    </div>
                    <p className="mt-1 text-[12px] text-tinta-2">{v.matchPercentage}% de afinidad</p>
                  </div>
                )}
                {v.reasons?.[0] && <p className="mt-3 text-[13px] leading-snug text-tinta-2">{v.reasons[0]}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-2 text-[14px] text-tinta-2">Afinar:</span>
        {REFINAR.map(r => (
          <button key={r} onClick={() => onRefinar(`${consulta}, ${r}`)} className="pastilla h-10 px-4">
            {r}
          </button>
        ))}
      </div>

      {resto.length > 0 && (
        <div>
          <h3 className="t-titulo text-[32px] md:text-[44px]">
            {podio.length ? 'Otras opciones' : 'Los que cumplen'} <span className="t-ligero text-tinta-2/50">({resto.length})</span>
          </h3>
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {resto.map((v, i) => (
              <TarjetaCarro key={v.id} vehiculo={v} indice={i} />
            ))}
          </div>
        </div>
      )}

      <p className="cifra text-[12px] text-tinta-2">
        {resultados.total_matches ?? resto.length + podio.length} carros analizados · {resultados.processing_time_ms ?? '—'} ms
      </p>
    </div>
  );
}
