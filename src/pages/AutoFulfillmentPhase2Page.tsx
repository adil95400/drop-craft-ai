import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAutoFulfillment } from '@/hooks/useMarketplacePhase2';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Package, Truck, CheckCircle, Clock } from 'lucide-react';

export default function AutoFulfillmentPhase2Page() {
  const { user } = useUnifiedAuth();
  const userId = user?.id || '';
  const { stats, isLoadingStats } = useAutoFulfillment(userId);

  return (
    <>
      <Helmet>
        <title>Auto-Fulfillment Phase 2 - ShopOpti</title>
        <meta name="description" content="Automatisez vos expéditions et suivez vos commandes en temps réel" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            📦 Auto-Fulfillment Avancé
          </h1>
          <p className="text-xl text-muted-foreground">
            Automatisez vos expéditions et gérez vos transporteurs intelligemment
          </p>
        </div>

        {/* KPIs Dashboard */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expéditions</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_shipments}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.shipments_today} aujourd'hui
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Transit</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.in_transit}</div>
                <p className="text-xs text-muted-foreground">
                  En cours de livraison
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux de Réussite</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.delivery_success_rate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats.delivered_on_time} livrés à temps
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Délai Moyen</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avg_delivery_time_days.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                  jours de livraison
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="carriers">Transporteurs</TabsTrigger>
            <TabsTrigger value="automation">Règles d'automatisation</TabsTrigger>
            <TabsTrigger value="shipments">Expéditions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Performance par Transporteur</CardTitle>
                <CardDescription>Comparez vos différents transporteurs</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="text-center py-8 text-muted-foreground">Chargement...</div>
                ) : stats?.by_carrier.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun transporteur configuré
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats?.by_carrier.map((carrier, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b pb-4 last:border-0">
                        <div>
                          <p className="font-medium">{carrier.carrier_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {carrier.shipments} expéditions
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{carrier.on_time_rate.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">
                            Coût moyen: {carrier.avg_cost}€
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="carriers">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Transporteurs</CardTitle>
                <CardDescription>Configurez vos transporteurs et leurs tarifs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Interface de configuration des transporteurs à venir
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automation">
            <Card>
              <CardHeader>
                <CardTitle>Règles d'Automatisation</CardTitle>
                <CardDescription>Automatisez la sélection des transporteurs et l'envoi des étiquettes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Configuration des règles d'automatisation à venir
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipments">
            <Card>
              <CardHeader>
                <CardTitle>Liste des Expéditions</CardTitle>
                <CardDescription>Toutes vos expéditions en cours et passées</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Liste des expéditions à venir
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
