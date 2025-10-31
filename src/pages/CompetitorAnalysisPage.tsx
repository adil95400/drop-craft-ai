import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CompetitorAnalyzer } from '@/components/competitive/CompetitorAnalyzer';
import { CompetitorList } from '@/components/competitive/CompetitorList';
import { PriceTracker } from '@/components/competitive/PriceTracker';
import { Target, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CompetitorAnalysisPage() {
  const navigate = useNavigate();
  
  return (
    <>
      <Helmet>
        <title>Analyse Concurrentielle | Drop Craft AI</title>
        <meta 
          name="description" 
          content="Analysez vos concurrents, suivez les prix et identifiez les opportunités de marché" 
        />
      </Helmet>

      <div className="container mx-auto py-8 px-4 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                Analyse Concurrentielle
              </h1>
              <p className="text-xl text-muted-foreground">
                Surveillez vos concurrents et restez compétitif sur le marché
              </p>
            </div>
            <Button onClick={() => navigate('/competitive-comparison')} size="lg">
              <BarChart3 className="w-4 h-4 mr-2" />
              Voir la Comparaison
            </Button>
          </div>
        </div>

        <Tabs defaultValue="analysis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Analyse
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Prix
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Résultats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis">
            <div className="grid gap-6 md:grid-cols-2">
              <CompetitorAnalyzer />
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-6 space-y-2">
                  <h3 className="font-semibold">Comment ça marche ?</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Entrez l'URL d'un site concurrent</li>
                    <li>• Notre IA analyse leur catalogue et stratégie</li>
                    <li>• Recevez des insights et opportunités</li>
                    <li>• Identifiez les gaps du marché</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pricing">
            <div className="grid gap-6 md:grid-cols-2">
              <PriceTracker />
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-6 space-y-2">
                  <h3 className="font-semibold">Suivi des prix</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Comparez vos prix avec la concurrence</li>
                    <li>• Analysez votre positionnement</li>
                    <li>• Recevez des recommandations stratégiques</li>
                    <li>• Optimisez vos marges</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="results">
            <CompetitorList />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
