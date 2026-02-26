import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale';
import { getPlatformLogo } from '@/utils/platformLogos';

interface ConnectedStoresWidgetProps {
  timeRange: string;
  settings?: {
    showDetails?: boolean;
  };
}

export function ConnectedStoresWidget({ settings }: ConnectedStoresWidgetProps) {
  const showDetails = settings?.showDetails ?? true;
  const locale = useDateFnsLocale();

  const { data: stores, isLoading, refetch } = useQuery({
    queryKey: ['connected-stores'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .in('platform', ['shopify', 'woocommerce', 'prestashop', 'magento', 'bigcommerce'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const activeStores = stores?.filter(s => s.is_active && s.connection_status === 'connected') || [];
  const inactiveStores = stores?.filter(s => !s.is_active || s.connection_status !== 'connected') || [];

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="h-4 w-4 text-primary" />
            Boutiques connectées
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
            <Store className="h-4 w-4 text-primary" />
            Boutiques connectées
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => refetch()}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-green-500/10 rounded-lg">
            <CheckCircle className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold">{activeStores.length}</p>
            <p className="text-xs text-muted-foreground">Actives</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <XCircle className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-2xl font-bold">{inactiveStores.length}</p>
            <p className="text-xs text-muted-foreground">Inactives</p>
          </div>
        </div>

        {showDetails && stores && stores.length > 0 && (
          <div className="space-y-2">
            {stores.slice(0, 4).map((store) => (
              <div 
                key={store.id}
                className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-muted/50 flex items-center justify-center p-1 overflow-hidden">
                    {getPlatformLogo(store.platform) ? (
                      <img 
                        src={getPlatformLogo(store.platform)!}
                        alt={store.platform_name || store.platform}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Store className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">{store.platform_name || store.platform}</p>
                    {store.store_url && (
                      <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {store.store_url}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={store.connection_status === 'connected' ? 'default' : 'secondary'}
                    className="text-[10px]"
                  >
                    {store.connection_status === 'connected' ? 'Connecté' : 'Déconnecté'}
                  </Badge>
                  {store.store_url && (
                    <a href={store.store_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {(!stores || stores.length === 0) && (
          <div className="text-center py-6 text-muted-foreground">
            <Store className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune boutique connectée</p>
            <p className="text-xs">Connectez votre boutique Shopify, WooCommerce...</p>
          </div>
        )}

        {stores && stores.length > 0 && stores[0].last_sync_at && (
          <p className="text-xs text-muted-foreground text-center">
            Dernière sync: {formatDistanceToNow(new Date(stores[0].last_sync_at), { addSuffix: true, locale })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
