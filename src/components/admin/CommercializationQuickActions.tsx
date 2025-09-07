import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import { 
  Package, 
  Users, 
  Activity, 
  CreditCard, 
  TrendingUp, 
  ExternalLink,
  CheckCircle,
  Crown
} from 'lucide-react'

export function CommercializationQuickActions() {
  const commercializationFeatures = [
    {
      title: 'Catalogue Produits Pro',
      description: 'Éditeur avancé avec IA, SEO et gestion des prix',
      href: '/catalog',
      icon: Package,
      status: 'ready',
      plan: 'PRO'
    },
    {
      title: 'CRM & Marketing',
      description: 'Gestion complète des contacts et campagnes',
      href: '/crm',
      icon: Users,
      status: 'ready',
      plan: 'PRO'
    },
    {
      title: 'Monitoring Système',
      description: 'Surveillance temps réel et analytics business',
      href: '/monitoring',
      icon: Activity,
      status: 'ready',
      plan: 'ULTRA PRO'
    },
    {
      title: 'Gestion Facturation',
      description: 'Plans tarifaires et quotas Stripe',
      href: '/modern/billing',
      icon: CreditCard,
      status: 'ready',
      plan: 'CORE'
    }
  ]

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          Fonctionnalités Commercialisées
          <Badge variant="default" className="ml-2">100% PRÊT</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {commercializationFeatures.map((feature) => {
            const IconComponent = feature.icon
            return (
              <div key={feature.href} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <IconComponent className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{feature.title}</span>
                      <Badge 
                        variant={feature.plan === 'ULTRA PRO' ? 'destructive' : feature.plan === 'PRO' ? 'default' : 'secondary'} 
                        className="text-xs"
                      >
                        {feature.plan}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Button size="sm" variant="ghost" asChild>
                    <Link to={feature.href}>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium text-sm">Drop Craft AI est prêt pour la commercialisation</span>
          </div>
          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
            Toutes les fonctionnalités premium sont implémentées avec monitoring, tests E2E et architecture scalable.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}