import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, DollarSign, Target, Zap, BarChart3 } from 'lucide-react';

const PriceOptimizationPage: React.FC = () => {
  const recommendations = [
    {
      id: 1,
      product: 'Product A',
      currentPrice: 29.99,
      suggestedPrice: 34.99,
      impact: '+15%',
      confidence: 'high',
    },
    {
      id: 2,
      product: 'Product B',
      currentPrice: 49.99,
      suggestedPrice: 44.99,
      impact: '+8%',
      confidence: 'medium',
    },
    {
      id: 3,
      product: 'Product C',
      currentPrice: 19.99,
      suggestedPrice: 22.99,
      impact: '+12%',
      confidence: 'high',
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Optimisation des prix</h1>
          <p className="text-muted-foreground">
            Maximisez vos revenus avec des prix intelligents
          </p>
        </div>
        <Button>
          <Zap className="mr-2 h-4 w-4" />
          Appliquer les recommandations
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gain potentiel</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+€3,450</div>
            <p className="text-xs text-muted-foreground">Par mois estimé</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunités</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">Produits à optimiser</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prix moyen</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€36.40</div>
            <p className="text-xs text-muted-foreground">+2.5% recommandé</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compétitivité</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">Score global</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recommendations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
          <TabsTrigger value="rules">Règles de prix</TabsTrigger>
          <TabsTrigger value="competitor">Analyse concurrents</TabsTrigger>
          <TabsTrigger value="elasticity">Élasticité</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommandations IA</CardTitle>
              <CardDescription>Suggestions basées sur l'analyse du marché</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold">{rec.product}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">
                          Prix actuel: €{rec.currentPrice}
                        </span>
                        <span className="text-sm">→</span>
                        <span className="text-sm font-semibold text-primary">
                          Prix suggéré: €{rec.suggestedPrice}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-green-500">
                          {rec.impact}
                        </div>
                        <div className="text-xs text-muted-foreground">Impact revenue</div>
                      </div>
                      <Badge
                        variant={rec.confidence === 'high' ? 'default' : 'secondary'}
                      >
                        {rec.confidence === 'high' ? 'Haute confiance' : 'Confiance moyenne'}
                      </Badge>
                      <Button size="sm">Appliquer</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Règles de tarification</CardTitle>
              <CardDescription>Configurez vos stratégies de prix automatiques</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Marge minimale (%)</label>
                  <Slider defaultValue={[20]} max={100} step={1} />
                  <p className="text-xs text-muted-foreground">Marge bénéficiaire minimale: 20%</p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Ajustement concurrentiel (%)</label>
                  <Slider defaultValue={[5]} max={50} step={1} />
                  <p className="text-xs text-muted-foreground">
                    Rester dans ±5% des prix concurrents
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Prix psychologique</label>
                  <div className="flex gap-2">
                    <Badge variant="outline">.99</Badge>
                    <Badge variant="outline">.95</Badge>
                    <Badge variant="outline">.90</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Arrondir aux terminaisons psychologiques
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitor">
          <Card>
            <CardHeader>
              <CardTitle>Analyse concurrentielle</CardTitle>
              <CardDescription>Comparaison avec le marché</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Données de comparaison des prix concurrents...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="elasticity">
          <Card>
            <CardHeader>
              <CardTitle>Élasticité des prix</CardTitle>
              <CardDescription>Sensibilité de la demande aux variations de prix</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Analyse d'élasticité des prix...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PriceOptimizationPage;
