import { RepricingDashboard } from '@/components/repricing/RepricingDashboard';
import { CompetitorRepricingPanel } from '@/components/repricing/CompetitorRepricingPanel';
import { RepricingSchedulePanel } from '@/components/repricing/RepricingSchedulePanel';
import { RepricingLogsPanel } from '@/components/repricing/RepricingLogsPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Users, Calendar, FileText } from 'lucide-react';

export default function RepricingPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Repricing Dynamique</h1>
        <p className="text-muted-foreground">
          Optimisez vos prix automatiquement en fonction de la concurrence et de vos marges
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="competitors" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Concurrents
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Planification
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <RepricingDashboard />
        </TabsContent>

        <TabsContent value="competitors" className="mt-6">
          <CompetitorRepricingPanel />
        </TabsContent>

        <TabsContent value="schedule" className="mt-6">
          <RepricingSchedulePanel />
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <RepricingLogsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
