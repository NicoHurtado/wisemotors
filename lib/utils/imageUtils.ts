// Utilidades para manejo de imágenes
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  
  // Si es Base64, es válida (legacy)
  if (url.startsWith('data:image/')) return true;
  
  // Si es una URL externa válida (incluyendo Cloudinary)
  if (url.startsWith('http://') || url.startsWith('https://')) return true;

  // URLs de API internas
  if (url.startsWith('/api/')) return true;
  
  return false;
}

export function getValidImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // Si es Base64, devolverla directamente (legacy)
  if (url.startsWith('data:image/')) return url;
  
  // Si es URL externa (incluyendo Cloudinary), devolverla
  if (url.startsWith('http://') || url.startsWith('https://')) return url;

  // URLs de API internas
  if (url.startsWith('/api/')) return url;
  
  return null;
}

export function createImagePlaceholder(brand: string, model: string): string {
  const text = `${brand} ${model}`;
  
  return `data:image/svg+xml;base64,${Buffer.from(`
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:0.15" />
          <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:0.15" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      <rect width="100%" height="100%" fill="none" stroke="#e5e7eb" stroke-width="2" stroke-dasharray="10,5"/>
      
      <!-- Icono de carro -->
      <g transform="translate(200, 130)">
        <!-- Cuerpo del carro -->
        <rect x="-40" y="-10" width="80" height="20" rx="5" fill="#9ca3af"/>
        <!-- Ventanas -->
        <rect x="-35" y="-15" width="25" height="8" rx="2" fill="#d1d5db"/>
        <rect x="-5" y="-15" width="25" height="8" rx="2" fill="#d1d5db"/>
        <!-- Ruedas -->
        <circle cx="-25" cy="15" r="8" fill="#6b7280"/>
        <circle cx="25" cy="15" r="8" fill="#6b7280"/>
        <circle cx="-25" cy="15" r="4" fill="#374151"/>
        <circle cx="25" cy="15" r="4" fill="#374151"/>
      </g>
      
      <text x="50%" y="75%" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#6b7280" text-anchor="middle">
        ${text}
      </text>
      <text x="50%" y="85%" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af" text-anchor="middle">
        WiseMotors
      </text>
    </svg>
  `).toString('base64')}`;
}

// Hook para usar en componentes React
export function useVehicleImage(imageUrl: string | null | undefined, brand: string, model: string) {
  const validUrl = getValidImageUrl(imageUrl);
  
  if (validUrl) {
    return validUrl;
  }
  
  return createImagePlaceholder(brand, model);
}
