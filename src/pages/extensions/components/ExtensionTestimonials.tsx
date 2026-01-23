/**
 * User testimonials for extensions
 */
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Star, Quote, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'

const testimonials = [
  {
    name: 'Marie L.',
    role: 'Dropshipper Pro',
    avatar: '👩‍💼',
    rating: 5,
    text: 'Cette extension a révolutionné mon business. J\'importe 50+ produits par jour en quelques clics. Gain de temps incroyable!',
    stats: '+340%',
    statsLabel: 'productivité',
    icon: TrendingUp,
    color: 'text-green-500'
  },
  {
    name: 'Thomas B.',
    role: 'E-commerçant',
    avatar: '👨‍💻',
    rating: 5,
    text: 'La surveillance des prix m\'a fait économiser des milliers d\'euros. Je ne rate plus jamais une baisse de prix fournisseur.',
    stats: '15K€',
    statsLabel: 'économisés',
    icon: DollarSign,
    color: 'text-blue-500'
  },
  {
    name: 'Sophie M.',
    role: 'Entrepreneuse',
    avatar: '👩‍🚀',
    rating: 5,
    text: 'L\'import d\'avis clients a boosté mes conversions. Mes clients font confiance aux vrais retours.',
    stats: '+40%',
    statsLabel: 'conversions',
    icon: ShoppingCart,
    color: 'text-purple-500'
  },
]

interface ExtensionTestimonialsProps {
  className?: string
}

export function ExtensionTestimonials({ className }: ExtensionTestimonialsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Ce que disent nos utilisateurs</h2>
        <Badge variant="outline" className="gap-1">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          4.9/5 (2.4K+ avis)
        </Badge>
      </div>
      
      <div className="grid md:grid-cols-3 gap-4">
        {testimonials.map((testimonial, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="h-full border-border/50 bg-card/50 backdrop-blur hover:shadow-lg transition-all group">
              <CardContent className="p-6">
                {/* Quote icon */}
                <Quote className="w-8 h-8 text-primary/20 mb-4" />
                
                {/* Rating */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                {/* Text */}
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>
                
                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                  <div className="text-3xl">{testimonial.avatar}</div>
                  <div className="flex-1">
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                  
                  {/* Stats */}
                  <div className="text-right">
                    <div className={cn("flex items-center gap-1 font-bold", testimonial.color)}>
                      <testimonial.icon className="w-4 h-4" />
                      {testimonial.stats}
                    </div>
                    <p className="text-xs text-muted-foreground">{testimonial.statsLabel}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
