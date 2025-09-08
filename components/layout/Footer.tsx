import Link from 'next/link';
import { Instagram, Phone, MapPin, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-wise/10 border-t border-wise/20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Left Section - Branding and Slogan */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-bold">
                <span className="text-wise">Wise</span>
                <span className="text-foreground">Motors</span>
              </span>
            </div>
            
            <p className="text-muted-foreground text-lg max-w-md">
              Powered by real dealerships, for real customers.
            </p>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="https://instagram.com/wisemotors.co" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-wise hover:text-wise-dark transition-colors"
                aria-label="Síguenos en Instagram"
              >
                <Instagram className="w-6 h-6" />
              </Link>
            </div>
          </div>

          {/* Right Section - Contact Information */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-wise">
              Contacto
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Instagram className="w-5 h-5 text-wise flex-shrink-0" />
                <Link 
                  href="https://instagram.com/wisemotors.co" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  @wisemotors.co
                </Link>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-wise flex-shrink-0" />
                <Link 
                  href="tel:+573103818615"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  +57 310 3818615
                </Link>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-wise flex-shrink-0" />
                <span className="text-muted-foreground">
                  Medellín, Antioquia
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-wise flex-shrink-0" />
                <Link 
                  href="mailto:wisemotorsco@gmail.com"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  wisemotorsco@gmail.com
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="border-t border-wise/20 pt-8">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              © 2025{' '}
              <span className="font-semibold">
                <span className="text-wise">Wise</span>
                <span className="text-foreground">Motors</span>
              </span>
              . Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
