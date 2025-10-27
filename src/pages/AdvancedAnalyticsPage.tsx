import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomReportsBuilder } from '@/components/analytics/CustomReportsBuilder';
import { TeamManager } from '@/components/teams/TeamManager';
import { BarChart, Users, Target, Activity } from 'lucide-react';

export default function AdvancedAnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Analytics Avancés & Collaboration</h1>
        <p className="text-muted-foreground text-lg">
          Rapports personnalisés, KPIs et gestion d'équipe
        </p>
      </div>

      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="reports">
            <BarChart className="mr-2 h-4 w-4" />
            Rapports
          </TabsTrigger>
          <TabsTrigger value="kpis">
            <Target className="mr-2 h-4 w-4" />
            KPIs
          </TabsTrigger>
          <TabsTrigger value="teams">
            <Users className="mr-2 h-4 w-4" />
            Équipes
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="mr-2 h-4 w-4" />
            Activité
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-6">
          <CustomReportsBuilder />
        </TabsContent>

        <TabsContent value="kpis" className="space-y-6">
          <div className="text-center py-12 text-muted-foreground">
            Module KPIs personnalisés à venir
          </div>
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          <TeamManager />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="text-center py-12 text-muted-foreground">
            Journal d'activité de l'équipe à venir
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
