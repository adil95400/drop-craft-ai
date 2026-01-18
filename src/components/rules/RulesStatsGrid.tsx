/**
 * RulesStatsGrid - Grille de statistiques pour les règles
 */
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LucideIcon, Play, Pause, Zap, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatItem {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: 'primary' | 'green' | 'orange' | 'blue' | 'purple';
  trend?: number;
}

interface RulesStatsGridProps {
  stats: {
    activeRules: number;
    pausedRules: number;
    totalExecutions: number;
    aiRules: number;
    successRate?: number;
  };
  isLoading?: boolean;
}

const colorClasses = {
  primary: {
    gradient: 'from-primary/20 to-primary/5',
    text: 'text-primary',
    bg: 'bg-primary/10',
  },
  green: {
    gradient: 'from-emerald-500/20 to-emerald-500/5',
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  orange: {
    gradient: 'from-amber-500/20 to-amber-500/5',
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
  },
  blue: {
    gradient: 'from-blue-500/20 to-blue-500/5',
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10',
  },
  purple: {
    gradient: 'from-purple-500/20 to-purple-500/5',
    text: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-500/10',
  },
};

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  color,
  trend,
  index 
}: StatItem & { index: number }) => {
  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="group"
    >
      <Card className="relative overflow-hidden border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-50 group-hover:opacity-70 transition-opacity",
          colors.gradient
        )} />
        <CardContent className="relative p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold tracking-tight">{value}</p>
                {trend !== undefined && trend !== 0 && (
                  <span className={cn(
                    "text-xs font-medium flex items-center gap-0.5",
                    trend > 0 ? "text-emerald-500" : "text-red-500"
                  )}>
                    <TrendingUp className={cn("h-3 w-3", trend < 0 && "rotate-180")} />
                    {Math.abs(trend)}%
                  </span>
                )}
              </div>
            </div>
            <div className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
              colors.bg
            )}>
              <Icon className={cn("h-6 w-6", colors.text)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const StatCardSkeleton = () => (
  <Card className="relative overflow-hidden border-border/50">
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </CardContent>
  </Card>
);

export function RulesStatsGrid({ stats, isLoading }: RulesStatsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const statItems: StatItem[] = [
    { 
      icon: Play, 
      label: 'Règles actives', 
      value: stats.activeRules, 
      color: 'green' 
    },
    { 
      icon: Pause, 
      label: 'Règles pausées', 
      value: stats.pausedRules, 
      color: 'orange' 
    },
    { 
      icon: Zap, 
      label: 'Exécutions', 
      value: stats.totalExecutions.toLocaleString(), 
      color: 'blue' 
    },
    { 
      icon: Sparkles, 
      label: 'Règles IA', 
      value: stats.aiRules, 
      color: 'purple' 
    },
  ];

  // Ajouter le taux de succès si disponible
  if (stats.successRate !== undefined) {
    statItems.push({
      icon: CheckCircle2,
      label: 'Taux de succès',
      value: `${stats.successRate}%`,
      color: 'green'
    });
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.slice(0, 4).map((stat, index) => (
        <StatCard key={stat.label} {...stat} index={index} />
      ))}
    </div>
  );
}
