import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Activity, 
  Download, 
  Star, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  Package
} from 'lucide-react'
import { useExtensionActionLogs, type ExtensionActionLog } from '@/hooks/useExtensionActionLogs'
import { formatDistanceToNow } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'

const ACTION_ICONS: Record<string, React.ReactNode> = {
  'IMPORT_PRODUCT': <Download className="h-4 w-4" />,
  'IMPORT_BULK': <Package className="h-4 w-4" />,
  'AI_OPTIMIZE_TITLE': <Star className="h-4 w-4" />,
  'AI_OPTIMIZE_DESCRIPTION': <Star className="h-4 w-4" />,
  'AI_OPTIMIZE_FULL': <Star className="h-4 w-4" />,
  'SYNC_STOCK': <RefreshCw className="h-4 w-4" />,
  'SYNC_PRICE': <TrendingUp className="h-4 w-4" />,
  'SCRAPE_URL': <Activity className="h-4 w-4" />,
}

const ACTION_LABELS: Record<string, string> = {
  'IMPORT_PRODUCT': 'Import Produit',
  'IMPORT_BULK': 'Import Groupé',
  'AI_OPTIMIZE_TITLE': 'Optimisation Titre IA',
  'AI_OPTIMIZE_DESCRIPTION': 'Optimisation Description IA',
  'AI_OPTIMIZE_FULL': 'Optimisation Complète IA',
  'SYNC_STOCK': 'Sync Stock',
  'SYNC_PRICE': 'Sync Prix',
  'SCRAPE_URL': 'Analyse URL',
  'AUTH_HEARTBEAT': 'Heartbeat',
  'CHECK_VERSION': 'Version Check',
  'GET_SETTINGS': 'Récup. Paramètres',
}

const STATUS_STYLES: Record<string, { icon: React.ReactNode; className: string }> = {
  'success': { 
    icon: <CheckCircle2 className="h-3 w-3" />, 
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
  },
  'error': { 
    icon: <AlertCircle className="h-3 w-3" />, 
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
  },
  'pending': { 
    icon: <Clock className="h-3 w-3" />, 
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' 
  },
}

function LogItem({ log }: { log: ExtensionActionLog }) {
  const statusStyle = STATUS_STYLES[log.action_status] || STATUS_STYLES['pending']
  const actionIcon = ACTION_ICONS[log.action_type] || <Activity className="h-4 w-4" />
  const actionLabel = ACTION_LABELS[log.action_type] || log.action_type

  const handleOpenDeepLink = () => {
    if (log.product_id) {
      window.open(`/products?id=${log.product_id}`, '_blank')
    } else if (log.product_url) {
      window.open(log.product_url, '_blank')
    }
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        {actionIcon}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{actionLabel}</span>
          <Badge 
            variant="secondary" 
            className={`text-xs px-1.5 py-0 ${statusStyle.className}`}
          >
            {statusStyle.icon}
            <span className="ml-1 capitalize">{log.action_status}</span>
          </Badge>
        </div>
        
        {log.product_title && (
          <p className="text-sm text-muted-foreground truncate">
            {log.product_title}
          </p>
        )}
        
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          {log.platform && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              {log.platform}
            </Badge>
          )}
          {log.extension_version && (
            <span>v{log.extension_version}</span>
          )}
          <span>•</span>
          <span>
            {formatDistanceToNow(new Date(log.created_at), { 
              addSuffix: true, 
              locale: getDateFnsLocale() 
            })}
          </span>
        </div>
      </div>

      {(log.product_id || log.product_url) && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex-shrink-0"
          onClick={handleOpenDeepLink}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ExtensionActivityLog() {
  const { logs, isLoading, stats, refresh } = useExtensionActionLogs({ limit: 50 })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Historique Extension
          </CardTitle>
          <CardDescription>
            Actions effectuées depuis l'extension Chrome
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </CardHeader>
      
      <CardContent>
        {/* Stats summary */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <div className="text-lg font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
            <div className="text-lg font-bold text-green-600">{stats.success}</div>
            <div className="text-xs text-muted-foreground">Succès</div>
          </div>
          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-center">
            <div className="text-lg font-bold text-red-600">{stats.errors}</div>
            <div className="text-xs text-muted-foreground">Erreurs</div>
          </div>
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
            <div className="text-lg font-bold text-blue-600">
              {Object.keys(stats.byPlatform).length}
            </div>
            <div className="text-xs text-muted-foreground">Plateformes</div>
          </div>
        </div>

        {/* Logs list */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <LoadingSkeleton />
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-center">Aucune activité de l'extension</p>
              <p className="text-sm text-center mt-1">
                Les imports et actions apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map(log => (
                <LogItem key={log.id} log={log} />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
