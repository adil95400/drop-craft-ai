import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { supabase } from '@/integrations/supabase/client'
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, Package, ShoppingCart, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'

interface SyncLog {
  id: string
  type: 'products' | 'orders' | 'customers' | 'full'
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
  items_count?: number
  created_at: string
}

interface SyncHistoryProps {
  storeId: string
}

export function SyncHistory({ storeId }: SyncHistoryProps) {
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchLogs = async () => {
    try {
      // Fetch real activity logs filtered by store/integration
      const { data, error } = await (supabase.from('activity_logs') as any)
        .select('*')
        .or(`action.eq.sync_completed,action.eq.sync_failed,action.eq.sync_partial,action.ilike.%sync%`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      const mapped: SyncLog[] = (data || []).map((log: any) => ({
        id: log.id,
        type: log.entity_type === 'order' ? 'orders' : log.entity_type === 'customer' ? 'customers' : log.entity_type === 'product' ? 'products' : 'full',
        status: log.severity === 'error' ? 'error' : log.severity === 'warn' ? 'warning' : 'success',
        message: log.description || log.action,
        details: log.details,
        items_count: log.details?.count || log.details?.items_count,
        created_at: log.created_at,
      }))

      setLogs(mapped)
    } catch (error) {
      console.error('Error fetching sync logs:', error)
      setLogs([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [storeId])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchLogs()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />
      case 'warning': return <AlertCircle className="w-4 h-4 text-orange-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'products': return <Package className="w-4 h-4" />
      case 'orders': return <ShoppingCart className="w-4 h-4" />
      case 'customers': return <Users className="w-4 h-4" />
      default: return <RefreshCw className="w-4 h-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'products': return 'Produits'
      case 'orders': return 'Commandes'
      case 'customers': return 'Clients'
      case 'full': return 'Complète'
      default: return type
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200'
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      case 'warning': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Historique des synchronisations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Historique des synchronisations
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune synchronisation trouvée</p>
                <p className="text-sm">L'historique apparaîtra ici après vos premières synchronisations</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(log.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="gap-1">
                        {getTypeIcon(log.type)}
                        {getTypeLabel(log.type)}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(log.status)}
                      >
                        {log.status === 'success' ? 'Succès' : 
                         log.status === 'error' ? 'Erreur' : 'Attention'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {log.message}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(log.created_at), { 
                          addSuffix: true, 
                          locale: getDateFnsLocale() 
                        })}
                      </span>
                      {log.items_count && (
                        <span>
                          {log.items_count} élément{log.items_count > 1 ? 's' : ''} traité{log.items_count > 1 ? 's' : ''}
                        </span>
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
