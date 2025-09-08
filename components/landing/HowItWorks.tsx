import { Search, BarChart3, ArrowLeftRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: Search,
    title: 'Búsqueda Inteligente',
    description: 'Describe lo que quieres con tus palabras y te encontramos las mejores opciones en segundos',
  },
  {
    icon: BarChart3,
    title: 'Especificaciones Detalladas',
    description: 'Accede a la información técnica más completa disponible, junto a métricas innovadoras incluyendo deportividad, comodidad, diversión al conducir y más.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Comparación Avanzada',
    description: 'Compara tus carros favoritos lado a lado y entiende las diferencias de un solo vistazo. Todo visual, todo claro, para decidir en segundos.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            ¿Cómo Funciona?
          </h2>
          <p className="text-muted-foreground text-lg mt-2 max-w-2xl mx-auto">
            Descubre cómo WiseMotors revoluciona la búsqueda de vehículos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-soft transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="mx-auto w-16 h-16 bg-wise/10 rounded-2xl flex items-center justify-center mb-4">
                  <feature.icon className="w-8 h-8 text-wise" />
                </div>
                <CardTitle className="text-xl font-semibold text-foreground">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
