import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomReportsBuilder } from '@/components/analytics/CustomReportsBuilder';
import { TeamManager } from '@/components/teams/TeamManager';
import { BarChart, Users, Target, Activity } from 'lucide-react';

export default function AdvancedAnalyticsPage() {
  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">Analytics Avancés & Collaboration</h1>
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
          Rapports personnalisés, KPIs et gestion d'équipe
        </p>
      </div>

      <Tabs defaultValue="reports" className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
          <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-4 sm:max-w-2xl">
            <TabsTrigger value="reports" className="flex items-center gap-1.5 px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
              <BarChart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Rapports</span>
              <span className="xs:hidden">📊</span>
            </TabsTrigger>
            <TabsTrigger value="kpis" className="flex items-center gap-1.5 px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
              <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>KPIs</span>
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-1.5 px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Équipes</span>
              <span className="xs:hidden">👥</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-1.5 px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
              <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Activité</span>
              <span className="xs:hidden">📈</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="reports" className="space-y-4 sm:space-y-6">
          <CustomReportsBuilder />
        </TabsContent>

        <TabsContent value="kpis" className="space-y-4 sm:space-y-6">
          <div className="text-center py-8 sm:py-12 text-muted-foreground text-sm sm:text-base">
            Module KPIs personnalisés à venir
          </div>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4 sm:space-y-6">
          <TeamManager />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4 sm:space-y-6">
          <div className="text-center py-8 sm:py-12 text-muted-foreground text-sm sm:text-base">
            Journal d'activité de l'équipe à venir
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
