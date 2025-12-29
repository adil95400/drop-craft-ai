import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, TrendingUp, DollarSign, AlertCircle, BarChart3, Target, 
  Loader2, Trash2, History, ExternalLink, Plus, X, Lightbulb,
  Shield, Users, Zap
} from 'lucide-react';
import { 
  useCompetitiveIntelligence, 
  CompetitorAnalysis, 
  SalesEstimate, 
  SaturationAnalysis,
  PriceIntelligence 
} from '@/hooks/useCompetitiveIntelligence';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function CompetitiveIntelligenceHub() {
  const [productUrl, setProductUrl] = useState('');
  const [category, setCategory] = useState('');
  const [competitorUrls, setCompetitorUrls] = useState<string[]>(['']);
  const [analysisResult, setAnalysisResult] = useState<CompetitorAnalysis | null>(null);
  const [salesResult, setSalesResult] = useState<SalesEstimate | null>(null);
  const [saturationResult, setSaturationResult] = useState<SaturationAnalysis | null>(null);
  const [priceResult, setPriceResult] = useState<PriceIntelligence | null>(null);
  
  const { 
    analyzeProduct, 
    estimateSales, 
    analyzeSaturation, 
    analyzePrices,
    bulkAnalyze,
    deleteAnalysis,
    useAnalysisHistory 
  } = useCompetitiveIntelligence();
  
  const { data: historyData, isLoading: historyLoading } = useAnalysisHistory();

  const handleAnalyze = async () => {
    if (!productUrl) return;
    const result = await analyzeProduct.mutateAsync(productUrl);
    setAnalysisResult(result);
  };

  const handleEstimateSales = async () => {
    if (!productUrl) return;
    const result = await estimateSales.mutateAsync(productUrl);
    setSalesResult(result);
  };

  const handleAnalyzeSaturation = async () => {
    if (!category) return;
    const result = await analyzeSaturation.mutateAsync(category);
    setSaturationResult(result);
  };

  const handleAnalyzePrices = async () => {
    const urls = competitorUrls.filter(url => url.trim() !== '');
    if (urls.length === 0) return;
    const result = await analyzePrices.mutateAsync(urls);
    setPriceResult(result);
  };

  const addCompetitorUrl = () => {
    setCompetitorUrls([...competitorUrls, '']);
  };

  const removeCompetitorUrl = (index: number) => {
    setCompetitorUrls(competitorUrls.filter((_, i) => i !== index));
  };

  const updateCompetitorUrl = (index: number, value: string) => {
    const updated = [...competitorUrls];
    updated[index] = value;
    setCompetitorUrls(updated);
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'default';
    }
  };

  const isLoading = analyzeProduct.isPending || estimateSales.isPending || 
                    analyzeSaturation.isPending || analyzePrices.isPending;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            Intelligence Concurrentielle
          </h1>
          <p className="text-muted-foreground mt-2">
            Analysez vos concurrents et estimez les volumes de ventes en temps réel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Analyse en temps réel
          </Badge>
        </div>
      </div>

      {/* Barre de recherche principale */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="https://example.com/product - URL du produit concurrent..."
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              className="h-12"
            />
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={!productUrl || isLoading}
            className="h-12 px-8 bg-gradient-primary"
          >
            {analyzeProduct.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Analyser le concurrent
          </Button>
        </div>
      </Card>

      {/* Résultats résumés */}
      {analysisResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ventes mensuelles estimées</p>
                <p className="text-2xl font-bold">{analysisResult.estimated_monthly_sales.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenu estimé</p>
                <p className="text-2xl font-bold">{analysisResult.estimated_revenue.toLocaleString()}€</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saturation marché</p>
                <p className="text-2xl font-bold">
                  {(analysisResult.market_saturation_score * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score SEO</p>
                <p className="text-2xl font-bold">{analysisResult.seo_score}/100</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Onglets */}
      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="analysis">Analyse détaillée</TabsTrigger>
          <TabsTrigger value="sales">Estimation ventes</TabsTrigger>
          <TabsTrigger value="saturation">Saturation marché</TabsTrigger>
          <TabsTrigger value="prices">Intelligence prix</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        {/* Onglet Analyse */}
        <TabsContent value="analysis" className="space-y-4">
          {analysisResult ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Tendances */}
              <Card className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Tendances
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Direction:</span>
                    <Badge variant="default">{analysisResult.trend_direction}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Croissance prévue:</span>
                    <span className="font-semibold text-green-600">{analysisResult.predicted_growth}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Mentions sociales:</span>
                    <span className="font-semibold">{analysisResult.social_mentions?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Avis clients:</span>
                    <span className="font-semibold">{analysisResult.review_count}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Note moyenne:</span>
                    <span className="font-semibold">{analysisResult.rating}/5 ⭐</span>
                  </div>
                </div>
              </Card>

              {/* Activité publicitaire */}
              <Card className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Activité publicitaire estimée
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Facebook Ads</span>
                      <span className="text-sm font-medium">{analysisResult.ad_activity?.facebook_ads} campagnes</span>
                    </div>
                    <Progress value={Math.min(100, analysisResult.ad_activity?.facebook_ads * 5)} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Google Ads</span>
                      <span className="text-sm font-medium">{analysisResult.ad_activity?.google_ads} campagnes</span>
                    </div>
                    <Progress value={Math.min(100, analysisResult.ad_activity?.google_ads * 5)} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">TikTok Ads</span>
                      <span className="text-sm font-medium">{analysisResult.ad_activity?.tiktok_ads} campagnes</span>
                    </div>
                    <Progress value={Math.min(100, analysisResult.ad_activity?.tiktok_ads * 5)} className="h-2" />
                  </div>
                </div>
              </Card>

              {/* Position prix */}
              <Card className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Position prix
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Position:</span>
                    <Badge variant="outline" className="capitalize">{analysisResult.price_position}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Prix moyen:</span>
                    <span className="font-semibold">{analysisResult.avg_competitor_price}€</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Concurrents:</span>
                    <span className="font-semibold">{analysisResult.competitors_count}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Niveau concurrence:</span>
                    <Badge variant={getThreatColor(analysisResult.competition_level)} className="capitalize">
                      {analysisResult.competition_level}
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* Opportunités */}
              {analysisResult.opportunities && analysisResult.opportunities.length > 0 && (
                <Card className="p-6 md:col-span-2 lg:col-span-3">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    Opportunités identifiées
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {analysisResult.opportunities.map((opp, index) => (
                      <div key={index} className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <p className="text-sm">{opp}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
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

        {/* Onglet Estimation ventes */}
        <TabsContent value="sales" className="space-y-4">
          <Card className="p-6">
            <div className="flex gap-4 mb-6">
              <Input
                placeholder="URL du produit à analyser..."
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleEstimateSales}
                disabled={!productUrl || estimateSales.isPending}
              >
                {estimateSales.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TrendingUp className="h-4 w-4 mr-2" />
                )}
                Estimer les ventes
              </Button>
            </div>

            {salesResult && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-4 text-center bg-muted/50">
                  <p className="text-sm text-muted-foreground">Journalier</p>
                  <p className="text-3xl font-bold">{salesResult.daily_estimate}</p>
                  <p className="text-xs text-muted-foreground">unités/jour</p>
                </Card>
                <Card className="p-4 text-center bg-muted/50">
                  <p className="text-sm text-muted-foreground">Hebdomadaire</p>
                  <p className="text-3xl font-bold">{salesResult.weekly_estimate}</p>
                  <p className="text-xs text-muted-foreground">unités/semaine</p>
                </Card>
                <Card className="p-4 text-center bg-primary/10">
                  <p className="text-sm text-muted-foreground">Mensuel</p>
                  <p className="text-3xl font-bold text-primary">{salesResult.monthly_estimate}</p>
                  <p className="text-xs text-muted-foreground">unités/mois</p>
                </Card>

                <Card className="p-4 md:col-span-3">
                  <h4 className="font-semibold mb-3">Facteurs d'analyse</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Volume recherche</p>
                      <Badge variant="outline">{salesResult.factors.search_volume}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Engagement social</p>
                      <Badge variant="outline">{salesResult.factors.social_engagement}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Prix concurrent</p>
                      <Badge variant="outline">{salesResult.factors.competitor_pricing}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Saisonnalité</p>
                      <Badge variant="outline">{salesResult.factors.seasonality}</Badge>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Confiance:</span>
                    <Progress value={salesResult.confidence_level * 100} className="flex-1 h-2" />
                    <span className="text-sm font-medium">{(salesResult.confidence_level * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Modèle: {salesResult.prediction_model}
                  </p>
                </Card>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Onglet Saturation marché */}
        <TabsContent value="saturation" className="space-y-4">
          <Card className="p-6">
            <div className="flex gap-4 mb-6">
              <Input
                placeholder="Catégorie (ex: electronics, fashion, beauty...)"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleAnalyzeSaturation}
                disabled={!category || analyzeSaturation.isPending}
              >
                {analyzeSaturation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-2" />
                )}
                Analyser la saturation
              </Button>
            </div>

            {saturationResult && (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Score de saturation</p>
                  <div className="relative w-32 h-32 mx-auto">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
                      <circle 
                        cx="64" 
                        cy="64" 
                        r="56" 
                        stroke="currentColor" 
                        strokeWidth="8" 
                        fill="none" 
                        className={saturationResult.saturation_score > 0.7 ? 'text-red-500' : saturationResult.saturation_score > 0.4 ? 'text-yellow-500' : 'text-green-500'}
                        strokeDasharray={`${saturationResult.saturation_score * 352} 352`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold">{(saturationResult.saturation_score * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-bold">{saturationResult.top_players}</p>
                    <p className="text-sm text-muted-foreground">Acteurs majeurs</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Plus className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-bold">{saturationResult.new_entrants_last_30_days}</p>
                    <p className="text-sm text-muted-foreground">Nouveaux entrants (30j)</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Shield className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-bold capitalize">{saturationResult.barrier_to_entry}</p>
                    <p className="text-sm text-muted-foreground">Barrière à l'entrée</p>
                  </div>
                </div>

                <Card className="p-4 bg-primary/5 border-primary/20">
                  <h4 className="font-semibold mb-2">Recommandation</h4>
                  <p>{saturationResult.recommendation}</p>
                </Card>

                {saturationResult.niches_available.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Niches disponibles</h4>
                    <div className="flex flex-wrap gap-2">
                      {saturationResult.niches_available.map((niche, index) => (
                        <Badge key={index} variant="secondary">{niche}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {saturationResult.entry_strategies.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Stratégies d'entrée</h4>
                    <ul className="space-y-2">
                      {saturationResult.entry_strategies.map((strategy, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          <span>{strategy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Onglet Intelligence prix */}
        <TabsContent value="prices" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">URLs des concurrents à analyser</h3>
            <div className="space-y-3 mb-4">
              {competitorUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`URL concurrent ${index + 1}...`}
                    value={url}
                    onChange={(e) => updateCompetitorUrl(index, e.target.value)}
                    className="flex-1"
                  />
                  {competitorUrls.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeCompetitorUrl(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={addCompetitorUrl}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter URL
              </Button>
              <Button
                onClick={handleAnalyzePrices}
                disabled={competitorUrls.filter(u => u.trim()).length === 0 || analyzePrices.isPending}
              >
                {analyzePrices.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <DollarSign className="h-4 w-4 mr-2" />
                )}
                Analyser les prix
              </Button>
            </div>

            {priceResult && (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Prix moyen marché</p>
                    <p className="text-2xl font-bold">{priceResult.market_avg_price}€</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Prix recommandé</p>
                    <p className="text-2xl font-bold text-primary">{priceResult.recommended_price}€</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Plage de prix</p>
                    <p className="text-lg font-bold">{priceResult.market_min_price}€ - {priceResult.market_max_price}€</p>
                  </Card>
                </div>

                {priceResult.competitor_prices.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Concurrent</th>
                          <th className="text-right py-2">Prix moyen</th>
                          <th className="text-right py-2">Min</th>
                          <th className="text-right py-2">Max</th>
                          <th className="text-center py-2">Position</th>
                          <th className="text-center py-2">SEO</th>
                        </tr>
                      </thead>
                      <tbody>
                        {priceResult.competitor_prices.map((comp, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2">
                              <a href={comp.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                                {comp.hostname}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </td>
                            <td className="text-right py-2 font-medium">{comp.current_price}€</td>
                            <td className="text-right py-2">{comp.min_price}€</td>
                            <td className="text-right py-2">{comp.max_price}€</td>
                            <td className="text-center py-2">
                              <Badge variant="outline" className="capitalize">{comp.price_position}</Badge>
                            </td>
                            <td className="text-center py-2">{comp.seo_score}/100</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {priceResult.failed_urls.length > 0 && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {priceResult.failed_urls.length} URL(s) n'ont pas pu être analysées
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Onglet Historique */}
        <TabsContent value="history">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique des analyses
            </h3>

            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : historyData && historyData.length > 0 ? (
              <div className="space-y-3">
                {historyData.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.competitor_name}</span>
                        <Badge variant="outline" className="capitalize">{item.market_position}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate max-w-md">
                        {item.competitor_url}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(item.updated_at), 'PPp', { locale: fr })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setProductUrl(item.competitor_url || '');
                          if (item.competitive_data) {
                            setAnalysisResult({
                              product_url: item.competitor_url || '',
                              title: item.competitive_data.title || '',
                              estimated_monthly_sales: 0,
                              estimated_revenue: 0,
                              market_saturation_score: 0.5,
                              competition_level: 'medium',
                              price_position: item.market_position as any || 'competitive',
                              trend_direction: 'stable',
                              predicted_growth: '+5%',
                              competitors_count: 0,
                              avg_competitor_price: item.price_analysis?.avgPrice || '0',
                              social_mentions: 0,
                              seo_score: item.competitive_data.seoScore || 0,
                              review_count: 0,
                              rating: 0,
                              ad_activity: { facebook_ads: 0, google_ads: 0, tiktok_ads: 0 },
                              opportunities: item.recommendations || []
                            });
                          }
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAnalysis.mutate(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucune analyse dans l'historique</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
