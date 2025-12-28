import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CampaignsManager } from './CampaignsManager'
import { TemplatesManager } from './TemplatesManager'
import { AutomationFlowBuilder } from './AutomationFlowBuilder'
import { ABTestManager } from './ABTestManager'
import { DeliverabilityStats } from './DeliverabilityStats'
import { Mail, FileText, Workflow, FlaskConical, Shield } from 'lucide-react'

export function MarketingAutomationHub() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Marketing Automation</h1>
        <p className="text-muted-foreground">Gérez vos campagnes email/SMS, automations et tests A/B</p>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Campagnes
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="automations" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Automations
          </TabsTrigger>
          <TabsTrigger value="ab-tests" className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            Tests A/B
          </TabsTrigger>
          <TabsTrigger value="deliverability" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Délivrabilité
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <CampaignsManager />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesManager />
        </TabsContent>

        <TabsContent value="automations">
          <AutomationFlowBuilder />
        </TabsContent>

        <TabsContent value="ab-tests">
          <ABTestManager />
        </TabsContent>

        <TabsContent value="deliverability">
          <DeliverabilityStats />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { CampaignsManager } from './CampaignsManager'
export { TemplatesManager } from './TemplatesManager'
export { AutomationFlowBuilder } from './AutomationFlowBuilder'
export { ABTestManager } from './ABTestManager'
export { DeliverabilityStats } from './DeliverabilityStats'
