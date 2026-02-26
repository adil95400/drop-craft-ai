import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react'
import { useAutoSync } from '@/hooks/useAutoSync'
import { formatDistanceToNow } from 'date-fns'
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale'

interface SyncStatusIndicatorProps {
  compact?: boolean
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ compact = false }) => {
  const locale = useDateFnsLocale()
  const { 
    enableAutoSync, 
    isSyncing, 
    lastSyncTime, 
    setAutoSync, 
    manualSync 
  } = useAutoSync()

  const handleManualSync = () => {
    manualSync(['imports', 'products', 'catalog'])
  }

  const toggleAutoSync = () => {
    setAutoSync(!enableAutoSync)
  }

  const getStatusColor = () => {
    if (isSyncing) return 'bg-blue-500'
    if (!enableAutoSync) return 'bg-gray-500'
    if (lastSyncTime && Date.now() - lastSyncTime < 2 * 60 * 1000) return 'bg-green-500'
    return 'bg-orange-500'
  }

  const getStatusIcon = () => {
    if (isSyncing) return <RefreshCw className="w-4 h-4 animate-spin" />
    if (!enableAutoSync) return <WifiOff className="w-4 h-4" />
    if (lastSyncTime && Date.now() - lastSyncTime < 2 * 60 * 1000) return <Check className="w-4 h-4" />
    return <AlertCircle className="w-4 h-4" />
  }

  const getStatusText = () => {
    if (isSyncing) return 'Synchronisation...'
    if (!enableAutoSync) return 'Sync désactivée'
    if (lastSyncTime && Date.now() - lastSyncTime < 2 * 60 * 1000) return 'À jour'
    if (lastSyncTime) return `Dernière sync: ${formatDistanceToNow(lastSyncTime, { locale, addSuffix: true })}`
    return 'Non synchronisé'
  }

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2"
              onClick={handleManualSync}
              disabled={isSyncing}
            >
              {getStatusIcon()}
              <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusColor()}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">{getStatusText()}</p>
              <p className="text-xs text-gray-500">
                Cliquer pour synchroniser
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white border rounded-lg shadow-sm">
      <div className="flex items-center gap-2">
        <div className={`p-1 rounded-full ${getStatusColor()}`}>
          {getStatusIcon()}
        </div>
        <div>
          <div className="font-medium text-sm">{getStatusText()}</div>
          <div className="text-xs text-gray-500">
            Synchronisation automatique {enableAutoSync ? 'activée' : 'désactivée'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAutoSync}
                className="p-2"
              >
                {enableAutoSync ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {enableAutoSync ? 'Désactiver la sync auto' : 'Activer la sync auto'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button
          variant="outline"
          size="sm"
          onClick={handleManualSync}
          disabled={isSyncing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          Synchroniser
        </Button>
      </div>
    </div>
  )
}