import { useState } from 'react'
import { Brain, TrendingUp, Target, Zap, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface AIAnalysisProps {
  products: any[]
  onAnalysisComplete?: (analysis: any) => void
}

interface AnalysisResult {
  type: string
  analysis: any
  timestamp: string
  productsAnalyzed: number
}

export function AIAnalysisInterface({ products, onAnalysisComplete }: AIAnalysisProps) {
  const { toast } = useToast()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [activeTab, setActiveTab] = useState('optimization')

  const runAIAnalysis = async (analysisType: string) => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    
    try {
      // Simulation du progrès
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const { data, error } = await supabase.functions.invoke('ai-catalog-analysis', {
        body: {
          analysisType,
          productData: products.slice(0, 20), // Limiter pour l'analyse
          marketData: {
            timestamp: new Date().toISOString(),
            totalProducts: products.length
          }
        }
      })

      clearInterval(progressInterval)
      setAnalysisProgress(100)

      if (error) {
        throw new Error(error.message)
      }

      const analysisResult: AnalysisResult = {
        type: analysisType,
        analysis: data.analysis,
        timestamp: data.timestamp,
        productsAnalyzed: data.productsAnalyzed
      }

      setCurrentAnalysis(analysisResult)
      onAnalysisComplete?.(analysisResult)

      toast({
        title: "Analyse IA terminée",
        description: `${data.productsAnalyzed} produits analysés avec succès`,
      })

    } catch (error) {
      toast({
        title: "Erreur d'analyse",
        description: error instanceof Error ? error.message : "Erreur lors de l'analyse IA",
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
      setAnalysisProgress(0)
    }
  }

  const renderOptimizationResults = () => {
    if (!currentAnalysis?.analysis) return null

    const analysis = currentAnalysis.analysis

    return (
      <div className="space-y-4">
        {/* Top produits */}
        {analysis.topProducts && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-500" />
                Top Produits Identifiés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {analysis.topProducts.map((product: any, index: number) => (
                  <div key={index} className="p-3 border rounded-lg bg-green-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{product.name || `Produit ${index + 1}`}</h4>
                        <p className="text-sm text-muted-foreground">{product.justification}</p>
                      </div>
                      <Badge className="bg-green-500">Score: {product.score}/100</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommandations de prix */}
        {analysis.priceRecommendations && (
          <Card>
            <CardHeader>
              <CardTitle>Optimisation des Prix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.priceRecommendations.map((rec: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded">
                    <span className="font-medium">{rec.product}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{rec.currentPrice}€</span>
                      <span className="mx-2">→</span>
                      <span className="font-bold text-green-600">{rec.recommendedPrice}€</span>
                      <Badge variant="outline">+{rec.improvement}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const renderTrendAnalysis = () => {
    if (!currentAnalysis?.analysis) return null

    const analysis = currentAnalysis.analysis

    return (
      <div className="space-y-4">
        {/* Tendances par catégorie */}
        {analysis.categoryTrends && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Tendances par Catégorie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {analysis.categoryTrends.map((trend: any, index: number) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{trend.category}</h4>
                      <Badge variant={trend.trend === 'rising' ? 'default' : 'secondary'}>
                        {trend.growth}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{trend.insights}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Opportunités de croissance */}
        {analysis.growthOpportunities && (
          <Card>
            <CardHeader>
              <CardTitle>Opportunités de Croissance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.growthOpportunities.map((opp: any, index: number) => (
                  <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900">{opp.opportunity}</h4>
                    <p className="text-sm text-blue-700">{opp.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-blue-500">Potentiel: {opp.potential}</Badge>
                      <Badge variant="outline">Difficulté: {opp.difficulty}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec boutons d'analyse */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-500" />
            Intelligence Artificielle Avancée
          </CardTitle>
          <CardDescription>
            Analyses de votre catalogue basées sur {products.length} produits réels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => runAIAnalysis('product_optimization')}
              disabled={isAnalyzing}
              className="bg-gradient-to-r from-purple-500 to-pink-500"
            >
              {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
              Optimisation Produits
            </Button>
            <Button 
              onClick={() => runAIAnalysis('market_trends')}
              disabled={isAnalyzing}
              variant="outline"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Analyse Tendances
            </Button>
            <Button 
              onClick={() => runAIAnalysis('competitor_analysis')}
              disabled={isAnalyzing}
              variant="outline"
            >
              <Target className="w-4 h-4 mr-2" />
              Analyse Concurrence
            </Button>
          </div>

          {/* Barre de progression */}
          {isAnalyzing && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Analyse IA en cours...</span>
                <span>{analysisProgress}%</span>
              </div>
              <Progress value={analysisProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Résultats d'analyse */}
      {currentAnalysis && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <CardTitle>Résultats d'Analyse IA</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {currentAnalysis.productsAnalyzed} produits analysés
                </Badge>
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </div>
            <CardDescription>
              Analyse générée le {new Date(currentAnalysis.timestamp).toLocaleString('fr-FR')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="optimization">Optimisation</TabsTrigger>
                <TabsTrigger value="trends">Tendances</TabsTrigger>
                <TabsTrigger value="raw">Données Brutes</TabsTrigger>
              </TabsList>

              <TabsContent value="optimization" className="mt-4">
                {renderOptimizationResults()}
              </TabsContent>

              <TabsContent value="trends" className="mt-4">
                {renderTrendAnalysis()}
              </TabsContent>

              <TabsContent value="raw" className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto max-h-96">
                      {JSON.stringify(currentAnalysis.analysis, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Message si pas d'analyse */}
      {!currentAnalysis && !isAnalyzing && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Aucune analyse IA disponible
            </h3>
            <p className="text-gray-500 text-center mb-4">
              Lancez une analyse pour obtenir des insights intelligent sur votre catalogue
            </p>
            <Button onClick={() => runAIAnalysis('product_optimization')}>
              <Zap className="w-4 h-4 mr-2" />
              Démarrer l'analyse
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}