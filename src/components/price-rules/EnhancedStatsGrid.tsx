/**
 * Enhanced Stats Dashboard for Price Rules
 * KPIs business enrichis avec scoring IA
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, Zap, Package, TrendingUp, Brain, 
  Target, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { usePriceRulesAIStats } from '@/hooks/pricing';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

export function EnhancedStatsGrid() {
  const { data: stats, isLoading } = usePriceRulesAIStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-16 animate-pulse bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const scoreColor = (stats?.optimizationScore || 0) >= 70 
    ? 'text-green-600' 
    : (stats?.optimizationScore || 0) >= 40 
      ? 'text-amber-600' 
      : 'text-red-600';

  const statsItems = [
    {
      icon: Brain,
      label: 'Score Optimisation',
      value: `${stats?.optimizationScore || 0}%`,
      subtext: stats?.optimizationScore && stats.optimizationScore >= 70 
        ? 'Excellent' 
        : stats?.optimizationScore && stats.optimizationScore >= 40 
          ? 'À améliorer' 
          : 'Critique',
      color: scoreColor,
      bgColor: 'bg-primary/10',
      showProgress: true,
      progressValue: stats?.optimizationScore || 0,
    },
    {
      icon: Zap,
      label: 'Règles Actives',
      value: stats?.activeRules || 0,
      subtext: `sur ${stats?.totalRules || 0} règles`,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: Package,
      label: 'Produits Gérés',
      value: stats?.totalProductsManaged || 0,
      subtext: stats?.productsWithoutRules 
        ? `${stats.productsWithoutRules} sans règle` 
        : 'Tous couverts',
      color: stats?.productsWithoutRules && stats.productsWithoutRules > 0 
        ? 'text-amber-600' 
        : 'text-blue-600',
      bgColor: stats?.productsWithoutRules && stats.productsWithoutRules > 0 
        ? 'bg-amber-100' 
        : 'bg-blue-100',
    },
    {
      icon: TrendingUp,
      label: 'Marge Moyenne',
      value: `${stats?.avgMarginPercent || 0}%`,
      subtext: (stats?.avgMarginPercent || 0) >= 25 
        ? 'Saine' 
        : 'Faible',
      color: (stats?.avgMarginPercent || 0) >= 25 
        ? 'text-green-600' 
        : 'text-amber-600',
      bgColor: (stats?.avgMarginPercent || 0) >= 25 
        ? 'bg-green-100' 
        : 'bg-amber-100',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsItems.map((stat, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                  <stat.icon className={cn('h-5 w-5', stat.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                  <p className={cn('text-xs font-medium mt-0.5', stat.color)}>
                    {stat.subtext}
                  </p>
                </div>
              </div>
              {stat.showProgress && (
                <Progress 
                  value={stat.progressValue} 
                  className="h-1.5 mt-3" 
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity and opportunities row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's activity */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Target className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Activité du jour</p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>{stats?.rulesAppliedToday || 0} règles appliquées</span>
                    <span>{stats?.priceChangesToday || 0} prix modifiés</span>
                  </div>
                </div>
              </div>
              {stats?.lastRuleApplication && (
                <Badge variant="secondary" className="text-xs">
                  Dernière: {formatDistanceToNow(new Date(stats.lastRuleApplication), { 
                    addSuffix: true, 
                    locale: getDateFnsLocale() 
                  })}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Potential gain */}
        <Card className={cn(
          stats?.potentialRevenueGain && stats.potentialRevenueGain > 0 
            ? 'border-green-200 bg-green-50/50' 
            : ''
        )}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  stats?.potentialRevenueGain && stats.potentialRevenueGain > 0 
                    ? 'bg-green-100' 
                    : 'bg-muted'
                )}>
                  {stats?.potentialRevenueGain && stats.potentialRevenueGain > 0 ? (
                    <DollarSign className="h-5 w-5 text-green-600" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {stats?.potentialRevenueGain && stats.potentialRevenueGain > 0 
                      ? 'Potentiel de gain' 
                      : 'Tarification optimisée'
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {stats?.potentialRevenueGain && stats.potentialRevenueGain > 0 
                      ? `${stats.recommendations?.length || 0} recommandations IA disponibles`
                      : 'Aucune action requise'
                    }
                  </p>
                </div>
              </div>
              {stats?.potentialRevenueGain && stats.potentialRevenueGain > 0 && (
                <span className="text-xl font-bold text-green-600">
                  +{stats.potentialRevenueGain.toFixed(0)}€
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
