import { Helmet } from 'react-helmet-async'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Workflow, Zap } from 'lucide-react'
import { FlowchartWorkflowBuilder } from '@/components/automation/FlowchartWorkflowBuilder'
import { AdvancedRulesEngine } from '@/components/marketing/AdvancedRulesEngine'

export default function WorkflowsPage() {
  return (
    <>
      <Helmet>
        <title>Workflows & Automatisations - ShopOpti</title>
        <meta name="description" content="Créez des workflows visuels et des automatisations if/then" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <Tabs defaultValue="visual" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="visual" className="flex items-center gap-2">
              <Workflow className="h-4 w-4" />
              Éditeur Visuel
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Moteur de Règles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visual">
            <FlowchartWorkflowBuilder />
          </TabsContent>

          <TabsContent value="rules">
            <AdvancedRulesEngine />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
