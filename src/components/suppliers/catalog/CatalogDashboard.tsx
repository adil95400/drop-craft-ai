/**
 * CatalogDashboard - Widgets de statistiques interactifs
 * Dashboard avec KPIs, graphiques sparkline et actions rapides
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  Crown,
  TrendingUp,
  TrendingDown,
  Sparkles,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Target,
  ShoppingCart,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CatalogProduct } from './CatalogProductCard';

interface CatalogDashboardProps {
  products: CatalogProduct[];
  onQuickFilter: (filter: string) => void;
  onSync?: () => void;
  isSyncing?: boolean;
  lastSyncAt?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
  progress?: number;
}

const colorClasses = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  danger: 'bg-red-500/10 text-red-600 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

const iconColorClasses = {
  primary: 'text-primary',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  danger: 'text-red-500',
  info: 'text-blue-500',
};

const StatCard = memo(function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  color,
  onClick,
  progress,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={cn(
          "relative overflow-hidden transition-all duration-200 border cursor-pointer hover:shadow-lg",
          colorClasses[color]
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className={cn("p-2 rounded-lg", `bg-${color}/10`)}>
              <Icon className={cn("h-5 w-5", iconColorClasses[color])} />
            </div>
            {trend !== undefined && (
              <div className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                trend >= 0 ? "text-emerald-600" : "text-red-500"
              )}>
                {trend >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {Math.abs(trend)}%
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs font-medium opacity-80">{title}</p>
            {subtitle && (
              <p className="text-[10px] opacity-60">{subtitle}</p>
            )}
          </div>

          {progress !== undefined && (
            <div className="mt-3">
              <Progress value={progress} className="h-1" />
            </div>
          )}

          {trendLabel && (
            <p className="text-[10px] mt-2 opacity-60">{trendLabel}</p>
          )}

          {/* Decorative element */}
          <div className={cn(
            "absolute -bottom-4 -right-4 h-20 w-20 rounded-full opacity-10",
            `bg-${color}`
          )} />
        </CardContent>
      </Card>
    </motion.div>
  );
});

export const CatalogDashboard = memo(function CatalogDashboard({
  products,
  onQuickFilter,
  onSync,
  isSyncing,
  lastSyncAt,
}: CatalogDashboardProps) {
  const stats = useMemo(() => {
    const total = products.length;
    const winners = products.filter(p => p.is_winner).length;
    const trending = products.filter(p => p.is_trending).length;
    const bestsellers = products.filter(p => p.orders_count > 500).length;
    const lowStock = products.filter(p => p.stock_status === 'low_stock').length;
    const outOfStock = products.filter(p => p.stock_status === 'out_of_stock').length;
    const inStock = products.filter(p => p.stock_status === 'in_stock').length;
    
    const avgScore = total > 0 
      ? products.reduce((sum, p) => sum + p.ai_score, 0) / total 
      : 0;
    const avgMargin = total > 0 
      ? products.reduce((sum, p) => sum + p.profit_margin, 0) / total 
      : 0;
    const totalRevenuePotential = products.reduce((sum, p) => sum + (p.profit * p.stock_quantity), 0);
    
    const highScoreProducts = products.filter(p => p.ai_score > 0.8).length;
    const healthScore = total > 0 
      ? ((inStock / total) * 40) + ((highScoreProducts / total) * 30) + ((avgMargin / 100) * 30)
      : 0;

    return {
      total,
      winners,
      trending,
      bestsellers,
      lowStock,
      outOfStock,
      inStock,
      avgScore: Math.round(avgScore * 100),
      avgMargin: avgMargin.toFixed(1),
      totalRevenuePotential,
      highScoreProducts,
      healthScore: Math.round(healthScore),
      stockHealth: total > 0 ? Math.round((inStock / total) * 100) : 0,
    };
  }, [products]);

  const formatLastSync = () => {
    if (!lastSyncAt) return 'Jamais';
    const date = new Date(lastSyncAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)} h`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="space-y-4">
      {/* Quick Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              stats.healthScore >= 70 ? "bg-emerald-500" : 
              stats.healthScore >= 40 ? "bg-amber-500" : "bg-red-500"
            )} />
            <span className="text-sm font-medium">
              Santé catalogue: {stats.healthScore}%
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            Dernière sync: {formatLastSync()}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuickFilter('winners')}
            className="gap-1"
          >
            <Crown className="h-3.5 w-3.5 text-amber-500" />
            Winners ({stats.winners})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuickFilter('low_stock')}
            className="gap-1"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            Stock faible ({stats.lowStock})
          </Button>
          {onSync && (
            <Button
              size="sm"
              onClick={onSync}
              disabled={isSyncing}
              className="gap-1"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
              Synchroniser
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Produits Total"
          value={stats.total.toLocaleString()}
          subtitle={`${stats.inStock} en stock`}
          icon={Package}
          color="primary"
          progress={stats.stockHealth}
          onClick={() => onQuickFilter('all')}
        />
        <StatCard
          title="Winners"
          value={stats.winners}
          subtitle="Score IA > 88%"
          icon={Crown}
          color="warning"
          trend={12}
          onClick={() => onQuickFilter('winners')}
        />
        <StatCard
          title="Score IA Moyen"
          value={`${stats.avgScore}%`}
          subtitle={`${stats.highScoreProducts} produits > 80%`}
          icon={Sparkles}
          color="info"
          trend={5}
          progress={stats.avgScore}
          onClick={() => onQuickFilter('all')}
        />
        <StatCard
          title="Marge Moyenne"
          value={`${stats.avgMargin}%`}
          subtitle="Sur prix de vente"
          icon={DollarSign}
          color="success"
          trend={3}
          onClick={() => onQuickFilter('all')}
        />
        <StatCard
          title="Tendances"
          value={stats.trending}
          subtitle="Produits en hausse"
          icon={TrendingUp}
          color="info"
          trend={18}
          onClick={() => onQuickFilter('trending')}
        />
        <StatCard
          title="Alertes Stock"
          value={stats.lowStock + stats.outOfStock}
          subtitle={`${stats.outOfStock} en rupture`}
          icon={AlertTriangle}
          color={stats.lowStock + stats.outOfStock > 10 ? 'danger' : 'warning'}
          onClick={() => onQuickFilter('low_stock')}
        />
      </div>

      {/* Revenue Potential Card */}
      {stats.totalRevenuePotential > 0 && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Potentiel de revenus</p>
                  <p className="text-2xl font-bold text-primary">
                    {stats.totalRevenuePotential.toLocaleString('fr-FR', { 
                      style: 'currency', 
                      currency: 'EUR',
                      maximumFractionDigits: 0 
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/20 text-primary border-0">
                  {stats.bestsellers} best-sellers disponibles
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
