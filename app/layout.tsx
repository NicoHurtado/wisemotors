import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'WiseMotors - Encuentra tu vehículo ideal con IA',
    template: '%s | WiseMotors'
  },
  description: 'Usa nuestra inteligencia artificial para encontrar el carro o moto perfecto. Describe lo que buscas y WiseMotors lo encuentra por ti en segundos.',
  keywords: ['compra de vehículos', 'carros usados', 'motos', 'búsqueda con IA', 'WiseMotors', 'automóviles Colombia', 'concesionario digital'],
  authors: [{ name: 'WiseMotors' }],
  creator: 'WiseMotors',
  publisher: 'WiseMotors',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://wisemotors.ai'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'WiseMotors - Encuentra tu vehículo ideal con IA',
    description: 'Búsqueda inteligente de vehículos impulsada por IA. Encuentra lo que realmente necesitas.',
    url: 'https://wisemotors.ai',
    siteName: 'WiseMotors',
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WiseMotors - Búsqueda de Vehículos con IA',
    description: 'Encuentra tu próximo vehículo describiendo lo que quieres. IA al servicio de tu movilidad.',
  },
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <FavoritesProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
