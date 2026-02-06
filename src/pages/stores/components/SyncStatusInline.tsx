import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, RefreshCw, AlertCircle, Package, Clock, Loader2, RotateCcw } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { shopOptiApi } from '@/services/api/ShopOptiApiClient'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface SyncStatusInlineProps {
  integrationId: string
  lastSyncAt?: string | null
  syncStatus?: string | null
  storeConfig?: {
    sync_in_progress?: boolean
    last_products_synced?: number
    sync_error?: string
  } | null
  onSync: () => void
  isSyncing: boolean
}

export function SyncStatusInline({
  integrationId,
  lastSyncAt,
  syncStatus,
  storeConfig,
  onSync,
  isSyncing
}: SyncStatusInlineProps) {
  const [localSyncStatus, setLocalSyncStatus] = useState(syncStatus)
  const [localConfig, setLocalConfig] = useState(storeConfig)
  const [productsCount, setProductsCount] = useState(storeConfig?.last_products_synced || 0)
  const [isResetting, setIsResetting] = useState(false)

  const handleResetSync = async () => {
    setIsResetting(true)
    try {
      const res = await shopOptiApi.request(`/sync/reset/${integrationId}`, { method: 'POST' })
      
      if (!res.success) throw new Error(res.error)
      
      setLocalConfig(prev => ({ ...prev, sync_in_progress: false }))
      setLocalSyncStatus('connected')
      toast.success('Statut de synchronisation réinitialisé')
    } catch (err) {
      console.error('Reset error:', err)
      toast.error('Erreur lors de la réinitialisation')
    } finally {
      setIsResetting(false)
    }
  }

  // Real-time subscription for sync updates
  useEffect(() => {
    const channel = supabase
      .channel(`sync-status-${integrationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'integrations',
          filter: `id=eq.${integrationId}`
        },
        (payload) => {
          const newData = payload.new as any
          setLocalSyncStatus(newData.sync_status)
          setLocalConfig(newData.store_config)
          setProductsCount(newData.store_config?.last_products_synced || 0)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [integrationId])

  const isInProgress = localConfig?.sync_in_progress || localSyncStatus === 'syncing' || isSyncing
  const hasError = localSyncStatus === 'error'
  const isComplete = localSyncStatus === 'synced' && !isInProgress

  const formatLastSync = (date: string | null | undefined) => {
    if (!date) return 'Jamais synchronisé'
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes < 1) return 'À l\'instant'
    if (minutes < 60) return `Il y a ${minutes} min`
    if (hours < 24) return `Il y a ${hours}h`
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isInProgress ? (
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          ) : hasError ? (
            <AlertCircle className="h-5 w-5 text-destructive" />
          ) : isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Clock className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="font-medium">
            {isInProgress ? 'Synchronisation en cours' : 
             hasError ? 'Erreur de synchronisation' :
             isComplete ? 'Synchronisé' : 'En attente'}
          </span>
        </div>
        
        <Badge 
          variant={isInProgress ? 'secondary' : hasError ? 'destructive' : isComplete ? 'default' : 'outline'}
          className={cn(
            isComplete && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          )}
        >
          {isInProgress ? 'En cours' : hasError ? 'Erreur' : isComplete ? 'Actif' : 'Inactif'}
        </Badge>
      </div>

      {/* Progress bar when syncing */}
      {isInProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Import des produits...</span>
            <span className="font-medium text-primary">{productsCount} produits</span>
          </div>
          <Progress value={productsCount > 0 ? Math.min((productsCount / 100) * 100, 95) : 10} className="h-2" />
        </div>
      )}

      {/* Error message */}
      {hasError && localConfig?.sync_error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-md p-2">
          {localConfig.sync_error}
        </div>
      )}

      {/* Stats when complete */}
      {isComplete && productsCount > 0 && (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{productsCount} produits</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatLastSync(lastSyncAt)}</span>
          </div>
        </div>
      )}

      {/* Sync buttons */}
      <div className="flex gap-2">
        <Button 
          onClick={onSync} 
          disabled={isInProgress || isResetting}
          className="flex-1"
          variant={isInProgress ? 'secondary' : 'default'}
        >
          {isInProgress ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sync en cours...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              {productsCount > 0 ? 'Resync' : 'Synchroniser'}
            </>
          )}
        </Button>
        
        {/* Reset button - shown when stuck */}
        {(isInProgress || localConfig?.sync_in_progress) && productsCount > 0 && (
          <Button 
            onClick={handleResetSync}
            disabled={isResetting}
            variant="outline"
            size="icon"
            title="Réinitialiser le statut (si bloqué)"
          >
            {isResetting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
