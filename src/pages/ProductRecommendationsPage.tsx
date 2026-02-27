import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, TrendingUp, ShoppingCart, Target, Zap, BarChart3, RefreshCw, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useProductRecommendations } from '@/hooks/useProductRecommendations';
import { Progress } from '@/components/ui/progress';

const ProductRecommendationsPage: React.FC = () => {
  const { stats, recommendations, isLoading, generate, isGenerating } = useProductRecommendations();

  const ctr = stats?.impressions > 0 ? ((stats.clicks / stats.impressions) * 100).toFixed(1) : '0';
  const conversionRate = stats?.clicks > 0 ? ((stats.purchases / stats.clicks) * 100).toFixed(1) : '0';

  const strategyLabels: Record<string, string> = {
    cross_sell: 'Cross-sell',
    upsell: 'Up-sell',
    bundle: 'Bundle',
    similar: 'Similaire',
    personalized: 'Personnalisé',
  };

  const strategyIcons: Record<string, React.ReactNode> = {
    cross_sell: <Target className="h-5 w-5 text-primary" />,
    upsell: <Zap className="h-5 w-5 text-primary" />,
    bundle: <ShoppingCart className="h-5 w-5 text-primary" />,
    similar: <Sparkles className="h-5 w-5 text-primary" />,
  };

  return (
    <ChannablePageWrapper
      title="Recommandations produits"
      description="Moteur IA de recommandation avec collaborative filtering"
      heroImage="ai"
      badge={{ label: 'Recommandations IA', icon: Sparkles }}
      actions={
        <Button onClick={() => generate()} disabled={isGenerating}>
          {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {isGenerating ? 'Analyse en cours...' : 'Générer des recommandations'}
        </Button>
      }
    >
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.impressions || 0}</div>
            <p className="text-xs text-muted-foreground">Recommandations affichées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clics</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.clicks || 0}</div>
            <p className="text-xs text-muted-foreground">CTR: {ctr}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.purchases || 0}</div>
            <p className="text-xs text-muted-foreground">Taux: {conversionRate}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ajouts panier</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.add_to_cart || 0}</div>
            <p className="text-xs text-muted-foreground">Via recommandations</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recommendations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recommendations">Recommandations IA</TabsTrigger>
          <TabsTrigger value="strategies">Stratégies</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : recommendations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucune recommandation</h3>
                <p className="text-muted-foreground mb-4">
                  Cliquez sur "Générer des recommandations" pour analyser vos produits et historique de commandes.
                </p>
                <Button onClick={() => generate()} disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Lancer l'analyse IA
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec: any) => (
                <Card key={rec.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-primary/10 rounded-lg mt-1">
                          {strategyIcons[rec.recommendation_type] || <Sparkles className="h-5 w-5 text-primary" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{rec.title}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {strategyLabels[rec.recommendation_type] || rec.recommendation_type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{rec.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-center">
                          <div className="text-sm font-semibold">{Math.round((rec.confidence_score || 0) * 100)}%</div>
                          <div className="text-xs text-muted-foreground">Confiance</div>
                          <Progress value={(rec.confidence_score || 0) * 100} className="h-1 w-16 mt-1" />
                        </div>
                        {rec.impact_value > 0 && (
                          <div className="text-center">
                            <div className="text-sm font-semibold text-primary">+€{rec.impact_value?.toFixed(0)}</div>
                            <div className="text-xs text-muted-foreground">Impact</div>
                          </div>
                        )}
                        <div className="flex gap-1">
                          <Button size="sm" variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" /> Appliquer
                          </Button>
                          <Button size="sm" variant="ghost">
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="strategies" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(stats?.by_strategy || {}).map(([strategy, data]: [string, any]) => (
              <Card key={strategy}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    {strategyIcons[strategy] || <Sparkles className="h-4 w-4 text-primary" />}
                    <CardTitle className="text-base">{strategyLabels[strategy] || strategy}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Impressions</span>
                    <span className="font-medium">{data.impressions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Clics</span>
                    <span className="font-medium">{data.clicks}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Conversions</span>
                    <span className="font-medium">{data.purchases}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">CTR</span>
                    <span className="font-medium">
                      {data.impressions > 0 ? ((data.clicks / data.impressions) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {Object.keys(stats?.by_strategy || {}).length === 0 && (
              <Card className="col-span-full">
                <CardContent className="py-8 text-center text-muted-foreground">
                  Aucune donnée de stratégie disponible. Générez des recommandations pour commencer.
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Configuration des stratégies</CardTitle>
              <CardDescription>Activez ou désactivez les types de recommandation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { key: 'cross_sell', title: 'Cross-sell', desc: 'Produits complémentaires', icon: Target },
                  { key: 'upsell', title: 'Up-sell', desc: 'Versions premium', icon: Zap },
                  { key: 'bundle', title: 'Bundles', desc: 'Lots de produits', icon: ShoppingCart },
                ].map(s => (
                  <div key={s.key} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <s.icon className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{s.title}</span>
                      <Badge variant="default" className="ml-auto text-xs">Actif</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Analyse de performance</CardTitle>
              <CardDescription>Métriques temps réel du moteur de recommandation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-semibold">Entonnoir de conversion</h4>
                  {[
                    { label: 'Impressions', value: stats?.impressions || 0, pct: 100 },
                    { label: 'Clics', value: stats?.clicks || 0, pct: stats?.impressions ? (stats.clicks / stats.impressions) * 100 : 0 },
                    { label: 'Ajouts panier', value: stats?.add_to_cart || 0, pct: stats?.impressions ? (stats.add_to_cart / stats.impressions) * 100 : 0 },
                    { label: 'Achats', value: stats?.purchases || 0, pct: stats?.impressions ? (stats.purchases / stats.impressions) * 100 : 0 },
                  ].map((step, i) => (
                    <div key={step.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{step.label}</span>
                        <span className="font-medium">{step.value} ({step.pct.toFixed(1)}%)</span>
                      </div>
                      <Progress value={step.pct} className="h-2" />
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Modèle IA</h4>
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Algorithme</span>
                      <span className="font-medium">Collaborative Filtering + IA</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Moteur</span>
                      <span className="font-medium">OpenAI GPT-5</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Recommandations actives</span>
                      <span className="font-medium">{recommendations.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Score moyen</span>
                      <span className="font-medium">
                        {recommendations.length > 0
                          ? (recommendations.reduce((s: number, r: any) => s + (r.confidence_score || 0), 0) / recommendations.length * 100).toFixed(0)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
};

export default ProductRecommendationsPage;
