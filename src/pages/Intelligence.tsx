import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { 
  StockPredictionsPanel, 
  StockAlertsPanel,
  PriceOptimizationPanel,
  ABTestingPanel 
} from '@/components/intelligence';
import { Brain, Package, Sparkles, FlaskConical, Bell } from 'lucide-react';

export default function IntelligencePage() {
  return (
    <>
      <Helmet>
        <title>Intelligence Dropshipping - Prédictions & Optimisation</title>
        <meta name="description" content="Prédictions de stock et optimisation automatique des marges avec l'IA" />
      </Helmet>

      <ChannablePageWrapper
        title="Intelligence Dropshipping"
        subtitle="IA Prédictive"
        description="Prédictions de stock et optimisation automatique des marges"
        heroImage="ai"
        badge={{ label: 'IA Avancée', icon: Brain }}
      >
        <Tabs defaultValue="stock" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="stock" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Prédictions</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alertes</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Prix</span>
            </TabsTrigger>
            <TabsTrigger value="ab-tests" className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              <span className="hidden sm:inline">A/B Tests</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stock">
            <StockPredictionsPanel />
          </TabsContent>

          <TabsContent value="alerts">
            <StockAlertsPanel />
          </TabsContent>

          <TabsContent value="pricing">
            <PriceOptimizationPanel />
          </TabsContent>

          <TabsContent value="ab-tests">
            <ABTestingPanel />
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
