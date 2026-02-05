'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Brain } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FilterButtons } from './FilterButtons';

interface HeroSearchProps {
  initialQuery?: string;
  showFilters?: boolean;
}

const examplePrompts = [
  "Quiero un carro barato pero rápido para subir a Palmas y no quedarme atrás de mis amigos",
  "Busco un SUV amplio y cómodo para viajar con mi familia a Santa Fe o al Eje Cafetero",
  "Quiero un deportivo eléctrico moderno que llame la atención en El Poblado",
  "Necesito un carro económico para moverme en la ciudad porque apenas estoy empezando a trabajar",
  "Quiero una pickup fuerte para cargar materiales y trabajar en las fincas",
  "Me gustaría un convertible fresco para pasear los fines de semana por Las Palmas",
  "Busco un híbrido que me ayude a ahorrar gasolina en los trancones de la 80",
  "Quiero un carro de lujo elegante para llegar con estilo a las reuniones",
  "Auto práctico y ágil para que mi hija universitaria se mueva fácil en Medellín",
  "Busco un carro cómodo y seguro para mi papá que ya está mayor, que no tenga que preocuparse por nada",
  "Quiero un carro resistente y alto para no sufrir con los huecos y las calles destapadas",
  "Necesito un carro bien seguro para que si llego a tener un choque mi familia esté protegida"
];


export function HeroSearch({ initialQuery, showFilters = false }: HeroSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery || '');
  const [isSearching, setIsSearching] = useState(false);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [placeholder, setPlaceholder] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Sync query with URL params and initialQuery
  useEffect(() => {
    const urlQuery = searchParams.get('q') || initialQuery || '';
    setQuery(urlQuery);
  }, [searchParams, initialQuery]);

  // Typing effect for example prompts
  useEffect(() => {
    if (query.trim()) {
      setPlaceholder('');
      return;
    }

    let timeoutId: NodeJS.Timeout;
    let typingTimeoutId: NodeJS.Timeout;
    let currentCharIndex = 0;
    const currentExample = examplePrompts[currentExampleIndex];

    // Calculate timing based on text length for consistent duration
    const totalDuration = 8000; // 8 seconds total per example
    const readingTime = 3000; // 3 seconds to read
    const writingTime = (totalDuration - readingTime) / 2; // Half for writing, half for deleting
    const charDelay = writingTime / currentExample.length; // Delay per character

    const typeText = () => {
      if (currentCharIndex <= currentExample.length) {
        setPlaceholder(currentExample.slice(0, currentCharIndex));
        currentCharIndex++;
        typingTimeoutId = setTimeout(typeText, Math.max(charDelay, 15)); // Minimum 15ms delay
      } else {
        // Wait consistent time to read before starting to delete
        timeoutId = setTimeout(() => {
          deleteText();
        }, readingTime);
      }
    };

    const deleteText = () => {
      if (currentCharIndex > 0) {
        setPlaceholder(currentExample.slice(0, currentCharIndex - 1));
        currentCharIndex--;
        typingTimeoutId = setTimeout(deleteText, Math.max(charDelay, 10)); // Minimum 10ms delay
      } else {
        // Move to next example
        setCurrentExampleIndex((prev) => (prev + 1) % examplePrompts.length);
      }
    };

    setIsTyping(true);
    typeText();

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(typingTimeoutId);
      setIsTyping(false);
    };
  }, [currentExampleIndex, query]);

  // Move to next example after typing is complete
  useEffect(() => {
    if (query.trim()) return;

    const interval = setInterval(() => {
      setCurrentExampleIndex((prev) => (prev + 1) % examplePrompts.length);
    }, 8000); // Total time for typing + waiting + deleting - más tiempo para leer

    return () => clearInterval(interval);
  }, [query]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);

    try {
      // Build search URL preserving existing params
      const params = new URLSearchParams(searchParams.toString());
      params.set('q', query.trim());

      // Stay on home and trigger AI recommendations section
      router.push(`/?${params.toString()}`);
    } catch (error) {
      console.error('Error during search:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFilterClick = (newQuery: string) => {
    console.log('Filter clicked:', newQuery);
    setQuery(newQuery);
    // Trigger search immediately with the new query
    const params = new URLSearchParams(searchParams.toString());
    params.set('q', newQuery.trim());
    console.log('Navigating to:', `/?${params.toString()}`);
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto text-center space-y-8">
      {/* Hero Title */}
      <div className="space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
          Encuentra tu vehículo ideal con{' '}
          <span className="text-wise">Wise</span>
          <span className="text-foreground">Motors</span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Describe lo que quieres con tus palabras y te encontramos las mejores opciones en segundos
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="relative w-full">
            <Input
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="h-14 text-base pr-20 bg-white/80 backdrop-blur-sm border-2 border-wise/20 focus:border-wise focus:ring-2 focus:ring-wise/20 transition-all duration-300"
              aria-label="Buscar vehículos"
              aria-describedby="search-description"
            />
            {/* Cursor parpadeante */}
            {!query.trim() && isTyping && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                <span className="animate-pulse">|</span>
              </div>
            )}
          </div>

          <Button
            onClick={handleSearch}
            disabled={!query.trim() || isSearching}
            size="icon"
            className="h-14 w-14 bg-wise hover:bg-wise-dark transition-colors"
            aria-label="Buscar"
          >
            {isSearching ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="w-6 h-6" />}
          </Button>
        </div>

        <p id="search-description" className="sr-only">
          Escribe tu búsqueda y presiona Enter o el botón de búsqueda
        </p>

      </div>

      {/* AI Badge */}
      <div className="flex items-center justify-center gap-2">
        <Badge variant="secondary" className="text-sm px-4 py-2">
          <Brain className="w-4 h-4 mr-2" />
          Impulsado por inteligencia artificial
        </Badge>
      </div>

      {/* Filter Buttons - Solo se muestran cuando hay resultados */}
      {showFilters && (
        <div className="pt-4">
          <FilterButtons
            currentQuery={query}
            onFilterClick={handleFilterClick}
          />
        </div>
      )}

      {/* Search feedback for screen readers */}
      <div aria-live="polite" className="sr-only">
        {isSearching ? 'Buscando...' : ''}
      </div>
    </div>
  );
}
