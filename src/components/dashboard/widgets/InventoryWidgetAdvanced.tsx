import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingDown, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { TimeRange } from '@/hooks/useDashboardConfig';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useDashboardStats } from '@/hooks/useDashboardStats';

interface InventoryWidgetAdvancedProps {
  timeRange: TimeRange;
  settings: {
    showTrend?: boolean;
  };
  lastRefresh: Date;
}

export function InventoryWidgetAdvanced({ timeRange, settings, lastRefresh }: InventoryWidgetAdvancedProps) {
  const { data: stats, isLoading } = useDashboardStats();

  // Mock inventory data
  const inventoryStats = {
    totalProducts: stats?.productsCount || 0,
    inStock: Math.floor((stats?.productsCount || 0) * 0.75),
    lowStock: Math.floor((stats?.productsCount || 0) * 0.15),
    outOfStock: Math.floor((stats?.productsCount || 0) * 0.10),
    stockValue: 45680,
  };

  const stockHealth = (inventoryStats.inStock / (inventoryStats.totalProducts || 1)) * 100;

  if (isLoading) {
    return (
      <CardContent className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </CardContent>
    );
  }

  return (
    <>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Package className="h-5 w-5 text-amber-500" />
            </div>
            <span>Inventaire</span>
          </div>
          <Badge variant={stockHealth > 70 ? 'default' : stockHealth > 50 ? 'secondary' : 'destructive'} className="text-xs">
            {stockHealth.toFixed(0)}% en stock
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{inventoryStats.totalProducts}</span>
          <span className="text-sm text-muted-foreground">produits</span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Santé du stock</span>
            <span className="font-medium">{stockHealth.toFixed(0)}%</span>
          </div>
          <Progress value={stockHealth} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center">
            <CheckCircle className="h-4 w-4 mx-auto text-green-500" />
            <p className="text-lg font-bold">{inventoryStats.inStock}</p>
            <p className="text-[10px] text-muted-foreground">En stock</p>
          </div>
          <div className="text-center">
            <AlertTriangle className="h-4 w-4 mx-auto text-yellow-500" />
            <p className="text-lg font-bold">{inventoryStats.lowStock}</p>
            <p className="text-[10px] text-muted-foreground">Stock bas</p>
          </div>
          <div className="text-center">
            <Package className="h-4 w-4 mx-auto text-red-500" />
            <p className="text-lg font-bold">{inventoryStats.outOfStock}</p>
            <p className="text-[10px] text-muted-foreground">Rupture</p>
          </div>
        </div>

        <div className="pt-2 border-t text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valeur stock</span>
            <span className="font-semibold">{inventoryStats.stockValue.toLocaleString('fr-FR')}€</span>
          </div>
        </div>
      </CardContent>
    </>
  );
}
