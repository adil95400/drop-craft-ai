import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStockSync } from '@/hooks/useStockSync';
import { usePricingRules } from '@/hooks/usePricingRules';
import { RefreshCw, AlertTriangle, DollarSign, TrendingUp, Settings, History, Zap } from 'lucide-react';
import { StockSyncConfigurator } from '@/components/stock/StockSyncConfigurator';
import { PricingRulesManager } from '@/components/stock/PricingRulesManager';
import { PriceHistoryView } from '@/components/stock/PriceHistoryView';
import { StockAlertsPanel } from '@/components/stock/StockAlertsPanel';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';

export default function StockRepricingHub() {
  const stockSync = useStockSync();
  const pricingRules = usePricingRules();

  return (
    <>
      <Helmet>
        <title>Stock Live & Repricing - ShopOpti</title>
        <meta name="description" content="Synchronisation stock temps réel et repricing automatique intelligent pour optimiser vos marges" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <AdvancedFeatureGuide {...ADVANCED_GUIDES.stockRepricing} />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <TrendingUp className="h-10 w-10 text-primary" />
              Stock Live & Repricing
            </h1>
            <p className="text-xl text-muted-foreground mt-2">
              Synchronisation temps réel et optimisation automatique des prix
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => stockSync.syncAll()}
              disabled={stockSync.isSyncingAll}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${stockSync.isSyncingAll ? 'animate-spin' : ''}`} />
              Sync Stock
            </Button>
            <Button
              onClick={() => pricingRules.applyAllRules()}
              disabled={pricingRules.isApplying}
            >
              <Zap className="h-4 w-4 mr-2" />
              Appliquer Pricing
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sync Configs</p>
                  <p className="text-3xl font-bold">{stockSync.stats.totalConfigs}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stockSync.stats.activeConfigs} actifs
                  </p>
                </div>
                <RefreshCw className="h-12 w-12 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Règles Pricing</p>
                  <p className="text-3xl font-bold">{pricingRules.stats.totalRules}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {pricingRules.stats.activeRules} actives
                  </p>
                </div>
                <DollarSign className="h-12 w-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Alertes Actives</p>
                  <p className="text-3xl font-bold text-orange-600">{stockSync.stats.activeAlerts}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stockSync.stats.criticalAlerts} critiques
                  </p>
                </div>
                <AlertTriangle className="h-12 w-12 text-orange-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Changements 24h</p>
                  <p className="text-3xl font-bold">{stockSync.stats.recentChanges}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    stock + prix
                  </p>
                </div>
                <History className="h-12 w-12 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="alerts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Alertes
            </TabsTrigger>
            <TabsTrigger value="sync" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Config Sync
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Règles Pricing
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Historique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alerts">
            <StockAlertsPanel />
          </TabsContent>

          <TabsContent value="sync">
            <StockSyncConfigurator 
              configs={stockSync.configs}
              upsertConfig={stockSync.upsertConfig}
              syncSupplier={stockSync.syncSupplier}
            />
          </TabsContent>

          <TabsContent value="pricing">
            <PricingRulesManager
              rules={pricingRules.rules}
              createRule={pricingRules.createRule}
              updateRule={pricingRules.updateRule}
              deleteRule={pricingRules.deleteRule}
              applyRule={pricingRules.applyRule}
              previewRule={pricingRules.previewRule}
            />
          </TabsContent>

          <TabsContent value="history">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Historique Stock</CardTitle>
                  <CardDescription>Dernières modifications de stock</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stockSync.stockHistory.slice(0, 20).map((change: any) => (
                      <div key={change.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Produit #{change.product_id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">{change.change_reason}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold">
                            {change.previous_quantity} → {change.new_quantity}
                          </p>
                          <Badge variant={change.change_amount > 0 ? 'default' : 'secondary'}>
                            {change.change_amount > 0 ? '+' : ''}{change.change_amount}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <PriceHistoryView priceHistory={pricingRules.priceHistory} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
