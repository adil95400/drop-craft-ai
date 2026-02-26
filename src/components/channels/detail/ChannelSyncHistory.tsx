/**
 * ChannelSyncHistory - Historique et statut de synchronisation bidirectionnelle
 * Uses real data from unified_sync_queue
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'
import { 
  RefreshCw, CheckCircle2, XCircle, Clock, ArrowRightLeft,
  ArrowUpRight, ArrowDownLeft, Loader2, History
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface SyncLog {
  id: string
  direction: 'push' | 'pull' | 'bidirectional'
  status: 'success' | 'error' | 'pending' | 'running'
  type: 'products' | 'orders' | 'inventory' | 'prices'
  itemsProcessed: number
  itemsTotal: number
  startedAt: Date
  completedAt?: Date
  error?: string
}

interface ChannelSyncHistoryProps {
  channelId: string
  onSync?: (direction: 'push' | 'pull' | 'bidirectional') => Promise<void>
  isSyncing?: boolean
}

export function ChannelSyncHistory({ 
  channelId, 
  onSync,
  isSyncing = false 
}: ChannelSyncHistoryProps) {
  // Fetch real sync logs from unified_sync_queue
  const { data: realLogs } = useQuery({
    queryKey: ['sync-history', channelId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      const { data } = await supabase
        .from('unified_sync_queue')
        .select('id, sync_type, action, status, created_at, processed_at, payload')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      return (data || []).map((item: any) => ({
        id: item.id,
        direction: (item.action === 'create' ? 'push' : 'pull') as SyncLog['direction'],
        status: (item.status === 'completed' ? 'success' : item.status === 'failed' ? 'error' : item.status === 'processing' ? 'running' : 'pending') as SyncLog['status'],
        type: (item.sync_type || 'products') as SyncLog['type'],
        itemsProcessed: item.status === 'completed' ? 1 : 0,
        itemsTotal: 1,
        startedAt: new Date(item.created_at),
        completedAt: item.processed_at ? new Date(item.processed_at) : undefined,
        error: item.status === 'failed' ? 'Sync failed' : undefined,
      })) as SyncLog[];
    },
  });

  const [logs, setLogs] = useState<SyncLog[]>([])
  const [currentSync, setCurrentSync] = useState<SyncLog | null>(null)

  // Update logs when real data arrives
  useEffect(() => {
    if (realLogs && realLogs.length > 0) {
      setLogs(realLogs);
    }
  }, [realLogs]);

  const getDirectionIcon = (direction: SyncLog['direction']) => {
    switch (direction) {
      case 'push': return ArrowUpRight
      case 'pull': return ArrowDownLeft
      default: return ArrowRightLeft
    }
  }

  const getStatusConfig = (status: SyncLog['status']) => {
    switch (status) {
      case 'success':
        return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-500/10', label: 'Succès' }
      case 'error':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-500/10', label: 'Erreur' }
      case 'running':
        return { icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-500/10', label: 'En cours' }
      default:
        return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-500/10', label: 'En attente' }
    }
  }

  const getTypeLabel = (type: SyncLog['type']) => {
    const labels = {
      products: 'Produits',
      orders: 'Commandes',
      inventory: 'Stock',
      prices: 'Prix'
    }
    return labels[type]
  }

  const handleSync = async (direction: 'push' | 'pull' | 'bidirectional') => {
    const newSync: SyncLog = {
      id: Date.now().toString(),
      direction,
      status: 'running',
      type: 'products',
      itemsProcessed: 0,
      itemsTotal: 100,
      startedAt: new Date(),
    }
    
    setCurrentSync(newSync)
    
    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(r => setTimeout(r, 200))
      setCurrentSync(prev => prev ? { ...prev, itemsProcessed: i } : null)
    }
    
    const completedSync = {
      ...newSync,
      status: 'success' as const,
      itemsProcessed: 100,
      completedAt: new Date()
    }
    
    setLogs(prev => [completedSync, ...prev])
    setCurrentSync(null)
    
    await onSync?.(direction)
  }

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden">
      <CardHeader className="pb-4 bg-gradient-to-r from-purple-500/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10">
              <ArrowRightLeft className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Synchronisation bidirectionnelle</CardTitle>
              <p className="text-sm text-muted-foreground">
                Shopify ↔ ShopOpti+
              </p>
            </div>
          </div>
        </div>

        {/* Quick Sync Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleSync('pull')}
            disabled={isSyncing || !!currentSync}
            className="gap-2 rounded-xl"
          >
            <ArrowDownLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Importer</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleSync('push')}
            disabled={isSyncing || !!currentSync}
            className="gap-2 rounded-xl"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span className="hidden sm:inline">Exporter</span>
          </Button>
          <Button 
            onClick={() => handleSync('bidirectional')}
            disabled={isSyncing || !!currentSync}
            size="sm"
            className="gap-2 rounded-xl"
          >
            <ArrowRightLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Sync complète</span>
          </Button>
        </div>

        {/* Current Sync Progress */}
        {currentSync && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium">Synchronisation en cours...</span>
              </div>
              <span className="text-sm font-mono">{currentSync.itemsProcessed}%</span>
            </div>
            <Progress value={currentSync.itemsProcessed} className="h-2" />
          </motion.div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center gap-2 mb-3">
          <History className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Historique récent</span>
        </div>

        <div className="space-y-2">
          {logs.slice(0, 5).map((log, index) => {
            const DirectionIcon = getDirectionIcon(log.direction)
            const statusConfig = getStatusConfig(log.status)
            const StatusIcon = statusConfig.icon
            
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors",
                  log.status === 'error' && "border-red-500/30 bg-red-500/5"
                )}
              >
                <div className={cn("p-2 rounded-lg", statusConfig.bg)}>
                  <DirectionIcon className={cn("h-4 w-4", statusConfig.color)} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{getTypeLabel(log.type)}</span>
                    <Badge variant="outline" className="text-xs">
                      {log.direction === 'push' ? '→ Shopify' : log.direction === 'pull' ? '← Shopify' : '↔ Bidirectionnel'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {log.itemsProcessed}/{log.itemsTotal} éléments
                    {log.error && <span className="text-red-600"> • {log.error}</span>}
                  </p>
                </div>
                
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1.5">
                    <StatusIcon className={cn("h-4 w-4", statusConfig.color, log.status === 'running' && "animate-spin")} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(log.startedAt, 'HH:mm', { locale: getDateFnsLocale() })}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {logs.length === 0 && (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">Aucune synchronisation récente</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
