/**
 * Sprint 17: BI Advanced Dashboard Page
 * Cohort analysis, smart alerts, automated reports
 */
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CohortAnalysis } from '@/components/analytics/CohortAnalysis';
import { SmartAlertsEngine } from '@/components/analytics/SmartAlertsEngine';
import { AutomatedReportGenerator } from '@/components/analytics/AutomatedReportGenerator';
import { BarChart3, Users, Bell, FileText } from 'lucide-react';

export default function BIAdvancedDashboardPage() {
  return (
    <>
      <Helmet>
        <title>Business Intelligence Avancé | ShopOpti</title>
        <meta name="description" content="Dashboards prédictifs, analyse de cohortes et alertes intelligentes" />
      </Helmet>

      <ChannablePageWrapper
        title="Business Intelligence Avancé"
        description="Cohortes, alertes intelligentes et rapports automatisés"
        heroImage="analytics"
        badge={{ label: 'BI Pro', icon: BarChart3 }}
      >
        <Tabs defaultValue="cohorts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="cohorts" className="flex items-center gap-1.5">
              <Users className="h-4 w-4" /> Cohortes
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-1.5">
              <Bell className="h-4 w-4" /> Alertes
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" /> Rapports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cohorts">
            <CohortAnalysis />
          </TabsContent>

          <TabsContent value="alerts">
            <SmartAlertsEngine />
          </TabsContent>

          <TabsContent value="reports">
            <AutomatedReportGenerator />
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
