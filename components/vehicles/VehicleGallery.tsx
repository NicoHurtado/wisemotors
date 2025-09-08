'use client';

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

interface VehicleGalleryProps {
  vehicle: any;
}

export function VehicleGallery({ vehicle }: VehicleGalleryProps) {
  const [currentPosition, setCurrentPosition] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, position: 0 });
  const [isAutoMoving, setIsAutoMoving] = useState(true);

  // Crear datos para el carrusel (duplicar para el loop infinito)
  const getGalleryItems = () => {
    if (vehicle.images && vehicle.images.length > 0) {
      return vehicle.images.map((image: any, index: number) => ({
        id: `image-${index}`,
        type: 'image',
        data: image,
        alt: `${vehicle.brand} ${vehicle.model} - Imagen ${index + 1}`
      }));
    } else {
      return [1, 2, 3, 4].map((index) => ({
        id: `placeholder-${index}`,
        type: 'placeholder',
        data: { index },
        alt: `Imagen ${index}`
      }));
    }
  };

  const items = getGalleryItems();
  // Duplicar los items para el loop infinito
  const duplicatedItems = [...items, ...items];

  // Animación continua solo cuando no se está interactuando
  useEffect(() => {
    if (!isHovered && !isDragging && isAutoMoving) {
      const interval = setInterval(() => {
        setCurrentPosition(prev => {
          const itemWidth = 300; // Ancho de cada item + gap
          const maxPosition = items.length * itemWidth;
          const newPosition = prev + 0.5; // Velocidad lenta
          
          if (newPosition >= maxPosition) {
            return 0; // Reset para el loop infinito
          }
          return newPosition;
        });
      }, 16); // ~60fps

      return () => clearInterval(interval);
    }
  }, [isHovered, isDragging, isAutoMoving, items.length]);

  // Event listeners globales para el arrastre
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStart.x;
        const newPosition = dragStart.position - deltaX;
        
        // Aplicar límites para evitar que se vaya demasiado lejos
        const maxPosition = items.length * 300;
        const boundedPosition = Math.max(0, Math.min(newPosition, maxPosition));
        
        setCurrentPosition(boundedPosition);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        // Reanudar movimiento automático después de un breve delay
        setTimeout(() => {
          if (!isHovered) {
            setIsAutoMoving(true);
          }
        }, 1000);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, isHovered, items.length]);

  // Funciones para el arrastre
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setIsAutoMoving(false);
    setDragStart({
      x: e.clientX,
      position: currentPosition
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsAutoMoving(false);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!isDragging) {
      setTimeout(() => {
        setIsAutoMoving(true);
      }, 1000);
    }
  };

  const renderItem = (item: any, index: number) => {
    if (item.type === 'image') {
      return (
        <div
          key={`${item.id}-${index}`}
          className="flex-shrink-0 w-[280px] aspect-[4/3] bg-gradient-to-br from-wise/5 to-wise/10 rounded-2xl shadow-soft overflow-hidden"
        >
          <img
            src={item.data.url}
            alt={item.alt}
            className="w-full h-full object-cover"
          />
        </div>
      );
    } else {
      return (
        <div
          key={`${item.id}-${index}`}
          className="flex-shrink-0 w-[280px] aspect-[4/3] bg-gradient-to-br from-wise/5 to-wise/10 rounded-2xl shadow-soft flex items-center justify-center"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-wise/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-8 h-8 text-wise" />
            </div>
            <p className="text-gray-500 text-sm">Imagen {item.data.index}</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Gallery Title - Centered */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Galería</h2>
      </div>
      
      {/* Carrusel Container */}
      <div 
        className="relative overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
      >
        <div 
          className="flex gap-6 transition-transform duration-0 ease-linear select-none"
          style={{
            transform: `translateX(-${currentPosition}px)`,
            width: `${duplicatedItems.length * 280 + (duplicatedItems.length - 1) * 24}px`, // 280px item + 24px gap
            userSelect: 'none' // Prevenir selección de texto durante el arrastre
          }}
        >
          {duplicatedItems.map((item, index) => renderItem(item, index))}
        </div>
        
        {/* Indicador de interacción */}
        {isHovered && (
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            Arrastra para mover
          </div>
        )}
      </div>
    </div>
  );
}
