'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface VehicleGalleryProps {
  images?: string[];
  coverImage?: string;
  vehicle?: any;
  className?: string;
}

export function VehicleGallery({ images, coverImage, vehicle, className = '' }: VehicleGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Extraer imágenes del vehículo si se proporciona
  let finalImages = images || [];
  let finalCoverImage = coverImage;

  if (vehicle?.images) {
    // Para la galería, mostrar solo las imágenes de galería, NO la portada
    finalImages = vehicle.images
      .filter((img: any) => img.type === 'gallery')
      .sort((a: any, b: any) => a.order - b.order)
      .map((img: any) => img.url);
  }

  // Usar solo las imágenes de galería
  const allImages = finalImages;

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <>
      {/* Galería Carrusel Infinito */}
      <div className={`relative ${className}`}>
        {allImages.length > 0 ? (
          <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
            {/* Carrusel infinito */}
            <div 
              className="flex absolute top-0 left-0 h-full animate-scroll-infinite"
              style={{
                width: `${allImages.length * 2 * 320}px`
              }}
            >
              {/* Duplicar imágenes para efecto infinito */}
              {[...allImages, ...allImages].map((image, index) => (
                <div
                  key={`carousel-${index}`}
                  className="flex-shrink-0 w-80 h-full relative group cursor-pointer mx-2"
                  onClick={() => {
                    setCurrentIndex(index % allImages.length);
                    openModal();
                  }}
                >
                  <img
                    src={image}
                    alt={`Imagen ${(index % allImages.length) + 1}`}
                    className="w-full h-full object-cover rounded-lg transition-transform group-hover:scale-105"
                    onError={(e) => {
                      console.error('Error loading carousel image:', image);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center rounded-lg">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white bg-opacity-90 rounded-full px-3 py-1">
                        <span className="text-sm font-medium">Ver imagen</span>
                      </div>
                    </div>
                  </div>

                  {/* Indicador de miniatura */}
                  {(() => {
                    const currentImage = allImages[index % allImages.length];
                    const isThumbnail = vehicle?.images?.find((img: any) => img.url === currentImage)?.isThumbnail;
                    return isThumbnail && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded">
                        Miniatura
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>

          </div>
        ) : (
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-2xl">📷</span>
              </div>
              <p>No hay imágenes disponibles</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de galería completa */}
      {isModalOpen && (
        <div 
          className="modal-fullscreen bg-black bg-opacity-70 flex items-center justify-center"
          style={{ padding: '1rem' }}
          onClick={closeModal}
        >
          <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            {/* Botón de cerrar */}
            <button
              onClick={closeModal}
              className="absolute top-6 right-6 z-10 bg-white bg-opacity-20 text-white p-3 rounded-full hover:bg-opacity-30 transition-all backdrop-blur-sm"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Imagen en modal */}
            <div className="relative">
              <img
                src={allImages[currentIndex]}
                alt={`Vehículo ${currentIndex + 1}`}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
                onError={(e) => {
                  console.error('Error loading modal image:', allImages[currentIndex]);
                  e.currentTarget.style.display = 'none';
                }}
              />

              {/* Controles en modal */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Información de la imagen */}
            <div className="mt-4 text-center text-white">
              <p className="text-lg font-medium">
                {(() => {
                  const currentImage = allImages[currentIndex];
                  const isThumbnail = vehicle?.images?.find((img: any) => img.url === currentImage)?.isThumbnail;
                  return isThumbnail ? 'Imagen miniatura' : `Imagen ${currentIndex + 1}`;
                })()}
              </p>
              <p className="text-sm text-gray-300">
                {currentIndex + 1} de {allImages.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}