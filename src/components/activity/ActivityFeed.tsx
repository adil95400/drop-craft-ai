import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, 
  CheckCircle, 
  Star, 
  Search, 
  Bot, 
  Users, 
  ShoppingCart, 
  Target,
  TrendingUp,
  AlertCircle,
  Clock,
  Zap
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface ActivityItem {
  id: string
  type: 'success' | 'info' | 'warning' | 'error'
  icon: any
  title: string
  description: string
  timestamp: string
  module: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function ActivityFeed() {
  const navigate = useNavigate()
  const [activities] = useState<ActivityItem[]>([
    {
      id: '1',
      type: 'success',
      icon: CheckCircle,
      title: 'Transformation CRM terminée',
      description: 'Module CRM & Marketing entièrement fonctionnel avec données réelles',
      timestamp: 'Il y a 5 minutes',
      module: 'CRM',
      action: {
        label: 'Voir CRM',
        onClick: () => navigate('/crm')
      }
    },
    {
      id: '2',
      type: 'success',
      icon: Star,
      title: 'Module Reviews opérationnel',
      description: 'Système d\'avis clients avec modales avancées et gestion complète',
      timestamp: 'Il y a 8 minutes',
      module: 'Reviews',
      action: {
        label: 'Gérer avis',
        onClick: () => navigate('/reviews')
      }
    },
    {
      id: '3',
      type: 'success',
      icon: Search,
      title: 'SEO Ultra Pro activé',
      description: 'Optimisation SEO avec IA, suivi mots-clés et analytics avancés',
      timestamp: 'Il y a 12 minutes',
      module: 'SEO',
      action: {
        label: 'Optimiser SEO',
        onClick: () => navigate('/marketing/seo')
      }
    },
    {
      id: '4',
      type: 'success',
      icon: Bot,
      title: 'Automatisation IA déployée',
      description: 'Workflows intelligents et automations avancées opérationnels',
      timestamp: 'Il y a 15 minutes',
      module: 'Automation',
      action: {
        label: 'Configurer IA',
        onClick: () => navigate('/automation')
      }
    },
    {
      id: '5',
      type: 'info',
      icon: TrendingUp,
      title: 'Dashboard Ultra Pro mis à jour',
      description: 'Vue d\'ensemble complète avec métriques en temps réel de tous les modules',
      timestamp: 'Il y a 2 minutes',
      module: 'Dashboard',
      action: {
        label: 'Voir dashboard',
        onClick: () => navigate('/dashboard')
      }
    },
    {
      id: '6',
      type: 'success',
      icon: Users,
      title: 'Intégration clients sécurisée',
      description: 'Monitoring de sécurité et protection des données clients activés',
      timestamp: 'Il y a 18 minutes',
      module: 'Security'
    },
    {
      id: '7',
      type: 'info',
      icon: Target,
      title: 'Marketing automation prêt',
      description: 'Campagnes marketing et segmentation clients opérationnels',
      timestamp: 'Il y a 20 minutes',
      module: 'Marketing'
    },
    {
      id: '8',
      type: 'success',
      icon: Zap,
      title: 'API backend optimisées',
      description: 'Edge functions et intégrations Supabase entièrement configurées',
      timestamp: 'Il y a 25 minutes',
      module: 'Backend'
    }
  ])

  const getActivityIcon = (activity: ActivityItem) => {
    const IconComponent = activity.icon
    const colorClass = {
      success: 'text-green-600 bg-green-100',
      info: 'text-blue-600 bg-blue-100', 
      warning: 'text-yellow-600 bg-yellow-100',
      error: 'text-red-600 bg-red-100'
    }[activity.type]

    return (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
        <IconComponent className="w-4 h-4" />
      </div>
    )
  }

  const getModuleBadge = (module: string) => {
    const moduleColors = {
      'CRM': 'bg-purple-100 text-purple-800',
      'Reviews': 'bg-yellow-100 text-yellow-800',
      'SEO': 'bg-green-100 text-green-800',
      'Automation': 'bg-blue-100 text-blue-800',
      'Dashboard': 'bg-indigo-100 text-indigo-800',
      'Security': 'bg-red-100 text-red-800',
      'Marketing': 'bg-pink-100 text-pink-800',
      'Backend': 'bg-gray-100 text-gray-800'
    }

    return (
      <Badge variant="secondary" className={`text-xs ${moduleColors[module as keyof typeof moduleColors] || 'bg-gray-100 text-gray-800'}`}>
        {module}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Activité Récente
            </CardTitle>
            <CardDescription>
              Transformations et mises à jour de votre plateforme
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <CheckCircle className="h-3 w-3 text-green-600" />
            Tout opérationnel
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                {getActivityIcon(activity)}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">{activity.title}</h4>
                    {getModuleBadge(activity.module)}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {activity.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {activity.timestamp}
                    </div>
                    {activity.action && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 text-xs"
                        onClick={activity.action.onClick}
                      >
                        {activity.action.label}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}