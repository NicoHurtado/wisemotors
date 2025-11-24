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
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900 text-center">
        Categorías WiseMotors
      </h2>

      <div className="flex flex-wrap justify-center items-start gap-8 md:gap-16 px-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex flex-col items-center group"
          >
            <div className="w-24 h-24 bg-purple-50 rounded-[2rem] flex items-center justify-center mb-5 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl group-hover:bg-purple-100">
              <span className="text-wise font-bold text-2xl tracking-tight">wise</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center max-w-[200px] leading-tight">
              {category.label}
            </h3>
          </div>
        ))}
      </div>
    </div>
  );
}
