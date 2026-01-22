import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Bot, Zap, PlayCircle, CheckCircle2, Target, RefreshCw, Users, Tag, Loader2 } from 'lucide-react'
import { useMarketingStoreSync } from '@/hooks/useMarketingStoreSync'
import { Skeleton } from '@/components/ui/skeleton'

export function AutomatedMarketingSync() {
  const {
    stats,
    isLoadingStats,
    rules,
    isLoadingRules,
    syncCoupons,
    isSyncingCoupons,
    importCustomers,
    isImportingCustomers,
    toggleRule,
    isTogglingRule
  } = useMarketingStoreSync()

  const handleToggleRule = (ruleId: string, currentState: boolean) => {
    toggleRule({ ruleId, isActive: !currentState })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            Automatisation Marketing IA
          </h2>
          <p className="text-muted-foreground">
            Synchronisez vos promotions et clients avec vos boutiques connectées
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => importCustomers()}
            disabled={isImportingCustomers}
          >
            {isImportingCustomers ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Users className="h-4 w-4 mr-2" />
            )}
            Importer Clients
          </Button>
          <Button 
            onClick={() => syncCoupons()}
            disabled={isSyncingCoupons}
          >
            {isSyncingCoupons ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Tag className="h-4 w-4 mr-2" />
            )}
            Sync Coupons
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Règles Actives</p>
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-green-600">{stats?.active_rules || 0}</p>
                )}
              </div>
              <PlayCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Exécutions</p>
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{(stats?.total_executions || 0).toLocaleString()}</p>
                )}
              </div>
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Succès</p>
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-14 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-green-600">{stats?.success_rate || 0}%</p>
                )}
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Économies</p>
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-primary">€{(stats?.estimated_savings || 0).toLocaleString()}</p>
                )}
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Règles d'Automatisation
            </CardTitle>
            <CardDescription>
              {stats?.connected_platforms || 0} boutiques connectées
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRules ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : rules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune règle d'automatisation configurée</p>
                <p className="text-sm">Les règles seront créées automatiquement lors de vos actions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{rule.name}</h4>
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {rule.trigger_type}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {rule.trigger_count} exécutions
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch 
                          checked={rule.is_active} 
                          onCheckedChange={() => handleToggleRule(rule.id, rule.is_active)}
                          disabled={isTogglingRule}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Syncs Récents</CardTitle>
            <CardDescription>
              Dernières synchronisations avec vos boutiques
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !stats?.recent_syncs?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune synchronisation récente</p>
                <p className="text-sm">Cliquez sur "Sync Coupons" pour démarrer</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recent_syncs.slice(0, 10).map((sync: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{sync.sync_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sync.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <Badge variant={sync.status === 'success' ? 'default' : 'destructive'}>
                      {sync.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
