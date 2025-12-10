import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AutomationBuilder } from '@/components/automation/AutomationBuilder';
import { AutomationList } from '@/components/automation/AutomationList';
import { AdvancedWorkflowBuilder } from '@/components/automation/AdvancedWorkflowBuilder';
import { WorkflowTemplates } from '@/components/automation/WorkflowTemplates';
import { WorkflowExecutionLogs } from '@/components/automation/WorkflowExecutionLogs';
import { Zap, List, Activity, Workflow, LayoutTemplate } from 'lucide-react';

export default function AutomationPage() {
  const [activeTab, setActiveTab] = useState('visual');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Automatisations & Workflows
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground">
            Créez des workflows visuels avec conditions ET/OU, boucles et intégrations externes
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="w-full max-w-2xl grid grid-cols-5 h-auto">
            <TabsTrigger value="visual" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-1.5">
              <Workflow className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Éditeur Visuel</span>
              <span className="sm:hidden">Visuel</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-1.5">
              <List className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Mes Workflows</span>
              <span className="sm:hidden">Liste</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-1.5">
              <LayoutTemplate className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Templates</span>
              <span className="sm:hidden">Modèles</span>
            </TabsTrigger>
            <TabsTrigger value="simple" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-1.5">
              <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Simple</span>
              <span className="sm:hidden">+</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-1.5">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Historique</span>
              <span className="sm:hidden">Logs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="space-y-6">
            <AdvancedWorkflowBuilder />
          </TabsContent>

          <TabsContent value="list" className="space-y-6">
            <AutomationList />
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <WorkflowTemplates onSelectTemplate={(id) => setActiveTab('visual')} />
          </TabsContent>

          <TabsContent value="simple" className="space-y-6">
            <AutomationBuilder />
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <WorkflowExecutionLogs />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
