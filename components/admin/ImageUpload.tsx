'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  type?: 'cover' | 'gallery';
  label?: string;
  thumbnailIndex?: number;
  onThumbnailChange?: (index: number) => void;
}

export function ImageUpload({ 
  images, 
  onImagesChange, 
  maxImages = 10, 
  type = 'gallery',
  label,
  thumbnailIndex = 0,
  onThumbnailChange
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    setUploading(true);

    try {
      // Upload files to Cloudinary via API
      const formData = new FormData();
      for (const file of filesToProcess) {
        formData.append('files', file);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al subir las imágenes');
      }

      const data = await response.json();
      const newImages = [...images, ...data.urls];
      onImagesChange(newImages);
    } catch (error) {
      console.error('Error uploading images:', error);
      alert(error instanceof Error ? error.message : 'Error al subir las imágenes');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      {/* Botón de subida */}
      <div className="flex items-center justify-center w-full">
        <button
          type="button"
          onClick={openFileDialog}
          disabled={uploading || images.length >= maxImages}
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-gray-400" />
          )}
          <p className="mt-2 text-sm text-gray-500">
            {uploading 
              ? 'Subiendo a Cloudinary...' 
              : `Haz clic para subir ${type === 'cover' ? 'foto de portada' : 'fotos de galería'}`
            }
          </p>
          <p className="text-xs text-gray-400">
            {images.length}/{maxImages} imágenes
          </p>
        </button>
      </div>

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={type === 'gallery'}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Vista previa de imágenes */}
      {images.length > 0 && (
        <div className={`grid gap-4 ${
          type === 'cover' 
            ? 'grid-cols-1' 
            : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
        }`}>
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className={`relative overflow-hidden rounded-lg ${
                type === 'cover' ? 'aspect-video' : 'aspect-square'
              }`}>
                <img
                  src={image}
                  alt={`Imagen ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Botón de eliminar */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Indicador de foto de portada */}
                {type === 'cover' && index === 0 && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                    Portada
                  </div>
                )}

                {/* Botón de miniatura para galería */}
                {type === 'gallery' && onThumbnailChange && (
                  <button
                    type="button"
                    onClick={() => onThumbnailChange(index)}
                    className={`absolute top-2 left-2 px-2 py-1 text-xs rounded transition-colors ${
                      thumbnailIndex === index
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-600 text-white hover:bg-yellow-500'
                    }`}
                  >
                    {thumbnailIndex === index ? 'Miniatura' : 'Hacer miniatura'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Información adicional */}
      <div className="text-xs text-gray-500">
        <p>Formatos soportados: JPG, PNG, WebP</p>
        <p>Tamaño máximo: 10MB por imagen</p>
        {type === 'gallery' && (
          <p>Puedes subir hasta {maxImages} imágenes para la galería</p>
        )}
      </div>
    </div>
  );
}
