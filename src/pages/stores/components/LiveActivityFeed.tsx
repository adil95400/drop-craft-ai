import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, Package, ShoppingCart, AlertCircle, CheckCircle, Clock, Zap
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale'

interface ActivityItem {
  id: string
  type: 'sync' | 'order' | 'product' | 'error' | 'success'
  title: string
  description: string
  timestamp: string
}

interface LiveActivityFeedProps {
  storeId: string
}

function mapAction(action: string): ActivityItem['type'] {
  if (action.includes('order') || action.includes('commande')) return 'order'
  if (action.includes('product') || action.includes('import')) return 'product'
  if (action.includes('sync') || action.includes('synchron')) return 'sync'
  if (action.includes('error') || action.includes('fail')) return 'error'
  return 'success'
}

export function LiveActivityFeed({ storeId }: LiveActivityFeedProps) {
  const locale = useDateFnsLocale()
  const { user } = useAuth()

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['live-activity-feed', user?.id, storeId],
    enabled: !!user,
    refetchInterval: 30000, // auto-refresh every 30s
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('id, action, description, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return (data || []).map((item: any) => ({
        id: item.id,
        type: mapAction(item.action || ''),
        title: item.action?.replace(/_/g, ' ') || 'Activité',
        description: item.description || '',
        timestamp: item.created_at,
      })) as ActivityItem[]
    }
  })

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'sync': return <Zap className="w-4 h-4 text-blue-500" />
      case 'order': return <ShoppingCart className="w-4 h-4 text-green-500" />
      case 'product': return <Package className="w-4 h-4 text-purple-500" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
      default: return <Activity className="w-4 h-4 text-muted-foreground" />
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
          <Badge variant="secondary" className="ml-auto animate-pulse">Live</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p>Chargement...</p>
              </div>
            ) : activities.length === 0 ? (
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
                  <div className="flex-shrink-0 mt-0.5">{getIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <Badge variant={getBadgeVariant(activity.type)} className="text-xs">{activity.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{activity.description}</p>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale })}
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
