import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ActivityItem {
  id: string
  type: 'sync' | 'order' | 'product' | 'error' | 'success'
  title: string
  description: string
  timestamp: string
  metadata?: any
}

interface LiveActivityFeedProps {
  storeId: string
}

export function LiveActivityFeed({ storeId }: LiveActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      id: '1',
      type: 'success',
      title: 'Synchronisation terminée',
      description: '127 produits synchronisés avec succès',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString()
    },
    {
      id: '2',
      type: 'order',
      title: 'Nouvelle commande',
      description: 'Commande #1032 - 89,99 €',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
    },
    {
      id: '3',
      type: 'product',
      title: 'Produit ajouté',
      description: 'iPhone 15 Pro Max ajouté au catalogue',
      timestamp: new Date(Date.now() - 1000 * 60 * 32).toISOString()
    },
    {
      id: '4',
      type: 'sync',
      title: 'Synchronisation auto',
      description: 'Vérification des mises à jour Shopify',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString()
    }
  ])

  // Simulation d'activité en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      const randomEvents = [
        {
          type: 'order' as const,
          title: 'Nouvelle commande',
          description: `Commande #${Math.floor(Math.random() * 9000) + 1000} - ${(Math.random() * 200 + 20).toFixed(2)} €`
        },
        {
          type: 'sync' as const,
          title: 'Auto-sync',
          description: 'Vérification automatique des données'
        },
        {
          type: 'product' as const,
          title: 'Stock mis à jour',
          description: `Mise à jour du stock pour ${Math.floor(Math.random() * 20) + 1} produits`
        }
      ]

      // Ajouter un événement aléatoire toutes les 30 secondes
      if (Math.random() > 0.7) {
        const event = randomEvents[Math.floor(Math.random() * randomEvents.length)]
        const newActivity: ActivityItem = {
          id: Date.now().toString(),
          type: event.type,
          title: event.title,
          description: event.description,
          timestamp: new Date().toISOString()
        }

        setActivities(prev => [newActivity, ...prev.slice(0, 9)]) // Garder max 10 items
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'sync': return <Zap className="w-4 h-4 text-blue-500" />
      case 'order': return <ShoppingCart className="w-4 h-4 text-green-500" />
      case 'product': return <Package className="w-4 h-4 text-purple-500" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getBadgeVariant = (type: ActivityItem['type']) => {
    switch (type) {
      case 'success': return 'default'
      case 'error': return 'destructive'
      case 'order': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Activité en temps réel
          <Badge variant="secondary" className="ml-auto animate-pulse">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune activité récente</p>
                <p className="text-sm">Les événements apparaîtront ici en temps réel</p>
              </div>
            ) : (
              activities.map((activity, index) => (
                <div 
                  key={activity.id} 
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-300 hover:bg-muted/50 ${
                    index === 0 ? 'animate-fade-in ring-1 ring-primary/20' : ''
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <Badge variant={getBadgeVariant(activity.type)} className="text-xs">
                        {activity.type}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-1">
                      {activity.description}
                    </p>
                    
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { 
                        addSuffix: true, 
                        locale: fr 
                      })}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}