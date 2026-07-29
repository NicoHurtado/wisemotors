'use client';

import { HeroSearch } from '@/components/landing/HeroSearch';
import { TrendingVehicles } from '@/components/landing/TrendingVehicles';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/urls';
import { useEffect, useState, Suspense } from 'react';
import { AIResultsLoader } from '@/components/vehicles/AIResultsLoader';
import { AdaptiveResults } from '@/components/vehicles/AdaptiveResults';
import { useRouter, useSearchParams } from 'next/navigation';
import { FilterButtons } from '@/components/landing/FilterButtons';
import { AdminQuickAccess } from '@/components/admin/AdminQuickAccess';
import { Reveal } from '@/components/ui/Reveal';

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiResults, setAiResults] = useState<any[] | null>(null);

  useEffect(() => {
    const run = async () => {
      console.log('Query changed:', query);
      if (!query) {
        setAiResults(null);
        return;
      }
      console.log('Starting AI search for:', query);
      setLoadingAI(true);
      setAiResults(null);
      try {
        const resp = await fetch('/api/ai/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: query })
        });
        const data = await resp.json();
        console.log('AI response:', data);
        setAiResults(data.results || data);
      } catch (e) {
        console.error('AI search error:', e);
        setAiResults([]);
      } finally {
        setLoadingAI(false);
      }
    };
    run();
  }, [query]);

  return (
    <>
      {/* Hero Section */}
      <section className="py-20 md:py-28 bg-hero">
        <div className="container mx-auto px-4">
          <HeroSearch 
            initialQuery={query} 
            showFilters={false}
          />
        </div>
      </section>

      {query && (
        <section className="py-6">
          <div className="container mx-auto px-4">
            {loadingAI && <AIResultsLoader />}
            {!loadingAI && aiResults && (Array.isArray(aiResults) ? aiResults.length > 0 : (aiResults as any).total_matches > 0) && (
              <AdaptiveResults 
                results={aiResults} 
                query={query}
                onFilterClick={(newQuery: string) => {
                  router.push(`/?q=${encodeURIComponent(newQuery)}`);
                }}
              />
            )}
            {!loadingAI && aiResults && (Array.isArray(aiResults) ? aiResults.length === 0 : (aiResults as any).total_matches === 0) && (
              <div className="text-center py-12 max-w-3xl mx-auto">
                <h3 className="text-2xl font-semibold text-foreground mb-2">No encontramos resultados con esa combinación</h3>
                <p className="text-muted-foreground mb-6">Prueba ajustando tu búsqueda o utiliza estas opciones para refinarla.</p>
                <FilterButtons
                  currentQuery={query}
                  onFilterClick={(newQuery: string) => {
                    router.push(`/?q=${encodeURIComponent(newQuery)}`);
                  }}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Trending Vehicles Section - Solo mostrar si no hay query subjetivo */}
      {!query || (aiResults && (aiResults as any).query_type === 'OBJECTIVE_FEATURE') ? (
        <TrendingVehicles />
      ) : null}

      {/* How It Works Section */}
      <HowItWorks />

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto max-w-[1180px] px-4">
          <Reveal>
            <div className="glass relative overflow-hidden rounded-[2rem] px-8 py-14 md:px-14">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle, rgba(136,28,183,0.16) 0%, transparent 70%)',
                }}
              />
              <div className="relative grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end">
                <div className="md:col-span-7">
                  <h2 className="text-[2.1rem] md:text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground">
                    ¿Listo para encontrar tu vehículo ideal?
                  </h2>
                  <p className="mt-3 max-w-[56ch] text-[17px] leading-relaxed text-muted-foreground">
                    Explora el catálogo completo y encuentra la opción que de verdad te sirve.
                  </p>
                </div>
                <div className="md:col-span-4 md:col-start-9 md:justify-self-end">
                  <Button
                    asChild
                    size="lg"
                    variant="wise"
                    className="rounded-full px-8 text-[16px] shadow-lg shadow-wise/25"
                  >
                    <a href={routes.vehicles}>Ver todos los vehículos</a>
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      
      {/* Admin Quick Access */}
      <AdminQuickAccess />
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
