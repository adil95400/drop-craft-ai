/**
 * Composants de confiance et preuves sociales
 * Témoignages, badges de confiance, statistiques
 */

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Star, Shield, Award, Lock, CheckCircle2, 
  Globe, Users, TrendingUp, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Testimonial Card
interface TestimonialProps {
  quote: string
  author: string
  role: string
  company: string
  avatar?: string
  rating?: number
  metrics?: {
    label: string
    value: string
  }
}

export function TestimonialCard({ 
  quote, 
  author, 
  role, 
  company, 
  avatar,
  rating = 5,
  metrics
}: TestimonialProps) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardContent className="p-6 space-y-4">
        {/* Rating */}
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star 
              key={i} 
              className={cn(
                "h-4 w-4",
                i < rating ? "text-yellow-500 fill-yellow-500" : "text-muted"
              )} 
            />
          ))}
        </div>
        
        {/* Quote */}
        <blockquote className="text-foreground leading-relaxed">
          "{quote}"
        </blockquote>
        
        {/* Metrics if provided */}
        {metrics && (
          <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg">
            <TrendingUp className="h-4 w-4 text-success" />
            <div>
              <span className="font-bold text-success">{metrics.value}</span>
              <span className="text-sm text-muted-foreground ml-1">{metrics.label}</span>
            </div>
          </div>
        )}
        
        {/* Author */}
        <div className="flex items-center gap-3 pt-2 border-t">
          {avatar ? (
            <img 
              src={avatar} 
              alt={author}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="font-bold text-primary">
                {author.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium text-sm">{author}</p>
            <p className="text-xs text-muted-foreground">{role}, {company}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Trust Badges
interface TrustBadgeProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description?: string
}

export function TrustBadge({ icon: Icon, label, description }: TrustBadgeProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="font-medium text-sm">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  )
}

export function TrustBadgesGrid() {
  const badges = [
    { icon: Shield, label: 'Données sécurisées', description: 'Chiffrement SSL 256-bit' },
    { icon: Lock, label: 'Conforme RGPD', description: 'Protection des données' },
    { icon: Award, label: 'Support 24/7', description: 'Équipe française' },
    { icon: Globe, label: '99.9% Uptime', description: 'Infrastructure cloud' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {badges.map((badge, index) => (
        <TrustBadge key={index} {...badge} />
      ))}
    </div>
  )
}

// Stats with animation
interface StatItemProps {
  value: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  trend?: string
}

export function StatItem({ value, label, icon: Icon, trend }: StatItemProps) {
  return (
    <div className="text-center p-6 rounded-xl bg-card border hover:border-primary/50 transition-colors">
      <div className="flex justify-center mb-3">
        <div className="p-3 rounded-full bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
      <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
        {value}
      </div>
      {trend && (
        <Badge variant="secondary" className="mb-2 text-success">
          {trend}
        </Badge>
      )}
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

// Integration Logos
export function IntegrationLogos() {
  const integrations = [
    { name: 'Shopify', logo: '/logos/shopify.svg' },
    { name: 'WooCommerce', logo: '/logos/woocommerce.svg' },
    { name: 'PrestaShop', logo: '/logos/prestashop.svg' },
    { name: 'Amazon', logo: '/logos/amazon.svg' },
    { name: 'eBay', logo: '/logos/ebay.svg' },
    { name: 'Etsy', logo: '/logos/etsy.svg' },
  ]

  return (
    <div className="py-8">
      <p className="text-center text-sm text-muted-foreground mb-6">
        Intégrations avec vos plateformes préférées
      </p>
      <div className="flex flex-wrap justify-center items-center gap-8">
        {integrations.map((integration) => (
          <div 
            key={integration.name}
            className="h-8 w-auto grayscale hover:grayscale-0 transition-all opacity-60 hover:opacity-100"
          >
            <img 
              src={integration.logo} 
              alt={integration.name}
              className="h-full w-auto object-contain"
              onError={(e) => {
                // Fallback to text if image fails
                const target = e.currentTarget
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent) {
                  parent.innerHTML = `<span class="text-sm font-medium text-muted-foreground">${integration.name}</span>`
                }
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Featured testimonials for homepage
export function FeaturedTestimonials() {
  const testimonials: TestimonialProps[] = [
    {
      quote: "ShopOpti a transformé notre gestion e-commerce. L'import automatique depuis AliExpress nous fait gagner 15h par semaine.",
      author: "Marie Dupont",
      role: "Fondatrice",
      company: "TechStyle Paris",
      rating: 5,
      metrics: { value: "+127%", label: "de CA en 6 mois" }
    },
    {
      quote: "L'IA d'optimisation des descriptions a amélioré notre taux de conversion de 35%. Un investissement rentabilisé en 2 semaines.",
      author: "Thomas Martin",
      role: "E-commerce Manager",
      company: "GreenShop",
      rating: 5,
      metrics: { value: "+35%", label: "de conversions" }
    },
    {
      quote: "La synchronisation multi-marketplace est impeccable. Plus d'erreurs de stock, plus de commandes annulées.",
      author: "Sophie Laurent",
      role: "CEO",
      company: "ModaExpress",
      rating: 5,
      metrics: { value: "0", label: "erreurs de stock" }
    }
  ]

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {testimonials.map((testimonial, index) => (
        <TestimonialCard key={index} {...testimonial} />
      ))}
    </div>
  )
}
