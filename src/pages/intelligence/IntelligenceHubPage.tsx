import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { DemandForecastDashboard } from '@/components/intelligence/DemandForecastDashboard';
import { OpportunityDashboard } from '@/components/intelligence/OpportunityDashboard';
import { SupplierScoringDashboard } from '@/components/intelligence/SupplierScoringDashboard';
import { SmartAlertsDashboard } from '@/components/intelligence/SmartAlertsDashboard';
import { Brain, Sparkles, Shield, Bell } from 'lucide-react';

export default function IntelligenceHubPage() {
  return (
    <ChannablePageWrapper
      title="Intelligence Hub"
      description="Analyses prédictives, scoring fournisseur et détection d'opportunités"
      heroImage="ai"
      badge={{ label: 'P2 Intelligence', icon: Brain }}
    >
      <Tabs defaultValue="opportunities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="opportunities" className="gap-1"><Sparkles className="h-4 w-4" />Opportunités</TabsTrigger>
          <TabsTrigger value="forecasts" className="gap-1"><Brain className="h-4 w-4" />Prévisions</TabsTrigger>
          <TabsTrigger value="scoring" className="gap-1"><Shield className="h-4 w-4" />Scoring</TabsTrigger>
          <TabsTrigger value="alerts" className="gap-1"><Bell className="h-4 w-4" />Alertes</TabsTrigger>
        </TabsList>
        <TabsContent value="opportunities"><OpportunityDashboard /></TabsContent>
        <TabsContent value="forecasts"><DemandForecastDashboard /></TabsContent>
        <TabsContent value="scoring"><SupplierScoringDashboard /></TabsContent>
        <TabsContent value="alerts"><SmartAlertsDashboard /></TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
