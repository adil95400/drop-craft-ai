import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MultiStorePerformance } from '@/components/stores/analytics/MultiStorePerformance';
import { InsightsPanel } from '@/components/stores/analytics/InsightsPanel';
import { PredictionsPanel } from '@/components/stores/analytics/PredictionsPanel';
import { BarChart3, Lightbulb, TrendingUp } from 'lucide-react';

export default function MultiStoreAnalyticsDashboard() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analyses Multi-Magasins</h1>
        <p className="text-muted-foreground mt-1">
          Analyses avancées et insights IA pour optimiser la performance de vos magasins
        </p>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList>
          <TabsTrigger value="performance" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Insights IA
          </TabsTrigger>
          <TabsTrigger value="predictions" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Prédictions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <MultiStorePerformance />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <InsightsPanel />
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <PredictionsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
