/**
 * PersonalizedInsights — Dashboard widget showing real-time personalized indicators
 * - Low stock alerts
 * - Winning products
 * - Store performance summary
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle, TrendingUp, Package, ArrowRight, Sparkles, ShoppingCart
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface Insight {
  id: string;
  type: 'low_stock' | 'winning' | 'store_perf';
  icon: React.ElementType;
  title: string;
  description: string;
  action: string;
  route: string;
  severity: 'warning' | 'success' | 'info';
}

export function PersonalizedInsights() {
  const navigate = useNavigate();

  const { data: lowStockProducts, isLoading: loadingStock } = useQuery({
    queryKey: ['insights-low-stock'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, title, stock_quantity')
        .lt('stock_quantity', 5)
        .gt('stock_quantity', -1)
        .order('stock_quantity', { ascending: true })
        .limit(5);
      return data || [];
    },
    staleTime: 60_000,
  });

  const { data: topProducts, isLoading: loadingTop } = useQuery({
    queryKey: ['insights-top-products'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, title, price, stock_quantity')
        .gt('price', 0)
        .order('price', { ascending: false })
        .limit(3);
      return data || [];
    },
    staleTime: 60_000,
  });

  const { data: storeCount } = useQuery({
    queryKey: ['insights-store-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('integrations')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      return count || 0;
    },
    staleTime: 120_000,
  });

  const insights = useMemo<Insight[]>(() => {
    const items: Insight[] = [];

    if (lowStockProducts && lowStockProducts.length > 0) {
      items.push({
        id: 'low-stock',
        type: 'low_stock',
        icon: AlertTriangle,
        title: `${lowStockProducts.length} produit${lowStockProducts.length > 1 ? 's' : ''} en stock faible`,
        description: lowStockProducts
          .slice(0, 3)
          .map((p) => `${p.title?.substring(0, 25)}… (${p.stock_quantity})`)
          .join(', '),
        action: 'Gérer le stock',
        route: '/products',
        severity: 'warning',
      });
    }

    if (topProducts && topProducts.length > 0) {
      items.push({
        id: 'winning',
        type: 'winning',
        icon: TrendingUp,
        title: 'Produits à fort potentiel',
        description: topProducts
          .slice(0, 3)
          .map((p) => `${p.title?.substring(0, 20)}… ($${p.price})`)
          .join(', '),
        action: 'Voir le catalogue',
        route: '/products',
        severity: 'success',
      });
    }

    if (storeCount !== undefined) {
      items.push({
        id: 'stores',
        type: 'store_perf',
        icon: ShoppingCart,
        title: `${storeCount} boutique${storeCount !== 1 ? 's' : ''} connectée${storeCount !== 1 ? 's' : ''}`,
        description: storeCount > 0
          ? 'Synchronisation active sur tous vos canaux'
          : 'Connectez votre première boutique pour commencer',
        action: storeCount > 0 ? 'Gérer les boutiques' : 'Connecter une boutique',
        route: '/stores-channels',
        severity: storeCount > 0 ? 'info' : 'warning',
      });
    }

    return items;
  }, [lowStockProducts, topProducts, storeCount]);

  const isLoading = loadingStock || loadingTop;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Insights personnalisés
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) return null;

  const severityStyles = {
    warning: 'border-warning/30 bg-warning/5',
    success: 'border-success/30 bg-success/5',
    info: 'border-primary/30 bg-primary/5',
  };

  const iconStyles = {
    warning: 'text-warning bg-warning/10',
    success: 'text-success bg-success/10',
    info: 'text-primary bg-primary/10',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          Insights personnalisés
          <Badge variant="outline" className="ml-auto text-xs">
            Temps réel
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`flex items-start gap-3 p-3 rounded-lg border ${severityStyles[insight.severity]}`}
          >
            <div className={`p-2 rounded-lg ${iconStyles[insight.severity]}`}>
              <insight.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{insight.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{insight.description}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-xs"
              onClick={() => navigate(insight.route)}
            >
              {insight.action}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
