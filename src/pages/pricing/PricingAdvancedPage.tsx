import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductPnLDashboard } from '@/components/pricing/ProductPnLDashboard';
import { BulkPricingOptimizer } from '@/components/pricing/BulkPricingOptimizer';
import { AutoApplyConfidenceSettings } from '@/components/pricing/AutoApplyConfidenceSettings';
import { BarChart3, Layers, Brain } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

export default function PricingAdvancedPage() {
  const { t } = useTranslation('pages');

  return (
    <>
      <Helmet>
        <title>Moteur de Tarification Avancé | Drop-Craft AI</title>
        <meta name="description" content="P&L produit, optimisation en masse et auto-apply IA avec seuils de confiance." />
      </Helmet>

      <ChannablePageWrapper
        title="Moteur de Tarification Avancé"
        description="P&L granulaire, optimisation groupée et recommandations IA auto-apply"
        heroImage="analytics"
        badge={{ label: 'Pro', icon: Brain }}
      >
        <Tabs defaultValue="pnl" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pnl" className="gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              P&L Produit
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              Optimisation Masse
            </TabsTrigger>
            <TabsTrigger value="autoApply" className="gap-1.5">
              <Brain className="h-3.5 w-3.5" />
              Auto-Apply IA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pnl">
            <ProductPnLDashboard />
          </TabsContent>

          <TabsContent value="bulk">
            <BulkPricingOptimizer />
          </TabsContent>

          <TabsContent value="autoApply">
            <AutoApplyConfidenceSettings />
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
