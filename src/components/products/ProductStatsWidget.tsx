import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Package, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  ShoppingCart,
  Star,
  Zap,
  Target,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UnifiedProduct } from '@/hooks/useUnifiedProducts';

interface ProductStatsWidgetProps {
  products: UnifiedProduct[];
  className?: string;
}

export function ProductStatsWidget({ products, className }: ProductStatsWidgetProps) {
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter(p => p.status === 'active').length;
    const inactive = products.filter(p => p.status === 'inactive').length;
    const lowStock = products.filter(p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) < 10).length;
    const outOfStock = products.filter(p => (p.stock_quantity || 0) === 0).length;
    const inStock = products.filter(p => (p.stock_quantity || 0) >= 10).length;
    
    // Calculs financiers
    const totalRevenue = products.reduce((sum, p) => sum + (p.price * (p.stock_quantity || 0)), 0);
    const totalCost = products.reduce((sum, p) => sum + ((p.cost_price || 0) * (p.stock_quantity || 0)), 0);
    const totalProfit = totalRevenue - totalCost;
    const avgMargin = products.filter(p => p.profit_margin).length > 0
      ? products.filter(p => p.profit_margin).reduce((sum, p) => sum + (p.profit_margin || 0), 0) / products.filter(p => p.profit_margin).length
      : 0;
    const avgPrice = total > 0 ? products.reduce((sum, p) => sum + p.price, 0) / total : 0;
    
    // Scores de qualité
    const withImages = products.filter(p => p.image_url).length;
    const withDescription = products.filter(p => p.description && p.description.length > 50).length;
    const withCategory = products.filter(p => p.category).length;
    const qualityScore = total > 0 
      ? Math.round(((withImages + withDescription + withCategory) / (total * 3)) * 100)
      : 0;

    // Performance fictive basée sur données
    const highPerformers = products.filter(p => (p.profit_margin || 0) > 30).length;
    const lowPerformers = products.filter(p => (p.profit_margin || 0) < 10 && (p.profit_margin || 0) > 0).length;
    
    return {
      total,
      active,
      inactive,
      lowStock,
      outOfStock,
      inStock,
      totalRevenue,
      totalCost,
      totalProfit,
      avgMargin,
      avgPrice,
      withImages,
      withDescription,
      withCategory,
      qualityScore,
      highPerformers,
      lowPerformers,
      activeRate: total > 0 ? (active / total) * 100 : 0,
      stockHealth: total > 0 ? (inStock / total) * 100 : 0
    };
  }, [products]);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  return (
    <TooltipProvider>
      <div className={cn("grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2", className)}>
        {/* Total Produits */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <Package className="h-4 w-4 text-primary" />
                  <Badge variant="secondary" className="text-[10px] px-1">
                    {stats.activeRate.toFixed(0)}%
                  </Badge>
                </div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-[10px] text-muted-foreground">Produits</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>{stats.active} actifs / {stats.inactive} inactifs</p>
          </TooltipContent>
        </Tooltip>

        {/* Revenus */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <TrendingUp className="h-3 w-3 text-green-600" />
                </div>
                <div className="text-xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</div>
                <p className="text-[10px] text-muted-foreground">Valeur stock</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Profit potentiel: {formatCurrency(stats.totalProfit)}</p>
          </TooltipContent>
        </Tooltip>

        {/* Marge moyenne */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <Target className="h-4 w-4 text-purple-600" />
                  <Badge 
                    variant={stats.avgMargin >= 25 ? "default" : "secondary"} 
                    className={cn(
                      "text-[10px] px-1",
                      stats.avgMargin >= 25 && "bg-purple-600"
                    )}
                  >
                    {stats.avgMargin >= 25 ? 'Bon' : 'Moyen'}
                  </Badge>
                </div>
                <div className="text-xl font-bold text-purple-600">{stats.avgMargin.toFixed(1)}%</div>
                <p className="text-[10px] text-muted-foreground">Marge moy.</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>{stats.highPerformers} produits avec +30% de marge</p>
          </TooltipContent>
        </Tooltip>

        {/* Stock */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className={cn(
              "hover:shadow-md transition-all cursor-pointer",
              stats.lowStock > 5 
                ? "bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20"
                : "bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20"
            )}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <ShoppingCart className={cn("h-4 w-4", stats.lowStock > 5 ? "text-orange-600" : "text-blue-600")} />
                  {stats.lowStock > 0 && (
                    <Badge variant="destructive" className="text-[10px] px-1 animate-pulse">
                      {stats.lowStock}
                    </Badge>
                  )}
                </div>
                <div className={cn("text-xl font-bold", stats.lowStock > 5 ? "text-orange-600" : "text-blue-600")}>
                  {stats.stockHealth.toFixed(0)}%
                </div>
                <p className="text-[10px] text-muted-foreground">Stock sain</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="text-green-400">{stats.inStock} en stock (&gt;10)</p>
              <p className="text-orange-400">{stats.lowStock} faible (&lt;10)</p>
              <p className="text-red-400">{stats.outOfStock} épuisés</p>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Qualité catalogue */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/20 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <Star className="h-4 w-4 text-cyan-600" />
                  <Zap className={cn(
                    "h-3 w-3",
                    stats.qualityScore >= 70 ? "text-green-500" : stats.qualityScore >= 40 ? "text-yellow-500" : "text-red-500"
                  )} />
                </div>
                <div className="text-xl font-bold text-cyan-600">{stats.qualityScore}%</div>
                <p className="text-[10px] text-muted-foreground">Qualité</p>
                <Progress 
                  value={stats.qualityScore} 
                  className="h-1 mt-1" 
                />
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p>{stats.withImages}/{stats.total} avec images</p>
              <p>{stats.withDescription}/{stats.total} avec descriptions</p>
              <p>{stats.withCategory}/{stats.total} catégorisés</p>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Prix moyen */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <BarChart3 className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="text-xl font-bold text-indigo-600">{formatCurrency(stats.avgPrice)}</div>
                <p className="text-[10px] text-muted-foreground">Prix moy.</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Prix moyen de tous les produits</p>
          </TooltipContent>
        </Tooltip>

        {/* Performances */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-xl font-bold text-emerald-600">{stats.highPerformers}</div>
                <p className="text-[10px] text-muted-foreground">Performants</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Produits avec +30% de marge</p>
          </TooltipContent>
        </Tooltip>

        {/* Alertes */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className={cn(
              "hover:shadow-md transition-all cursor-pointer",
              (stats.lowStock + stats.outOfStock + stats.lowPerformers) > 5
                ? "bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20"
                : "bg-gradient-to-br from-gray-500/10 to-gray-500/5 border-gray-500/20"
            )}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <AlertTriangle className={cn(
                    "h-4 w-4",
                    (stats.lowStock + stats.outOfStock) > 5 ? "text-red-600" : "text-gray-500"
                  )} />
                  {(stats.lowStock + stats.outOfStock) > 0 && (
                    <Badge variant="destructive" className="text-[10px] px-1">
                      !
                    </Badge>
                  )}
                </div>
                <div className={cn(
                  "text-xl font-bold",
                  (stats.lowStock + stats.outOfStock) > 5 ? "text-red-600" : "text-gray-500"
                )}>
                  {stats.lowStock + stats.outOfStock + stats.lowPerformers}
                </div>
                <p className="text-[10px] text-muted-foreground">Alertes</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="text-orange-400">{stats.lowStock} stock faible</p>
              <p className="text-red-400">{stats.outOfStock} épuisés</p>
              <p className="text-yellow-400">{stats.lowPerformers} marge faible</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
