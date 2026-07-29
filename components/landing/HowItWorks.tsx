import { Search, BarChart3, ArrowLeftRight } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';

// La numeración se gana aquí porque sí comunica una secuencia: buscar, leer,
// comparar. Cada paso se desplaza un poco más a la derecha que el anterior,
// así la lectura avanza en diagonal en vez de ser tres tarjetas idénticas.
const pasos = [
  {
    icon: Search,
    title: 'Describe lo que necesitas',
    description:
      'Escríbelo como se lo dirías a un amigo. No hace falta saber de carros ni conocer los filtros.',
    offset: 'md:col-start-1',
  },
  {
    icon: BarChart3,
    title: 'Mira las cifras que importan',
    description:
      'Ficha técnica completa y diez lecturas propias: comodidad, fiabilidad, diversión al conducir, relación calidad-precio.',
    offset: 'md:col-start-3',
  },
  {
    icon: ArrowLeftRight,
    title: 'Compara y decide',
    description:
      'Dos o tres carros lado a lado, con las diferencias reales resaltadas. Sin tener que abrir diez pestañas.',
    offset: 'md:col-start-5',
  },
];

export function HowItWorks() {
  return (
    <section className="py-24">
      <div className="container mx-auto max-w-[1180px] px-4">
        <Reveal>
          <div className="grid grid-cols-1 gap-x-12 gap-y-3 md:grid-cols-12 md:items-end">
            <h2 className="md:col-span-6 text-[2.1rem] md:text-[2.75rem] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground">
              Cómo funciona
            </h2>
            <p className="md:col-span-5 md:col-start-8 text-[16px] text-muted-foreground leading-relaxed">
              Tres pasos, sin formularios ni filtros que nadie entiende.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 space-y-5">
          {pasos.map((paso, index) => (
            <Reveal key={paso.title} delayMs={index * 70}>
              <div className="grid grid-cols-1 md:grid-cols-12">
                <article
                  className={`glass group rounded-3xl p-7 md:p-8 md:col-span-8 ${paso.offset}`}
                  style={{ transition: 'transform var(--motion-quick) var(--ease-out-strong)' }}
                >
                  <div className="flex items-start gap-5">
                    <span className="font-mono text-[13px] tabular-nums text-wise/60 pt-1">
                      0{index + 1}
                    </span>

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-wise/10">
                      <paso.icon className="h-5 w-5 text-wise" strokeWidth={1.75} />
                    </div>

                    <div>
                      <h3 className="text-[19px] font-semibold tracking-tight text-foreground">
                        {paso.title}
                      </h3>
                      <p className="mt-1.5 max-w-[62ch] text-[15px] leading-relaxed text-muted-foreground">
                        {paso.description}
                      </p>
                    </div>
                  </div>
                </article>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
