/**
 * AI Recommendations Panel for Price Rules
 * Affiche les suggestions IA et permet de les appliquer
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, Sparkles, TrendingUp, ChevronRight, Check, X, 
  AlertTriangle, Zap, Target, Package 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  usePriceRulesAIStats, 
  useApplyAIRecommendation,
  type AIRuleRecommendation 
} from '@/hooks/pricing';

const priorityConfig = {
  high: { label: 'Haute', color: 'text-red-600 bg-red-100', icon: AlertTriangle },
  medium: { label: 'Moyenne', color: 'text-amber-600 bg-amber-100', icon: Target },
  low: { label: 'Basse', color: 'text-blue-600 bg-blue-100', icon: Zap },
};

const ruleTypeIcons: Record<string, typeof TrendingUp> = {
  markup: TrendingUp,
  margin: Target,
  competitive: Zap,
  rounding: Package,
};

export function AIRecommendationsPanel() {
  const { data: stats, isLoading } = usePriceRulesAIStats();
  const applyRecommendation = useApplyAIRecommendation();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Brain className="h-8 w-8 mx-auto mb-3 animate-pulse" />
          Analyse IA en cours...
        </CardContent>
      </Card>
    );
  }

  const recommendations = (stats?.recommendations || []).filter(
    r => !dismissedIds.has(r.id)
  );

  if (recommendations.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="py-8 text-center">
          <Check className="h-10 w-10 mx-auto mb-3 text-green-600" />
          <h3 className="font-medium text-green-800 mb-1">Catalogue optimisé</h3>
          <p className="text-sm text-green-700">
            Aucune recommandation d'optimisation pour le moment
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleApply = (recommendation: AIRuleRecommendation) => {
    applyRecommendation.mutate(recommendation, {
      onSuccess: () => {
        setDismissedIds(prev => new Set(prev).add(recommendation.id));
      },
    });
  };

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set(prev).add(id));
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Recommandations IA</CardTitle>
              <CardDescription>
                {recommendations.length} opportunité{recommendations.length > 1 ? 's' : ''} d'optimisation
              </CardDescription>
            </div>
          </div>
          {stats?.potentialRevenueGain && stats.potentialRevenueGain > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              +{stats.potentialRevenueGain.toFixed(0)}€ potentiel
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.slice(0, 4).map((rec) => {
          const PriorityIcon = priorityConfig[rec.priority].icon;
          const RuleIcon = ruleTypeIcons[rec.type] || TrendingUp;
          
          return (
            <div
              key={rec.id}
              className="p-4 border rounded-lg bg-background hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-muted">
                    <RuleIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{rec.name}</h4>
                      <Badge 
                        variant="outline" 
                        className={cn('text-xs', priorityConfig[rec.priority].color)}
                      >
                        <PriorityIcon className="h-3 w-3 mr-1" />
                        {priorityConfig[rec.priority].label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {rec.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1">
                        <Package className="h-3.5 w-3.5" />
                        {rec.estimatedImpact.productsAffected} produits
                      </span>
                      <span className={cn(
                        'flex items-center gap-1 font-medium',
                        rec.estimatedImpact.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        <TrendingUp className="h-3.5 w-3.5" />
                        {rec.estimatedImpact.revenueChange >= 0 ? '+' : ''}
                        {rec.estimatedImpact.revenueChange}€
                      </span>
                      <span className="text-muted-foreground">
                        Confiance: {Math.round(rec.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDismiss(rec.id)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApply(rec)}
                    disabled={applyRecommendation.isPending}
                    className="gap-1"
                  >
                    <Check className="h-4 w-4" />
                    Appliquer
                  </Button>
                </div>
              </div>
              
              {/* Confidence bar */}
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Confiance IA</span>
                  <span>{Math.round(rec.confidence * 100)}%</span>
                </div>
                <Progress value={rec.confidence * 100} className="h-1.5" />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
