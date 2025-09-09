'use client';

import { Button } from '@/components/ui/button';

interface FilterButtonsProps {
  currentQuery: string;
  onFilterClick: (newQuery: string) => void;
}

const filterOptions = [
  { label: 'Más barato', modifier: 'más barato' },
  { label: 'Más deportivo', modifier: 'más deportivo' },
  { label: 'Más elegante', modifier: 'más elegante' },
  { label: 'Más pequeño', modifier: 'más pequeño' },
  { label: 'De otra marca', modifier: 'de otra marca' },
  { label: 'Más económico en gasolina', modifier: 'más económico en gasolina' },
  { label: 'Que sea eléctrico', modifier: 'que sea eléctrico' },
  { label: 'Solo gasolina', modifier: 'solo gasolina' },
  { label: 'Más moderno', modifier: 'más moderno' },
];

export function FilterButtons({ currentQuery, onFilterClick }: FilterButtonsProps) {
  const handleFilterClick = (modifier: string) => {
    const newQuery = `${currentQuery} ${modifier}`;
    onFilterClick(newQuery);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600 mb-4">Refina tu búsqueda:</p>
      </div>
      
      <div className="flex flex-wrap justify-center gap-2">
        {filterOptions.map((option) => (
          <Button
            key={option.label}
            onClick={() => handleFilterClick(option.modifier)}
            variant="outline"
            size="sm"
            className="text-sm px-4 py-2 border-gray-300 text-gray-700 hover:border-wise hover:text-wise hover:bg-wise/5 transition-all duration-200"
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
