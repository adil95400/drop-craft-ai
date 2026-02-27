/**
 * AIRecommendationsPage — Real AI-powered recommendations with cross-sell & metrics
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Helmet } from 'react-helmet-async'
import {
  TrendingUp, ShoppingBag, AlertTriangle, Bell, Sparkles,
  ArrowUpRight, Package, DollarSign, Flame, Eye, Loader2,
  RefreshCw, CheckCircle2, XCircle, BarChart3, Zap, Target,
  ThumbsUp, ThumbsDown, Link2
} from 'lucide-react'
import { useAIRecommendations } from '@/hooks/useAIRecommendations'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const TYPE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  trending: { icon: Flame, color: 'bg-orange-500', label: 'Tendance' },
  cross_sell: { icon: Link2, color: 'bg-purple-500', label: 'Cross-Sell' },
  upsell: { icon: ArrowUpRight, color: 'bg-emerald-500', label: 'Up-Sell' },
  restock: { icon: Package, color: 'bg-blue-500', label: 'Stock' },
  pricing: { icon: DollarSign, color: 'bg-green-500', label: 'Prix' },
  bundle: { icon: ShoppingBag, color: 'bg-pink-500', label: 'Bundle' },
}

export default function AIRecommendationsPage() {
  const {
    recommendations, isLoading, affinities, affinitiesLoading,
    metrics, generate, computeCrossSell, updateStatus,
  } = useAIRecommendations()

  const pendingRecs = recommendations.filter(r => r.status === 'pending')
  const acceptedRecs = recommendations.filter(r => r.status === 'accepted')

  // Aggregate metrics
  const totalGenerated = metrics.reduce((s: number, m: any) => s + (m.total_generated || 0), 0)
  const totalAccepted = metrics.reduce((s: number, m: any) => s + (m.total_accepted || 0), 0)
  const avgConfidence = recommendations.length > 0
    ? Math.round(recommendations.reduce((s, r) => s + r.confidence_score, 0) / recommendations.length)
    : 0

  return (
    <>
      <Helmet>
        <title>Moteur de Recommandation IA | Drop Craft AI</title>
        <meta name="description" content="Recommandations IA basées sur vos ventes, cross-selling collaboratif et alertes proactives." />
      </Helmet>

      <ChannablePageWrapper
        title="Moteur de Recommandation IA"
        description="Recommandations intelligentes basées sur vos données réelles"
        heroImage="ai"
        badge={{ label: 'AI Engine', icon: Sparkles }}
        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => computeCrossSell.mutate()}
              disabled={computeCrossSell.isPending}
            >
              <Link2 className={cn("h-4 w-4 mr-2", computeCrossSell.isPending && "animate-spin")} />
              Cross-Sell
            </Button>
            <Button
              size="sm"
              onClick={() => generate.mutate()}
              disabled={generate.isPending}
            >
              {generate.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Générer
            </Button>
          </div>
        }
      >
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Recommandations</p>
                  <p className="text-2xl font-bold">{pendingRecs.length}</p>
                  <p className="text-xs text-muted-foreground">en attente</p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Taux d'adoption</p>
                  <p className="text-2xl font-bold">
                    {totalGenerated > 0 ? Math.round((totalAccepted / totalGenerated) * 100) : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">{totalAccepted}/{totalGenerated} acceptées</p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Target className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Confiance moy.</p>
                  <p className="text-2xl font-bold">{avgConfidence}%</p>
                  <Progress value={avgConfidence} className="h-1.5 mt-2" />
                </div>
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Paires Cross-Sell</p>
                  <p className="text-2xl font-bold">{affinities.length}</p>
                  <p className="text-xs text-muted-foreground">détectées</p>
                </div>
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Link2 className="h-5 w-5 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="recommendations" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-10">
            <TabsTrigger value="recommendations" className="gap-1.5">
              <Zap className="h-4 w-4" />Recommandations
              {pendingRecs.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 ml-1">{pendingRecs.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="crosssell" className="gap-1.5">
              <ShoppingBag className="h-4 w-4" />Cross-Sell
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <BarChart3 className="h-4 w-4" />Historique
            </TabsTrigger>
          </TabsList>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations">
            {isLoading || generate.isPending ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
                  <p className="text-muted-foreground">
                    {generate.isPending ? 'L\'IA analyse vos données...' : 'Chargement...'}
                  </p>
                </CardContent>
              </Card>
            ) : pendingRecs.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Aucune recommandation en attente</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                    Cliquez sur "Générer" pour que l'IA analyse vos produits, commandes et métriques de vente.
                  </p>
                  <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
                    <Sparkles className="h-4 w-4 mr-2" />Lancer l'analyse IA
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence>
                <div className="space-y-3">
                  {pendingRecs.map((rec, index) => {
                    const typeConf = TYPE_CONFIG[rec.recommendation_type] || TYPE_CONFIG.trending
                    const Icon = typeConf.icon
                    return (
                      <motion.div
                        key={rec.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="hover:shadow-md transition-all">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={cn("p-2 rounded-lg shrink-0", typeConf.color)}>
                                <Icon className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-sm truncate">{rec.title}</h3>
                                  <Badge variant="outline" className="text-[10px] shrink-0">{typeConf.label}</Badge>
                                  <Badge className={cn(
                                    "text-[10px] shrink-0",
                                    rec.confidence_score >= 80 ? "bg-emerald-500" :
                                    rec.confidence_score >= 60 ? "bg-amber-500" : "bg-muted"
                                  )}>
                                    {rec.confidence_score}%
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">{rec.description}</p>
                                
                                {rec.reasoning && (
                                  <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mb-2">
                                    💡 {rec.reasoning}
                                  </p>
                                )}

                                <div className="flex items-center justify-between">
                                  {rec.impact_estimate && (
                                    <span className="text-xs font-medium text-primary">
                                      📊 {rec.impact_estimate}
                                    </span>
                                  )}
                                  <div className="flex gap-1.5 ml-auto">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-xs text-red-500 hover:text-red-600"
                                      onClick={() => updateStatus.mutate({ id: rec.id, action: 'dismiss' })}
                                    >
                                      <ThumbsDown className="h-3 w-3 mr-1" />Ignorer
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => updateStatus.mutate({ id: rec.id, action: 'accept' })}
                                    >
                                      <ThumbsUp className="h-3 w-3 mr-1" />Appliquer
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </AnimatePresence>
            )}
          </TabsContent>

          {/* Cross-Sell Tab */}
          <TabsContent value="crosssell">
            {affinitiesLoading || computeCrossSell.isPending ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
                  <p className="text-muted-foreground">Analyse des affinités produits...</p>
                </CardContent>
              </Card>
            ) : affinities.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Cross-Selling Collaboratif</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                    L'IA analyse vos commandes pour identifier les produits fréquemment achetés ensemble et maximiser le panier moyen.
                  </p>
                  <Button onClick={() => computeCrossSell.mutate()} disabled={computeCrossSell.isPending}>
                    <Link2 className="h-4 w-4 mr-2" />Analyser les affinités
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="py-3 px-4">
                    <p className="text-sm">
                      <strong>{affinities.length} paires</strong> de produits fréquemment achetés ensemble détectées par analyse collaborative.
                    </p>
                  </CardContent>
                </Card>
                {affinities.map((aff) => (
                  <Card key={aff.id} className="hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{aff.product_a?.title || 'Produit A'}</p>
                          <p className="text-xs text-muted-foreground">{aff.product_a?.sale_price?.toFixed(2)}€</p>
                        </div>
                        <div className="flex flex-col items-center shrink-0">
                          <Link2 className="h-4 w-4 text-purple-500" />
                          <Badge variant="outline" className="text-[10px] mt-1">
                            {aff.co_occurrence_count}x ensemble
                          </Badge>
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <p className="font-medium text-sm truncate">{aff.product_b?.title || 'Produit B'}</p>
                          <p className="text-xs text-muted-foreground">{aff.product_b?.sale_price?.toFixed(2)}€</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Score d'affinité</span>
                          <span className="font-medium">{aff.affinity_score}%</span>
                        </div>
                        <Progress value={aff.affinity_score} className="h-1.5" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            {acceptedRecs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Pas encore d'historique</h3>
                  <p className="text-sm text-muted-foreground">Les recommandations acceptées apparaîtront ici.</p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {acceptedRecs.map(rec => {
                    const typeConf = TYPE_CONFIG[rec.recommendation_type] || TYPE_CONFIG.trending
                    const Icon = typeConf.icon
                    return (
                      <Card key={rec.id} className="border-emerald-200/50 bg-emerald-50/30 dark:bg-emerald-950/10">
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className={cn("p-1.5 rounded-lg shrink-0", typeConf.color)}>
                            <Icon className="h-3.5 w-3.5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{rec.title}</p>
                            <p className="text-xs text-muted-foreground">{rec.impact_estimate}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300 shrink-0">
                            <CheckCircle2 className="h-3 w-3 mr-1" />Acceptée
                          </Badge>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  )
}
