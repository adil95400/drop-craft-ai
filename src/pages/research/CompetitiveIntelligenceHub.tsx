import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, TrendingUp, DollarSign, AlertCircle, BarChart3, Target } from 'lucide-react';
import { useCompetitiveIntelligence } from '@/hooks/useCompetitiveIntelligence';

export default function CompetitiveIntelligenceHub() {
  const [productUrl, setProductUrl] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const { analyzeProduct, estimateSales, analyzeSaturation } = useCompetitiveIntelligence();

  const handleAnalyze = async () => {
    const result = await analyzeProduct.mutateAsync(productUrl);
    setAnalysisResult(result);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Target className="h-8 w-8 text-primary" />
          Intelligence Concurrentielle
        </h1>
        <p className="text-muted-foreground mt-2">
          Analysez vos concurrents et estimez les volumes de ventes
        </p>
      </div>

      <Card className="p-6">
        <div className="flex gap-4">
          <Input
            placeholder="URL du produit concurrent à analyser..."
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
          />
          <Button
            onClick={handleAnalyze}
            disabled={!productUrl || analyzeProduct.isPending}
            className="bg-gradient-primary"
          >
            <Search className="h-4 w-4 mr-2" />
            Analyser
          </Button>
        </div>
      </Card>

      {analysisResult && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Ventes mensuelles estimées</p>
                <p className="text-2xl font-bold">{analysisResult.estimated_monthly_sales}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Revenu estimé</p>
                <p className="text-2xl font-bold">{analysisResult.estimated_revenue}€</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Saturation marché</p>
                <p className="text-2xl font-bold">{(analysisResult.market_saturation_score * 100).toFixed(0)}%</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Concurrents</p>
                <p className="text-2xl font-bold">{analysisResult.competitors_count}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Tabs defaultValue="analysis">
        <TabsList>
          <TabsTrigger value="analysis">Analyse</TabsTrigger>
          <TabsTrigger value="sales">Estimation ventes</TabsTrigger>
          <TabsTrigger value="saturation">Saturation marché</TabsTrigger>
          <TabsTrigger value="prices">Intelligence prix</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          {analysisResult ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Tendances
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Direction:</span>
                    <Badge variant="default">{analysisResult.trend_direction}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Croissance prévue:</span>
                    <span className="font-semibold">{analysisResult.predicted_growth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mentions sociales:</span>
                    <span className="font-semibold">{analysisResult.social_mentions?.toLocaleString()}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Activité publicitaire
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Facebook Ads:</span>
                    <span className="font-semibold">{analysisResult.ad_activity?.facebook_ads}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Google Ads:</span>
                    <span className="font-semibold">{analysisResult.ad_activity?.google_ads}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TikTok Ads:</span>
                    <span className="font-semibold">{analysisResult.ad_activity?.tiktok_ads}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Position prix
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Position:</span>
                    <Badge variant="outline">{analysisResult.price_position}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prix moyen concurrent:</span>
                    <span className="font-semibold">{analysisResult.avg_competitor_price}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Niveau concurrence:</span>
                    <Badge variant={analysisResult.competition_level === 'high' ? 'destructive' : 'secondary'}>
                      {analysisResult.competition_level}
                    </Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Opportunités
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Marché en croissance avec opportunité de positionnement premium
                  </p>
                  <Badge variant="default">Recommandé</Badge>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucune analyse</h3>
              <p className="text-muted-foreground">
                Entrez l'URL d'un produit concurrent pour démarrer l'analyse
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sales">
          <Card className="p-6 text-center">
            <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Estimation des ventes</h3>
            <p className="text-muted-foreground">
              Algorithme prédictif d'estimation de volumes de ventes
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="saturation">
          <Card className="p-6 text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Analyse de saturation</h3>
            <p className="text-muted-foreground">
              Score de saturation marché par catégorie et niche
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="prices">
          <Card className="p-6 text-center">
            <DollarSign className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Intelligence des prix</h3>
            <p className="text-muted-foreground">
              Suivi et analyse des prix concurrents en temps réel
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}