/**
 * CatalogHealthAIPanel - Panneau IA pour la santé catalogue
 * Prédictions, insights et actions automatisées
 */
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Zap,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  BarChart3,
  Loader2
} from 'lucide-react'
import { 
  useCatalogHealthAIStats, 
  useHealthRecommendations,
  useApplyHealthRecommendation,
  type HealthRecommendation,
  type HealthPriorityAction
} from '@/hooks/catalog/useCatalogHealthAI'
import { cn } from '@/lib/utils'

export function CatalogHealthAIPanel() {
  const { aiStats, metrics, isLoading } = useCatalogHealthAIStats()
  const { recommendations } = useHealthRecommendations()
  const applyMutation = useApplyHealthRecommendation()

  if (isLoading || !aiStats || !metrics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Analyse IA en cours...</span>
        </div>
      </div>
    )
  }

  const trendIcon = aiStats.healthTrendPrediction === 'improving' ? TrendingUp :
                    aiStats.healthTrendPrediction === 'declining' ? TrendingDown : Minus
  
  const trendColor = aiStats.healthTrendPrediction === 'improving' ? 'text-emerald-500' :
                     aiStats.healthTrendPrediction === 'declining' ? 'text-red-500' : 'text-amber-500'

  const riskColors = {
    low: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    high: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
    critical: 'bg-red-500/10 text-red-700 border-red-500/20'
  }

  return (
    <div className="space-y-6">
      {/* Header IA avec prédictions */}
      <Card className="bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-fuchsia-500/5 border-violet-500/20">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-violet-500/10">
                <Brain className="h-8 w-8 text-violet-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  Intelligence Catalogue
                  <Badge variant="outline" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    IA Active
                  </Badge>
                </h3>
                <p className="text-muted-foreground mt-1">
                  Prédictions et recommandations basées sur vos données
                </p>
              </div>
            </div>
            <Badge className={cn("text-sm px-3 py-1", riskColors[aiStats.riskLevel])}>
              Risque {aiStats.riskLevel === 'low' ? 'Faible' : 
                      aiStats.riskLevel === 'medium' ? 'Modéré' :
                      aiStats.riskLevel === 'high' ? 'Élevé' : 'Critique'}
            </Badge>
          </div>

          {/* Métriques prédictives */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-background/50 rounded-xl p-4 border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                {React.createElement(trendIcon, { className: cn("h-4 w-4", trendColor) })}
                Tendance
              </div>
              <div className={cn("text-2xl font-bold", trendColor)}>
                {aiStats.healthTrendPrediction === 'improving' ? 'En hausse' :
                 aiStats.healthTrendPrediction === 'declining' ? 'En baisse' : 'Stable'}
              </div>
            </div>

            <div className="bg-background/50 rounded-xl p-4 border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Target className="h-4 w-4" />
                Score J+7
              </div>
              <div className="text-2xl font-bold">{aiStats.predictedScoreIn7Days}%</div>
              <div className="text-xs text-muted-foreground">
                {aiStats.predictedScoreIn7Days > metrics.globalScore ? '+' : ''}
                {aiStats.predictedScoreIn7Days - metrics.globalScore} pts
              </div>
            </div>

            <div className="bg-background/50 rounded-xl p-4 border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Zap className="h-4 w-4" />
                Automatisable
              </div>
              <div className="text-2xl font-bold">{aiStats.automationPotential}%</div>
              <Progress value={aiStats.automationPotential} className="h-1.5 mt-2" />
            </div>

            <div className="bg-background/50 rounded-xl p-4 border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Clock className="h-4 w-4" />
                Temps vers 100%
              </div>
              <div className="text-2xl font-bold">{aiStats.estimatedTimeToFullHealth}j</div>
              <div className="text-xs text-muted-foreground">au rythme actuel</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions prioritaires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Actions prioritaires
            <Badge variant="secondary" className="ml-2">
              {aiStats.priorityActions.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {aiStats.priorityActions.slice(0, 4).map((action) => (
              <PriorityActionCard key={action.id} action={action} />
            ))}
            {aiStats.priorityActions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
                <p>Aucune action prioritaire identifiée</p>
                <p className="text-sm">Votre catalogue est en excellente santé !</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommandations IA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Recommandations IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.slice(0, 4).map((rec) => (
              <RecommendationCard 
                key={rec.id} 
                recommendation={rec}
                onApply={() => applyMutation.mutate(rec)}
                isApplying={applyMutation.isPending}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights par catégorie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            Santé par catégorie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiStats.categoryInsights.map((insight) => (
              <div key={insight.category} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium truncate">{insight.category}</span>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-medium",
                        insight.healthScore >= 70 ? "text-emerald-600" :
                        insight.healthScore >= 50 ? "text-amber-600" : "text-red-600"
                      )}>
                        {insight.healthScore}%
                      </span>
                      {insight.trend === 'up' && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                      {insight.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                    </div>
                  </div>
                  <Progress 
                    value={insight.healthScore} 
                    className={cn(
                      "h-2",
                      insight.healthScore >= 70 ? "[&>div]:bg-emerald-500" :
                      insight.healthScore >= 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"
                    )}
                  />
                  {insight.issues.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {insight.issues.join(' • ')}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="shrink-0">
                  {insight.productCount}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Benchmark */}
      <Card className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                📊 Benchmark Industrie
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Comparaison avec les catalogues similaires
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                Top {100 - aiStats.benchmarkComparison.percentile}%
              </div>
              <p className="text-sm text-muted-foreground">
                Moyenne industrie: {aiStats.benchmarkComparison.industryAverage}%
              </p>
            </div>
          </div>
          {aiStats.benchmarkComparison.topPerformerGap > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-background/50 border">
              <p className="text-sm">
                💡 <span className="font-medium">+{aiStats.benchmarkComparison.topPerformerGap} points</span> pour atteindre le niveau des top performers
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Sous-composant pour les actions prioritaires
function PriorityActionCard({ action }: { action: HealthPriorityAction }) {
  const typeColors = {
    critical: 'border-l-red-500 bg-red-500/5',
    high: 'border-l-orange-500 bg-orange-500/5',
    medium: 'border-l-amber-500 bg-amber-500/5',
    low: 'border-l-blue-500 bg-blue-500/5'
  }

  return (
    <div className={cn(
      "p-4 rounded-lg border border-l-4 transition-all hover:shadow-md",
      typeColors[action.type]
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{action.title}</h4>
            {action.automatable && (
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Auto
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>{action.affectedProducts} produits</span>
            <span>+{action.estimatedGain} pts potentiel</span>
            <span>Effort: {'★'.repeat(action.effortScore)}{'☆'.repeat(5 - action.effortScore)}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant={action.type === 'critical' ? 'destructive' : 'secondary'}>
            Impact: {action.impactScore}%
          </Badge>
        </div>
      </div>
    </div>
  )
}

// Sous-composant pour les recommandations
function RecommendationCard({ 
  recommendation, 
  onApply,
  isApplying 
}: { 
  recommendation: HealthRecommendation
  onApply: () => void
  isApplying: boolean
}) {
  const typeIcons = {
    quick_win: '🚀',
    strategic: '📊',
    automation: '⚡',
    batch_fix: '🔧'
  }

  const impactColors = {
    high: 'text-emerald-600',
    medium: 'text-amber-600',
    low: 'text-blue-600'
  }

  return (
    <div className="p-4 rounded-lg border bg-card hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium flex items-center gap-2">
            <span>{typeIcons[recommendation.type]}</span>
            {recommendation.title}
          </h4>
          <p className="text-sm text-muted-foreground mt-1">{recommendation.description}</p>
          <div className="flex items-center gap-4 mt-3">
            <Badge variant="outline" className={cn("text-xs", impactColors[recommendation.impact])}>
              +{recommendation.estimatedScoreGain} pts
            </Badge>
            <span className="text-xs text-muted-foreground">
              {recommendation.affectedProducts} produits
            </span>
            <span className="text-xs text-muted-foreground">
              ~{Math.round(recommendation.estimatedTimeMinutes)} min
            </span>
          </div>
        </div>
        <Button 
          size="sm" 
          onClick={onApply}
          disabled={isApplying}
        >
          {isApplying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Appliquer
              <ArrowRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
