'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface VehicleSearchProps {
  onSearch: (search: string) => void;
}

export function VehicleSearch({ onSearch }: VehicleSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Búsqueda automática después de 500ms de inactividad
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== '') {
        onSearch(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, onSearch]);

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre, marca o modelo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10 pr-10 h-12 text-lg border-2 border-gray-200 focus:border-wise focus:ring-2 focus:ring-wise/20"
            aria-label="Buscar vehículos"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <Button
          onClick={handleSearch}
          size="icon"
          className="h-12 w-12 bg-wise hover:bg-wise-dark transition-colors"
          aria-label="Buscar"
        >
          <Search className="w-6 h-6" />
        </Button>
      </div>
      
      {searchQuery && (
        <div className="mt-2 text-sm text-gray-500">
          Buscando: "{searchQuery}"
        </div>
      )}
    </div>
  );
}
