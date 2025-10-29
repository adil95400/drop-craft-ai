import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { BehaviorAnalysisDashboard } from '@/components/customer-intelligence/BehaviorAnalysisDashboard';
import { SegmentationView } from '@/components/customer-intelligence/SegmentationView';
import { LifetimeValueView } from '@/components/customer-intelligence/LifetimeValueView';
import { ChurnRiskView } from '@/components/customer-intelligence/ChurnRiskView';

export default function CustomerIntelligencePage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Customer Intelligence Hub</h1>
          <p className="text-muted-foreground">
            Analyse comportementale et prédictions IA pour vos clients
          </p>
        </div>
      </div>

      <Tabs defaultValue="behavior" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="behavior" className="gap-2">
            <Brain className="h-4 w-4" />
            Analyses
          </TabsTrigger>
          <TabsTrigger value="segmentation" className="gap-2">
            <Users className="h-4 w-4" />
            Segmentation
          </TabsTrigger>
          <TabsTrigger value="lifetime" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Valeur Vie
          </TabsTrigger>
          <TabsTrigger value="churn" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Risque Churn
          </TabsTrigger>
        </TabsList>

        <TabsContent value="behavior">
          <BehaviorAnalysisDashboard />
        </TabsContent>

        <TabsContent value="segmentation">
          <SegmentationView />
        </TabsContent>

        <TabsContent value="lifetime">
          <LifetimeValueView />
        </TabsContent>

        <TabsContent value="churn">
          <ChurnRiskView />
        </TabsContent>
      </Tabs>
    </div>
  );
}