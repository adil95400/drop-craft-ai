import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { TrendingUp, DollarSign, Target, Zap, BarChart3, Loader2, Users, Activity } from 'lucide-react';
import {
  useOptimizationStats,
  usePriceRecommendations,
  useApplyRecommendation,
  useApplyAllRecommendations,
  useCompetitorAnalysis,
  useElasticityData,
} from '@/hooks/usePriceOptimization';

const PriceOptimizationPage: React.FC = () => {
  const [applyingId, setApplyingId] = useState<string | null>(null);
  
  const { data: stats, isLoading: isLoadingStats } = useOptimizationStats();
  const { data: recommendations = [], isLoading: isLoadingRecs } = usePriceRecommendations();
  const { data: competitors = [], isLoading: isLoadingCompetitors } = useCompetitorAnalysis();
  const { data: elasticityData = [], isLoading: isLoadingElasticity } = useElasticityData();
  
  const applyRecommendation = useApplyRecommendation();
  const applyAll = useApplyAllRecommendations();

  const handleApplyRecommendation = (rec: typeof recommendations[0]) => {
    setApplyingId(rec.id);
    applyRecommendation.mutate(rec, {
      onSettled: () => setApplyingId(null),
    });
  };

  return (
    <>
      <Helmet>
        <title>Optimisation des Prix - ShopOpti</title>
        <meta name="description" content="Maximisez vos revenus avec des prix intelligents basés sur l'IA" />
      </Helmet>

      <ChannablePageWrapper
        title="Optimisation des Prix"
        subtitle="Intelligence artificielle"
        description="Maximisez vos revenus avec des prix intelligents"
        heroImage="analytics"
        badge={{ label: 'IA Pricing', icon: Zap }}
        actions={
          <Button 
            onClick={() => applyAll.mutate(recommendations)}
            disabled={applyAll.isPending || recommendations.length === 0}
          >
            {applyAll.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
            Appliquer les recommandations
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gain potentiel</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold text-green-600">+{stats?.potentialGain || 0}€</div>
                )}
                <p className="text-xs text-muted-foreground">Par mois estimé</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Opportunités</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.opportunities || 0}</div>
                )}
                <p className="text-xs text-muted-foreground">Produits à optimiser</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Prix moyen</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{(stats?.avgPrice || 0).toFixed(2)}€</div>
                )}
                <p className="text-xs text-muted-foreground">Catalogue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compétitivité</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.competitiveness || 0}%</div>
                )}
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
                  {isLoadingRecs ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                    </div>
                  ) : recommendations.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucune recommandation disponible</p>
                      <p className="text-sm">Vos prix sont déjà optimisés</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recommendations.map((rec) => (
                        <div
                          key={rec.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div>
                            <h3 className="font-semibold">{rec.product}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-muted-foreground">
                                Prix actuel: {rec.currentPrice.toFixed(2)}€
                              </span>
                              <span className="text-sm">→</span>
                              <span className="text-sm font-semibold text-primary">
                                Suggéré: {rec.suggestedPrice.toFixed(2)}€
                              </span>
                            </div>
                            {rec.reasoning && (
                              <p className="text-xs text-muted-foreground mt-1">{rec.reasoning}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm font-semibold text-green-500">
                                {rec.impact}
                              </div>
                              <div className="text-xs text-muted-foreground">Impact revenue</div>
                            </div>
                            <Badge
                              variant={rec.confidence === 'high' ? 'default' : rec.confidence === 'medium' ? 'secondary' : 'outline'}
                            >
                              {rec.confidence === 'high' ? 'Haute confiance' : rec.confidence === 'medium' ? 'Confiance moyenne' : 'Faible confiance'}
                            </Badge>
                            <Button 
                              size="sm"
                              onClick={() => handleApplyRecommendation(rec)}
                              disabled={applyingId !== null}
                            >
                              {applyingId === rec.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Appliquer'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                        <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">.99</Badge>
                        <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">.95</Badge>
                        <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">.90</Badge>
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
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Analyse concurrentielle
                  </CardTitle>
                  <CardDescription>Comparaison avec le marché</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingCompetitors ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                  ) : competitors.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucune donnée concurrentielle</p>
                      <p className="text-sm">Activez la surveillance des concurrents pour voir les analyses</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Concurrent</TableHead>
                          <TableHead>Produits suivis</TableHead>
                          <TableHead>Écart de prix moyen</TableHead>
                          <TableHead>Dernière vérification</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {competitors.map((comp) => (
                          <TableRow key={comp.id}>
                            <TableCell className="font-medium">{comp.competitor}</TableCell>
                            <TableCell>{comp.productCount}</TableCell>
                            <TableCell>
                              <Badge variant={comp.avgPriceDiff > 0 ? 'default' : 'destructive'}>
                                {comp.avgPriceDiff > 0 ? '+' : ''}{comp.avgPriceDiff.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{comp.lastChecked}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="elasticity">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Élasticité des prix
                  </CardTitle>
                  <CardDescription>Sensibilité de la demande aux variations de prix</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingElasticity ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                  ) : elasticityData.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Données insuffisantes</p>
                      <p className="text-sm">Plus de ventes sont nécessaires pour calculer l'élasticité</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produit</TableHead>
                          <TableHead>Prix actuel</TableHead>
                          <TableHead>Prix optimal</TableHead>
                          <TableHead>Élasticité</TableHead>
                          <TableHead>Impact demande</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {elasticityData.map((item) => (
                          <TableRow key={item.productId}>
                            <TableCell className="font-medium">{item.productName}</TableCell>
                            <TableCell>{item.currentPrice.toFixed(2)}€</TableCell>
                            <TableCell className="text-primary font-semibold">{item.optimalPrice.toFixed(2)}€</TableCell>
                            <TableCell>
                              <Badge variant={Math.abs(item.elasticity) > 1 ? 'destructive' : 'default'}>
                                {item.elasticity.toFixed(2)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.demandImpact}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ChannablePageWrapper>
    </>
  );
};

export default PriceOptimizationPage;
