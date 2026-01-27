/**
 * VariantsAIPanel - Panneau IA pour l'optimisation des variantes
 * Affiche les métriques et recommandations automatisées
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Sparkles, Package, DollarSign, RefreshCw, Hash, 
  TrendingUp, Euro, CheckCircle, AlertTriangle, ArrowRight, 
  Loader2, Zap, BarChart3, Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  useVariantsAIStats, 
  useVariantRecommendations, 
  useApplyVariantRecommendation,
  VariantRecommendation 
} from '@/hooks/catalog/useVariantsAI'

export function VariantsAIPanel() {
  const { stats, isLoading: statsLoading } = useVariantsAIStats()
  const { recommendations, isLoading: recsLoading } = useVariantRecommendations()
  const applyRecommendation = useApplyVariantRecommendation()
  const [applyingId, setApplyingId] = useState<string | null>(null)

  const isLoading = statsLoading || recsLoading

  const handleApply = async (rec: VariantRecommendation) => {
    setApplyingId(rec.id)
    try {
      await applyRecommendation.mutateAsync(rec)
    } finally {
      setApplyingId(null)
    }
  }

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'critical': return { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20' }
      case 'high': return { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' }
      case 'medium': return { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' }
      default: return { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted' }
    }
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'create_rule': return Zap
      case 'sync': return RefreshCw
      case 'generate_sku': return Hash
      default: return BarChart3
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Score et impact */}
      <Card className="bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-fuchsia-500/5 border-violet-500/20">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-violet-500" />
                <h3 className="font-semibold">Intelligence Variantes</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Analyse IA de la santé et cohérence de vos variantes produits
              </p>
              
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-4xl font-bold">{stats.optimizationScore}%</p>
                  <p className="text-xs text-muted-foreground">Score de santé</p>
                </div>
                <div className="h-12 w-px bg-border" />
                <div>
                  <p className="text-2xl font-semibold text-red-500">
                    -{stats.potentialRevenueLoss.toLocaleString()}€
                  </p>
                  <p className="text-xs text-muted-foreground">Perte potentielle</p>
                </div>
                <div className="h-12 w-px bg-border" />
                <div>
                  <p className="text-2xl font-semibold text-amber-500">
                    {stats.automationPotential}%
                  </p>
                  <p className="text-xs text-muted-foreground">Potentiel automation</p>
                </div>
              </div>
            </div>

            {stats.criticalIssues > 0 && (
              <Badge variant="destructive" className="text-sm">
                {stats.criticalIssues} problèmes critiques
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Métriques de santé */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Stock', value: stats.healthMetrics.stockHealth, icon: Package, color: 'text-emerald-500' },
          { label: 'Prix', value: stats.healthMetrics.priceHealth, icon: DollarSign, color: 'text-blue-500' },
          { label: 'Synchronisation', value: stats.healthMetrics.syncHealth, icon: RefreshCw, color: 'text-violet-500' },
          { label: 'Cohérence', value: stats.healthMetrics.consistencyHealth, icon: Shield, color: 'text-amber-500' }
        ].map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <metric.icon className={cn("h-4 w-4", metric.color)} />
                <span className="text-xs text-muted-foreground">{metric.label}</span>
              </div>
              <div className="flex items-end justify-between mb-2">
                <span className={cn(
                  "text-2xl font-bold",
                  metric.value >= 90 ? "text-emerald-500" : 
                  metric.value >= 70 ? "text-amber-500" : "text-red-500"
                )}>
                  {metric.value}%
                </span>
                <span className="text-xs text-muted-foreground">santé</span>
              </div>
              <Progress 
                value={metric.value} 
                className="h-1.5" 
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recommandations IA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recommandations IA
          </CardTitle>
          <CardDescription>
            Actions automatisées pour optimiser vos variantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="font-semibold">Variantes optimisées !</h3>
              <p className="text-sm text-muted-foreground">
                Aucune recommandation urgente pour le moment
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec) => {
                const styles = getPriorityStyles(rec.priority)
                const ActionIcon = getActionIcon(rec.action.type)
                const isApplying = applyingId === rec.id

                return (
                  <div 
                    key={rec.id}
                    className={cn(
                      "p-4 rounded-xl border transition-all",
                      styles.border,
                      styles.bg
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className={cn("h-4 w-4", styles.text)} />
                          <span className="font-medium">{rec.title}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {rec.productCount} produits
                          </Badge>
                          {rec.suggestedRule && (
                            <Badge variant="secondary" className="text-[10px]">
                              <Zap className="h-2.5 w-2.5 mr-1" />
                              Règle auto
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {rec.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-amber-500">
                            <AlertTriangle className="h-3 w-3" />
                            {rec.impact}
                          </span>
                          <span className="flex items-center gap-1 text-red-500">
                            <Euro className="h-3 w-3" />
                            -{rec.estimatedLoss.toLocaleString()}€ perte
                          </span>
                        </div>
                      </div>

                      <Button 
                        onClick={() => handleApply(rec)}
                        disabled={isApplying}
                        className="shrink-0"
                      >
                        {isApplying ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ActionIcon className="h-4 w-4 mr-2" />
                        )}
                        {rec.action.label}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
