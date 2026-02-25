import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, ShoppingCart, Users, TrendingUp, Bell, Smartphone, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { mobileService } from '@/services/mobile/MobileService';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function MobileOptimizedDashboard() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState('web');
  const { toast } = useToast();

  useEffect(() => {
    const initMobile = async () => {
      setIsNative(mobileService.isNative());
      setPlatform(mobileService.getPlatform());
      if (mobileService.isNative()) {
        await mobileService.initializePushNotifications();
      }
    };
    initMobile();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  // Real stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['mobile-dashboard-stats'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;
      const uid = user.user.id;

      const [productsRes, ordersRes, customersRes, revenueRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact' }).eq('user_id', uid),
        supabase.from('orders').select('id', { count: 'exact' }).eq('user_id', uid),
        supabase.from('customers').select('id', { count: 'exact' }).eq('user_id', uid),
        supabase.from('orders').select('total_amount').eq('user_id', uid),
      ]);

      const revenue = (revenueRes.data || []).reduce((s, o) => s + (o.total_amount || 0), 0);
      return {
        products: productsRes.count || 0,
        orders: ordersRes.count || 0,
        customers: customersRes.count || 0,
        revenue,
      };
    },
  });

  // Recent activity
  const { data: recentActivity } = useQuery({
    queryKey: ['mobile-recent-activity'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];
      const { data } = await supabase.from('activity_logs').select('action, description, created_at')
        .eq('user_id', user.user.id).order('created_at', { ascending: false }).limit(5);
      return (data || []).map(a => ({
        message: a.description || a.action.replace(/_/g, ' '),
        time: formatTimeAgo(a.created_at),
      }));
    },
  });

  const formatTimeAgo = (d: string) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (diff < 1) return "À l'instant";
    if (diff < 60) return `${diff} min`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return `${Math.floor(diff / 1440)}j`;
  };

  const statCards = [
    { title: 'Produits', value: stats?.products?.toLocaleString() || '0', icon: Package, color: 'bg-blue-500' },
    { title: 'Commandes', value: stats?.orders?.toLocaleString() || '0', icon: ShoppingCart, color: 'bg-green-500' },
    { title: 'Clients', value: stats?.customers?.toLocaleString() || '0', icon: Users, color: 'bg-purple-500' },
    { title: 'Revenus', value: `€${(stats?.revenue || 0).toLocaleString('fr-FR')}`, icon: TrendingUp, color: 'bg-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="mb-6 flex items-center justify-between">
        <Badge variant={isOnline ? 'default' : 'destructive'} className="flex items-center gap-1">
          {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </Badge>
        {isNative && <Badge variant="outline" className="flex items-center gap-1"><Smartphone className="h-3 w-3" />{platform}</Badge>}
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard Mobile</h1>
        <p className="text-muted-foreground">Optimisé pour {isNative ? 'mobile natif' : 'navigateur mobile'}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {statCards.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10 w-fit`}>
                    <IconComponent className={`h-4 w-4 ${stat.color.replace('bg-', 'text-')}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">Activité Récente</CardTitle></CardHeader>
        <CardContent>
          {(recentActivity || []).length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Aucune activité récente</p>
          ) : (
            <div className="space-y-3">
              {(recentActivity || []).map((activity: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <p className="text-sm font-medium flex-1">{activity.message}</p>
                  <Badge variant="outline" className="text-xs">{activity.time}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
