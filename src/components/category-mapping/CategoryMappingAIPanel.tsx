/**
 * CategoryMappingAIPanel - AI-driven category mapping suggestions
 * Phase 2: Smart auto-mapping and recommendations
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  Sparkles, 
  FolderTree, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  ArrowRight,
  Zap,
  Target,
  AlertTriangle
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  useCategoryMappingAIStats,
  useCategorySuggestions,
  useMappingRecommendations,
  useApplyCategorySuggestion,
  useApplyAllSuggestions
} from '@/hooks/catalog/useCategoryMappingAI'
import { cn } from '@/lib/utils'

const priorityColors = {
  high: 'border-red-500/50 bg-red-500/5',
  medium: 'border-yellow-500/50 bg-yellow-500/5',
  low: 'border-blue-500/50 bg-blue-500/5'
}

const destinationColors = {
  google: 'bg-red-500',
  facebook: 'bg-blue-600',
  amazon: 'bg-orange-500',
  shopify: 'bg-green-600'
}

const destinationLabels = {
  google: 'Google Shopping',
  facebook: 'Meta/Facebook',
  amazon: 'Amazon',
  shopify: 'Shopify'
}

export function CategoryMappingAIPanel() {
  const { stats, isLoading } = useCategoryMappingAIStats()
  const { suggestions } = useCategorySuggestions()
  const { recommendations } = useMappingRecommendations()
  const applySuggestion = useApplyCategorySuggestion()
  const applyAll = useApplyAllSuggestions()

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="py-10 text-center text-muted-foreground">
          <Brain className="h-8 w-8 mx-auto mb-3 animate-pulse" />
          Analyse des catégories en cours...
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
                <Badge variant="outline" className="text-xs">Automatisation</Badge>
              </div>
              <div className="text-3xl font-bold mb-1">{stats.automationScore}%</div>
              <Progress value={stats.automationScore} className="h-1.5 mb-2" />
              <p className="text-xs text-muted-foreground">Score d'automatisation</p>
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
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{stats.unmappedCategories}</div>
              <p className="text-xs text-muted-foreground">Catégories non mappées</p>
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
              <div className="text-3xl font-bold mb-1">{stats.coveragePercent}%</div>
              <p className="text-xs text-muted-foreground">Couverture mapping</p>
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
              <div className="text-3xl font-bold mb-1">{stats.potentialTimeSaved}h</div>
              <p className="text-xs text-muted-foreground">Temps économisé/mois</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Actions recommandées
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'p-4 rounded-lg border',
                    priorityColors[rec.priority]
                  )}
                >
                  <h4 className="font-medium text-sm mb-1">{rec.title}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{rec.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {rec.impactedProducts} produits
                    </Badge>
                    <span className="text-xs text-green-600 font-medium">
                      {rec.estimatedImpact}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Suggestions */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Suggestions IA de mapping
              </CardTitle>
              <CardDescription>
                Correspondances automatiques détectées par l'IA
              </CardDescription>
            </div>
            {suggestions.length > 0 && (
              <Button
                onClick={() => applyAll.mutate()}
                disabled={applyAll.isPending}
                className="gap-2"
              >
                <Zap className="h-4 w-4" />
                Appliquer tout ({suggestions.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {suggestions.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
              <p className="font-medium">Toutes les catégories sont mappées</p>
              <p className="text-sm text-muted-foreground">
                Aucune suggestion disponible
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="shrink-0">
                          {suggestion.sourceCategory}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Badge 
                          className={cn(
                            'shrink-0 text-white',
                            destinationColors[suggestion.destination]
                          )}
                        >
                          {destinationLabels[suggestion.destination]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        → {suggestion.suggestedMapping}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="text-muted-foreground">
                          {suggestion.productsAffected} produits
                        </span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'text-xs',
                            suggestion.confidence >= 0.8 ? 'border-green-500/50 text-green-600' :
                            suggestion.confidence >= 0.6 ? 'border-yellow-500/50 text-yellow-600' :
                            'border-red-500/50 text-red-600'
                          )}
                        >
                          {Math.round(suggestion.confidence * 100)}% confiance
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => applySuggestion.mutate(suggestion)}
                      disabled={applySuggestion.isPending}
                      className="shrink-0"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Appliquer
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
