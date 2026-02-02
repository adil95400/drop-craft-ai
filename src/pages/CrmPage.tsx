/**
 * CRM Page Enterprise - Vue unifiée avec Pipeline, Leads et Scoring
 */
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, TrendingUp, Target, Kanban, Star } from "lucide-react";
import { ChannablePageWrapper } from "@/components/channable/ChannablePageWrapper";
import { CRMKanbanPipeline } from "@/components/crm/CRMKanbanPipeline";
import { LeadsManager } from "@/components/crm/LeadsManager";
import { LeadScoring } from "@/components/crm/LeadScoring";
import { SalesPipeline } from "@/components/crm/SalesPipeline";

export default function CrmPage() {
  const [activeTab, setActiveTab] = useState("pipeline");

  return (
    <ChannablePageWrapper
      title="CRM"
      subtitle="Relation Client"
      description="Gérez vos leads, deals et pipeline de ventes avec une vue enterprise complète"
      heroImage="marketing"
      badge={{ label: 'Pro', icon: Star }}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="pipeline" className="gap-2">
            <Kanban className="h-4 w-4" />
            <span className="hidden sm:inline">Pipeline Kanban</span>
            <span className="sm:hidden">Pipeline</span>
          </TabsTrigger>
          <TabsTrigger value="leads" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Leads</span>
            <span className="sm:hidden">Leads</span>
          </TabsTrigger>
          <TabsTrigger value="scoring" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Lead Scoring</span>
            <span className="sm:hidden">Scoring</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">Stats</span>
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

        <TabsContent value="analytics" className="space-y-6 mt-6">
          <SalesPipeline />
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
