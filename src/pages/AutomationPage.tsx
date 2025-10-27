import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AutomationBuilder } from '@/components/automation/AutomationBuilder';
import { AutomationList } from '@/components/automation/AutomationList';
import { Zap, List, Activity } from 'lucide-react';

export default function AutomationPage() {
  const [activeTab, setActiveTab] = useState('list');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Automation & Workflows
          </h1>
          <p className="text-muted-foreground text-lg">
            Automate repetitive tasks and create intelligent workflows
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Automations
            </TabsTrigger>
            <TabsTrigger value="builder" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Create New
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            <AutomationList />
          </TabsContent>

          <TabsContent value="builder" className="space-y-6">
            <AutomationBuilder />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <div className="text-center py-12 text-muted-foreground">
              Activity monitoring coming soon...
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
