import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TimeRange } from '@/hooks/useDashboardConfig';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TopProductsWidgetProps {
  timeRange: TimeRange;
  settings: {
    showChart?: boolean;
    chartType?: 'line' | 'bar' | 'area' | 'pie';
  };
  lastRefresh: Date;
}

export function TopProductsWidget({ timeRange, settings, lastRefresh }: TopProductsWidgetProps) {
  const { user } = useAuth();

  // Fetch top products based on order_items
  const { data: topProductsData, isLoading } = useQuery({
    queryKey: ['top-products-sales', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get order items with product info
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          product_id,
          product_name,
          qty,
          total_price,
          order:orders!inner(user_id, status)
        `)
        .eq('order.user_id', user.id)
        .neq('order.status', 'cancelled');
      
      if (error) {
        console.warn('Error fetching order items:', error);
        // Fallback to products table
        const { data: products } = await supabase
          .from('products')
          .select('id, title, price, stock_quantity')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        return (products || []).map((p, i) => ({
          name: (p.title || 'Produit').substring(0, 15) + ((p.title?.length || 0) > 15 ? '...' : ''),
          sales: 5 - i,
          revenue: Number(p.price || 0) * (5 - i)
        }));
      }
      
      // Aggregate by product
      const productStats: { [key: string]: { name: string; sales: number; revenue: number } } = {};
      
      orderItems?.forEach(item => {
        const productId = item.product_id || item.product_name;
        if (!productStats[productId]) {
          productStats[productId] = {
            name: (item.product_name || 'Produit').substring(0, 15) + ((item.product_name?.length || 0) > 15 ? '...' : ''),
            sales: 0,
            revenue: 0
          };
        }
        productStats[productId].sales += item.qty || 1;
        productStats[productId].revenue += Number(item.total_price || 0);
      });
      
      // Sort by sales and take top 5
      return Object.values(productStats)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000
  });

  const formattedData = topProductsData || [];

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
                Aucune vente enregistrée
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
