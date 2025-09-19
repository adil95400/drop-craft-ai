import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Crown, 
  Zap, 
  ArrowRight,
  Sparkles,
  Target
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface UpgradePromoBannerProps {
  currentPage: 'import' | 'products' | 'suppliers'
  className?: string
}

const UPGRADE_CONTENT = {
  import: {
    title: 'Passez à l\'Import Ultra Pro',
    description: 'Importez depuis 150+ marketplaces en 1-clic avec IA et optimisation automatique',
    features: ['Import Amazon/eBay 1-clic', 'IA Scraper intelligent', 'Extension Chrome', 'SEO automatique'],
    url: '/import/advanced'
  },
  products: {
    title: 'Catalogue Ultra Pro disponible',
    description: 'Gestion intelligente avec optimisations IA et operations en masse',
    features: ['Actions bulk avancées', 'Optimisation IA', 'Analytics détaillées', 'Scoring qualité'],
    url: '/products/advanced'
  },
  suppliers: {
    title: 'Fournisseurs Ultra Pro',
    description: 'Monitoring temps réel et optimisation des relations fournisseurs',
    features: ['Scoring automatique', 'Monitoring 24/7', 'Alertes intelligentes', 'Workflows auto'],
    url: '/suppliers/advanced'
  }
}

export function UpgradePromoBanner({ currentPage, className = '' }: UpgradePromoBannerProps) {
  const content = UPGRADE_CONTENT[currentPage]

  return (
    <Card className={`border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 ${className}`}>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-primary/10">
                <Crown className="h-4 w-4 text-primary" />
              </div>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Sparkles className="h-3 w-3 mr-1" />
                Ultra Pro
              </Badge>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-primary">{content.title}</h3>
              <p className="text-sm text-muted-foreground">{content.description}</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {content.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-1 text-xs">
                  <Zap className="h-3 w-3 text-green-500" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/advanced">
                <Target className="h-4 w-4 mr-2" />
                Voir tous les modules
              </Link>
            </Button>
            
            <Button size="sm" asChild className="bg-primary hover:bg-primary/90">
              <Link to={content.url}>
                <Crown className="h-4 w-4 mr-2" />
                Accéder maintenant
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}