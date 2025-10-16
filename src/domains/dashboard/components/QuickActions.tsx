/**
 * PHASE 2: Actions rapides contextuelles selon le plan utilisateur
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Package, ShoppingCart, Users, TrendingUp, Brain, 
  Upload, Download, Settings, Zap, Target, 
  BarChart3, Mail, Share2, AlertCircle, Plus
} from 'lucide-react'
import { usePlanContext } from '@/components/plan'
import { useNavigate } from 'react-router-dom'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: any
  route: string
  color: string
  badge?: string
  planRequired?: 'standard' | 'pro' | 'ultra_pro'
  priority: 'high' | 'medium' | 'low'
  category: 'core' | 'advanced' | 'premium'
}

export const QuickActions: React.FC = () => {
  const { hasFeature, currentPlan: plan } = usePlanContext()
  const navigate = useNavigate()

  const actions: QuickAction[] = [
    // Actions Core (toujours disponibles)
    {
      id: 'import-products',
      title: 'Importer des produits',
      description: 'Ajouter des produits depuis URL ou fichier',
      icon: Upload,
      route: '/import',
      color: 'bg-blue-500 hover:bg-blue-600',
      priority: 'high',
      category: 'core'
    },
    {
      id: 'manage-orders',
      title: 'Gérer les commandes',
      description: 'Traiter et suivre les commandes',
      icon: ShoppingCart,
      route: '/orders',
      color: 'bg-green-500 hover:bg-green-600',
      priority: 'high',
      category: 'core'
    },
    {
      id: 'customer-management',
      title: 'Gestion clients',
      description: 'Voir et gérer la base clients',
      icon: Users,
      route: '/customers',
      color: 'bg-purple-500 hover:bg-purple-600',
      priority: 'high',
      category: 'core'
    },
    
    // Actions Avancées (Pro+)
    {
      id: 'advanced-analytics',
      title: 'Analytics avancés',
      description: 'Rapports et insights détaillés',
      icon: BarChart3,
      route: '/analytics',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      badge: 'Pro',
      planRequired: 'pro',
      priority: 'medium',
      category: 'advanced'
    },
    {
      id: 'automation-setup',
      title: 'Automatisation',
      description: 'Configurer les règles d\'automatisation',
      icon: Zap,
      route: '/automation',
      color: 'bg-yellow-500 hover:bg-yellow-600',
      badge: 'Pro',
      planRequired: 'pro',
      priority: 'medium',
      category: 'advanced'
    },
    {
      id: 'marketing-campaigns',
      title: 'Campagnes marketing',
      description: 'Créer et gérer les campagnes',
      icon: Target,
      route: '/marketing',
      color: 'bg-pink-500 hover:bg-pink-600',
      badge: 'Pro',
      planRequired: 'pro',
      priority: 'medium',
      category: 'advanced'
    },
    
    // Actions Premium (Ultra Pro)
    {
      id: 'ai-optimizer',
      title: 'Optimiseur IA',
      description: 'Optimisation automatique par IA',
      icon: Brain,
      route: '/ai-optimizer',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
      badge: 'Ultra Pro',
      planRequired: 'ultra_pro',
      priority: 'high',
      category: 'premium'
    },
    {
      id: 'predictive-analytics',
      title: 'Analytics prédictifs',
      description: 'Prédictions et tendances IA',
      icon: TrendingUp,
      route: '/predictive-analytics',
      color: 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600',
      badge: 'Ultra Pro',
      planRequired: 'ultra_pro',
      priority: 'medium',
      category: 'premium'
    },
    {
      id: 'advanced-automation',
      title: 'Automation avancée',
      description: 'Workflows complexes avec IA',
      icon: Settings,
      route: '/automation-advanced',
      color: 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600',
      badge: 'Ultra Pro',
      planRequired: 'ultra_pro',
      priority: 'medium',
      category: 'premium'
    }
  ]

  const handleActionClick = (action: QuickAction) => {
    if (action.planRequired && !hasFeature(action.planRequired)) {
      // Rediriger vers la page de mise à niveau
      navigate('/subscription')
      return
    }
    
    navigate(action.route)
  }

  const getActionsByCategory = (category: string) => {
    return actions.filter(action => action.category === category)
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
  }

  const ActionCard = ({ action }: { action: QuickAction }) => {
    const isLocked = action.planRequired && !hasFeature(action.planRequired)
    
    return (
      <Card className={`relative cursor-pointer transition-all hover:shadow-md ${isLocked ? 'opacity-60' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className={`p-2 rounded-lg ${action.color} text-white`}>
              <action.icon className="h-5 w-5" />
            </div>
            {action.badge && (
              <Badge variant={isLocked ? 'secondary' : 'default'} className="text-xs">
                {action.badge}
              </Badge>
            )}
          </div>
          <CardTitle className="text-base">{action.title}</CardTitle>
          <CardDescription className="text-sm">
            {action.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Button 
            className="w-full" 
            variant={isLocked ? 'outline' : 'default'}
            onClick={() => handleActionClick(action)}
          >
            {isLocked ? 'Mettre à niveau' : 'Accéder'}
          </Button>
        </CardContent>
        
        {isLocked && (
          <div className="absolute top-2 right-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Actions principales */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Zap className="h-5 w-5 mr-2 text-primary" />
          Actions essentielles
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {getActionsByCategory('core').map(action => (
            <ActionCard key={action.id} action={action} />
          ))}
        </div>
      </div>

      {/* Actions avancées */}
      {hasFeature('advanced_features') && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2 text-indigo-500" />
            Fonctionnalités avancées
            <Badge variant="secondary" className="ml-2">Pro</Badge>
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {getActionsByCategory('advanced').map(action => (
              <ActionCard key={action.id} action={action} />
            ))}
          </div>
        </div>
      )}

      {/* Actions premium */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Brain className="h-5 w-5 mr-2 text-purple-500" />
          Intelligence Artificielle
          <Badge className="ml-2 bg-gradient-to-r from-purple-500 to-pink-500">Ultra Pro</Badge>
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {getActionsByCategory('premium').map(action => (
            <ActionCard key={action.id} action={action} />
          ))}
        </div>
      </div>

      {/* Actions rapides additionnelles */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Actions rapides
          </CardTitle>
          <CardDescription>
            Raccourcis vers les tâches courantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" size="sm" className="justify-start" asChild>
              <a href="/import/url">
                <Upload className="h-4 w-4 mr-2" />
                Import URL
              </a>
            </Button>
            <Button variant="outline" size="sm" className="justify-start" asChild>
              <a href="/export">
                <Download className="h-4 w-4 mr-2" />
                Export données
              </a>
            </Button>
            <Button variant="outline" size="sm" className="justify-start" asChild>
              <a href="/integrations">
                <Share2 className="h-4 w-4 mr-2" />
                Intégrations
              </a>
            </Button>
            <Button variant="outline" size="sm" className="justify-start" asChild>
              <a href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Promotion vers plan supérieur */}
      {plan !== 'ultra_pro' && (
        <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <Brain className="h-5 w-5 mr-2" />
              Débloquer toutes les fonctionnalités
            </CardTitle>
            <CardDescription>
              Accédez à l'intelligence artificielle et aux automatisations avancées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Plan Ultra Pro</div>
                <div className="text-sm text-muted-foreground">
                  IA, automatisation, analytics prédictifs et plus
                </div>
              </div>
              <Button onClick={() => navigate('/subscription')}>
                Voir les plans
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}