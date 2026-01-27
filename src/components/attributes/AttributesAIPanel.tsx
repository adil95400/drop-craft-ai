/**
 * AttributesAIPanel - AI recommendations for attribute enrichment
 * Phase 2: Command Center style for attributes optimization
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  Sparkles, 
  Target, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Zap
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  useAttributesAIStats,
  useAttributeRecommendations,
  useMarketplaceReadiness,
  useApplyAttributeRecommendation
} from '@/hooks/catalog/useAttributesAI'
import { cn } from '@/lib/utils'

const priorityColors = {
  high: 'border-red-500/50 bg-red-500/5',
  medium: 'border-yellow-500/50 bg-yellow-500/5',
  low: 'border-blue-500/50 bg-blue-500/5'
}

const priorityBadges = {
  high: 'bg-red-500/10 text-red-600 border-red-500/30',
  medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  low: 'bg-blue-500/10 text-blue-600 border-blue-500/30'
}

export function AttributesAIPanel() {
  const { stats, isLoading } = useAttributesAIStats()
  const { recommendations } = useAttributeRecommendations()
  const { marketplaces } = useMarketplaceReadiness()
  const applyRecommendation = useApplyAttributeRecommendation()

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="py-10 text-center text-muted-foreground">
          <Brain className="h-8 w-8 mx-auto mb-3 animate-pulse" />
          Analyse IA en cours...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* AI Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="outline" className="text-xs">Score IA</Badge>
              </div>
              <div className="text-3xl font-bold mb-1">{stats.optimizationScore}%</div>
              <Progress value={stats.optimizationScore} className="h-1.5 mb-2" />
              <p className="text-xs text-muted-foreground">Optimisation attributs</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{stats.productsWithIssues}</div>
              <p className="text-xs text-muted-foreground">Produits à enrichir</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">+{stats.potentialVisibilityGain}%</div>
              <p className="text-xs text-muted-foreground">Gain visibilité potentiel</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{stats.estimatedTimeSaved}h</div>
              <p className="text-xs text-muted-foreground">Temps économisé/mois</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Recommendations */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Recommandations IA
                </CardTitle>
                <CardDescription>
                  Actions prioritaires pour optimiser vos attributs
                </CardDescription>
              </div>
              {recommendations.length > 0 && (
                <Badge variant="secondary">{recommendations.length} actions</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {recommendations.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
                <p className="font-medium">Excellent !</p>
                <p className="text-sm text-muted-foreground">
                  Tous vos attributs sont optimisés
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      'p-4 rounded-lg border transition-colors hover:bg-muted/50',
                      priorityColors[rec.priority]
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{rec.title}</h4>
                          <Badge 
                            variant="outline" 
                            className={cn('text-xs', priorityBadges[rec.priority])}
                          >
                            {rec.priority === 'high' ? 'Urgent' : rec.priority === 'medium' ? 'Moyen' : 'Optionnel'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {rec.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-muted-foreground">
                            {rec.impactedProducts} produits
                          </span>
                          <span className="text-green-600 font-medium">
                            {rec.estimatedImpact}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => applyRecommendation.mutate(rec.type)}
                        disabled={applyRecommendation.isPending}
                        className="shrink-0"
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        Appliquer
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Marketplace Readiness */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Compatibilité Marketplaces
            </CardTitle>
            <CardDescription>
              État de préparation par plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {marketplaces.map((mp, index) => (
                <motion.div
                  key={mp.marketplace}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full', mp.color)} />
                      <span className="font-medium text-sm">{mp.marketplace}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {mp.readyCount}/{mp.totalCount}
                      </span>
                      <Badge 
                        variant={mp.score >= 80 ? 'default' : mp.score >= 50 ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {mp.score}%
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={mp.score} 
                    className={cn(
                      'h-2',
                      mp.score >= 80 ? '[&>div]:bg-green-500' : 
                      mp.score >= 50 ? '[&>div]:bg-yellow-500' : 
                      '[&>div]:bg-red-500'
                    )} 
                  />
                  {mp.topIssues.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {mp.topIssues.slice(0, 2).map((issue, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {issue}
                        </Badge>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
