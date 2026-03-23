/**
 * Order Tracking Pipeline
 * Visual logistics tracking: confirmed → in_transit → delivered
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { motion } from 'framer-motion';
import {
  Package, Truck, CheckCircle2, Clock, MapPin,
  RefreshCw, Loader2, ArrowRight, Box, CalendarClock
} from 'lucide-react';

const TRACKING_STATUSES = [
  { key: 'confirmed', label: 'Confirmée', icon: CheckCircle2, color: 'text-info' },
  { key: 'in_transit', label: 'En transit', icon: Truck, color: 'text-warning' },
  { key: 'delivered', label: 'Livrée', icon: MapPin, color: 'text-success' },
];

export function OrderTrackingPipeline() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['order-tracking', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.functions.invoke('auto-reorder-engine', {
        body: { action: 'get_tracking', userId: user.id },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });

  const updateTracking = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('auto-reorder-engine', {
        body: { action: 'update_tracking' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (res) => {
      toast.success(`Tracking: ${res.results?.updated || 0} mis à jour, ${res.results?.delivered || 0} livrées`);
      queryClient.invalidateQueries({ queryKey: ['order-tracking'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const summary = data?.summary || { confirmed: 0, in_transit: 0, delivered: 0, total: 0 };
  const tracking = data?.tracking || { confirmed: [], in_transit: [], delivered: [] };

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total suivies', value: summary.total, icon: Package, color: 'text-primary' },
          { label: 'Confirmées', value: summary.confirmed, icon: CheckCircle2, color: 'text-info' },
          { label: 'En transit', value: summary.in_transit, icon: Truck, color: 'text-warning' },
          { label: 'Livrées', value: summary.delivered, icon: MapPin, color: 'text-success' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                  {kpi.label}
                </div>
                <p className="text-2xl font-bold">{kpi.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Refresh */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateTracking.mutate()}
          disabled={updateTracking.isPending}
          className="gap-2"
        >
          {updateTracking.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Mettre à jour le tracking
        </Button>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Pipeline columns */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TRACKING_STATUSES.map((status) => {
            const orders = tracking[status.key] || [];
            const StatusIcon = status.icon;

            return (
              <Card key={status.key} className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <StatusIcon className={`h-4 w-4 ${status.color}`} />
                    {status.label}
                    <Badge variant="secondary" className="ml-auto text-xs">{orders.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="max-h-[400px]">
                    {orders.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground text-sm">
                        Aucune commande
                      </div>
                    ) : (
                      <div className="divide-y">
                        {orders.map((order: any) => (
                          <div key={order.id} className="p-3 hover:bg-muted/30 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{order.product || 'Produit'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {order.quantity}x • {order.supplier || order.supplier_order_id?.substring(0, 10)}
                                </p>
                              </div>
                              {order.tracking_number && (
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {order.tracking_number}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              {order.processed_at && (
                                <span className="flex items-center gap-1">
                                  <CalendarClock className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(order.processed_at), { addSuffix: true, locale: getDateFnsLocale() })}
                                </span>
                              )}
                              {order.estimated_delivery && status.key !== 'delivered' && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  ETA {new Date(order.estimated_delivery).toLocaleDateString()}
                                </span>
                              )}
                            </div>

                            {/* Mini progress */}
                            <div className="flex items-center gap-1 mt-2">
                              {TRACKING_STATUSES.map((s, si) => {
                                const currentIdx = TRACKING_STATUSES.findIndex(t => t.key === status.key);
                                return (
                                  <div key={s.key} className="flex items-center gap-1">
                                    <div className={`w-2 h-2 rounded-full ${si <= currentIdx ? 'bg-primary' : 'bg-muted'}`} />
                                    {si < TRACKING_STATUSES.length - 1 && (
                                      <div className={`w-3 h-0.5 ${si < currentIdx ? 'bg-primary' : 'bg-muted'}`} />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
