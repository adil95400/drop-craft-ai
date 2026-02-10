import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStockSync } from '@/hooks/useStockSync';
import { usePricingRules } from '@/hooks/usePricingRules';
import { RefreshCw, AlertTriangle, DollarSign, TrendingUp, History, Zap } from 'lucide-react';
import { StockSyncConfigurator } from '@/components/stock/StockSyncConfigurator';
import { PricingRulesManager } from '@/components/stock/PricingRulesManager';
import { PriceHistoryView } from '@/components/stock/PriceHistoryView';
import { StockAlertsPanel } from '@/components/stock/StockAlertsPanel';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function StockRepricingHub() {
  const stockSync = useStockSync();
  const pricingRules = usePricingRules();

  return (
    <>
      <Helmet>
        <title>Stock Live & Repricing - ShopOpti</title>
        <meta name="description" content="Synchronisation stock temps réel et repricing automatique intelligent pour optimiser vos marges" />
      </Helmet>

      <ChannablePageWrapper
        title="Stock Live & Repricing"
        description={`${stockSync.stats.totalConfigs} configs • ${pricingRules.stats.totalRules} règles pricing • ${stockSync.stats.activeAlerts} alertes`}
        heroImage="stock"
        badge={{ label: 'Temps Réel', icon: TrendingUp }}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => stockSync.syncAll()} disabled={stockSync.isSyncingAll} className="gap-2 bg-background/80 backdrop-blur">
              <RefreshCw className={`h-4 w-4 ${stockSync.isSyncingAll ? 'animate-spin' : ''}`} />
              Sync Stock
            </Button>
            <Button onClick={() => pricingRules.applyAllRules()} disabled={pricingRules.isApplying} className="gap-2">
              <Zap className="h-4 w-4" />
              Appliquer Pricing
            </Button>
          </div>
        }
      >
        <AdvancedFeatureGuide {...ADVANCED_GUIDES.stockRepricing} />

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
      </ChannablePageWrapper>
    </>
  );
}
