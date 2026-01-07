import { RepricingDashboard } from '@/components/repricing/RepricingDashboard';
import { CompetitorRepricingPanel } from '@/components/repricing/CompetitorRepricingPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Users, Zap } from 'lucide-react';

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
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="competitors" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Concurrents
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Automation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <RepricingDashboard />
        </TabsContent>

        <TabsContent value="competitors" className="mt-6">
          <CompetitorRepricingPanel />
        </TabsContent>

        <TabsContent value="automation" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">Automation Avancée</h3>
            <p>Configuration des règles d'automation de repricing à venir</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
