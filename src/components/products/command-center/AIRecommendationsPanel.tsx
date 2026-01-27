/**
 * Panneau de recommandations IA contextualisées
 * Affiche les actions prioritaires avec impact business estimé
 */

import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, TrendingUp, TrendingDown, Minus,
  Package, Sparkles, DollarSign, RefreshCw, AlertTriangle,
  ChevronRight, Zap, Target
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { AIRecommendation, RecommendationPriority } from './types'
import { cn } from '@/lib/utils'

interface AIRecommendationsPanelProps {
  recommendations: AIRecommendation[]
  onActionClick: (recommendation: AIRecommendation) => void
  onViewProduct: (productId: string) => void
  maxVisible?: number
  isLoading?: boolean
}

const priorityConfig: Record<RecommendationPriority, {
  color: string
  bgColor: string
  borderColor: string
  label: string
}> = {
  critical: {
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    label: 'Critique'
  },
  high: {
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    label: 'Haute'
  },
  medium: {
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    label: 'Moyenne'
  },
  low: {
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    label: 'Basse'
  }
}

const typeIcons: Record<AIRecommendation['type'], typeof Brain> = {
  restock: Package,
  optimize_content: Sparkles,
  apply_pricing: DollarSign,
  sync_stores: RefreshCw,
  review_margin: TrendingUp
}

const impactLabels: Record<'high' | 'medium' | 'low', string> = {
  high: '+15-25% potentiel',
  medium: '+5-15% potentiel',
  low: '+1-5% potentiel'
}

export function AIRecommendationsPanel({
  recommendations,
  onActionClick,
  onViewProduct,
  maxVisible = 5,
  isLoading = false
}: AIRecommendationsPanelProps) {
  const visibleRecs = recommendations.slice(0, maxVisible)
  const remainingCount = recommendations.length - maxVisible
  
  // Calculer l'impact total estimé
  const totalImpact = recommendations.reduce((sum, rec) => {
    const impactValue = rec.impact === 'high' ? 20 : rec.impact === 'medium' ? 10 : 3
    return sum + impactValue
  }, 0)

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary animate-pulse" />
            <CardTitle className="text-base">Analyse IA en cours...</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-lg bg-muted/50 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Target className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-semibold text-emerald-700 dark:text-emerald-400">
              Catalogue optimisé
            </h3>
            <p className="text-sm text-muted-foreground">
              L'IA n'a pas détecté d'actions prioritaires pour le moment
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Recommandations IA</CardTitle>
              <p className="text-xs text-muted-foreground">
                {recommendations.length} actions • Impact estimé +{totalImpact}%
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/10 border-primary/30">
            <Zap className="h-3 w-3 mr-1" />
            Priorisé
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <ScrollArea className="max-h-[320px]">
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {visibleRecs.map((rec, index) => {
                const config = priorityConfig[rec.priority]
                const Icon = typeIcons[rec.type]
                
                return (
                  <motion.div
                    key={rec.productId + rec.type}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'group relative rounded-lg border p-3 transition-all',
                      'hover:shadow-md cursor-pointer',
                      config.bgColor,
                      config.borderColor
                    )}
                    onClick={() => onViewProduct(rec.productId)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                        config.bgColor
                      )}>
                        <Icon className={cn('h-4 w-4', config.color)} />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">
                            {rec.productName}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={cn('text-[10px] px-1.5 py-0', config.bgColor, config.borderColor)}
                          >
                            {config.label}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-2">
                          {rec.message}
                        </p>
                        
                        {/* Impact indicator */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                              <TrendingUp className="h-3 w-3" />
                              <span>{impactLabels[rec.impact]}</span>
                            </div>
                            <Progress 
                              value={rec.impact === 'high' ? 90 : rec.impact === 'medium' ? 60 : 30}
                              className="h-1"
                            />
                          </div>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              onActionClick(rec)
                            }}
                          >
                            {rec.action}
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </AnimatePresence>
        </ScrollArea>
        
        {remainingCount > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              Voir {remainingCount} autres recommandations
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
