/**
 * Dashboard Header Component
 * Titre et sous-titre avec indicateur de temps réel
 */

import { Badge } from '@/components/ui/badge'
import { Activity, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DashboardHeaderProps {
  isLive?: boolean
  isRefreshing?: boolean
  onRefresh?: () => void
  lastUpdate?: Date
}

export function DashboardHeader({ 
  isLive = true, 
  isRefreshing = false,
  onRefresh,
  lastUpdate 
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Tableau de bord</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Vue d'ensemble de votre activité
          {lastUpdate && (
            <span className="ml-2 text-xs opacity-60">
              · Mis à jour à {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
        )}
        
        <Badge 
          variant="outline" 
          className={cn(
            "text-xs gap-1.5 px-2 py-1",
            isLive ? "bg-green-500/10 text-green-700 border-green-500/50 dark:text-green-400" 
                   : "bg-muted text-muted-foreground"
          )}
        >
          <Activity className={cn("h-3 w-3", isLive && "animate-pulse")} />
          {isLive ? 'LIVE' : 'Offline'}
        </Badge>
      </div>
    </div>
  )
}
