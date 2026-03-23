/**
 * AutomationActivityFeed - Recent automation events
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Activity, DollarSign, RefreshCw, Truck } from 'lucide-react';

interface Props {
  period: string;
  since: string;
}

export function AutomationActivityFeed({ period, since }: Props) {
  const { data: events = [] } = useQuery({
    queryKey: ['automation-activity', period],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const [syncRes, priceRes, orderRes] = await Promise.all([
        supabase.from('supplier_sync_logs')
          .select('id, created_at, log_level, message')
          .eq('user_id', user.id).gte('created_at', since)
          .order('created_at', { ascending: false }).limit(20),
        supabase.from('price_change_history')
          .select('id, created_at, change_type, old_price, new_price')
          .eq('user_id', user.id).gte('created_at', since)
          .order('created_at', { ascending: false }).limit(20),
        supabase.from('auto_order_queue')
          .select('id, created_at, status, order_id')
          .eq('user_id', user.id).gte('created_at', since)
          .order('created_at', { ascending: false }).limit(20),
      ]);

      const syncs = syncRes.data || [];
      const priceChanges = priceRes.data || [];
      const orders = orderRes.data || [];

      const timeline: any[] = [];

      for (const s of syncs) {
        timeline.push({
          id: `sync-${s.id}`,
          type: 'sync',
          time: s.created_at,
          title: `Sync [${s.log_level}] — ${s.message?.slice(0, 60) || ''}`,
          status: s.log_level === 'error' ? 'error' : 'completed',
          icon: RefreshCw,
        });
      }
      for (const p of priceChanges) {
        const delta = p.old_price && p.new_price && p.old_price > 0
          ? ((p.new_price - p.old_price) / p.old_price * 100).toFixed(1) : null;
        timeline.push({
          id: `price-${p.id}`,
          type: 'price',
          time: p.created_at,
          title: `Prix ${p.change_type}: ${p.old_price}€ → ${p.new_price}€ ${delta ? `(${delta}%)` : ''}`,
          status: 'info',
          icon: DollarSign,
        });
      }
      for (const o of orders) {
        timeline.push({
          id: `order-${o.id}`,
          type: 'order',
          time: o.created_at,
          title: `Commande auto #${o.order_id?.slice(0, 8) || '—'}`,
          status: o.status,
          icon: Truck,
        });
      }

      return timeline.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 50);
    },
    staleTime: 30_000,
  });

  const statusVariant = (s: string): 'default' | 'destructive' | 'secondary' | 'outline' => {
    if (s === 'completed' || s === 'info') return 'default';
    if (s === 'error' || s === 'failed') return 'destructive';
    if (s === 'pending' || s === 'processing') return 'secondary';
    return 'outline';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Fil d'activité ({events.length} événements)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Aucune activité sur cette période</p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {events.map((event: any) => {
              const Icon = event.icon;
              return (
                <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{event.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {event.time && formatDistanceToNow(new Date(event.time), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                  <Badge variant={statusVariant(event.status)} className="text-[10px] shrink-0">
                    {event.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
