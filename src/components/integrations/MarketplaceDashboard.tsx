import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Store, Package, ShoppingCart, TrendingUp, 
  RefreshCw, Settings, AlertTriangle, CheckCircle2 
} from 'lucide-react';
import { MarketplaceConnectionCard, MARKETPLACE_CONFIGS } from './MarketplaceConnectionCard';
import { useMarketplaceConnectors, MarketplaceType } from '@/hooks/useMarketplaceConnectors';
import { useCrossMarketplaceSync } from '@/hooks/useCrossMarketplaceSync';

export function MarketplaceDashboard() {
  const { connections, isLoadingConnections } = useMarketplaceConnectors();
  const { syncProducts, isSyncing } = useCrossMarketplaceSync();

  const connectedCount = connections?.filter(c => c.status === 'connected').length || 0;
  const totalProducts = connections?.reduce((sum, c) => sum + (c.productCount || 0), 0) || 0;
  const totalOrders = connections?.reduce((sum, c) => sum + (c.orderCount || 0), 0) || 0;

  const handleSyncAll = () => {
    syncProducts({ syncType: 'all' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Connecteurs Marketplace</h2>
          <p className="text-muted-foreground">
            Gérez vos connexions Amazon, eBay, AliExpress et Cdiscount
          </p>
        </div>
        <Button onClick={handleSyncAll} disabled={isSyncing || connectedCount === 0}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          Synchroniser tout
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marketplaces</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedCount}</div>
            <p className="text-xs text-muted-foreground">
              sur {MARKETPLACE_CONFIGS.length} disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits listés</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              sur toutes les plateformes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              en attente de traitement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statut</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {connectedCount > 0 ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-lg font-semibold text-green-600">Opérationnel</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <span className="text-lg font-semibold text-yellow-600">Non configuré</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Marketplace Connections */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Toutes
            <Badge variant="secondary" className="ml-2">{MARKETPLACE_CONFIGS.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="connected">
            Connectées
            <Badge variant="secondary" className="ml-2">{connectedCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="available">
            Disponibles
            <Badge variant="secondary" className="ml-2">{MARKETPLACE_CONFIGS.length - connectedCount}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {MARKETPLACE_CONFIGS.map((config) => (
              <MarketplaceConnectionCard 
                key={config.id} 
                platform={config.id} 
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="connected" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {MARKETPLACE_CONFIGS
              .filter(config => connections?.some(c => c.platform === config.id && c.status === 'connected'))
              .map((config) => (
                <MarketplaceConnectionCard 
                  key={config.id} 
                  platform={config.id} 
                />
              ))}
            {connectedCount === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Store className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune marketplace connectée</p>
                <p className="text-sm">Connectez votre première marketplace pour commencer</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {MARKETPLACE_CONFIGS
              .filter(config => !connections?.some(c => c.platform === config.id && c.status === 'connected'))
              .map((config) => (
                <MarketplaceConnectionCard 
                  key={config.id} 
                  platform={config.id} 
                />
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      {connectedCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Gérez vos marketplaces connectées</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <Button variant="outline" className="justify-start">
                <Package className="w-4 h-4 mr-2" />
                Publier un produit
              </Button>
              <Button variant="outline" className="justify-start">
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync inventaire
              </Button>
              <Button variant="outline" className="justify-start">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Importer commandes
              </Button>
              <Button variant="outline" className="justify-start">
                <Settings className="w-4 h-4 mr-2" />
                Règles de prix
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
