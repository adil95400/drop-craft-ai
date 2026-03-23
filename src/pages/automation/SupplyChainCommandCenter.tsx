/**
 * Supply Chain Command Center
 * Unified view: Auto-reorder → Order tracking → Returns
 */
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Package, Truck, RotateCcw, Zap, AlertTriangle,
  Loader2, RefreshCw, Target, MapPin
} from 'lucide-react';
import { AutoOrderQueueDashboard } from '@/components/automation/AutoOrderQueueDashboard';
import { AutomatedReturnsWorkflow } from '@/components/automation/AutomatedReturnsWorkflow';
import { OrderTrackingPipeline } from '@/components/automation/OrderTrackingPipeline';

export default function SupplyChainCommandCenter() {
  const { data: stats } = useQuery({
    queryKey: ['supply-chain-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const [
        { count: pendingOrders },
        { count: activeRules },
        { count: pendingReturns },
        { count: lowStockProducts },
        { count: inTransit },
      ] = await Promise.all([
        supabase.from('auto_order_queue').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).in('status', ['pending', 'processing']),
        supabase.from('auto_order_rules').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).eq('is_active', true),
        supabase.from('returns').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).in('status', ['requested', 'approved']),
        supabase.from('products').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).lt('stock_quantity', 5).eq('status', 'active'),
        supabase.from('auto_order_queue').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).eq('status', 'completed'),
      ]);

      return {
        pendingOrders: pendingOrders || 0,
        activeRules: activeRules || 0,
        pendingReturns: pendingReturns || 0,
        lowStockProducts: lowStockProducts || 0,
        inTransit: inTransit || 0,
      };
    },
    staleTime: 30_000,
  });

  const triggerReorder = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('auto-reorder-engine', {
        body: { action: 'check_and_reorder' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const r = data?.results;
      toast.success(`Vérification: ${r?.checked || 0} règles, ${r?.triggered || 0} commandes créées`);
    },
    onError: (e: Error) => toast.error(`Erreur: ${e.message}`),
  });

  const processQueue = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('auto-reorder-engine', {
        body: { action: 'process_queue' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const r = data?.results;
      toast.success(`${r?.processed || 0} commandes traitées`);
    },
    onError: (e: Error) => toast.error(`Erreur: ${e.message}`),
  });

  const kpis = [
    { label: 'Stock bas', value: stats?.lowStockProducts ?? '—', icon: AlertTriangle, color: 'text-destructive' },
    { label: 'Règles actives', value: stats?.activeRules ?? '—', icon: Target, color: 'text-success' },
    { label: 'Commandes en cours', value: stats?.pendingOrders ?? '—', icon: Package, color: 'text-primary' },
    { label: 'En transit', value: stats?.inTransit ?? '—', icon: Truck, color: 'text-warning' },
    { label: 'Retours', value: stats?.pendingReturns ?? '—', icon: RotateCcw, color: 'text-chart-2' },
  ];

  return (
    <>
      <Helmet>
        <title>Supply Chain | Drop-Craft AI</title>
        <meta name="description" content="Centre de commande supply chain : réapprovisionnement automatique, suivi logistique et gestion des retours." />
      </Helmet>

      <ChannablePageWrapper
        title="Centre de Commande Supply Chain"
        description="Réapprovisionnement auto → Suivi logistique → Retours"
        heroImage="stock"
        badge={{ label: 'Supply Chain', icon: Truck }}
      >
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {kpis.map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
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

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            variant="outline"
            onClick={() => triggerReorder.mutate()}
            disabled={triggerReorder.isPending}
            className="gap-2"
          >
            {triggerReorder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Vérifier seuils & commander
          </Button>
          <Button
            variant="outline"
            onClick={() => processQueue.mutate()}
            disabled={processQueue.isPending}
            className="gap-2"
          >
            {processQueue.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Traiter la file d'attente
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList>
            <TabsTrigger value="orders" className="gap-1.5">
              <Package className="h-3.5 w-3.5" />
              Commandes auto
              {(stats?.pendingOrders || 0) > 0 && (
                <Badge className="ml-1 text-xs h-5 px-1.5">{stats?.pendingOrders}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tracking" className="gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Suivi logistique
              {(stats?.inTransit || 0) > 0 && (
                <Badge variant="outline" className="ml-1 text-xs h-5 px-1.5">{stats?.inTransit}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="returns" className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Retours
              {(stats?.pendingReturns || 0) > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">{stats?.pendingReturns}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <AutoOrderQueueDashboard />
          </TabsContent>

          <TabsContent value="tracking">
            <OrderTrackingPipeline />
          </TabsContent>

          <TabsContent value="returns">
            <AutomatedReturnsWorkflow />
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
