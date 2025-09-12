import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { supabase } from '@/integrations/supabase/client'
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, Package, ShoppingCart, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

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
      // Pour le moment, on simule des logs. 
      // En production, ces logs viendraient d'une vraie table de logs
      const mockLogs: SyncLog[] = [
        {
          id: '1',
          type: 'full',
          status: 'error',
          message: 'Erreur sync produits: Edge Function returned a non-2xx status code',
          created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 min ago
        },
        {
          id: '2',
          type: 'products',
          status: 'success',
          message: 'Synchronisation des produits réussie',
          items_count: 127,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
        },
        {
          id: '3',
          type: 'orders',
          status: 'success',
          message: 'Synchronisation des commandes réussie',
          items_count: 45,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() // 6 hours ago
        },
        {
          id: '4',
          type: 'full',
          status: 'warning',
          message: 'Synchronisation partiellement réussie - Quelques produits n\'ont pas pu être importés',
          items_count: 98,
          details: { skipped: 5, imported: 98 },
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
        }
      ]
      
      setLogs(mockLogs)
    } catch (error) {
      console.error('Error fetching sync logs:', error)
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
                          locale: fr 
                        })}
                      </span>
                      {log.items_count && (
                        <span>
                          {log.items_count} élément{log.items_count > 1 ? 's' : ''} traité{log.items_count > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    
                    {log.details && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {log.details.imported && (
                          <span>Importés: {log.details.imported}</span>
                        )}
                        {log.details.skipped && (
                          <span className="ml-2">Ignorés: {log.details.skipped}</span>
                        )}
                      </div>
                    )}
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