/**
 * Price & Stock Automation Command Center
 * Unified dashboard: sync status, pricing rules, alerts, price history, automated actions
 */
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Activity, AlertTriangle, ArrowUpRight, ArrowDownRight, BarChart3,
  Bot, CheckCircle2, Clock, DollarSign, Package, RefreshCw, Shield,
  TrendingDown, TrendingUp, Zap, XCircle, History, Settings2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PriceStockAutomationPage() {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // === KPIs: recent automated actions ===
  const { data: automationStats } = useQuery({
    queryKey: ['automation-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const since24h = new Date(Date.now() - 86400000).toISOString();
      const since7d = new Date(Date.now() - 7 * 86400000).toISOString();

      const [deactivated, reactivated, repriced, alerts] = await Promise.all([
        supabase.from('activity_logs').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).eq('action', 'product_auto_deactivated').gte('created_at', since24h),
        supabase.from('activity_logs').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).eq('action', 'product_auto_reactivated').gte('created_at', since24h),
        supabase.from('activity_logs').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).eq('action', 'product_auto_repriced').gte('created_at', since24h),
        (supabase.from('supplier_notifications') as any).select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).gte('created_at', since24h),
      ]);

      // Margin stats from price changes
      const { data: priceChanges } = await supabase
        .from('price_change_history')
        .select('old_price, new_price, change_percent, change_type, created_at')
        .eq('user_id', user.id)
        .gte('created_at', since7d)
        .order('created_at', { ascending: false })
        .limit(50);

      return {
        deactivated24h: deactivated.count || 0,
        reactivated24h: reactivated.count || 0,
        repriced24h: repriced.count || 0,
        alerts24h: alerts.count || 0,
        recentPriceChanges: priceChanges || [],
      };
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  // === Sync status ===
  const { data: syncJobs } = useQuery({
    queryKey: ['sync-jobs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .in('job_type', ['sync'])
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  // === Pricing rules ===
  const { data: pricingRules } = useQuery({
    queryKey: ['pricing-rules-automation', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  // === Stock alerts ===
  const { data: stockAlerts } = useQuery({
    queryKey: ['stock-alerts-automation', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await (supabase.from('stock_alerts') as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user,
  });

  // === Recent automation actions ===
  const { data: automationActions } = useQuery({
    queryKey: ['automation-actions-log', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .in('action', ['product_auto_deactivated', 'product_auto_reactivated', 'product_auto_repriced', 'supplier_auto_sync'])
        .order('created_at', { ascending: false })
        .limit(30);
      return data || [];
    },
    enabled: !!user,
  });

  // Toggle pricing rule
  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('pricing_rules')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules-automation'] });
      toast({ title: 'Règle mise à jour' });
    },
  });

  // Trigger manual sync
  const triggerSyncMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('supplier-sync-cron');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
      toast({ title: 'Synchronisation déclenchée' });
    },
    onError: () => toast({ title: 'Erreur', variant: 'destructive' }),
  });

  const stats = automationStats;
  const activeRules = pricingRules?.filter(r => r.is_active).length || 0;

  // Chart data from recent price changes
  const priceChangeChart = (stats?.recentPriceChanges || [])
    .filter((c: any) => c.change_type === 'auto_repricing')
    .slice(0, 15)
    .reverse()
    .map((c: any, i: number) => ({
      name: format(new Date(c.created_at), 'dd/MM HH:mm'),
      ancien: c.old_price,
      nouveau: c.new_price,
      variation: c.change_percent?.toFixed(1),
    }));

  return (
    <>
      <Helmet>
        <title>Automation Prix & Stock | Drop Craft AI</title>
        <meta name="description" content="Centre de commande pour l'automatisation des prix et stocks" />
      </Helmet>

      <ChannablePageWrapper
        title="Centre d'Automatisation Prix & Stock"
        description="Synchronisation, repricing automatique et gestion intelligente des ruptures"
        heroImage="products"
        badge={{ label: 'Automation', icon: Bot }}
      >
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KPICard
            icon={<Zap className="h-5 w-5" />}
            label="Repricing auto (24h)"
            value={stats?.repriced24h || 0}
            color="text-primary"
          />
          <KPICard
            icon={<XCircle className="h-5 w-5" />}
            label="Désactivés (rupture)"
            value={stats?.deactivated24h || 0}
            color="text-destructive"
          />
          <KPICard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Réactivés (stock ok)"
            value={stats?.reactivated24h || 0}
            color="text-green-600"
          />
          <KPICard
            icon={<AlertTriangle className="h-5 w-5" />}
            label="Alertes"
            value={stats?.alerts24h || 0}
            color="text-amber-500"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="pricing">Règles de prix</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="alerts">Alertes stock</TabsTrigger>
          </TabsList>

          {/* === OVERVIEW TAB === */}
          <TabsContent value="overview" className="space-y-6">
            {/* Sync status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Synchronisation fournisseurs
                  </CardTitle>
                  <CardDescription>Cron automatique toutes les 15 minutes</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => triggerSyncMutation.mutate()}
                  disabled={triggerSyncMutation.isPending}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${triggerSyncMutation.isPending ? 'animate-spin' : ''}`} />
                  Sync maintenant
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(syncJobs || []).slice(0, 5).map((job: any) => (
                    <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Badge variant={job.status === 'completed' ? 'default' : job.status === 'running' ? 'secondary' : 'destructive'}>
                          {job.status}
                        </Badge>
                        <span className="text-sm">{job.progress_message || job.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {job.created_at && formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: fr })}
                      </span>
                    </div>
                  ))}
                  {(!syncJobs || syncJobs.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucune synchronisation récente
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Auto-repricing chart */}
            {priceChangeChart.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Repricing automatique récent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={priceChangeChart}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="ancien" name="Ancien prix" fill="hsl(var(--muted-foreground))" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="nouveau" name="Nouveau prix" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* How it works */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  Fonctionnement automatique
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <AutomationFeatureCard
                    icon={<RefreshCw className="h-8 w-8 text-primary" />}
                    title="Sync toutes les 15 min"
                    description="Vérification automatique des stocks et prix chez vos fournisseurs"
                    active
                  />
                  <AutomationFeatureCard
                    icon={<DollarSign className="h-8 w-8 text-primary" />}
                    title="Auto-repricing"
                    description="Ajustement automatique de vos prix de vente selon vos règles de marge"
                    active={activeRules > 0}
                  />
                  <AutomationFeatureCard
                    icon={<Shield className="h-8 w-8 text-primary" />}
                    title="Protection rupture"
                    description="Désactivation automatique si stock = 0, réactivation quand le stock revient"
                    active
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === PRICING RULES TAB === */}
          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Règles de tarification actives</CardTitle>
                  <CardDescription>
                    {activeRules} règle(s) active(s) sur {pricingRules?.length || 0}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/pricing-manager'}>
                  <Settings2 className="h-4 w-4 mr-2" />
                  Gérer les règles
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(pricingRules || []).map((rule: any) => (
                    <div key={rule.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{rule.name}</h4>
                          <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                            {rule.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                          <Badge variant="outline">{rule.rule_type}</Badge>
                        </div>
                        {rule.description && (
                          <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Priorité: {rule.priority}</span>
                          {rule.execution_count > 0 && (
                            <span>Exécutions: {rule.execution_count}</span>
                          )}
                          {rule.last_executed_at && (
                            <span>Dernière: {formatDistanceToNow(new Date(rule.last_executed_at), { addSuffix: true, locale: fr })}</span>
                          )}
                        </div>
                      </div>
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(checked) =>
                          toggleRuleMutation.mutate({ id: rule.id, isActive: checked })
                        }
                      />
                    </div>
                  ))}
                  {(!pricingRules || pricingRules.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>Aucune règle de prix configurée</p>
                      <Button variant="link" onClick={() => window.location.href = '/pricing-manager'}>
                        Créer une règle
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === HISTORY TAB === */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Actions automatiques récentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(automationActions || []).map((action: any) => (
                    <div key={action.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition">
                      <ActionIcon action={action.action} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{action.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {action.created_at && formatDistanceToNow(new Date(action.created_at), { addSuffix: true, locale: fr })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {action.action.replace('product_auto_', '').replace('supplier_auto_', '')}
                      </Badge>
                    </div>
                  ))}
                  {(!automationActions || automationActions.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Aucune action automatique enregistrée
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === ALERTS TAB === */}
          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alertes stock actives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(stockAlerts || []).map((alert: any) => (
                    <div key={alert.id} className="flex items-center gap-3 p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                      {alert.alert_type === 'out_of_stock' ? (
                        <XCircle className="h-5 w-5 text-destructive shrink-0" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{alert.product_name || alert.message}</p>
                        <p className="text-xs text-muted-foreground">
                          Stock: {alert.current_stock} • Seuil: {alert.threshold}
                        </p>
                      </div>
                      <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                        {alert.alert_type === 'out_of_stock' ? 'Rupture' : 'Stock bas'}
                      </Badge>
                    </div>
                  ))}
                  {(!stockAlerts || stockAlerts.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30 text-green-500" />
                      <p>Aucune alerte active — Tous les stocks sont OK</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}

// === Sub-components ===

function KPICard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center gap-3">
          <div className={color}>{icon}</div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AutomationFeatureCard({ icon, title, description, active }: {
  icon: React.ReactNode; title: string; description: string; active: boolean;
}) {
  return (
    <div className={`p-4 rounded-lg border ${active ? 'border-primary/30 bg-primary/5' : 'border-muted bg-muted/30 opacity-60'}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        {active && <Badge variant="default" className="text-[10px]">Actif</Badge>}
      </div>
      <h4 className="font-medium text-sm">{title}</h4>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

function ActionIcon({ action }: { action: string }) {
  switch (action) {
    case 'product_auto_deactivated':
      return <XCircle className="h-5 w-5 text-destructive shrink-0" />;
    case 'product_auto_reactivated':
      return <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />;
    case 'product_auto_repriced':
      return <DollarSign className="h-5 w-5 text-primary shrink-0" />;
    case 'supplier_auto_sync':
      return <RefreshCw className="h-5 w-5 text-blue-500 shrink-0" />;
    default:
      return <Activity className="h-5 w-5 text-muted-foreground shrink-0" />;
  }
}
