/**
 * Feed Rules AI Panel
 * AI-powered recommendations and insights for feed rules
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, Sparkles, TrendingUp, AlertTriangle, Lightbulb, 
  Check, ArrowRight, BarChart3, Target, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useFeedRulesAIStats, 
  useFeedRuleRecommendations, 
  useApplyFeedRecommendation,
  FeedRuleRecommendation 
} from '@/hooks/rules';

export function FeedRulesAIPanel() {
  const { stats, isLoading: statsLoading } = useFeedRulesAIStats();
  const { recommendations, isLoading: recsLoading } = useFeedRuleRecommendations();
  const applyRecommendation = useApplyFeedRecommendation();
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const handleApply = async (rec: FeedRuleRecommendation) => {
    setApplyingId(rec.id);
    try {
      await applyRecommendation.mutateAsync(rec);
    } finally {
      setApplyingId(null);
    }
  };

  const getTypeIcon = (type: FeedRuleRecommendation['type']) => {
    switch (type) {
      case 'optimization':
        return <Sparkles className="h-4 w-4 text-blue-500" />;
      case 'new_rule':
        return <Lightbulb className="h-4 w-4 text-violet-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'opportunity':
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    }
  };

  const getTypeLabel = (type: FeedRuleRecommendation['type']) => {
    switch (type) {
      case 'optimization': return 'Optimisation';
      case 'new_rule': return 'Nouvelle règle';
      case 'warning': return 'Attention';
      case 'opportunity': return 'Opportunité';
    }
  };

  const getPriorityColor = (priority: FeedRuleRecommendation['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-2 rounded-lg",
                stats.coverageScore >= 70 ? "bg-emerald-500/10" : "bg-amber-500/10"
              )}>
                <Target className={cn(
                  "h-5 w-5",
                  stats.coverageScore >= 70 ? "text-emerald-500" : "text-amber-500"
                )} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold">{stats.coverageScore}%</p>
                </div>
                <p className="text-sm text-muted-foreground">Couverture</p>
                <Progress value={stats.coverageScore} className="h-1 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold">{stats.optimizationScore}%</p>
                <p className="text-sm text-muted-foreground">Score optimisation</p>
                <Progress value={stats.optimizationScore} className="h-1 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.productsWithoutRules}</p>
                <p className="text-sm text-muted-foreground">Sans règles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">+{stats.estimatedQualityGain}%</p>
                <p className="text-sm text-muted-foreground">Gain qualité estimé</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {stats.categoryBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Couverture par catégorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.categoryBreakdown.map((cat, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <span className="w-32 truncate text-sm font-medium">{cat.category}</span>
                  <div className="flex-1">
                    <Progress value={cat.coverage} className="h-2" />
                  </div>
                  <div className="flex items-center gap-2 w-32 justify-end">
                    <Badge variant="outline" className="text-xs">
                      {cat.rulesCount} règle{cat.rulesCount > 1 ? 's' : ''}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {cat.productsCount} prod.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Recommandations IA
          </CardTitle>
          <CardDescription>
            Optimisations suggérées basées sur l'analyse de votre catalogue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendations.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Check className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
              <p className="font-medium text-emerald-600">Excellent !</p>
              <p className="text-muted-foreground">
                Aucune recommandation pour le moment. Vos règles sont bien configurées.
              </p>
            </div>
          ) : (
            recommendations.map((rec) => (
              <Card key={rec.id} className="border-l-4 border-l-primary">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTypeIcon(rec.type)}
                        <h4 className="font-medium">{rec.title}</h4>
                        <Badge variant="outline" className={getPriorityColor(rec.priority)}>
                          {rec.priority === 'high' ? 'Haute' : rec.priority === 'medium' ? 'Moyenne' : 'Basse'}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {getTypeLabel(rec.type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {rec.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Target className="h-3 w-3" />
                          {rec.impact.productsAffected} produits
                        </span>
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <TrendingUp className="h-3 w-3" />
                          {rec.impact.estimatedImprovement}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Brain className="h-3 w-3" />
                          {rec.confidence}% confiance
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleApply(rec)}
                      disabled={applyingId === rec.id}
                      className="gap-2"
                    >
                      {applyingId === rec.id ? (
                        <>
                          <Zap className="h-4 w-4 animate-pulse" />
                          Application...
                        </>
                      ) : (
                        <>
                          Appliquer
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Show suggested rule structure */}
                  {(rec.suggestedConditions || rec.suggestedActions) && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        {rec.suggestedConditions && (
                          <div>
                            <p className="font-medium mb-1 text-muted-foreground">Conditions:</p>
                            <div className="space-y-1">
                              {rec.suggestedConditions.map((cond, idx) => (
                                <code key={idx} className="block p-1 bg-muted rounded">
                                  {cond.field} {cond.operator} {cond.value || '...'}
                                </code>
                              ))}
                            </div>
                          </div>
                        )}
                        {rec.suggestedActions && (
                          <div>
                            <p className="font-medium mb-1 text-muted-foreground">Actions:</p>
                            <div className="space-y-1">
                              {rec.suggestedActions.map((action, idx) => (
                                <code key={idx} className="block p-1 bg-muted rounded">
                                  {action.type}{action.field ? `: ${action.field}` : ''}{action.value ? ` = ${action.value}` : ''}
                                </code>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
