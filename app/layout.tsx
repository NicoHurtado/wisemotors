import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WiseMotors - Encuentra tu vehículo ideal',
  description: 'Describe lo que quieres con tus palabras y te encontramos las mejores opciones en segundos. Impulsado por inteligencia artificial.',
  keywords: 'vehículos, carros, motos, búsqueda inteligente, WiseMotors',
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
