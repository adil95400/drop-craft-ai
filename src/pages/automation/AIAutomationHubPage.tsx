/**
 * AI Automation Hub - Enhanced with creation, charts, realtime, edge function integration
 */
import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  Brain, Sparkles, Zap, TrendingUp, Bot, RefreshCw,
  CheckCircle2, XCircle, Clock, Activity, BarChart3,
  FileText, DollarSign, Package, Target, Plus, Trash2,
  Play, Pause, AlertTriangle, Rocket, Settings, Bell,
  ChevronRight, ChevronLeft, Shield, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow, format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ModuleInterconnectionBanner } from '@/components/cross-module/ModuleInterconnectionBanner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart
} from 'recharts';

const ACTION_TYPES = [
  { value: 'content-optimizer', icon: FileText, label: 'Optimiseur de Contenu', color: 'text-info', bg: 'bg-info/10', desc: 'Génère et optimise automatiquement les titres, descriptions et contenus produits grâce à l\'IA.' },
  { value: 'price-optimizer', icon: DollarSign, label: 'Optimiseur de Prix', color: 'text-success', bg: 'bg-success/10', desc: 'Ajuste dynamiquement les prix en fonction de la concurrence, des marges et de la demande.' },
  { value: 'stock-predictor', icon: Package, label: 'Prédicteur de Stock', color: 'text-warning', bg: 'bg-warning/10', desc: 'Prévoit les ruptures de stock et déclenche des réapprovisionnements automatiques.' },
  { value: 'ad-optimizer', icon: Target, label: 'Optimiseur Publicitaire', color: 'text-purple-500', bg: 'bg-purple-500/10', desc: 'Optimise les enchères, budgets et ciblage de vos campagnes publicitaires.' },
  { value: 'quality-auditor', icon: CheckCircle2, label: 'Auditeur Qualité', color: 'text-primary', bg: 'bg-primary/10', desc: 'Détecte les fiches produits incomplètes, erreurs et incohérences qualité.' },
  { value: 'seo-optimizer', icon: TrendingUp, label: 'Optimiseur SEO', color: 'text-orange-500', bg: 'bg-orange-500/10', desc: 'Analyse et améliore le référencement de vos produits automatiquement.' },
] as const;

const SCHEDULE_OPTIONS = [
  { value: 'realtime', label: 'Temps réel', desc: 'Exécution immédiate à chaque événement' },
  { value: 'hourly', label: 'Toutes les heures', desc: 'Analyse et actions horaires' },
  { value: 'daily', label: 'Quotidien', desc: 'Un cycle d\'optimisation par jour' },
  { value: 'weekly', label: 'Hebdomadaire', desc: 'Rapport et actions chaque semaine' },
] as const;

type CreateStep = 'type' | 'config' | 'review';

const ACTION_TYPE_META = Object.fromEntries(
  ACTION_TYPES.map(t => [t.value, { icon: t.icon, label: t.label, color: t.color, bg: t.bg }])
);

const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--info))'];

export default function AIAutomationHubPage() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<CreateStep>('type');
  const [newAgent, setNewAgent] = useState({
    action_type: 'content-optimizer',
    name: '',
    scope: 'global',
    threshold_score: 0.7,
    max_daily_actions: 50,
    schedule: 'daily',
    notify_on_action: true,
    notify_on_error: true,
    auto_revert: false,
    description: '',
  });

  const resetCreateForm = () => {
    setCreateStep('type');
    setNewAgent({
      action_type: 'content-optimizer', name: '', scope: 'global',
      threshold_score: 0.7, max_daily_actions: 50, schedule: 'daily',
      notify_on_action: true, notify_on_error: true, auto_revert: false, description: '',
    });
  };

  const selectedTypeMeta = ACTION_TYPES.find(t => t.value === newAgent.action_type) || ACTION_TYPES[0];

  // Fetch AI agent configs filtered by user
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['ai-automation-configs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('ai_auto_action_configs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch recent action logs filtered by user
  const { data: recentLogs = [] } = useQuery({
    queryKey: ['ai-automation-logs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('ai_auto_action_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch AI recommendations filtered by user
  const { data: recommendations = [] } = useQuery({
    queryKey: ['ai-automation-recommendations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('confidence_score', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch AI optimization jobs for performance stats
  const { data: aiJobs = [] } = useQuery({
    queryKey: ['ai-optimization-jobs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('ai_optimization_jobs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', subDays(new Date(), 30).toISOString())
        .order('created_at', { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Realtime subscription for live updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('ai-hub-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ai_auto_action_logs',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['ai-automation-logs', user.id] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ai_auto_action_configs',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['ai-automation-configs', user.id] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ai_recommendations',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['ai-automation-recommendations', user.id] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  // Toggle agent
  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('ai_auto_action_configs')
        .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-automation-configs'] });
      toast.success('Agent mis à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  // Create agent
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Non authentifié');
      const { error } = await supabase
        .from('ai_auto_action_configs')
        .insert({
          user_id: user.id,
          action_type: newAgent.action_type,
          scope: newAgent.scope,
          threshold_score: newAgent.threshold_score,
          max_daily_actions: newAgent.max_daily_actions,
          is_enabled: true,
          actions_today: 0,
          config: {},
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-automation-configs'] });
      toast.success('Agent IA créé avec succès');
      setCreateOpen(false);
      setNewAgent({ action_type: 'content-optimizer', scope: 'global', threshold_score: 0.7, max_daily_actions: 50 });
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  // Delete agent
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_auto_action_configs')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-automation-configs'] });
      toast.success('Agent supprimé');
    },
  });

  // Apply recommendation
  const applyRecommendation = useMutation({
    mutationFn: async (recId: string) => {
      const { error } = await supabase
        .from('ai_recommendations')
        .update({ status: 'applied', applied_at: new Date().toISOString() })
        .eq('id', recId)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-automation-recommendations'] });
      toast.success('Recommandation appliquée');
    },
  });

  // Dismiss recommendation
  const dismissRecommendation = useMutation({
    mutationFn: async (recId: string) => {
      const { error } = await supabase
        .from('ai_recommendations')
        .update({ status: 'dismissed', dismissed_at: new Date().toISOString() })
        .eq('id', recId)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-automation-recommendations'] });
    },
  });

  // Trigger AI orchestrator
  const triggerOrchestrator = useMutation({
    mutationFn: async (action: string) => {
      const { data, error } = await supabase.functions.invoke('ai-automation-orchestrator', {
        body: { action },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Orchestrateur IA lancé');
      queryClient.invalidateQueries({ queryKey: ['ai-automation-configs'] });
    },
    onError: (err: any) => {
      const msg = err?.message || '';
      if (msg.includes('429')) toast.error('Limite IA atteinte. Réessayez plus tard.');
      else if (msg.includes('402')) toast.error('Crédits IA épuisés.');
      else toast.error('Erreur orchestrateur IA');
    },
  });

  // Stats
  const activeAgents = configs.filter(c => c.is_enabled).length;
  const totalActionsToday = configs.reduce((s, c) => s + (c.actions_today || 0), 0);
  const successfulLogs = recentLogs.filter(l => l.status === 'applied');
  const failedLogs = recentLogs.filter(l => l.status === 'reverted' || l.status === 'failed');
  const avgSuccess = recentLogs.length > 0
    ? Math.round((successfulLogs.length / recentLogs.length) * 100) : 0;
  const avgConfidence = recentLogs.length > 0
    ? Math.round(recentLogs.reduce((s, l) => s + (l.confidence_score || 0), 0) / recentLogs.length * 100) : 0;

  // Chart data: actions per day (last 7 days)
  const activityChartData = (() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return { date: format(d, 'dd/MM'), day: format(d, 'yyyy-MM-dd'), success: 0, failed: 0, pending: 0 };
    });
    recentLogs.forEach(log => {
      const logDay = format(new Date(log.created_at), 'yyyy-MM-dd');
      const entry = days.find(d => d.day === logDay);
      if (entry) {
        if (log.status === 'applied') entry.success++;
        else if (log.status === 'reverted' || log.status === 'failed') entry.failed++;
        else entry.pending++;
      }
    });
    return days;
  })();

  // Chart data: actions by type
  const typeChartData = (() => {
    const map: Record<string, number> = {};
    recentLogs.forEach(log => {
      const label = ACTION_TYPE_META[log.action_type]?.label || log.action_type;
      map[label] = (map[label] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  })();

  // Jobs performance chart
  const jobsChartData = (() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return { date: format(d, 'dd/MM'), day: format(d, 'yyyy-MM-dd'), completed: 0, running: 0, failed: 0 };
    });
    aiJobs.forEach(job => {
      const jobDay = format(new Date(job.created_at!), 'yyyy-MM-dd');
      const entry = days.find(d => d.day === jobDay);
      if (entry) {
        if (job.status === 'completed') entry.completed++;
        else if (job.status === 'running' || job.status === 'pending') entry.running++;
        else entry.failed++;
      }
    });
    return days;
  })();

  if (isLoading) {
    return (
      <ChannablePageWrapper title="Hub IA" description="Chargement..." heroImage="ai" badge={{ label: 'IA Pro', icon: Brain }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </ChannablePageWrapper>
    );
  }

  return (
    <>
      <Helmet>
        <title>Hub IA & Automatisation | DropCraft AI</title>
        <meta name="description" content="Centre de commande IA pour l'automatisation intelligente de votre boutique e-commerce" />
      </Helmet>

      <ChannablePageWrapper
        title="Hub Intelligence Artificielle"
        description="Agents IA autonomes pour optimiser votre boutique en continu"
        heroImage="ai"
        badge={{ label: 'IA Pro', icon: Brain }}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => triggerOrchestrator.mutate('suggest_automations')}
              disabled={triggerOrchestrator.isPending}
            >
              <Rocket className="h-4 w-4" />
              {triggerOrchestrator.isPending ? 'Analyse...' : 'Suggestions IA'}
            </Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" /> Nouvel Agent
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un Agent IA</DialogTitle>
                  <DialogDescription>Configurez un nouvel agent d'automatisation intelligent</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Type d'agent</Label>
                    <Select value={newAgent.action_type} onValueChange={v => setNewAgent(p => ({ ...p, action_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ACTION_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>
                            <span className="flex items-center gap-2">
                              <t.icon className="h-4 w-4" /> {t.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Scope</Label>
                    <Select value={newAgent.scope} onValueChange={v => setNewAgent(p => ({ ...p, scope: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">Global (tous les produits)</SelectItem>
                        <SelectItem value="category">Par catégorie</SelectItem>
                        <SelectItem value="selected">Sélection manuelle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Seuil de confiance: {Math.round(newAgent.threshold_score * 100)}%</Label>
                    <Slider
                      value={[newAgent.threshold_score * 100]}
                      onValueChange={([v]) => setNewAgent(p => ({ ...p, threshold_score: v / 100 }))}
                      min={30} max={100} step={5}
                    />
                    <p className="text-xs text-muted-foreground">L'agent n'agira que si sa confiance dépasse ce seuil</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Limite d'actions par jour</Label>
                    <Input
                      type="number"
                      value={newAgent.max_daily_actions}
                      onChange={e => setNewAgent(p => ({ ...p, max_daily_actions: parseInt(e.target.value) || 10 }))}
                      min={1} max={1000}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
                  <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Création...' : 'Créer l\'agent'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      >
        <ModuleInterconnectionBanner currentModule="automation" />

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Bot className="h-3.5 w-3.5" /> Agents actifs
              </div>
              <div className="text-2xl font-bold text-foreground">{activeAgents}<span className="text-sm text-muted-foreground font-normal">/{configs.length}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Zap className="h-3.5 w-3.5" /> Actions aujourd'hui
              </div>
              <div className="text-2xl font-bold text-foreground">{totalActionsToday}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendingUp className="h-3.5 w-3.5" /> Taux de succès
              </div>
              <div className={cn('text-2xl font-bold', avgSuccess >= 80 ? 'text-success' : avgSuccess >= 50 ? 'text-warning' : 'text-destructive')}>
                {avgSuccess}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Brain className="h-3.5 w-3.5" /> Confiance moy.
              </div>
              <div className="text-2xl font-bold text-foreground">{avgConfidence}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Sparkles className="h-3.5 w-3.5" /> Recommandations
              </div>
              <div className="text-2xl font-bold text-primary">{recommendations.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="agents" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="agents" className="gap-1.5"><Bot className="h-4 w-4" /> Agents</TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5"><Activity className="h-4 w-4" /> Activité</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Analytics</TabsTrigger>
            <TabsTrigger value="insights" className="gap-1.5"><Sparkles className="h-4 w-4" /> Insights</TabsTrigger>
          </TabsList>

          {/* === AGENTS === */}
          <TabsContent value="agents">
            {configs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Aucun agent configuré</h3>
                  <p className="text-muted-foreground mb-4">Créez votre premier agent IA pour automatiser votre boutique.</p>
                  <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
                    <Plus className="h-4 w-4" /> Créer un agent
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {configs.map(config => {
                  const meta = ACTION_TYPE_META[config.action_type] || { icon: Brain, label: config.action_type, color: 'text-muted-foreground', bg: 'bg-muted' };
                  const Icon = meta.icon;
                  const isActive = config.is_enabled;
                  const usage = config.max_daily_actions ? Math.round(((config.actions_today || 0) / config.max_daily_actions) * 100) : 0;

                  return (
                    <Card key={config.id} className={cn('transition-all', isActive ? 'border-primary/20' : 'opacity-70')}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={cn('p-2.5 rounded-lg shrink-0', isActive ? meta.bg : 'bg-muted')}>
                              <Icon className={cn('h-5 w-5', isActive ? meta.color : 'text-muted-foreground')} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-foreground truncate">{meta.label}</h3>
                                <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs shrink-0">
                                  {isActive ? 'Actif' : 'En pause'}
                                </Badge>
                                {usage > 80 && (
                                  <Badge variant="outline" className="text-xs text-warning border-warning/30 shrink-0">
                                    <AlertTriangle className="h-3 w-3 mr-1" /> {usage}% utilisé
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                Scope: {config.scope || 'global'} · Seuil: {Math.round((config.threshold_score || 0) * 100)}%
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Zap className="h-3 w-3" /> {config.actions_today || 0}/{config.max_daily_actions || '∞'} actions
                                </span>
                                {config.last_run_at && (
                                  <span className="flex items-center gap-1">
                                    <RefreshCw className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(config.last_run_at), { addSuffix: true, locale: fr })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => { if (confirm('Supprimer cet agent ?')) deleteMutation.mutate(config.id); }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Switch
                              checked={isActive}
                              onCheckedChange={(checked) => toggleMutation.mutate({ id: config.id, enabled: checked })}
                              disabled={toggleMutation.isPending}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* === ACTIVITÉ === */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions récentes</CardTitle>
                <CardDescription>
                  {recentLogs.length} actions · {successfulLogs.length} réussies · {failedLogs.length} échouées
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Aucune action enregistrée</div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {recentLogs.map(log => {
                      const meta = ACTION_TYPE_META[log.action_type];
                      return (
                        <div key={log.id} className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/50 border-b border-border last:border-0">
                          <div className="flex items-center gap-3 min-w-0">
                            {log.status === 'applied' ? (
                              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                            ) : log.status === 'reverted' || log.status === 'failed' ? (
                              <XCircle className="h-4 w-4 text-destructive shrink-0" />
                            ) : (
                              <Clock className="h-4 w-4 text-warning shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">
                                {meta?.label || log.action_type} — {log.field_name || 'N/A'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {log.old_value && <span className="line-through mr-1">{log.old_value}</span>}
                                {log.new_value && <span className="text-foreground">{log.new_value}</span>}
                                {log.confidence_score != null && ` · ${Math.round(log.confidence_score * 100)}%`}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0 ml-2">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: fr })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === ANALYTICS === */}
          <TabsContent value="analytics">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Activity over time */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Activité des 7 derniers jours</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={activityChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Area type="monotone" dataKey="success" stackId="1" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.3} name="Réussies" />
                      <Area type="monotone" dataKey="failed" stackId="1" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.3} name="Échouées" />
                      <Area type="monotone" dataKey="pending" stackId="1" stroke="hsl(var(--warning))" fill="hsl(var(--warning))" fillOpacity={0.3} name="En attente" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Actions by type */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Répartition par type</CardTitle>
                </CardHeader>
                <CardContent>
                  {typeChartData.length === 0 ? (
                    <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                      Aucune donnée disponible
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={typeChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`} labelLine={false}>
                          {typeChartData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Jobs performance */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Performance des jobs IA</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={jobsChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Bar dataKey="completed" fill="hsl(var(--success))" name="Terminés" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="running" fill="hsl(var(--primary))" name="En cours" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="failed" fill="hsl(var(--destructive))" name="Échoués" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* === INSIGHTS === */}
          <TabsContent value="insights">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" /> Recommandations IA
                  </CardTitle>
                  <CardDescription>{recommendations.length} recommandations en attente</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recommendations.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      <Brain className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      Aucune recommandation en attente
                    </div>
                  ) : (
                    recommendations.slice(0, 6).map(rec => (
                      <div key={rec.id} className="p-3 rounded-lg border border-border bg-muted/30">
                        <div className="flex items-start gap-2">
                          <div className={cn(
                            'w-2 h-2 rounded-full mt-1.5 shrink-0',
                            rec.confidence_score >= 0.8 ? 'bg-success' :
                              rec.confidence_score >= 0.5 ? 'bg-warning' : 'bg-muted-foreground'
                          )} />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-foreground">{rec.title}</span>
                            {rec.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{rec.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {Math.round(rec.confidence_score * 100)}% confiance
                              </Badge>
                              {rec.impact_estimate && (
                                <Badge variant="outline" className="text-xs text-success border-success/30">
                                  {rec.impact_estimate}
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm" variant="default" className="h-7 text-xs gap-1"
                                onClick={() => applyRecommendation.mutate(rec.id)}
                                disabled={applyRecommendation.isPending}
                              >
                                <CheckCircle2 className="h-3 w-3" /> Appliquer
                              </Button>
                              <Button
                                size="sm" variant="ghost" className="h-7 text-xs"
                                onClick={() => dismissRecommendation.mutate(rec.id)}
                              >
                                Ignorer
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Stats summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" /> Vue d'ensemble
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: 'Agents configurés', value: configs.length },
                      { label: 'Agents actifs', value: activeAgents },
                      { label: 'Actions (dernières 50)', value: recentLogs.length },
                      { label: 'Actions réussies', value: successfulLogs.length, color: 'text-success' },
                      { label: 'Actions échouées', value: failedLogs.length, color: failedLogs.length > 0 ? 'text-destructive' : undefined },
                      { label: 'Taux de succès', value: `${avgSuccess}%`, color: avgSuccess >= 80 ? 'text-success' : avgSuccess >= 50 ? 'text-warning' : 'text-destructive' },
                      { label: 'Confiance moyenne', value: `${avgConfidence}%` },
                      { label: 'Jobs IA (30j)', value: aiJobs.length },
                      { label: 'Recommandations', value: recommendations.length, color: 'text-primary' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <span className={cn('font-semibold text-foreground', color)}>{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-border">
                    <h4 className="text-sm font-medium text-foreground mb-3">Actions rapides</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline" size="sm" className="gap-1.5 text-xs"
                        onClick={() => triggerOrchestrator.mutate('suggest_automations')}
                        disabled={triggerOrchestrator.isPending}
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Suggestions
                      </Button>
                      <Button
                        variant="outline" size="sm" className="gap-1.5 text-xs"
                        onClick={() => triggerOrchestrator.mutate('optimize_workflow')}
                        disabled={triggerOrchestrator.isPending}
                      >
                        <TrendingUp className="h-3.5 w-3.5" /> Optimiser
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
