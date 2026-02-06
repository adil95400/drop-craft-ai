/**
 * PriceMonitorPage - Moniteur de prix et stock dédié
 * Surveillance en temps réel des prix fournisseurs
 */
import { useState } from 'react'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { FeatureGuide, FEATURE_GUIDES } from '@/components/guide/FeatureGuide'
import { usePriceStockMonitor } from '@/hooks/usePriceStockMonitor'
import {
  TrendingUp, TrendingDown, AlertTriangle, RefreshCw, Plus,
  Bell, Activity, BarChart3, Package, DollarSign, CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PriceMonitorPage() {
  const {
    monitors, monitorsLoading, alerts, alertsLoading,
    checkAll, isChecking
  } = usePriceStockMonitor()

  const activeMonitors = monitors?.filter((m: any) => m.is_active)?.length || 0
  const totalMonitors = monitors?.length || 0
  const unresolvedAlerts = alerts?.filter((a: any) => a.status !== 'resolved')?.length || 0

  return (
    <ChannablePageWrapper
      title="Moniteur Prix & Stock"
      subtitle="Surveillance"
      description="Surveillez les prix et stocks de vos fournisseurs en temps réel"
      heroImage="stock"
      badge={{ label: `${activeMonitors} actifs`, variant: 'secondary' }}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => checkAll()} disabled={isChecking}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isChecking && "animate-spin")} />
            {isChecking ? 'Vérification...' : 'Vérifier tout'}
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un moniteur
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Guide intégré */}
        <FeatureGuide {...FEATURE_GUIDES.priceMonitor} defaultOpen />

        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalMonitors}</p>
                <p className="text-sm text-muted-foreground">Moniteurs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-500">{activeMonitors}</p>
                <p className="text-sm text-muted-foreground">Actifs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Bell className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-500">{unresolvedAlerts}</p>
                <p className="text-sm text-muted-foreground">Alertes actives</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">24h</p>
                <p className="text-sm text-muted-foreground">Dernière synchro</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des moniteurs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Produits surveillés
            </CardTitle>
            <CardDescription>
              {totalMonitors === 0
                ? 'Ajoutez des produits pour commencer la surveillance'
                : `${totalMonitors} produits surveillés, ${activeMonitors} actifs`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monitorsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : totalMonitors === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Aucun moniteur configuré</h3>
                <p className="text-muted-foreground mb-4">
                  Commencez par ajouter des produits à surveiller pour être alerté des changements de prix
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un moniteur
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {monitors?.map((monitor: any) => (
                  <div
                    key={monitor.id}
                    className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2.5 rounded-xl",
                        monitor.is_active ? "bg-emerald-500/10" : "bg-muted"
                      )}>
                        <Activity className={cn(
                          "h-5 w-5",
                          monitor.is_active ? "text-emerald-500" : "text-muted-foreground"
                        )} />
                      </div>
                      <div>
                        <p className="font-medium">{monitor.product_id || 'Produit'}</p>
                        <p className="text-sm text-muted-foreground">
                          Seuil : {monitor.alert_threshold}% • {monitor.is_active ? 'Actif' : 'Inactif'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={monitor.is_active ? 'default' : 'secondary'}>
                      {monitor.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alertes récentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Alertes récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : !alerts?.length ? (
              <div className="text-center py-8">
                <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                <p className="text-muted-foreground">Aucune alerte — tout est stable</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 10).map((alert: any) => (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      alert.severity === 'critical' && "border-red-500/30 bg-red-500/5",
                      alert.severity === 'warning' && "border-amber-500/30 bg-amber-500/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {alert.severity === 'critical' ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-amber-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">{alert.message}</p>
                      </div>
                    </div>
                    <Badge variant={alert.status === 'resolved' ? 'secondary' : 'destructive'}>
                      {alert.status === 'resolved' ? 'Résolu' : 'Actif'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ChannablePageWrapper>
  )
}
