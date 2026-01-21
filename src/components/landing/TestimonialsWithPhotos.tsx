/**
 * Témoignages clients avec photos - Phase 3.2
 * Section testimonials améliorée pour la homepage
 */
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Quote, TrendingUp, Users, ShoppingCart } from 'lucide-react';

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar: string;
  metrics: {
    label: string;
    value: string;
    icon: React.ElementType;
  };
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    quote: "ShopOpti+ a complètement transformé ma façon de gérer mes imports. Je gagne facilement 15h par semaine et mes ventes ont augmenté de 40% en seulement 3 mois !",
    author: "Marie Dupont",
    role: "Fondatrice",
    company: "BelleMode.fr",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces",
    metrics: { label: "Croissance ventes", value: "+40%", icon: TrendingUp },
    rating: 5
  },
  {
    id: '2',
    quote: "L'automatisation des commandes et la synchronisation multi-plateformes sont juste incroyables. Plus d'erreurs, plus de stress. Je recommande à 200% !",
    author: "Thomas Martin",
    role: "CEO",
    company: "TechGadgets Pro",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
    metrics: { label: "Temps économisé", value: "20h/sem", icon: Users },
    rating: 5
  },
  {
    id: '3',
    quote: "En tant qu'agence, nous gérons 30+ clients sur ShopOpti+. Le multi-tenant et l'API sont parfaits. Support réactif. Excellent investissement.",
    author: "Sophie Laurent",
    role: "Directrice",
    company: "Digital Commerce Agency",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces",
    metrics: { label: "Clients gérés", value: "30+", icon: ShoppingCart },
    rating: 5
  },
  {
    id: '4',
    quote: "Depuis que j'utilise l'IA de ShopOpti+ pour optimiser mes descriptions produits, mon taux de conversion a bondi de 25%. L'outil est devenu indispensable.",
    author: "Lucas Bernard",
    role: "E-commerçant",
    company: "SportsGear.io",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces",
    metrics: { label: "Conversion", value: "+25%", icon: TrendingUp },
    rating: 5
  }
];

export function TestimonialsWithPhotos() {
  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-background to-secondary/30">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center space-y-4 mb-12 lg:mb-16">
          <Badge className="px-4 py-2 bg-warning/15 text-amber-800 dark:text-warning border-warning/30">
            Témoignages
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            Ils ont transformé leur business
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Découvrez comment nos utilisateurs ont multiplié leurs résultats avec ShopOpti+
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => {
            const MetricIcon = testimonial.metrics.icon;
            
            return (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-xl transition-shadow duration-300 border-2 hover:border-primary/30">
                  <CardContent className="p-6 lg:p-8">
                    {/* Quote icon */}
                    <Quote className="h-8 w-8 text-primary/20 mb-4" />
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                      ))}
                    </div>

                    {/* Quote text */}
                    <p className="text-base lg:text-lg text-foreground/90 leading-relaxed mb-6">
                      "{testimonial.quote}"
                    </p>

                    {/* Author info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img
                          src={testimonial.avatar}
                          alt={testimonial.author}
                          className="w-12 h-12 lg:w-14 lg:h-14 rounded-full object-cover ring-2 ring-primary/20"
                          loading="lazy"
                        />
                        <div>
                          <div className="font-semibold text-foreground">{testimonial.author}</div>
                          <div className="text-sm text-muted-foreground">
                            {testimonial.role} · {testimonial.company}
                          </div>
                        </div>
                      </div>

                      {/* Metric badge */}
                      <div className="hidden sm:flex items-center gap-2 bg-success/10 text-success px-3 py-2 rounded-lg">
                        <MetricIcon className="h-4 w-4" />
                        <span className="font-bold">{testimonial.metrics.value}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 lg:mt-16 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl p-6 lg:p-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl lg:text-3xl font-bold text-primary">15,000+</div>
              <div className="text-sm text-muted-foreground">Utilisateurs actifs</div>
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-bold text-primary">98%</div>
              <div className="text-sm text-muted-foreground">Satisfaction client</div>
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-bold text-primary">4.9/5</div>
              <div className="text-sm text-muted-foreground">Note moyenne</div>
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Support disponible</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default TestimonialsWithPhotos;
