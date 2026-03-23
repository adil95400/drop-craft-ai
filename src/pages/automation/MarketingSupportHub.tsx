/**
 * Marketing & Support Automation Hub
 * Unified dashboard for cart recovery, upsell/cross-sell automation, and AI support
 */
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, TrendingUp, Headphones, BarChart3 } from 'lucide-react';
import { CartRecoveryAutomation } from '@/components/automation/marketing/CartRecoveryAutomation';
import { UpsellAutomationEngine } from '@/components/automation/marketing/UpsellAutomationEngine';
import { AISupportCenter } from '@/components/automation/marketing/AISupportCenter';
import { MarketingSupportOverview } from '@/components/automation/marketing/MarketingSupportOverview';

export default function MarketingSupportHub() {
  return (
    <>
      <Helmet>
        <title>Marketing & Support Automation</title>
      </Helmet>
      <ChannablePageWrapper
        title="Marketing & Support Automation"
        description="Automatisez vos relances, upsells et support client pour maximiser la conversion et la satisfaction"
        heroImage="marketing"
      >
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="cart-recovery" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Paniers abandonnés
            </TabsTrigger>
            <TabsTrigger value="upsell" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Upsell / Cross-sell
            </TabsTrigger>
            <TabsTrigger value="ai-support" className="flex items-center gap-2">
              <Headphones className="h-4 w-4" />
              Support IA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <MarketingSupportOverview />
          </TabsContent>
          <TabsContent value="cart-recovery">
            <CartRecoveryAutomation />
          </TabsContent>
          <TabsContent value="upsell">
            <UpsellAutomationEngine />
          </TabsContent>
          <TabsContent value="ai-support">
            <AISupportCenter />
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
