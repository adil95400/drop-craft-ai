import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDynamicRepricing } from '@/hooks/useMarketplacePhase2';
import { TrendingUp, Target, Zap, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DynamicRepricingPage() {
  const userId = 'current-user-id'; // TODO: Get from auth context
  const { dashboard, isLoadingDashboard, executeRepricing, isRepricingExecuting } = useDynamicRepricing(userId);

  return (
    <>
      <Helmet>
        <title>Repricing Dynamique - ShopOpti</title>
        <meta name="description" content="Optimisez vos prix automatiquement avec notre moteur de repricing intelligent" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            📊 Repricing Dynamique
          </h1>
          <p className="text-xl text-muted-foreground">
            Optimisez vos prix automatiquement en fonction de la concurrence et des marges
          </p>
        </div>

        {/* KPIs Dashboard */}
        {dashboard && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Règles Actives</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.active_rules}</div>
                <p className="text-xs text-muted-foreground">
                  Automatisation en cours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produits Monitorés</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.products_monitored}</div>
                <p className="text-xs text-muted-foreground">
                  Surveillance continue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Repricing Aujourd'hui</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.repricing_executions_today}</div>
                <p className="text-xs text-muted-foreground">
                  Modifications automatiques
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Impact Marge</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboard.avg_margin_change > 0 ? '+' : ''}{dashboard.avg_margin_change.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Changement moyen
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="rules">Règles de repricing</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="buybox">Performance Buy Box</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Changements Récents</CardTitle>
                <CardDescription>Dernières modifications de prix automatiques</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDashboard ? (
                  <div className="text-center py-8 text-muted-foreground">Chargement...</div>
                ) : dashboard?.recent_changes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun changement récent
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboard?.recent_changes.map((change, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b pb-4 last:border-0">
                        <div>
                          <p className="font-medium">{change.product_name}</p>
                          <p className="text-sm text-muted-foreground">{change.marketplace}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="line-through text-muted-foreground">{change.old_price}€</span>
                            <span className="font-bold text-primary">{change.new_price}€</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Marge: {change.margin_impact > 0 ? '+' : ''}{change.margin_impact.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules">
            <Card>
              <CardHeader>
                <CardTitle>Règles de Repricing</CardTitle>
                <CardDescription>Configurez vos stratégies de prix automatiques</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Interface de configuration des règles à venir
                </div>
                <Button className="w-full" onClick={() => {}}>
                  Créer une nouvelle règle
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Historique des Exécutions</CardTitle>
                <CardDescription>Toutes les modifications de prix</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Historique complet à venir
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="buybox">
            <Card>
              <CardHeader>
                <CardTitle>Performance Buy Box</CardTitle>
                <CardDescription>Votre position sur chaque marketplace</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboard?.buybox_performance.map((perf, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b pb-4 mb-4 last:border-0">
                    <div>
                      <p className="font-medium">{perf.marketplace}</p>
                      <p className="text-sm text-muted-foreground">
                        Position moyenne: {perf.avg_position.toFixed(1)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{perf.buybox_win_rate.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">
                        {perf.products_in_buybox} produits en Buy Box
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
