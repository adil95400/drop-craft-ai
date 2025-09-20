import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Upload, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Users,
  ShoppingCart,
  Package,
  TrendingUp,
  Bell
} from 'lucide-react'
import { useRealTimeUpdates, useImportJobUpdates, useSyncActivityUpdates } from '@/hooks/useRealTimeUpdates'
import { useToast } from '@/hooks/use-toast'

interface ActivityItem {
  id: string
  type: 'import' | 'sync' | 'order' | 'product' | 'user'
  status: 'success' | 'error' | 'warning' | 'info'
  message: string
  timestamp: string
  metadata?: any
}

interface MetricItem {
  label: string
  value: number
  change: number
  icon: React.ComponentType<{ className?: string }>
  format?: 'number' | 'percentage' | 'currency'
}

export function RealTimeMonitor() {
  const { toast } = useToast()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [metrics, setMetrics] = useState<MetricItem[]>([
    { label: "Produits Importés", value: 1250, change: 12, icon: Package },
    { label: "Commandes Traitées", value: 89, change: 8, icon: ShoppingCart },
    { label: "Clients Actifs", value: 456, change: -2, icon: Users },
    { label: "Taux de Sync", value: 98.5, change: 1.2, icon: RefreshCw, format: 'percentage' }
  ])
  const [isConnected, setIsConnected] = useState(false)

  // Real-time updates for imports
  const { isConnected: importConnected } = useImportJobUpdates((job) => {
    addActivity({
      id: job.id,
      type: 'import',
      status: job.status === 'completed' ? 'success' : job.status === 'failed' ? 'error' : 'info',
      message: `Import ${job.job_type}: ${job.status}`,
      timestamp: new Date().toISOString(),
      metadata: job
    })
  })

  // Real-time updates for sync
  const { isConnected: syncConnected } = useSyncActivityUpdates((activity) => {
    addActivity({
      id: activity.id,
      type: 'sync',
      status: activity.severity === 'error' ? 'error' : 'success',
      message: activity.description,
      timestamp: activity.created_at,
      metadata: activity
    })
  })

  useEffect(() => {
    setIsConnected(importConnected && syncConnected)
    loadInitialData()
  }, [importConnected, syncConnected])

  const loadInitialData = () => {
    // Simulate loading recent activities
    const mockActivities: ActivityItem[] = [
      {
        id: '1',
        type: 'import',
        status: 'success',
        message: 'Import CSV terminé - 45 produits ajoutés',
        timestamp: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: '2', 
        type: 'sync',
        status: 'success',
        message: 'Synchronisation BigBuy - Stock mis à jour',
        timestamp: new Date(Date.now() - 600000).toISOString()
      },
      {
        id: '3',
        type: 'order',
        status: 'info',
        message: 'Nouvelle commande #12345 reçue',
        timestamp: new Date(Date.now() - 900000).toISOString()
      }
    ]
    setActivities(mockActivities)
  }

  const addActivity = (activity: ActivityItem) => {
    setActivities(prev => [activity, ...prev.slice(0, 19)]) // Keep last 20
    
    // Update metrics based on activity
    if (activity.type === 'import' && activity.status === 'success') {
      setMetrics(prev => prev.map(metric => 
        metric.label === "Produits Importés" 
          ? { ...metric, value: metric.value + (activity.metadata?.processed_items || 1) }
          : metric
      ))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-success/10 text-success'
      case 'error': return 'bg-destructive/10 text-destructive'
      case 'warning': return 'bg-warning/10 text-warning'
      case 'info': return 'bg-primary/10 text-primary'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return CheckCircle
      case 'error': return AlertTriangle  
      case 'warning': return AlertTriangle
      case 'info': return Clock
      default: return Activity
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'import': return Upload
      case 'sync': return RefreshCw
      case 'order': return ShoppingCart
      case 'product': return Package
      case 'user': return Users
      default: return Activity
    }
  }

  const formatMetricValue = (value: number, format?: string) => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`
      case 'currency':
        return `${value.toFixed(2)}€`
      default:
        return value.toLocaleString()
    }
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
            <span className="text-sm">
              {isConnected ? 'Connecté aux mises à jour temps réel' : 'Connexion en cours...'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon
          return (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {metric.label}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">
                        {formatMetricValue(metric.value, metric.format)}
                      </p>
                      <div className={`flex items-center text-sm ${
                        metric.change > 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        <TrendingUp className={`w-3 h-3 ${metric.change < 0 ? 'rotate-180' : ''}`} />
                        {Math.abs(metric.change)}%
                      </div>
                    </div>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <IconComponent className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Activité Temps Réel
              </CardTitle>
              <CardDescription>
                Flux des événements système en direct
              </CardDescription>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Bell className="w-3 h-3" />
              {activities.length} événements
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80">
            <div className="space-y-3">
              {activities.map((activity) => {
                const StatusIcon = getStatusIcon(activity.status)
                const TypeIcon = getTypeIcon(activity.type)
                
                return (
                  <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-full ${getStatusColor(activity.status)}`}>
                        <StatusIcon className="w-3 h-3" />
                      </div>
                      <TypeIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {activity.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                      {activity.metadata?.processed_items && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>Progression</span>
                            <span>{activity.metadata.processed_items}/{activity.metadata.total_items || 100}</span>
                          </div>
                          <Progress 
                            value={(activity.metadata.processed_items / (activity.metadata.total_items || 100)) * 100} 
                            className="h-1"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              
              {activities.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune activité récente</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}