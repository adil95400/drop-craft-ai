import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AutomationBuilder } from '@/components/automation/AutomationBuilder';
import { AutomationList } from '@/components/automation/AutomationList';
import { ActivityMonitoring } from '@/components/automation/ActivityMonitoring';
import { Zap, List, Activity } from 'lucide-react';

export default function AutomationPage() {
  const [activeTab, setActiveTab] = useState('list');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Automation
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground">
            Automate tasks and create workflows
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="w-full max-w-md grid grid-cols-3 h-auto">
            <TabsTrigger value="list" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2">
              <List className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Automations</span>
              <span className="xs:hidden">Auto</span>
            </TabsTrigger>
            <TabsTrigger value="builder" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2">
              <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Create New</span>
              <span className="xs:hidden">New</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Activity</span>
              <span className="xs:hidden">Log</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            <AutomationList />
          </TabsContent>

          <TabsContent value="builder" className="space-y-6">
            <AutomationBuilder />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <ActivityMonitoring />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
