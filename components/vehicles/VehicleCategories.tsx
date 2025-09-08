'use client';

import { Check } from 'lucide-react';

interface Category {
  id: string;
  label: string;
  description: string;
}

interface VehicleCategoriesProps {
  categories: Category[];
}

export function VehicleCategories({ categories }: VehicleCategoriesProps) {
  // Lógica para organizar las categorías
  const getCategoryLayout = () => {
    const total = categories.length;
    
    if (total <= 4) {
      // 4 o menos: una sola fila horizontal
      return {
        topRow: categories,
        bottomRow: []
      };
    } else if (total === 5) {
      // 5: 4 arriba, 1 abajo centrada
      return {
        topRow: categories.slice(0, 4),
        bottomRow: categories.slice(4, 5)
      };
    } else if (total === 6) {
      // 6: 4 arriba, 2 abajo centradas
      return {
        topRow: categories.slice(0, 4),
        bottomRow: categories.slice(4, 6)
      };
    } else {
      // 7 o más: 4 arriba, resto abajo centradas
      return {
        topRow: categories.slice(0, 4),
        bottomRow: categories.slice(4)
      };
    }
  };

  const { topRow, bottomRow } = getCategoryLayout();

  const renderCategory = (category: Category) => (
    <div
      key={category.id}
      className="bg-white rounded-2xl shadow-soft p-6 text-center hover:shadow-soft transition-shadow duration-300"
    >
      <div className="w-16 h-16 bg-wise/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="w-8 h-8 text-wise" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">
        {category.label}
      </h3>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 text-center">
        Categorías WiseMotors
      </h2>
      
      <div className="flex justify-center">
        <div className="max-w-4xl">
          {/* Fila superior */}
          <div className="flex justify-center gap-6 mb-6">
            {topRow.map(renderCategory)}
          </div>
          
          {/* Fila inferior (si existe) */}
          {bottomRow.length > 0 && (
            <div className="flex justify-center gap-6">
              {bottomRow.map(renderCategory)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
