import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, CheckCircle, XCircle, RefreshCw, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale';

interface MarketplacesWidgetProps {
  timeRange: string;
  settings?: {
    showDetails?: boolean;
    showStats?: boolean;
  };
}

const marketplaceIcons: Record<string, { icon: string; color: string }> = {
  amazon: { icon: '📦', color: 'text-orange-500' },
  ebay: { icon: '🏷️', color: 'text-blue-500' },
  cdiscount: { icon: '🛍️', color: 'text-red-500' },
  aliexpress: { icon: '🌍', color: 'text-orange-400' },
  etsy: { icon: '🎨', color: 'text-orange-600' },
  rakuten: { icon: '🔴', color: 'text-red-600' },
  fnac: { icon: '📱', color: 'text-yellow-600' },
};

export function MarketplacesWidget({ settings }: MarketplacesWidgetProps) {
  const showDetails = settings?.showDetails ?? true;
  const showStats = settings?.showStats ?? true;

  const { data: marketplaces, isLoading, refetch } = useQuery({
    queryKey: ['connected-marketplaces'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .in('platform', ['amazon', 'ebay', 'cdiscount', 'aliexpress', 'etsy', 'rakuten', 'fnac'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch orders stats per marketplace
  const { data: orderStats } = useQuery({
    queryKey: ['marketplace-orders-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {};

      const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount, status')
        .eq('user_id', user.id);

      if (error) throw error;

      return {
        totalOrders: data?.length || 0,
        totalRevenue: data?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0,
      };
    },
  });

  const activeMarketplaces = marketplaces?.filter(m => m.is_active && m.connection_status === 'connected') || [];

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-indigo-500" />
            Marketplaces
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-indigo-500" />
            Marketplaces
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => refetch()}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-indigo-500/10 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-indigo-500" />
            <div>
              <p className="text-2xl font-bold">{activeMarketplaces.length}</p>
              <p className="text-xs text-muted-foreground">Marketplaces actives</p>
            </div>
          </div>
          {showStats && orderStats && (
            <div className="text-right">
              <p className="text-lg font-semibold">{orderStats.totalOrders}</p>
              <p className="text-xs text-muted-foreground">Commandes</p>
            </div>
          )}
        </div>

        {showDetails && marketplaces && marketplaces.length > 0 && (
          <div className="space-y-2">
            {marketplaces.slice(0, 5).map((marketplace) => {
              const config = marketplaceIcons[marketplace.platform] || { icon: '🌐', color: 'text-gray-500' };
              
              return (
                <div 
                  key={marketplace.id}
                  className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{config.icon}</span>
                    <div>
                      <p className="text-sm font-medium capitalize">{marketplace.platform_name || marketplace.platform}</p>
                      <p className="text-xs text-muted-foreground">
                        {marketplace.sync_frequency === 'realtime' ? 'Temps réel' : 
                         marketplace.sync_frequency === 'hourly' ? 'Toutes les heures' : 
                         marketplace.sync_frequency === 'daily' ? 'Quotidien' : 'Manuel'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {marketplace.connection_status === 'connected' ? (
                      <Badge variant="default" className="text-[10px] bg-green-500">
                        <CheckCircle className="h-2 w-2 mr-1" />
                        Actif
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        <XCircle className="h-2 w-2 mr-1" />
                        Inactif
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {(!marketplaces || marketplaces.length === 0) && (
          <div className="text-center py-6 text-muted-foreground">
            <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune marketplace connectée</p>
            <p className="text-xs">Connectez Amazon, eBay, Cdiscount...</p>
          </div>
        )}

        {showStats && orderStats && orderStats.totalRevenue > 0 && (
          <div className="flex items-center justify-center gap-2 p-2 bg-green-500/10 rounded-lg">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">
              {orderStats.totalRevenue.toLocaleString('fr-FR')} € de revenus
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
