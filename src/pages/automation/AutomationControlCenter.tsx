/**
 * Automation Control Center
 * Unified dashboard: KPIs, activity feed, alerts, cross-module metrics
 */
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Activity, AlertTriangle, BarChart3, Bell, CheckCircle2,
  DollarSign, Loader2, Package, RefreshCw, Settings,
  ShieldAlert, TrendingUp, Truck, XCircle, Zap
} from 'lucide-react';
import { AutomationMetricsDashboard } from '@/components/automation/AutomationMetricsDashboard';
import { AutomationAlertCenter } from '@/components/automation/AutomationAlertCenter';
import { AutomationActivityFeed } from '@/components/automation/AutomationActivityFeed';

export default function AutomationControlCenter() {
  const [period, setPeriod] = useState<string>('24h');
  const queryClient = useQueryClient();

  const periodMs = period === '1h' ? 3600000 : period === '24h' ? 86400000 : period === '7d' ? 604800000 : 2592000000;
  const since = new Date(Date.now() - periodMs).toISOString();

  // Unified KPIs
  const { data: kpis, isLoading } = useQuery({
    queryKey: ['automation-control-kpis', period],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const uid = user.id;

      const results = await Promise.all([
        supabase.from('automation_workflows').select('id', { count: 'exact', head: true })
          .eq('user_id', uid).eq('is_active', true),
        supabase.from('automation_workflows').select('id', { count: 'exact', head: true })
          .eq('user_id', uid).eq('status', 'error'),
        supabase.from('price_change_history').select('id', { count: 'exact', head: true })
          .eq('user_id', uid).gte('created_at', since),
        supabase.from('supplier_products').select('id', { count: 'exact', head: true })
          .eq('user_id', uid).gte('last_synced_at', since),
        supabase.from('auto_order_queue').select('id', { count: 'exact', head: true })
          .eq('user_id', uid).gte('created_at', since),
        supabase.from('auto_order_queue').select('id', { count: 'exact', head: true })
          .eq('user_id', uid).eq('status', 'failed').gte('created_at', since),
        supabase.from('supplier_sync_logs').select('id', { count: 'exact', head: true })
          .eq('user_id', uid).eq('log_level', 'error').gte('created_at', since),
        supabase.from('products').select('id', { count: 'exact', head: true })
          .eq('user_id', uid).lt('stock_quantity', 5).eq('status', 'active'),
        supabase.from('user_notifications').select('id', { count: 'exact', head: true })
          .eq('user_id', uid).eq('is_read', false),
      ]);

      const activeWorkflows = results[0].count || 0;
      const failedWorkflows = results[1].count || 0;
      const priceUpdates = results[2].count || 0;
      const stockUpdates = results[3].count || 0;
      const autoOrders = results[4].count || 0;
      const failedOrders = results[5].count || 0;
      const syncErrors = results[6].count || 0;
      const lowStockCount = results[7].count || 0;
      const activeAlerts = results[8].count || 0;

      return {
        activeWorkflows: activeWorkflows || 0,
        failedWorkflows: failedWorkflows || 0,
        priceUpdates: priceUpdates || 0,
        stockUpdates: stockUpdates || 0,
        autoOrders: autoOrders || 0,
        failedOrders: failedOrders || 0,
        syncErrors: syncErrors || 0,
        lowStockCount: lowStockCount || 0,
        activeAlerts: activeAlerts || 0,
        successRate: (autoOrders || 0) > 0
          ? Math.round(((autoOrders || 0) - (failedOrders || 0)) / (autoOrders || 0) * 100)
          : 100,
      };
    },
    staleTime: 30_000,
  });

  // Trigger full scan
  const scanAlerts = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('automation-alert-engine', {
        body: { action: 'scan_all' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const total = data?.results?.reduce((s: number, r: any) => s + (r.alerts_created || 0), 0) || 0;
      toast.success(`Scan terminé : ${total} nouvelle(s) alerte(s)`);
      queryClient.invalidateQueries({ queryKey: ['automation-control-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['proactive-alerts'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const kpiCards = [
    { label: 'Workflows actifs', value: kpis?.activeWorkflows ?? '—', icon: Zap, color: 'text-primary', sub: `${kpis?.failedWorkflows || 0} en erreur` },
    { label: 'MAJ prix', value: kpis?.priceUpdates ?? '—', icon: DollarSign, color: 'text-success' },
    { label: 'MAJ stock', value: kpis?.stockUpdates ?? '—', icon: Package, color: 'text-chart-2' },
    { label: 'Commandes auto', value: kpis?.autoOrders ?? '—', icon: Truck, color: 'text-warning', sub: `Taux succès: ${kpis?.successRate ?? '—'}%` },
    { label: 'Erreurs sync', value: kpis?.syncErrors ?? '—', icon: XCircle, color: 'text-destructive' },
    { label: 'Stock bas', value: kpis?.lowStockCount ?? '—', icon: AlertTriangle, color: 'text-warning' },
    { label: 'Alertes actives', value: kpis?.activeAlerts ?? '—', icon: Bell, color: 'text-destructive' },
    { label: 'Taux de succès', value: `${kpis?.successRate ?? '—'}%`, icon: CheckCircle2, color: 'text-success' },
  ];

  return (
    <>
      <Helmet>
        <title>Centre de Contrôle | Drop-Craft AI</title>
        <meta name="description" content="Tableau de bord unifié pour piloter toutes les automatisations : stocks, prix, workflows, alertes." />
      </Helmet>

      <ChannablePageWrapper
        title="Centre de Contrôle Automatisation"
        description="Pilotage centralisé de toutes les automatisations, métriques et alertes"
        heroImage="stock"
        badge={{ label: 'Control Center', icon: Activity }}
      >
        {/* Period selector + Scan button */}
        <div className="flex items-center justify-between mb-6">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Dernière heure</SelectItem>
              <SelectItem value="24h">24 heures</SelectItem>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => runOrchestrator.mutate()}
              disabled={runOrchestrator.isPending}
              className="gap-2"
            >
              {runOrchestrator.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Lancer le cycle complet
            </Button>
            <Button
              onClick={() => scanAlerts.mutate()}
              disabled={scanAlerts.isPending}
              className="gap-2"
            >
              {scanAlerts.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
              Scanner les anomalies
            </Button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {kpiCards.map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                    {kpi.label}
                  </div>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  {kpi.sub && <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-1.5">
              <Bell className="h-3.5 w-3.5" />
              Alertes
              {(kpis?.activeAlerts || 0) > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs h-5 px-1.5">{kpis?.activeAlerts}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Activité
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5">
              <Settings className="h-3.5 w-3.5" />
              Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AutomationMetricsDashboard period={period} />
          </TabsContent>

          <TabsContent value="alerts">
            <AutomationAlertCenter />
          </TabsContent>

          <TabsContent value="activity">
            <AutomationActivityFeed period={period} since={since} />
          </TabsContent>

          <TabsContent value="settings">
            <AlertConfigPanel />
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}

/* ── Alert Configuration Panel ── */
function AlertConfigPanel() {
  const { data: configs, isLoading } = useQuery({
    queryKey: ['alert-configurations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from('alert_configurations')
        .select('*')
        .eq('user_id', user.id);
      return data || [];
    },
  });

  const queryClient = useQueryClient();

  const upsertConfig = useMutation({
    mutationFn: async (config: { alert_type: string; threshold_value?: number; threshold_percent?: number; is_enabled: boolean; channels: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const existing = configs?.find((c: any) => c.alert_type === config.alert_type);
      if (existing) {
        await supabase.from('alert_configurations').update(config).eq('id', existing.id);
      } else {
        await supabase.from('alert_configurations').insert({ ...config, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-configurations'] });
      toast.success('Configuration sauvegardée');
    },
  });

  const alertTypes = [
    { type: 'stock_low', label: 'Stock bas', desc: 'Alerte quand le stock passe sous le seuil', icon: Package, defaultThreshold: 5, unit: 'unités' },
    { type: 'margin_drop', label: 'Baisse de marge', desc: 'Alerte quand la marge descend sous le seuil', icon: TrendingUp, defaultThreshold: 10, unit: '%' },
    { type: 'supplier_price_hike', label: 'Hausse prix fournisseur', desc: 'Alerte si hausse > seuil', icon: DollarSign, defaultThreshold: 15, unit: '%' },
    { type: 'workflow_failure', label: 'Échec workflow', desc: 'Alerte à chaque échec d\'automatisation', icon: XCircle, defaultThreshold: 1, unit: 'échecs' },
    { type: 'sync_failure', label: 'Échec synchronisation', desc: 'Alerte en cas d\'erreur de sync', icon: RefreshCw, defaultThreshold: 1, unit: 'erreurs' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Configuration des alertes</h3>
      <p className="text-sm text-muted-foreground">Personnalisez les seuils et canaux de notification pour chaque type d'alerte.</p>

      <div className="grid gap-4">
        {alertTypes.map((at) => {
          const config = configs?.find((c: any) => c.alert_type === at.type);
          const isEnabled = config?.is_enabled ?? true;
          const threshold = config?.threshold_value ?? config?.threshold_percent ?? at.defaultThreshold;
          const channels = config?.channels ?? ['in_app'];

          return (
            <Card key={at.type}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <at.icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{at.label}</p>
                      <p className="text-xs text-muted-foreground">{at.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Seuil:</span>
                      <Badge variant="outline">{threshold} {at.unit}</Badge>
                    </div>
                    <div className="flex gap-1">
                      {['in_app', 'email'].map((ch) => (
                        <Badge key={ch} variant={channels.includes(ch) ? 'default' : 'outline'} className="text-xs cursor-pointer"
                          onClick={() => {
                            const newChannels = channels.includes(ch) ? channels.filter((c: string) => c !== ch) : [...channels, ch];
                            upsertConfig.mutate({ alert_type: at.type, threshold_value: threshold, is_enabled: isEnabled, channels: newChannels });
                          }}
                        >
                          {ch === 'in_app' ? '🔔 App' : '📧 Email'}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant={isEnabled ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => upsertConfig.mutate({ alert_type: at.type, threshold_value: threshold, is_enabled: !isEnabled, channels })}
                    >
                      {isEnabled ? 'Actif' : 'Inactif'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
