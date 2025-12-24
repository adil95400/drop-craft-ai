import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  DollarSign,
  Target,
  Boxes,
  ShoppingCart
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductsStatsHeaderProps {
  stats: {
    total: number;
    active: number;
    inactive: number;
    lowStock: number;
    bySource: Record<string, number>;
  };
  auditStats?: {
    averageScore: number;
    excellentCount: number;
    goodCount: number;
    poorCount: number;
  };
  onFilterClick?: (filter: string) => void;
}

export function ProductsStatsHeader({ 
  stats, 
  auditStats,
  onFilterClick 
}: ProductsStatsHeaderProps) {
  const statCards = [
    {
      id: 'total',
      label: 'Total Produits',
      value: stats.total,
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
      subtitle: 'dans votre catalogue'
    },
    {
      id: 'active',
      label: 'Actifs',
      value: stats.active,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      subtitle: `${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% du catalogue`,
      trend: '+12%'
    },
    {
      id: 'score',
      label: 'Score Moyen',
      value: auditStats?.averageScore || 75,
      icon: Target,
      color: auditStats && auditStats.averageScore >= 70 ? 'text-green-500' : 'text-yellow-500',
      bgColor: auditStats && auditStats.averageScore >= 70 ? 'bg-green-500/10' : 'bg-yellow-500/10',
      borderColor: auditStats && auditStats.averageScore >= 70 ? 'border-green-500/20' : 'border-yellow-500/20',
      subtitle: `${auditStats?.excellentCount || 0} excellents`,
      isScore: true
    },
    {
      id: 'lowStock',
      label: 'Stock Faible',
      value: stats.lowStock,
      icon: AlertCircle,
      color: stats.lowStock > 0 ? 'text-orange-500' : 'text-muted-foreground',
      bgColor: stats.lowStock > 0 ? 'bg-orange-500/10' : 'bg-muted/50',
      borderColor: stats.lowStock > 0 ? 'border-orange-500/20' : 'border-border',
      subtitle: 'à réapprovisionner',
      isWarning: stats.lowStock > 5
    },
    {
      id: 'poor',
      label: 'À Optimiser',
      value: auditStats?.poorCount || 0,
      icon: TrendingUp,
      color: auditStats && auditStats.poorCount > 0 ? 'text-red-500' : 'text-green-500',
      bgColor: auditStats && auditStats.poorCount > 0 ? 'bg-red-500/10' : 'bg-green-500/10',
      borderColor: auditStats && auditStats.poorCount > 0 ? 'border-red-500/20' : 'border-green-500/20',
      subtitle: auditStats && auditStats.poorCount > 0 ? 'score < 40' : 'tout va bien'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {statCards.map((stat) => (
        <Card 
          key={stat.id}
          className={cn(
            "relative overflow-hidden transition-all duration-300 cursor-pointer group",
            "hover:shadow-lg hover:-translate-y-0.5",
            stat.borderColor,
            stat.bgColor
          )}
          onClick={() => onFilterClick?.(stat.id)}
        >
          {/* Icône en arrière-plan */}
          <div className="absolute -right-2 -top-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <stat.icon className="h-20 w-20" />
          </div>
          
          <CardContent className="p-4 relative z-10">
            <div className="flex items-start justify-between mb-2">
              <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
              {stat.trend && (
                <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600">
                  {stat.trend}
                </Badge>
              )}
              {stat.isWarning && (
                <Badge variant="destructive" className="text-[10px] animate-pulse">
                  !
                </Badge>
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">
                {stat.label}
              </p>
              <div className="flex items-baseline gap-1">
                <span className={cn("text-2xl font-bold", stat.color)}>
                  {stat.value}
                </span>
                {stat.isScore && <span className="text-sm text-muted-foreground">/100</span>}
              </div>
              <p className="text-[10px] text-muted-foreground truncate">
                {stat.subtitle}
              </p>
            </div>

            {stat.isScore && (
              <Progress 
                value={stat.value} 
                className="h-1 mt-2" 
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
