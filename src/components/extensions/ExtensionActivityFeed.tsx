/**
 * Extension Activity Feed
 * Affiche les activités en temps réel de l'extension Chrome
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, Package, Star, RefreshCw, AlertCircle, 
  CheckCircle, Clock, TrendingUp, Chrome, Eye
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  action: string;
  details: any;
  status: 'success' | 'pending' | 'error';
  source_url?: string;
  created_at: string;
}

export function ExtensionActivityFeed() {
  const { user } = useAuth();
  const [liveActivities, setLiveActivities] = useState<ActivityItem[]>([]);

  // Fetch activities from extension_data
  const { data: activities = [], isLoading, refetch } = useQuery({
    queryKey: ['extension-activities', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get from products (imports via extension)
      const { data: imports } = await (supabase
        .from('products') as any)
        .select('id, title, source_type, source_url, created_at, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      // Get from imported_reviews
      const { data: reviews } = await supabase
        .from('imported_reviews')
        .select('id, product_name, source, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      // Combine and sort
      const allActivities: ActivityItem[] = [
        ...(imports || []).map(item => ({
          id: item.id,
          action: 'product_import',
          details: { title: item.title, platform: item.source_platform },
          status: (item.status === 'active' ? 'success' : 'pending') as 'success' | 'pending',
          source_url: item.source_url,
          created_at: item.created_at
        })),
        ...(reviews || []).map(item => ({
          id: item.id,
          action: 'review_import',
          details: { product_name: item.product_name, source: item.source },
          status: 'success' as const,
          created_at: item.created_at
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
       .slice(0, 30);

      return allActivities;
    },
    enabled: !!user,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('extension-activities')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'catalog_products',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newActivity: ActivityItem = {
            id: payload.new.id,
            action: 'product_import',
            details: { 
              title: payload.new.title, 
              platform: payload.new.source_platform 
            },
            status: 'success',
            source_url: payload.new.source_url,
            created_at: payload.new.created_at
          };
          setLiveActivities(prev => [newActivity, ...prev].slice(0, 10));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'imported_reviews',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newActivity: ActivityItem = {
            id: payload.new.id,
            action: 'review_import',
            details: { 
              product_name: payload.new.product_name, 
              source: payload.new.source 
            },
            status: 'success',
            created_at: payload.new.created_at
          };
          setLiveActivities(prev => [newActivity, ...prev].slice(0, 10));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Combine live activities with fetched activities
  const allActivities = [...liveActivities, ...activities]
    .filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    )
    .slice(0, 30);

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'product_import':
        return <Package className="h-4 w-4" />;
      case 'review_import':
        return <Star className="h-4 w-4" />;
      case 'price_alert':
        return <TrendingUp className="h-4 w-4" />;
      case 'stock_sync':
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'product_import':
        return 'bg-blue-500/10 text-blue-500';
      case 'review_import':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'price_alert':
        return 'bg-green-500/10 text-green-500';
      case 'stock_sync':
        return 'bg-purple-500/10 text-purple-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="secondary" className="bg-green-500/10 text-green-600 text-xs"><CheckCircle className="h-3 w-3 mr-1" />Succès</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 text-xs"><Clock className="h-3 w-3 mr-1" />En cours</Badge>;
      case 'error':
        return <Badge variant="secondary" className="bg-red-500/10 text-red-600 text-xs"><AlertCircle className="h-3 w-3 mr-1" />Erreur</Badge>;
      default:
        return null;
    }
  };

  const getActivityLabel = (action: string) => {
    switch (action) {
      case 'product_import':
        return 'Import produit';
      case 'review_import':
        return 'Import avis';
      case 'price_alert':
        return 'Alerte prix';
      case 'stock_sync':
        return 'Sync stock';
      default:
        return 'Activité';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Chrome className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Activité Extension</CardTitle>
              <CardDescription className="text-xs">
                Temps réel
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : allActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune activité récente</p>
            <p className="text-xs mt-1">
              Utilisez l'extension Chrome pour importer des produits
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {allActivities.map((activity, index) => (
                <div 
                  key={activity.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                    liveActivities.some(la => la.id === activity.id) && "bg-primary/5 border-primary/20"
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                    getActivityColor(activity.action)
                  )}>
                    {getActivityIcon(activity.action)}
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium">
                        {getActivityLabel(activity.action)}
                      </span>
                      {getStatusBadge(activity.status)}
                    </div>
                    
                    <p className="text-sm truncate">
                      {activity.details?.title || activity.details?.product_name || 'Élément'}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {activity.details?.platform && (
                        <Badge variant="outline" className="text-xs py-0">
                          {activity.details.platform}
                        </Badge>
                      )}
                      <span>
                        {formatDistanceToNow(new Date(activity.created_at), { 
                          addSuffix: true, 
                          locale: fr 
                        })}
                      </span>
                    </div>
                  </div>

                  {activity.source_url && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 shrink-0"
                      onClick={() => window.open(activity.source_url, '_blank')}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
