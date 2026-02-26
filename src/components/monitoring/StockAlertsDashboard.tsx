import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  CheckCircle, 
  Package, 
  RefreshCw,
  Bell,
  XCircle,
  Loader2
} from 'lucide-react'
import { useStockAlerts, StockAlert } from '@/hooks/useStockAlerts'
import { PageLoading } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDistanceToNow } from 'date-fns'
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale'

const SEVERITY_CONFIG = {
  low: { label: 'Faible', variant: 'outline' as const, color: 'text-blue-600' },
  medium: { label: 'Moyenne', variant: 'secondary' as const, color: 'text-yellow-600' },
  high: { label: 'Haute', variant: 'default' as const, color: 'text-orange-600' },
  critical: { label: 'Critique', variant: 'destructive' as const, color: 'text-red-600' }
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  low_stock: 'Stock bas',
  out_of_stock: 'Rupture de stock',
  overstock: 'Surstock',
  reorder_point: 'Point de réapprovisionnement',
  expiring: 'Expiration proche'
}

export function StockAlertsDashboard() {
  const locale = useDateFnsLocale()
  const { alerts, stats, isLoading, refetch, resolveAlert, dismissAlert, isResolving } = useStockAlerts()

  if (isLoading) {
    return <PageLoading text="Chargement des alertes..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Alertes Stock</h2>
          <p className="text-muted-foreground">Surveillez vos niveaux de stock en temps réel</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non résolues</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unresolved}</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critiques</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ruptures</CardTitle>
            <XCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.outOfStock}</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock bas</CardTitle>
            <Package className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      {alerts.filter(a => !a.is_resolved).length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={CheckCircle}
              title="Aucune alerte"
              description="Tout est en ordre ! Aucune alerte de stock à traiter."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts
            .filter(a => !a.is_resolved)
            .sort((a, b) => {
              const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
              return (severityOrder[a.severity as keyof typeof severityOrder] || 3) - 
                     (severityOrder[b.severity as keyof typeof severityOrder] || 3)
            })
            .map((alert) => (
              <AlertCard 
                key={alert.id} 
                alert={alert}
                onResolve={() => resolveAlert(alert.id)}
                onDismiss={() => dismissAlert(alert.id)}
                isResolving={isResolving}
              />
            ))}
        </div>
      )}

      {/* Resolved alerts */}
      {alerts.filter(a => a.is_resolved).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-muted-foreground">
            Alertes résolues ({alerts.filter(a => a.is_resolved).length})
          </h3>
          <div className="space-y-2 opacity-60">
            {alerts
              .filter(a => a.is_resolved)
              .slice(0, 5)
              .map((alert) => (
                <AlertCard 
                  key={alert.id} 
                  alert={alert}
                  onResolve={() => {}}
                  onDismiss={() => dismissAlert(alert.id)}
                  isResolving={false}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AlertCard({ 
  alert, 
  onResolve, 
  onDismiss,
  isResolving 
}: { 
  alert: StockAlert
  onResolve: () => void
  onDismiss: () => void
  isResolving: boolean
}) {
  const locale = useDateFnsLocale()
  const severityConfig = SEVERITY_CONFIG[alert.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.medium

  return (
    <Card className={`${alert.is_resolved ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
              alert.severity === 'critical' ? 'bg-red-100 dark:bg-red-950' :
              alert.severity === 'high' ? 'bg-orange-100 dark:bg-orange-950' :
              alert.severity === 'medium' ? 'bg-yellow-100 dark:bg-yellow-950' :
              'bg-blue-100 dark:bg-blue-950'
            }`}>
              <AlertTriangle className={`h-5 w-5 ${severityConfig.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{alert.message}</span>
                <Badge variant={severityConfig.variant}>{severityConfig.label}</Badge>
                <Badge variant="outline">
                  {ALERT_TYPE_LABELS[alert.alert_type] || alert.alert_type}
                </Badge>
                {alert.is_resolved && (
                  <Badge variant="secondary">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Résolu
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Stock actuel: {alert.current_value} / Seuil: {alert.threshold_value} • 
                {' '}
                {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale })}
              </p>
            </div>
          </div>

          {!alert.is_resolved && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onDismiss}>
                Ignorer
              </Button>
              <Button size="sm" onClick={onResolve} disabled={isResolving}>
                {isResolving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Résoudre
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
