/**
 * Smart Inventory Command Center
 * Forecasting → Auto-Reorder → Supplier Analysis
 */
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Zap, Award, Brain } from 'lucide-react';
import { DemandForecastDashboard } from '@/components/inventory/DemandForecastDashboard';
import { SmartReorderConfig } from '@/components/inventory/SmartReorderConfig';
import { SupplierAnalysisDashboard } from '@/components/inventory/SupplierAnalysisDashboard';

export default function SmartInventoryCommandCenter() {
  return (
    <>
      <Helmet>
        <title>Inventaire Intelligent | Drop-Craft AI</title>
        <meta name="description" content="Prévisions de demande, réapprovisionnement automatique intelligent et analyse fournisseurs." />
      </Helmet>

      <ChannablePageWrapper
        title="Inventaire Intelligent"
        description="Prévisions IA → Auto-reorder prédictif → Scoring fournisseurs"
        heroImage="stock"
        badge={{ label: 'Smart Inventory', icon: Brain }}
      >
        <Tabs defaultValue="forecast" className="space-y-6">
          <TabsList>
            <TabsTrigger value="forecast" className="gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Prévisions
            </TabsTrigger>
            <TabsTrigger value="reorder" className="gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              Auto-Reorder
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="gap-1.5">
              <Award className="h-3.5 w-3.5" />
              Fournisseurs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="forecast">
            <DemandForecastDashboard />
          </TabsContent>

          <TabsContent value="reorder">
            <SmartReorderConfig />
          </TabsContent>

          <TabsContent value="suppliers">
            <SupplierAnalysisDashboard />
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
