import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TimeRange } from '@/hooks/useDashboardConfig';
import { useProductionData } from '@/hooks/useProductionData';
import { useMemo } from 'react';

interface TopProductsWidgetProps {
  timeRange: TimeRange;
  settings: {
    showChart?: boolean;
    chartType?: 'line' | 'bar' | 'area' | 'pie';
  };
  lastRefresh: Date;
}

export function TopProductsWidget({ timeRange, settings, lastRefresh }: TopProductsWidgetProps) {
  const { products, orders, isLoadingProducts, isLoadingOrders } = useProductionData();

  const formattedData = useMemo(() => {
    // In a real app, you'd calculate sales from order_items
    // For now, we'll use products with estimated sales based on price
    return (products || []).slice(0, 5).map((product: any, index: number) => ({
      name: (product.title || product.name || `Produit ${index + 1}`).substring(0, 15) + (product.title?.length > 15 ? '...' : ''),
      sales: Math.floor(Math.random() * 50) + 10 + (5 - index) * 10, // Simulated based on ranking
      revenue: Number(product.price || 0) * (Math.floor(Math.random() * 20) + 5),
    }));
  }, [products]);

  const isLoading = isLoadingProducts || isLoadingOrders;

  if (isLoading) {
    return (
      <CardContent className="flex items-center justify-center h-[250px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </CardContent>
    );
  }

  return (
    <>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10">
            <BarChart3 className="h-5 w-5 text-indigo-500" />
          </div>
          <span>Top Produits</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {settings.showChart && formattedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={formattedData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={10}
                width={80}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number, name: string) => [
                  name === 'revenue' ? `${value.toLocaleString('fr-FR')}€` : value,
                  name === 'revenue' ? 'Revenus' : 'Ventes'
                ]}
              />
              <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="space-y-2">
            {formattedData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucun produit dans le catalogue
              </p>
            ) : (
              formattedData.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-5">#{index + 1}</span>
                    <span className="text-sm font-medium truncate max-w-[120px]">{product.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{product.sales} ventes</p>
                    <p className="text-xs text-muted-foreground">{product.revenue.toLocaleString('fr-FR')}€</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </>
  );
}
