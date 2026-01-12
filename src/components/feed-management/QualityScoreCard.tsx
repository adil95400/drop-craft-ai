import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  AlertTriangle, CheckCircle, XCircle, Info, 
  TrendingUp, TrendingDown, ChevronRight, Lightbulb
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QualityIssue {
  id: string
  type: 'error' | 'warning' | 'info'
  field: string
  message: string
  affectedProducts: number
  suggestion?: string
}

interface QualityMetric {
  name: string
  score: number
  maxScore: number
  description: string
}

interface QualityScoreCardProps {
  score: number
  previousScore?: number
  metrics: QualityMetric[]
  issues: QualityIssue[]
  totalProducts: number
  onViewIssue?: (issueId: string) => void
  onFixIssue?: (issueId: string) => void
}

export function QualityScoreCard({
  score,
  previousScore,
  metrics,
  issues,
  totalProducts,
  onViewIssue,
  onFixIssue,
}: QualityScoreCardProps) {
  const getScoreColor = (s: number) => {
    if (s >= 90) return 'text-green-600'
    if (s >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBg = (s: number) => {
    if (s >= 90) return 'bg-green-500'
    if (s >= 70) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getScoreRing = (s: number) => {
    if (s >= 90) return 'ring-green-500/20'
    if (s >= 70) return 'ring-yellow-500/20'
    return 'ring-red-500/20'
  }

  const getIssueIcon = (type: QualityIssue['type']) => {
    switch (type) {
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info': return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getIssueBg = (type: QualityIssue['type']) => {
    switch (type) {
      case 'error': return 'bg-red-500/10 border-red-500/20'
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/20'
      case 'info': return 'bg-blue-500/10 border-blue-500/20'
    }
  }

  const trend = previousScore !== undefined ? score - previousScore : 0
  const errorCount = issues.filter(i => i.type === 'error').length
  const warningCount = issues.filter(i => i.type === 'warning').length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Main Score Card */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Score de qualité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Big Score Display */}
          <div className="flex items-center justify-center">
            <div className={cn(
              "relative w-32 h-32 rounded-full ring-8 flex items-center justify-center",
              getScoreRing(score)
            )}>
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-muted"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${score}, 100`}
                  className={getScoreColor(score).replace('text-', 'text-')}
                  style={{ stroke: score >= 90 ? '#22c55e' : score >= 70 ? '#eab308' : '#ef4444' }}
                />
              </svg>
              <div className="text-center">
                <span className={cn("text-4xl font-bold", getScoreColor(score))}>{score}</span>
                <span className="text-lg text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          {/* Trend */}
          {previousScore !== undefined && (
            <div className="flex items-center justify-center gap-2">
              {trend > 0 ? (
                <Badge className="bg-green-500/20 text-green-700 border-green-500/30">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{trend.toFixed(1)}%
                </Badge>
              ) : trend < 0 ? (
                <Badge variant="destructive">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {trend.toFixed(1)}%
                </Badge>
              ) : (
                <Badge variant="secondary">Stable</Badge>
              )}
              <span className="text-xs text-muted-foreground">vs semaine dernière</span>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            <div className="text-center p-2 rounded-lg bg-red-500/10">
              <p className="text-lg font-bold text-red-700">{errorCount}</p>
              <p className="text-xs text-muted-foreground">Erreurs</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-yellow-500/10">
              <p className="text-lg font-bold text-yellow-700">{warningCount}</p>
              <p className="text-xs text-muted-foreground">Alertes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Breakdown */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Métriques détaillées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {metrics.map((metric, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{metric.name}</span>
                <span className={cn("font-bold", getScoreColor(Math.round((metric.score / metric.maxScore) * 100)))}>
                  {metric.score}/{metric.maxScore}
                </span>
              </div>
              <Progress 
                value={(metric.score / metric.maxScore) * 100} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">{metric.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Issues List */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Problèmes à corriger</CardTitle>
            <Badge variant="outline">{issues.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {issues.slice(0, 5).map((issue) => (
            <div 
              key={issue.id}
              className={cn(
                "p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow",
                getIssueBg(issue.type)
              )}
              onClick={() => onViewIssue?.(issue.id)}
            >
              <div className="flex items-start gap-2">
                {getIssueIcon(issue.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{issue.field}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {issue.affectedProducts.toLocaleString()} produits
                    </span>
                  </div>
                  <p className="text-sm mt-1">{issue.message}</p>
                  {issue.suggestion && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Lightbulb className="h-3 w-3" />
                      <span>{issue.suggestion}</span>
                    </div>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))}

          {issues.length > 5 && (
            <Button variant="ghost" className="w-full" size="sm">
              Voir tous les problèmes ({issues.length})
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}

          {issues.length === 0 && (
            <div className="text-center py-6">
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium">Aucun problème détecté</p>
              <p className="text-xs text-muted-foreground">Votre flux est optimisé</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
