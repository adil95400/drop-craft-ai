/**
 * Feed Optimization Page - ChannablePageWrapper Standard
 * Optimisation IA des feeds
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, TrendingUp, AlertTriangle, CheckCircle, Zap,
  Lightbulb, Target, BarChart3, Package, Loader2, Play, ChevronRight, ArrowRight
} from 'lucide-react';
import { FeedSubNavigation } from '@/components/feeds/FeedSubNavigation';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';
import { 
  useOptimizableProducts, useAnalyzeProducts, useOptimizeProducts,
  useFeedRecommendations, useApplyOptimization
} from '@/hooks/useFeedOptimization';
import { motion } from 'framer-motion';

export default function FeedOptimizationPage() {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [optimizationResults, setOptimizationResults] = useState<any[]>([]);

  const { data: products = [], isLoading: isLoadingProducts } = useOptimizableProducts();
  const { data: recommendations, isLoading: isLoadingRecommendations } = useFeedRecommendations(products);
  
  const analyzeProducts = useAnalyzeProducts();
  const optimizeProducts = useOptimizeProducts();
  const applyOptimization = useApplyOptimization();

  const handleAnalyze = async () => {
    const productsToAnalyze = selectedProducts.length > 0 
      ? products.filter(p => selectedProducts.includes(p.id))
      : products.slice(0, 20);
    const results = await analyzeProducts.mutateAsync({ products: productsToAnalyze });
    setAnalysisResults(results);
  };

  const handleOptimize = async () => {
    const productsToOptimize = selectedProducts.length > 0 
      ? products.filter(p => selectedProducts.includes(p.id))
      : products.slice(0, 5);
    const results = await optimizeProducts.mutateAsync({ products: productsToOptimize });
    setOptimizationResults(results);
  };

  const handleApplyAll = () => {
    if (optimizationResults.length > 0) {
      applyOptimization.mutate(optimizationResults);
    }
  };

  const stats = {
    totalProducts: products.length,
    analyzed: analysisResults.length,
    optimized: optimizationResults.length,
    avgScore: analysisResults.length > 0 
      ? Math.round(analysisResults.reduce((acc, r) => acc + r.score, 0) / analysisResults.length)
      : recommendations?.overallScore || 0,
    highIssues: analysisResults.filter(r => r.issues.some((i: any) => i.severity === 'high')).length,
    mediumIssues: analysisResults.filter(r => r.issues.some((i: any) => i.severity === 'medium')).length,
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <ChannablePageWrapper
      title="Optimisation IA des Feeds"
      subtitle="Performance"
      description={`${stats.totalProducts} produits • Score global ${stats.avgScore}/100 • ${stats.highIssues} problèmes critiques`}
      heroImage="ai"
      badge={{ label: "IA", icon: Sparkles }}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAnalyze} disabled={analyzeProducts.isPending || products.length === 0}>
            {analyzeProducts.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <BarChart3 className="h-4 w-4 mr-2" />}
            Analyser
          </Button>
          <Button onClick={handleOptimize} disabled={optimizeProducts.isPending || products.length === 0}>
            {optimizeProducts.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Optimiser avec IA
          </Button>
        </div>
      }
    >
      <FeedSubNavigation />
      <AdvancedFeatureGuide {...ADVANCED_GUIDES.feedOptimization} />

      {/* Score Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Score Global</p>
                <p className={`text-3xl font-bold ${getScoreColor(stats.avgScore)}`}>{stats.avgScore}/100</p>
              </div>
              <div className={`w-12 h-12 rounded-full ${getScoreBgColor(stats.avgScore)} bg-opacity-20 flex items-center justify-center`}>
                <Target className={`h-6 w-6 ${getScoreColor(stats.avgScore)}`} />
              </div>
            </div>
            <Progress value={stats.avgScore} className="mt-3 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl"><Package className="h-6 w-6 text-primary" /></div>
              <div><p className="text-2xl font-bold">{stats.totalProducts}</p><p className="text-sm text-muted-foreground">Produits</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-xl"><AlertTriangle className="h-6 w-6 text-red-500" /></div>
              <div><p className="text-2xl font-bold text-red-500">{stats.highIssues}</p><p className="text-sm text-muted-foreground">Critiques</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-xl"><TrendingUp className="h-6 w-6 text-yellow-500" /></div>
              <div><p className="text-2xl font-bold text-yellow-500">{stats.mediumIssues}</p><p className="text-sm text-muted-foreground">À améliorer</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl"><CheckCircle className="h-6 w-6 text-green-500" /></div>
              <div><p className="text-2xl font-bold text-green-500">{stats.optimized}</p><p className="text-sm text-muted-foreground">Optimisés</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="recommendations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommendations"><Lightbulb className="h-4 w-4 mr-2" />Recommandations IA</TabsTrigger>
          <TabsTrigger value="analysis"><BarChart3 className="h-4 w-4 mr-2" />Analyse détaillée</TabsTrigger>
          <TabsTrigger value="optimizations"><Sparkles className="h-4 w-4 mr-2" />Optimisations</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          {isLoadingProducts || isLoadingRecommendations ? (
            <Card><CardContent className="py-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" /><p className="text-muted-foreground">Analyse en cours...</p></CardContent></Card>
          ) : recommendations?.recommendations && recommendations.recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.summary && (
                <Card className="bg-primary/5 border-primary/20"><CardContent className="py-4"><p className="text-sm">{recommendations.summary}</p></CardContent></Card>
              )}
              {recommendations.recommendations.map((rec: any, index: number) => (
                <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${rec.impact === 'high' ? 'bg-red-500' : rec.impact === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`}>
                            {rec.priority}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{rec.title}</h3>
                              <Badge variant={rec.impact === 'high' ? 'destructive' : rec.impact === 'medium' ? 'secondary' : 'outline'}>
                                Impact {rec.impact === 'high' ? 'élevé' : rec.impact === 'medium' ? 'moyen' : 'faible'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{rec.description}</p>
                            {rec.affectedProducts > 0 && <p className="text-xs text-muted-foreground mt-1">{rec.affectedProducts} produit(s) concerné(s)</p>}
                          </div>
                        </div>
                        <Button variant="outline" size="sm"><Zap className="h-4 w-4 mr-1" />Corriger</Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card><CardContent className="py-12 text-center">
              <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Aucune recommandation</h3>
              <p className="text-muted-foreground text-sm">{products.length === 0 ? "Ajoutez des produits pour obtenir des recommandations IA" : "Vos produits semblent bien optimisés !"}</p>
            </CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {analysisResults.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Aucune analyse</h3>
              <p className="text-muted-foreground text-sm mb-4">Cliquez sur "Analyser" pour scanner vos produits</p>
              <Button onClick={handleAnalyze} disabled={analyzeProducts.isPending}>
                {analyzeProducts.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                Lancer l'analyse
              </Button>
            </CardContent></Card>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3 pr-4">
                {analysisResults.map((result) => (
                  <Card key={result.productId} className={result.score < 60 ? 'border-red-200' : ''}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium truncate">{result.originalTitle || 'Sans titre'}</h4>
                            <Badge className={getScoreBgColor(result.score)}>{result.score}/100</Badge>
                          </div>
                          {result.issues.length > 0 && (
                            <div className="space-y-1">
                              {result.issues.map((issue: any, i: number) => (
                                <div key={i} className="flex items-start gap-2 text-sm">
                                  <AlertTriangle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${issue.severity === 'high' ? 'text-red-500' : issue.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'}`} />
                                  <div><span className="font-medium">{issue.message}</span><span className="text-muted-foreground"> - {issue.suggestion}</span></div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="sm"><ChevronRight className="h-4 w-4" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="optimizations" className="space-y-4">
          {optimizationResults.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Aucune optimisation</h3>
              <p className="text-muted-foreground text-sm mb-4">Cliquez sur "Optimiser avec IA" pour générer des améliorations</p>
              <Button onClick={handleOptimize} disabled={optimizeProducts.isPending}>
                {optimizeProducts.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                Lancer l'optimisation
              </Button>
            </CardContent></Card>
          ) : (
            <>
              <div className="flex justify-end">
                <Button onClick={handleApplyAll} disabled={applyOptimization.isPending}>
                  {applyOptimization.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Appliquer toutes les optimisations
                </Button>
              </div>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4 pr-4">
                  {optimizationResults.map((result) => (
                    <Card key={result.productId} className="border-primary/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />Optimisation proposée
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {result.optimizedTitle && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Titre</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div className="p-3 bg-muted/50 rounded-lg"><p className="text-xs text-muted-foreground mb-1">Avant</p><p className="text-sm">{result.originalTitle}</p></div>
                              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg"><p className="text-xs text-primary mb-1">Après (IA)</p><p className="text-sm">{result.optimizedTitle}</p></div>
                            </div>
                          </div>
                        )}
                        {result.optimizedDescription && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Description</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div className="p-3 bg-muted/50 rounded-lg max-h-32 overflow-y-auto"><p className="text-xs text-muted-foreground mb-1">Avant</p><p className="text-sm">{result.originalDescription || 'Aucune description'}</p></div>
                              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg max-h-32 overflow-y-auto"><p className="text-xs text-primary mb-1">Après (IA)</p><p className="text-sm">{result.optimizedDescription}</p></div>
                            </div>
                          </div>
                        )}
                        {result.suggestions && result.suggestions.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Suggestions</p>
                            <ul className="space-y-1">
                              {result.suggestions.map((s: string, i: number) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <ArrowRight className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary" />{s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
