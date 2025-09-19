import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Zap, 
  Bot, 
  TrendingUp,
  Package,
  Upload,
  Users,
  Crown,
  ArrowRight
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface AdvancedModule {
  id: string
  title: string
  description: string
  url: string
  icon: React.ElementType
  badge: string
  benefits: string[]
}

const ADVANCED_MODULES: AdvancedModule[] = [
  {
    id: 'import-ultra',
    title: 'Import Ultra Pro',
    description: 'Import depuis 150+ marketplaces avec IA et optimisation automatique',
    url: '/import/advanced',
    icon: Upload,
    badge: 'Ultra',
    benefits: [
      'Import 1-clic depuis Amazon, eBay, AliExpress...',
      'IA scraper intelligent pour tout site',
      'Extension Chrome avancée',
      'Optimisation SEO automatique',
      'Actions bulk sur milliers de produits'
    ]
  },
  {
    id: 'products-ultra',
    title: 'Catalogue Ultra Pro',
    description: 'Gestion intelligente avec optimisations IA et operations en masse',
    url: '/products/advanced',
    icon: Package,
    badge: 'Ultra',
    benefits: [
      'Actions bulk avancées sur produits',
      'Optimisation IA (SEO, prix, contenu)',
      'Analytics de performance détaillées', 
      'Recommandations intelligentes',
      'Scoring qualité automatique'
    ]
  },
  {
    id: 'suppliers-ultra',
    title: 'Fournisseurs Ultra Pro',
    description: 'Monitoring temps réel et optimisation des relations fournisseurs',
    url: '/suppliers/advanced',
    icon: Users,
    badge: 'Ultra',
    benefits: [
      'Scoring fournisseurs automatique',
      'Monitoring temps réel 24/7',
      'Alertes intelligentes',
      'Analytics performance avancées',
      'Workflows automatisés'
    ]
  }
]

export function AdvancedModulesMenu() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Crown className="h-6 w-6 text-yellow-500" />
          <h2 className="text-2xl font-bold">Modules Ultra Pro</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Accédez aux fonctionnalités avancées inspirées des leaders du marché (Shopify, WooCommerce, Magento)
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {ADVANCED_MODULES.map((module) => (
          <Card key={module.id} className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <module.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {module.badge}
                    </Badge>
                  </div>
                </div>
              </div>
              <CardDescription className="text-sm">
                {module.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Fonctionnalités clés :</h4>
                <ul className="space-y-1">
                  {module.benefits.slice(0, 3).map((benefit, index) => (
                    <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                      <Zap className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                  {module.benefits.length > 3 && (
                    <li className="text-xs text-muted-foreground">
                      +{module.benefits.length - 3} autres fonctionnalités...
                    </li>
                  )}
                </ul>
              </div>
              
              <Button asChild className="w-full">
                <Link to={module.url}>
                  <Bot className="h-4 w-4 mr-2" />
                  Accéder au module
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
            
            {/* Gradient overlay */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-[40px]" />
          </Card>
        ))}
      </div>
      
      <div className="text-center">
        <Card className="inline-block p-4 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center gap-3">
            <Crown className="h-5 w-5 text-yellow-500" />
            <span className="text-sm font-medium">
              Ces modules nécessitent un abonnement Ultra Pro
            </span>
            <Button size="sm" variant="outline" asChild>
              <Link to="/subscription">
                Upgrade
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}