/**
 * Cartes de statistiques d'audit
 * Affiche les métriques clés du catalogue
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Target,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface AuditStats {
  totalProducts: number;
  averageScore: number;
  excellentCount: number;
  goodCount: number;
  poorCount: number;
  criticalIssuesCount: number;
  needsCorrectionCount: number;
}

interface AuditStatsCardsProps {
  stats: AuditStats;
  isLoading?: boolean;
}

export function AuditStatsCards({ stats, isLoading }: AuditStatsCardsProps) {
  const getScoreStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2 };
    if (score >= 60) return { label: 'Bon', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: TrendingUp };
    if (score >= 40) return { label: 'À améliorer', color: 'text-orange-600', bg: 'bg-orange-50', icon: TrendingDown };
    return { label: 'Critique', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle };
  };

  const scoreStatus = getScoreStatus(stats.averageScore);
  const healthPercent = stats.totalProducts > 0 
    ? Math.round(((stats.excellentCount + stats.goodCount) / stats.totalProducts) * 100)
    : 0;

  const cards = [
    {
      title: 'Score Moyen',
      value: `${stats.averageScore}/100`,
      description: scoreStatus.label,
      icon: Target,
      color: scoreStatus.color,
      bgColor: scoreStatus.bg,
      trend: stats.averageScore >= 60 ? '+5%' : '-3%',
      trendUp: stats.averageScore >= 60
    },
    {
      title: 'Santé Catalogue',
      value: `${healthPercent}%`,
      description: `${stats.excellentCount + stats.goodCount} produits OK`,
      icon: BarChart3,
      color: healthPercent >= 70 ? 'text-green-600' : 'text-orange-600',
      bgColor: healthPercent >= 70 ? 'bg-green-50' : 'bg-orange-50',
      progress: healthPercent
    },
    {
      title: 'Problèmes Critiques',
      value: stats.criticalIssuesCount.toString(),
      description: 'À corriger en priorité',
      icon: AlertTriangle,
      color: stats.criticalIssuesCount > 0 ? 'text-red-600' : 'text-green-600',
      bgColor: stats.criticalIssuesCount > 0 ? 'bg-red-50' : 'bg-green-50',
      urgent: stats.criticalIssuesCount > 0
    },
    {
      title: 'Prêts pour AI Shopping',
      value: stats.excellentCount.toString(),
      description: `${stats.totalProducts > 0 ? Math.round((stats.excellentCount / stats.totalProducts) * 100) : 0}% du catalogue`,
      icon: Sparkles,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className={cn('text-2xl font-bold', card.color)}>
                      {card.value}
                    </span>
                    {card.trend && (
                      <Badge 
                        variant={card.trendUp ? 'default' : 'destructive'} 
                        className="text-xs"
                      >
                        {card.trend}
                      </Badge>
                    )}
                    {card.urgent && (
                      <Badge variant="destructive" className="text-xs animate-pulse">
                        Urgent
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {card.description}
                  </p>
                </div>
                <div className={cn('p-2 rounded-lg', card.bgColor)}>
                  <card.icon className={cn('h-5 w-5', card.color)} />
                </div>
              </div>
              {card.progress !== undefined && (
                <Progress value={card.progress} className="mt-3 h-1.5" />
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
