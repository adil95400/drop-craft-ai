/**
 * Carte de score IA améliorée avec breakdown détaillé
 * Affiche le score global et les sous-scores par dimension
 */

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Sparkles, FileText, Image, Tag, Target, Search, 
  TrendingUp, AlertTriangle, CheckCircle, XCircle,
  ChevronRight, Zap, Brain
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ProductAuditIssue {
  severity: 'critical' | 'warning' | 'info'
  message: string
  field?: string
}

export interface ProductAuditResult {
  globalScore: number
  dimensionScores: Record<string, number>
  issues: ProductAuditIssue[]
  recommendations?: string[]
}

interface EnhancedAIScoreCardProps {
  auditResult: ProductAuditResult
  compact?: boolean
  showActions?: boolean
  onOptimize?: (dimension: string) => void
  className?: string
}

const DIMENSION_CONFIG = {
  seo: {
    label: 'SEO',
    icon: Search,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    description: 'Titres, méta-descriptions, mots-clés'
  },
  content: {
    label: 'Contenu',
    icon: FileText,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    description: 'Descriptions, qualité du texte'
  },
  images: {
    label: 'Images',
    icon: Image,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    description: 'Quantité et qualité des images'
  },
  data: {
    label: 'Données',
    icon: Tag,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    description: 'SKU, GTIN, attributs, variantes'
  },
  aiReadiness: {
    label: 'IA Ready',
    icon: Brain,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    description: 'Prêt pour Google Shopping, Meta, etc.'
  }
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  if (score >= 40) return 'text-orange-600'
  return 'text-red-600'
}

function getScoreBgColor(score: number) {
  if (score >= 80) return 'bg-green-100 dark:bg-green-900/30'
  if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30'
  if (score >= 40) return 'bg-orange-100 dark:bg-orange-900/30'
  return 'bg-red-100 dark:bg-red-900/30'
}

function getScoreLabel(score: number) {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Bon'
  if (score >= 40) return 'À améliorer'
  return 'Critique'
}

function getProgressColor(score: number) {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-500'
  if (score >= 40) return 'bg-orange-500'
  return 'bg-red-500'
}

export function EnhancedAIScoreCard({
  auditResult,
  compact = false,
  showActions = true,
  onOptimize,
  className
}: EnhancedAIScoreCardProps) {
  const { globalScore, dimensionScores, issues, recommendations } = auditResult

  const criticalIssues = useMemo(() => 
    issues.filter(i => i.severity === 'critical'),
    [issues]
  )

  const warningIssues = useMemo(() =>
    issues.filter(i => i.severity === 'warning'),
    [issues]
  )

  const sortedDimensions = useMemo(() => {
    return Object.entries(dimensionScores)
      .map(([key, score]) => ({
        key,
        score,
        config: DIMENSION_CONFIG[key as keyof typeof DIMENSION_CONFIG]
      }))
      .filter(d => d.config)
      .sort((a, b) => a.score - b.score)
  }, [dimensionScores])

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all hover:scale-105",
              getScoreBgColor(globalScore),
              className
            )}>
              <Sparkles className={cn("h-4 w-4", getScoreColor(globalScore))} />
              <span className={cn("font-bold text-lg", getScoreColor(globalScore))}>
                {globalScore}
              </span>
              {criticalIssues.length > 0 && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0">
                  {criticalIssues.length}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="w-80 p-0">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Score IA Global</span>
                <span className={cn("font-bold text-xl", getScoreColor(globalScore))}>
                  {globalScore}/100
                </span>
              </div>
              <div className="space-y-2">
                {sortedDimensions.map(({ key, score, config }) => (
                  <div key={key} className="flex items-center gap-2">
                    <config.icon className={cn("h-3 w-3", config.color)} />
                    <span className="text-xs flex-1">{config.label}</span>
                    <span className={cn("text-xs font-medium", getScoreColor(score))}>
                      {score}%
                    </span>
                  </div>
                ))}
              </div>
              {criticalIssues.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-destructive font-medium">
                    {criticalIssues.length} problème{criticalIssues.length > 1 ? 's' : ''} critique{criticalIssues.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-lg",
              getScoreBgColor(globalScore)
            )}>
              <Sparkles className={cn("h-5 w-5", getScoreColor(globalScore))} />
            </div>
            <div>
              <CardTitle className="text-lg">Score IA</CardTitle>
              <p className="text-xs text-muted-foreground">{getScoreLabel(globalScore)}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={cn("text-4xl font-bold", getScoreColor(globalScore))}>
              {globalScore}
            </span>
            <span className="text-lg text-muted-foreground">/100</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Breakdown par dimension */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Analyse par dimension</h4>
          <div className="space-y-3">
            {sortedDimensions.map(({ key, score, config }) => (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded", config.bgColor)}>
                      <config.icon className={cn("h-3.5 w-3.5", config.color)} />
                    </div>
                    <span className="text-sm font-medium">{config.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-bold", getScoreColor(score))}>
                      {score}%
                    </span>
                    {showActions && score < 70 && onOptimize && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => onOptimize(key)}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Optimiser
                      </Button>
                    )}
                  </div>
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn("absolute inset-y-0 left-0 rounded-full transition-all", getProgressColor(score))}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Problèmes détectés */}
        {issues.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Problèmes détectés ({issues.length})
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {issues.slice(0, 5).map((issue, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "flex items-start gap-2 p-2 rounded-lg text-xs",
                    issue.severity === 'critical' 
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                  )}
                >
                  {issue.severity === 'critical' ? (
                    <XCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{issue.message}</p>
                    {issue.field && (
                      <p className="text-muted-foreground mt-0.5">Champ: {issue.field}</p>
                    )}
                  </div>
                </div>
              ))}
              {issues.length > 5 && (
                <p className="text-xs text-muted-foreground text-center py-1">
                  +{issues.length - 5} autres problèmes
                </p>
              )}
            </div>
          </div>
        )}

        {/* Recommandations */}
        {recommendations && recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Recommandations
            </h4>
            <div className="space-y-2">
              {recommendations.slice(0, 3).map((rec, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-xs"
                >
                  <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-green-700 dark:text-green-300">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions globales */}
        {showActions && globalScore < 80 && (
          <div className="pt-3 border-t">
            <Button 
              className="w-full gap-2"
              onClick={() => onOptimize?.('all')}
            >
              <Sparkles className="h-4 w-4" />
              Optimisation IA complète
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Version inline pour les tableaux/listes
export function AIScoreInline({ score, issues = [] }: { score: number; issues?: ProductAuditIssue[] }) {
  const criticalCount = issues.filter(i => i.severity === 'critical').length

  return (
    <div className="flex items-center gap-1.5">
      <div className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
        getScoreBgColor(score),
        getScoreColor(score)
      )}>
        <Sparkles className="h-3 w-3" />
        {score}
      </div>
      {criticalCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="destructive" className="text-[10px] h-4 px-1">
                {criticalCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{criticalCount} problème{criticalCount > 1 ? 's' : ''} critique{criticalCount > 1 ? 's' : ''}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
