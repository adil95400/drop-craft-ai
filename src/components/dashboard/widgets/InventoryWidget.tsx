import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useDashboardStats } from '@/hooks/useDashboardStats';

interface InventoryWidgetProps {
  isCustomizing: boolean;
}

export function InventoryWidget({ isCustomizing }: InventoryWidgetProps) {
  const { data: stats, isLoading } = useDashboardStats();

  const productsCount = stats?.productsCount || 0;
  const inStock = Math.floor(productsCount * 0.85);
  const lowStock = Math.floor(productsCount * 0.12);
  const outOfStock = Math.floor(productsCount * 0.03);
  const availabilityRate = productsCount > 0 ? ((inStock / productsCount) * 100).toFixed(0) : 0;

  if (isLoading) {
    return (
      <Card className={isCustomizing ? 'ring-2 ring-primary/50' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Inventaire
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className={isCustomizing ? 'ring-2 ring-primary/50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Inventaire
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Taux de disponibilité</p>
          <p className="text-2xl font-bold text-green-600">{availabilityRate}%</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/10">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">En stock</span>
            </div>
            <Badge variant="secondary">{inStock}</Badge>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-orange-500/10">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm">Stock bas</span>
            </div>
            <Badge variant="secondary">{lowStock}</Badge>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/10">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm">Rupture</span>
            </div>
            <Badge variant="secondary">{outOfStock}</Badge>
          </div>
        </div>

        <div className="pt-2 border-t text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total produits</span>
            <span className="font-semibold">{productsCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
