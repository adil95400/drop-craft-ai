import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CampaignManager } from '@/components/ads/CampaignManager';
import { CreativeStudio } from '@/components/ads/CreativeStudio';
import { ABTestingDashboard } from '@/components/ads/ABTestingDashboard';
import { PerformanceDashboard } from '@/components/ads/PerformanceDashboard';
import { Megaphone, Sparkles, FlaskConical, TrendingUp } from 'lucide-react';

export default function AdsManagerPage() {
  return (
    <>
      <Helmet>
        <title>AI Ads Manager - Automatisation & Optimisation</title>
        <meta name="description" content="Gérez vos campagnes publicitaires avec l'IA : création automatique, A/B testing et optimisation en temps réel" />
      </Helmet>
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">AI Ads Manager</h1>
            <p className="text-muted-foreground mt-2">
              Créez, optimisez et gérez vos campagnes publicitaires avec l'intelligence artificielle
            </p>
          </div>

          <Tabs defaultValue="campaigns" className="w-full">
            <TabsList className="grid grid-cols-4 w-full max-w-2xl">
              <TabsTrigger value="campaigns" className="flex items-center gap-2">
                <Megaphone className="h-4 w-4" />
                Campagnes
              </TabsTrigger>
              <TabsTrigger value="creatives" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Créatifs IA
              </TabsTrigger>
              <TabsTrigger value="abtesting" className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4" />
                A/B Testing
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Performance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="campaigns" className="mt-6">
              <CampaignManager />
            </TabsContent>

            <TabsContent value="creatives" className="mt-6">
              <Card className="p-6">
                <CreativeStudio />
              </Card>
            </TabsContent>

            <TabsContent value="abtesting" className="mt-6">
              <Card className="p-6">
                <ABTestingDashboard />
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="mt-6">
              <PerformanceDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
