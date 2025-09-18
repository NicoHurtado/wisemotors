'use client';

import { HeroSearch } from '@/components/landing/HeroSearch';
import { TrendingVehicles } from '@/components/landing/TrendingVehicles';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/urls';
import { useEffect, useState } from 'react';
import { AIResultsLoader } from '@/components/vehicles/AIResultsLoader';
import { AdaptiveResults } from '@/components/vehicles/AdaptiveResults';
import { useRouter, useSearchParams } from 'next/navigation';
import { FilterButtons } from '@/components/landing/FilterButtons';

export default function HomePage() {
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
      <section className="py-20 bg-hero">
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
            {!loadingAI && aiResults && (() => {
              if (Array.isArray(aiResults)) {
                return aiResults.length > 0;
              }
              return aiResults && typeof aiResults === 'object' && 'total_matches' in aiResults && aiResults.total_matches > 0;
            })() && (
              <AdaptiveResults 
                results={aiResults} 
                query={query}
                onFilterClick={(newQuery: string) => {
                  router.push(`/?q=${encodeURIComponent(newQuery)}`);
                }}
              />
            )}
            {!loadingAI && aiResults && (() => {
              if (Array.isArray(aiResults)) {
                return aiResults.length === 0;
              }
              return aiResults && typeof aiResults === 'object' && 'total_matches' in aiResults && aiResults.total_matches === 0;
            })() && (
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
      {!query || (aiResults && aiResults.query_type === 'OBJECTIVE_FEATURE') ? (
        <TrendingVehicles />
      ) : null}

      {/* How It Works Section */}
      <HowItWorks />

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              ¿Listo para encontrar tu vehículo ideal?
            </h2>
            <p className="text-muted-foreground text-lg">
              Explora nuestro catálogo completo y encuentra la opción perfecta para ti
            </p>
            <Button asChild size="lg" variant="wise" className="text-lg px-8 py-4">
              <a href={routes.vehicles}>
                Ver todos los vehículos
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
