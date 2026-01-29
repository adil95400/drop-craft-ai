import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface Stat {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  description?: string;
  href?: string;
  onClick?: () => void;
}

interface QuickStatsProps {
  stats: Stat[];
  className?: string;
}

export function QuickStats({ stats, className }: QuickStatsProps) {
  const navigate = useNavigate();
  
  const formatValue = (value: string | number) => {
    if (typeof value === 'number') {
      return value.toLocaleString('fr-FR');
    }
    return value;
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-4 w-4 text-emerald-600" />;
      case 'down':
        return <ArrowDownRight className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-emerald-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const handleClick = (stat: Stat) => {
    if (stat.onClick) {
      stat.onClick();
    } else if (stat.href) {
      navigate(stat.href);
    }
  };

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const isClickable = !!(stat.href || stat.onClick);
        
        return (
          <Card 
            key={index} 
            className={cn(
              "relative overflow-hidden",
              isClickable && "cursor-pointer transition-all hover:shadow-lg hover:scale-105"
            )}
            onClick={() => isClickable && handleClick(stat)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">
                {formatValue(stat.value)}
              </div>
              
              {stat.change !== undefined && (
                <div className="flex items-center gap-1 text-xs">
                  {getTrendIcon(stat.trend)}
                  <span className={getTrendColor(stat.trend)}>
                    {Math.abs(stat.change)}% vs mois dernier
                  </span>
                </div>
              )}
              
              {stat.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Export des icônes pour faciliter l'utilisation
export const StatIcons = {
  Revenue: DollarSign,
  Orders: ShoppingCart,
  Customers: Users,
  Products: Package,
  TrendingUp,
  TrendingDown
};