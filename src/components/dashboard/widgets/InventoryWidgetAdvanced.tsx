import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { TimeRange } from '@/hooks/useDashboardConfig';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface InventoryWidgetAdvancedProps {
  timeRange: TimeRange;
  settings: {
    showTrend?: boolean;
  };
  lastRefresh: Date;
}

const LOW_STOCK_THRESHOLD = 10;

export function InventoryWidgetAdvanced({ timeRange, settings, lastRefresh }: InventoryWidgetAdvancedProps) {
  const { user } = useAuth();

  const { data: inventoryStats, isLoading } = useQuery({
    queryKey: ['inventory-real-stats', user?.id, lastRefresh.getTime()],
    queryFn: async () => {
      if (!user?.id) return { totalProducts: 0, inStock: 0, lowStock: 0, outOfStock: 0, stockValue: 0 };

      const { data: products, error } = await supabase
        .from('products')
        .select('stock_quantity, price')
        .eq('user_id', user.id);

      if (error) {
        console.warn('Inventory query error:', error.message);
        return { totalProducts: 0, inStock: 0, lowStock: 0, outOfStock: 0, stockValue: 0 };
      }

      const all = products || [];
      const totalProducts = all.length;
      let inStock = 0;
      let lowStock = 0;
      let outOfStock = 0;
      let stockValue = 0;

      for (const p of all) {
        const qty = p.stock_quantity ?? 0;
        const price = Number(p.price) || 0;
        stockValue += qty * price;

        if (qty <= 0) {
          outOfStock++;
        } else if (qty <= LOW_STOCK_THRESHOLD) {
          lowStock++;
        } else {
          inStock++;
        }
      }

      return { totalProducts, inStock, lowStock, outOfStock, stockValue };
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  const stats = inventoryStats ?? { totalProducts: 0, inStock: 0, lowStock: 0, outOfStock: 0, stockValue: 0 };
  const stockHealth = stats.totalProducts > 0 ? (stats.inStock / stats.totalProducts) * 100 : 0;

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
              <Package className="h-5 w-5 text-warning" />
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
          <span className="text-3xl font-bold">{stats.totalProducts}</span>
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
            <CheckCircle className="h-4 w-4 mx-auto text-success" />
            <p className="text-lg font-bold">{stats.inStock}</p>
            <p className="text-[10px] text-muted-foreground">En stock</p>
          </div>
          <div className="text-center">
            <AlertTriangle className="h-4 w-4 mx-auto text-warning" />
            <p className="text-lg font-bold">{stats.lowStock}</p>
            <p className="text-[10px] text-muted-foreground">Stock bas</p>
          </div>
          <div className="text-center">
            <Package className="h-4 w-4 mx-auto text-destructive" />
            <p className="text-lg font-bold">{stats.outOfStock}</p>
            <p className="text-[10px] text-muted-foreground">Rupture</p>
          </div>
        </div>

        <div className="pt-2 border-t text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valeur stock</span>
            <span className="font-semibold">{stats.stockValue.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€</span>
          </div>
        </div>
      </CardContent>
    </>
  );
}
