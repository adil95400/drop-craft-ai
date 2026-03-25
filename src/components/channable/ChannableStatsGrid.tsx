/**
 * Grille de statistiques style Channable — Premium redesign
 * Dense, data-rich, Shopify-level polish
 */

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ChannableStat } from './types';

interface ChannableStatsGridProps {
  stats: ChannableStat[];
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
  compact?: boolean;
}

const colorClasses = {
  primary: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', accent: 'bg-primary' },
  success: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20', accent: 'bg-success' },
  warning: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20', accent: 'bg-warning' },
  destructive: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20', accent: 'bg-destructive' },
  info: { bg: 'bg-info/10', text: 'text-info', border: 'border-info/20', accent: 'bg-info' },
};

export function ChannableStatsGrid({
  stats,
  columns = 4,
  className,
  compact = false
}: ChannableStatsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  };

  return (
    <div className={cn("grid gap-3", gridCols[columns], className)}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const TrendIcon = stat.trend === 'up' ? TrendingUp : stat.trend === 'down' ? TrendingDown : Minus;
        const color = colorClasses[stat.color || 'primary'];

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
          >
            <Card
              className={cn(
                "group relative overflow-hidden border-border/50 transition-all duration-200",
                "hover:shadow-md hover:border-border",
                stat.onClick && "cursor-pointer"
              )}
              onClick={stat.onClick}
            >
              {/* Top accent line */}
              <div className={cn("absolute top-0 left-0 right-0 h-0.5", color.accent, "opacity-60")} />

              <CardContent className={cn("relative", compact ? "p-3" : "p-4")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground truncate mb-1.5">
                      {stat.label}
                    </p>
                    <p className={cn(
                      "font-bold tracking-tight tabular-nums",
                      compact ? "text-xl" : "text-2xl"
                    )}>
                      {stat.value}
                    </p>

                    {/* Trend */}
                    {stat.change !== undefined && (
                      <div className={cn(
                        "flex items-center gap-1 mt-1.5",
                        stat.trend === 'up' && "text-success",
                        stat.trend === 'down' && "text-destructive",
                        !stat.trend && "text-muted-foreground"
                      )}>
                        <TrendIcon className="h-3 w-3" />
                        <span className="text-xs font-semibold tabular-nums">
                          {stat.change > 0 ? '+' : ''}{stat.change}%
                        </span>
                        {stat.changeLabel && (
                          <span className="text-xs text-muted-foreground ml-0.5">
                            {stat.changeLabel}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Icon */}
                  {Icon && (
                    <div className={cn(
                      "flex items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
                      compact ? "h-9 w-9" : "h-10 w-10",
                      color.bg
                    )}>
                      <Icon className={cn("h-4.5 w-4.5", color.text)} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
