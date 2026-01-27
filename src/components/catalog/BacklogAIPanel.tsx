/**
 * BacklogAIPanel - Panneau IA pour le backlog produit
 * Phase 2: Insights et automatisations
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  Clock, 
  Euro, 
  Sparkles,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Bot,
  BarChart3
} from 'lucide-react'
import { 
  useBacklogAIStats, 
  useBacklogRecommendations,
  useApplyBacklogRecommendation,
  BacklogRecommendation
} from '@/hooks/catalog/useProductBacklogAI'
import { cn } from '@/lib/utils'

export function BacklogAIPanel() {
  const { stats, isLoading: statsLoading } = useBacklogAIStats()
  const { recommendations, isLoading: recsLoading } = useBacklogRecommendations()
  const applyMutation = useApplyBacklogRecommendation()

  const isLoading = statsLoading || recsLoading

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600'
    if (score >= 60) return 'text-amber-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Bon'
    if (score >= 40) return 'À améliorer'
    return 'Critique'
  }

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500/30 bg-red-500/5'
      case 'high': return 'border-amber-500/30 bg-amber-500/5'
      default: return 'border-violet-500/30 bg-violet-500/5'
    }
  }

  const handleApply = (rec: BacklogRecommendation) => {
    applyMutation.mutate(rec)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Score global */}
      <Card className="bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 border-violet-500/20">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-violet-500/10">
                <Brain className="h-8 w-8 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score d'efficacité catalogue</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={cn("text-4xl font-bold", getScoreColor(stats.efficiencyScore))}>
                    {stats.efficiencyScore}%
                  </span>
                  <Badge variant="outline" className={getScoreColor(stats.efficiencyScore)}>
                    {getScoreLabel(stats.efficiencyScore)}
                  </Badge>
                </div>
              </div>
            </div>
            <Badge className="bg-violet-500">
              <Sparkles className="h-3 w-3 mr-1" />
              Analyse IA
            </Badge>
          </div>
          <Progress 
            value={stats.efficiencyScore} 
            className="h-2 mt-4" 
          />
        </CardContent>
      </Card>

      {/* Métriques clés */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <Euro className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">
                {stats.potentialGainPerHour}€/h
              </p>
              <p className="text-sm text-muted-foreground">Gain potentiel</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Bot className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {stats.automationPotential}%
              </p>
              <p className="text-sm text-muted-foreground">Automatisable</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">
                {stats.urgencyDistribution.critical + stats.urgencyDistribution.high}
              </p>
              <p className="text-sm text-muted-foreground">Actions urgentes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution des urgences */}
      {(stats.urgencyDistribution.critical > 0 || stats.urgencyDistribution.high > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Distribution des urgences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.urgencyDistribution.critical > 0 && (
              <div className="flex items-center gap-3">
                <Badge variant="destructive" className="w-20 justify-center">Critique</Badge>
                <Progress value={(stats.urgencyDistribution.critical / (stats.urgencyDistribution.critical + stats.urgencyDistribution.high + stats.urgencyDistribution.medium + stats.urgencyDistribution.low)) * 100} className="flex-1 h-2" />
                <span className="text-sm font-medium w-8">{stats.urgencyDistribution.critical}</span>
              </div>
            )}
            {stats.urgencyDistribution.high > 0 && (
              <div className="flex items-center gap-3">
                <Badge className="w-20 justify-center bg-amber-500">Urgent</Badge>
                <Progress value={(stats.urgencyDistribution.high / (stats.urgencyDistribution.critical + stats.urgencyDistribution.high + stats.urgencyDistribution.medium + stats.urgencyDistribution.low)) * 100} className="flex-1 h-2" />
                <span className="text-sm font-medium w-8">{stats.urgencyDistribution.high}</span>
              </div>
            )}
            {stats.urgencyDistribution.medium > 0 && (
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="w-20 justify-center">Moyen</Badge>
                <Progress value={(stats.urgencyDistribution.medium / (stats.urgencyDistribution.critical + stats.urgencyDistribution.high + stats.urgencyDistribution.medium + stats.urgencyDistribution.low)) * 100} className="flex-1 h-2" />
                <span className="text-sm font-medium w-8">{stats.urgencyDistribution.medium}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommandations IA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Recommandations IA
            {recommendations.length > 0 && (
              <Badge variant="secondary">{recommendations.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-semibold">Backlog optimisé</h3>
              <p className="text-sm text-muted-foreground">Aucune action automatisée suggérée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all hover:shadow-md",
                    getPriorityStyles(rec.priority)
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{rec.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {rec.affectedProducts} produits
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {rec.estimatedTime}
                        </span>
                        {rec.estimatedImpact > 0 && (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <TrendingUp className="h-3 w-3" />
                            +{rec.estimatedImpact}€
                          </span>
                        )}
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => handleApply(rec)}
                      disabled={applyMutation.isPending}
                    >
                      {rec.actionLabel}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top problèmes */}
      {stats.topIssueTypes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Problèmes les plus impactants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topIssueTypes.map((issue, index) => (
                <div key={issue.type} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground/50">#{index + 1}</span>
                    <div>
                      <p className="font-medium">{issue.type}</p>
                      <p className="text-xs text-muted-foreground">{issue.count} produits</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-emerald-600">
                    +{issue.totalImpact}€
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
