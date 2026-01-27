/**
 * CatalogRulesAIPanel - Panneau IA pour les règles de catalogue
 */
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, 
  TrendingUp, 
  Clock, 
  Target, 
  Zap,
  FileText,
  Tag,
  AlertTriangle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { useCatalogRulesAIStats, useApplyCatalogRecommendation, type CatalogAIRecommendation } from '@/hooks/rules/useCatalogRulesAI';
import { cn } from '@/lib/utils';

const RECOMMENDATION_ICONS = {
  title_optimization: FileText,
  description_missing: FileText,
  category_mapping: Target,
  stock_alert: AlertTriangle,
  seo_improvement: TrendingUp,
};

const IMPACT_COLORS = {
  high: 'bg-red-500/10 text-red-600 border-red-500/20',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  low: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

const IMPACT_LABELS = {
  high: 'Impact élevé',
  medium: 'Impact moyen',
  low: 'Impact faible',
};

interface RecommendationCardProps {
  recommendation: CatalogAIRecommendation;
  onApply: () => void;
  isApplying: boolean;
}

function RecommendationCard({ recommendation, onApply, isApplying }: RecommendationCardProps) {
  const Icon = RECOMMENDATION_ICONS[recommendation.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="group"
    >
      <Card className="border-border/50 hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm">{recommendation.title}</h4>
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", IMPACT_COLORS[recommendation.impact])}
                >
                  {IMPACT_LABELS[recommendation.impact]}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                {recommendation.description}
              </p>
              
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {recommendation.affectedProducts} produits
                </Badge>
                
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="gap-1 text-xs group-hover:bg-primary group-hover:text-primary-foreground"
                  onClick={onApply}
                  disabled={isApplying}
                >
                  {isApplying ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Sparkles className="h-3 w-3" />
                      </motion.div>
                      Création...
                    </>
                  ) : (
                    <>
                      Créer règle
                      <ArrowRight className="h-3 w-3" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function CatalogRulesAIPanel() {
  const { stats, isLoading } = useCatalogRulesAIStats();
  const applyMutation = useApplyCatalogRecommendation();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
            <CardContent className="relative p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Score d'optimisation</p>
                  <p className="text-3xl font-bold">{stats.optimizationScore}%</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
              </div>
              <Progress value={stats.optimizationScore} className="mt-3 h-1.5" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-amber-500/5" />
            <CardContent className="relative p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">À optimiser</p>
                  <p className="text-3xl font-bold">{stats.productsWithoutRules}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5" />
            <CardContent className="relative p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Couverture auto</p>
                  <p className="text-3xl font-bold">{stats.automationCoverage}%</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-purple-500/5" />
            <CardContent className="relative p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Temps économisé</p>
                  <p className="text-3xl font-bold">{stats.potentialTimesSaved}h</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">potentiel/mois</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Recommandations IA</CardTitle>
              <CardDescription>
                Actions suggérées pour optimiser votre catalogue
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {stats.recommendations.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
              <p className="font-medium">Catalogue optimisé !</p>
              <p className="text-sm text-muted-foreground">
                Aucune amélioration majeure détectée
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recommendations.map((recommendation, index) => (
                <motion.div
                  key={recommendation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <RecommendationCard
                    recommendation={recommendation}
                    onApply={() => applyMutation.mutate(recommendation)}
                    isApplying={applyMutation.isPending}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Optimisation automatique</p>
                <p className="text-sm text-muted-foreground">
                  Appliquer toutes les recommandations IA en un clic
                </p>
              </div>
            </div>
            <Button 
              className="gap-2"
              disabled={stats.recommendations.length === 0 || applyMutation.isPending}
              onClick={() => {
                // Appliquer toutes les recommandations séquentiellement
                stats.recommendations.forEach((rec, i) => {
                  setTimeout(() => applyMutation.mutate(rec), i * 500);
                });
              }}
            >
              <Sparkles className="h-4 w-4" />
              Tout appliquer ({stats.recommendations.length})
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
