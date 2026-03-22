/**
 * CRM Hub — Page unifiée CRM avancé
 * Pipeline Kanban, Leads, Scoring, Timeline activités, Funnel analytics
 */
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { CRMKanbanPipeline } from '@/components/crm/CRMKanbanPipeline';
import { LeadsManager } from '@/components/crm/LeadsManager';
import { LeadScoring } from '@/components/crm/LeadScoring';
import { CRMActivityTimeline } from '@/components/crm/CRMActivityTimeline';
import { CRMConversionFunnel } from '@/components/crm/CRMConversionFunnel';
import {
  Kanban, Users, Target, BarChart3, Clock, Star
} from 'lucide-react';

export default function CRMHubPage() {
  const [activeTab, setActiveTab] = useState('pipeline');

    const { t: tPages } = useTranslation('pages');


  return (
    <ChannablePageWrapper
      title={tPages('crmAvance.title')}
      subtitle="Relation Client"
      description="Pipeline de ventes, scoring leads, historique interactions et analytics de conversion."
      heroImage="marketing"
      badge={{ label: 'Pro', icon: Star }}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="pipeline" className="gap-2">
            <Kanban className="h-4 w-4" />
            <span className="hidden sm:inline">Pipeline</span>
          </TabsTrigger>
          <TabsTrigger value="leads" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Leads</span>
          </TabsTrigger>
          <TabsTrigger value="scoring" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Scoring</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Activités</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-6 mt-6">
          <CRMKanbanPipeline />
        </TabsContent>

        <TabsContent value="leads" className="space-y-6 mt-6">
          <LeadsManager />
        </TabsContent>

        <TabsContent value="scoring" className="space-y-6 mt-6">
          <LeadScoring />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6 mt-6">
          <CRMActivityTimeline />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-6">
          <CRMConversionFunnel />
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
