/**
 * Page Analytics Avancés avec design Channable premium
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomReportsBuilder } from '@/components/analytics/CustomReportsBuilder';
import { TeamManager } from '@/components/teams/TeamManager';
import { KPIsDashboard } from '@/components/analytics/KPIsDashboard';
import { ActivityLog } from '@/components/analytics/ActivityLog';
import { BarChart, Users, Target, Activity, TrendingUp, Sparkles, Download, Filter } from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function AdvancedAnalyticsPage() {
  return (
    <ChannablePageWrapper
      title="Analytics Avancés"
      subtitle="Intelligence & Collaboration"
      description="Rapports personnalisés, KPIs temps réel et gestion d'équipe pour une prise de décision optimale"
      heroImage="analytics"
      badge={{
        label: 'BI Pro',
        icon: Sparkles
      }}
      actions={
        <>
          <Button className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
            <TrendingUp className="h-4 w-4" />
            Générer un rapport
          </Button>
          <Button variant="outline" className="gap-2 backdrop-blur-sm bg-background/50">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </>
      }
    >
      <Tabs defaultValue="reports" className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide"
        >
          <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-4 sm:max-w-2xl bg-muted/50 p-1 rounded-xl">
            <TabsTrigger 
              value="reports" 
              className="flex items-center gap-2 px-4 py-2.5 whitespace-nowrap text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <BarChart className="h-4 w-4" />
              <span>Rapports</span>
            </TabsTrigger>
            <TabsTrigger 
              value="kpis" 
              className="flex items-center gap-2 px-4 py-2.5 whitespace-nowrap text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <Target className="h-4 w-4" />
              <span>KPIs</span>
            </TabsTrigger>
            <TabsTrigger 
              value="teams" 
              className="flex items-center gap-2 px-4 py-2.5 whitespace-nowrap text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <Users className="h-4 w-4" />
              <span>Équipes</span>
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="flex items-center gap-2 px-4 py-2.5 whitespace-nowrap text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <Activity className="h-4 w-4" />
              <span>Activité</span>
            </TabsTrigger>
          </TabsList>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <TabsContent value="reports" className="space-y-6 mt-0">
            <CustomReportsBuilder />
          </TabsContent>

          <TabsContent value="kpis" className="space-y-6 mt-0">
            <KPIsDashboard />
          </TabsContent>

          <TabsContent value="teams" className="space-y-6 mt-0">
            <TeamManager />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6 mt-0">
            <ActivityLog />
          </TabsContent>
        </motion.div>
      </Tabs>
    </ChannablePageWrapper>
  );
}
