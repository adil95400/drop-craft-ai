/**
 * MediaAIPanel - Panneau IA pour l'optimisation des médias
 * Affiche les métriques et recommandations automatisées
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Sparkles, Image, Video, Type, Zap, TrendingUp, 
  Euro, CheckCircle, AlertTriangle, ArrowRight, Loader2,
  ImagePlus, Wand2, RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  useMediaAIStats, 
  useMediaRecommendations, 
  useApplyMediaRecommendation,
  MediaRecommendation 
} from '@/hooks/catalog/useMediaAI'

export function MediaAIPanel() {
  const { stats, isLoading: statsLoading } = useMediaAIStats()
  const { recommendations, isLoading: recsLoading } = useMediaRecommendations()
  const applyRecommendation = useApplyMediaRecommendation()
  const [applyingId, setApplyingId] = useState<string | null>(null)

  const isLoading = statsLoading || recsLoading

  const handleApply = async (rec: MediaRecommendation) => {
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
      case 'enrich_ai': return Wand2
      case 'scrape': return RefreshCw
      case 'generate': return Sparkles
      default: return Zap
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
      <Card className="bg-gradient-to-br from-primary/5 via-violet-500/5 to-purple-500/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Intelligence Médias</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Analyse IA de la qualité et couverture de vos médias produits
              </p>
              
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-4xl font-bold">{stats.optimizationScore}%</p>
                  <p className="text-xs text-muted-foreground">Score d'optimisation</p>
                </div>
                <div className="h-12 w-px bg-border" />
                <div>
                  <p className="text-2xl font-semibold text-emerald-500">
                    +{stats.potentialConversionGain}%
                  </p>
                  <p className="text-xs text-muted-foreground">Gain conversions potentiel</p>
                </div>
                <div className="h-12 w-px bg-border" />
                <div>
                  <p className="text-2xl font-semibold text-emerald-500">
                    +{stats.potentialRevenueGain.toLocaleString()}€
                  </p>
                  <p className="text-xs text-muted-foreground">Revenus additionnels</p>
                </div>
              </div>
            </div>

            {stats.priorityActions > 0 && (
              <Badge variant="destructive" className="text-sm">
                {stats.priorityActions} actions prioritaires
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Métriques de couverture */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Image principale', value: stats.coverageMetrics.mainImage, icon: Image, target: 100 },
          { label: 'Galerie (+3 images)', value: stats.coverageMetrics.gallery, icon: ImagePlus, target: 80 },
          { label: 'Vidéo produit', value: stats.coverageMetrics.video, icon: Video, target: 30 },
          { label: 'Texte alt (SEO)', value: stats.coverageMetrics.altText, icon: Type, target: 90 }
        ].map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <metric.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{metric.label}</span>
              </div>
              <div className="flex items-end justify-between mb-2">
                <span className={cn(
                  "text-2xl font-bold",
                  metric.value >= metric.target ? "text-emerald-500" : 
                  metric.value >= metric.target * 0.7 ? "text-amber-500" : "text-red-500"
                )}>
                  {metric.value}%
                </span>
                <span className="text-xs text-muted-foreground">/ {metric.target}%</span>
              </div>
              <Progress value={metric.value} max={metric.target} className="h-1.5" />
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
            Actions automatisées pour optimiser vos médias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="font-semibold">Médias optimisés !</h3>
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
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {rec.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-emerald-500">
                            <TrendingUp className="h-3 w-3" />
                            {rec.impact}
                          </span>
                          <span className="flex items-center gap-1 text-emerald-600">
                            <Euro className="h-3 w-3" />
                            +{rec.estimatedGain.toLocaleString()}€ potentiel
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
