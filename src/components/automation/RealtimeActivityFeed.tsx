import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Bot,
  RefreshCw,
  TrendingUp,
  ShoppingCart,
  Mail,
  Database
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ActivityItem {
  id: string
  type: 'automation' | 'workflow' | 'optimization' | 'import' | 'sync' | 'error'
  title: string
  description: string
  status: 'success' | 'error' | 'processing' | 'info'
  timestamp: Date
  metadata?: Record<string, any>
}

export const RealtimeActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLive, setIsLive] = useState(true)

  // Simuler des activités en temps réel
  useEffect(() => {
    if (!isLive) return

    const generateActivity = (): ActivityItem => {
      const types = ['automation', 'workflow', 'optimization', 'import', 'sync'] as const
      const type = types[Math.floor(Math.random() * types.length)]
      
      const activities: Record<typeof type, Omit<ActivityItem, 'id' | 'timestamp'>> = {
        automation: {
          type: 'automation',
          title: 'Synchronisation prix automatique',
          description: '127 produits mis à jour avec succès',
          status: 'success',
          metadata: { products: 127, priceChanges: 23 }
        },
        workflow: {
          type: 'workflow',
          title: 'Workflow nouveau produit',
          description: 'Produit optimisé et publié automatiquement',
          status: 'success',
          metadata: { productName: 'Chaise Design Moderne', category: 'Mobilier' }
        },
        optimization: {
          type: 'optimization',
          title: 'Optimisation IA terminée',
          description: '45 suggestions générées, 12 appliquées',
          status: 'success',
          metadata: { suggestions: 45, applied: 12 }
        },
        import: {
          type: 'import',
          title: 'Import produits gagnants',
          description: '8 nouveaux produits importés depuis AliExpress',
          status: 'success',
          metadata: { source: 'AliExpress', count: 8 }
        },
        sync: {
          type: 'sync',
          title: 'Synchronisation stock',
          description: 'Stock mis à jour pour 234 produits',
          status: 'success',
          metadata: { products: 234, outOfStock: 5 }
        }
      }

      return {
        ...activities[type],
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date()
      }
    }

    const addRandomActivity = () => {
      if (Math.random() > 0.3) { // 70% de chance d'ajouter une activité
        const newActivity = generateActivity()
        setActivities(prev => [newActivity, ...prev.slice(0, 49)]) // Garde les 50 dernières
      }
    }

    // Ajouter une activité initiale
    const initialActivities = Array.from({ length: 10 }, () => ({
      ...generateActivity(),
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) // 24h passées
    })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    setActivities(initialActivities)

    // Ajouter des activités toutes les 3-8 secondes
    const interval = setInterval(() => {
      addRandomActivity()
    }, Math.random() * 5000 + 3000)

    return () => clearInterval(interval)
  }, [isLive])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'automation': return <Zap className="w-4 h-4" />
      case 'workflow': return <Bot className="w-4 h-4" />
      case 'optimization': return <TrendingUp className="w-4 h-4" />
      case 'import': return <ShoppingCart className="w-4 h-4" />
      case 'sync': return <Database className="w-4 h-4" />
      case 'error': return <AlertCircle className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100'
      case 'error': return 'text-red-600 bg-red-100'
      case 'processing': return 'text-blue-600 bg-blue-100'
      case 'info': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return 'default'
      case 'error': return 'destructive'
      case 'processing': return 'secondary'
      default: return 'outline'
    }
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      automation: 'Automation',
      workflow: 'Workflow',
      optimization: 'IA Optim',
      import: 'Import',
      sync: 'Sync',
      error: 'Erreur'
    }
    return labels[type as keyof typeof labels] || type
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activité Temps Réel
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm text-gray-600">
              {isLive ? 'En direct' : 'Pause'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="p-4 space-y-3">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Aucune activité récente</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${getStatusColor(activity.status)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm truncate">{activity.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(activity.type)}
                        </Badge>
                        <Badge variant={getStatusBadge(activity.status)} className="text-xs">
                          {activity.status === 'success' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {activity.status === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {activity.status === 'processing' && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                          {activity.status === 'success' ? 'Réussi' : 
                           activity.status === 'error' ? 'Erreur' :
                           activity.status === 'processing' ? 'En cours' : 'Info'}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(activity.timestamp, { locale: fr, addSuffix: true })}
                      </span>
                      
                      {activity.metadata && (
                        <div className="flex items-center gap-1">
                          {Object.entries(activity.metadata).slice(0, 2).map(([key, value]) => (
                            <span key={key} className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
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