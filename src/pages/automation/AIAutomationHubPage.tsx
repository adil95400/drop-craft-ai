/**
 * AI Automation Hub - Données réelles depuis ai_auto_action_configs + ai_auto_action_logs
 */
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Brain, Sparkles, Zap, TrendingUp, Bot, RefreshCw,
  CheckCircle2, XCircle, Clock, Activity, BarChart3,
  FileText, DollarSign, Package, Target, Loader2, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ModuleInterconnectionBanner } from '@/components/cross-module/ModuleInterconnectionBanner';

const ACTION_TYPE_META: Record<string, { icon: any; label: string; color: string }> = {
  'content-optimizer': { icon: FileText, label: 'Optimiseur de Contenu', color: 'text-info' },
  'price-optimizer': { icon: DollarSign, label: 'Optimiseur de Prix', color: 'text-success' },
  'stock-predictor': { icon: Package, label: 'Prédicteur de Stock', color: 'text-warning' },
  'ad-optimizer': { icon: Target, label: 'Optimiseur Publicitaire', color: 'text-purple-500' },
  'quality-auditor': { icon: CheckCircle2, label: 'Auditeur Qualité', color: 'text-primary' },
};

export default function AIAutomationHubPage() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();

  // Fetch AI agent configs from DB
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['ai-automation-configs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_auto_action_configs')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  // Fetch recent action logs
  const { data: recentLogs = [] } = useQuery({
    queryKey: ['ai-automation-logs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_auto_action_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  // Fetch AI recommendations
  const { data: recommendations = [] } = useQuery({
    queryKey: ['ai-automation-recommendations'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('status', 'pending')
        .order('confidence_score', { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  // Toggle agent
  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('ai_auto_action_configs')
        .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-automation-configs'] });
      toast.success('Agent mis à jour');
    },
  });

  // Stats from real data
  const activeAgents = configs.filter(c => c.is_enabled).length;
  const totalActionsToday = configs.reduce((s, c) => s + (c.actions_today || 0), 0);
  const successfulLogs = recentLogs.filter(l => l.status === 'applied');
  const avgSuccess = recentLogs.length > 0
    ? Math.round((successfulLogs.length / recentLogs.length) * 100)
    : 0;

  if (isLoading) {
    return (
      <ChannablePageWrapper title="Hub IA" description="Chargement..." heroImage="ai" badge={{ label: 'IA Pro', icon: Brain }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-96" />
      </ChannablePageWrapper>
    );
  }

  return (
    <>
      <Helmet>
        <title>Hub IA & Automatisation | Drop Craft AI</title>
        <meta name="description" content="Centre de commande IA pour l'automatisation intelligente de votre boutique" />
      </Helmet>

      <ChannablePageWrapper
        title="Hub Intelligence Artificielle"
        description="Agents IA autonomes pour optimiser votre boutique en continu"
        heroImage="ai"
        badge={{ label: 'IA Pro', icon: Brain }}
      >
        <ModuleInterconnectionBanner currentModule="automation" />

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Bot className="h-4 w-4" /> Agents actifs
              </div>
              <div className="text-2xl font-bold text-foreground">{activeAgents}/{configs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Zap className="h-4 w-4" /> Actions aujourd'hui
              </div>
              <div className="text-2xl font-bold text-foreground">{totalActionsToday}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <TrendingUp className="h-4 w-4" /> Taux de succès
              </div>
              <div className="text-2xl font-bold text-foreground">{avgSuccess}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Sparkles className="h-4 w-4" /> Recommandations
              </div>
              <div className="text-2xl font-bold text-foreground">{recommendations.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="agents" className="space-y-4">
          <TabsList>
            <TabsTrigger value="agents" className="gap-1.5"><Bot className="h-4 w-4" /> Agents IA</TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5"><Activity className="h-4 w-4" /> Activité</TabsTrigger>
            <TabsTrigger value="insights" className="gap-1.5"><Sparkles className="h-4 w-4" /> Insights</TabsTrigger>
          </TabsList>

          {/* Agents IA */}
          <TabsContent value="agents">
            {configs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Aucun agent configuré</h3>
                  <p className="text-muted-foreground mb-4">Configurez vos premiers agents IA pour automatiser votre boutique.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {configs.map(config => {
                  const meta = ACTION_TYPE_META[config.action_type] || {
                    icon: Brain,
                    label: config.action_type,
                    color: 'text-muted-foreground',
                  };
                  const Icon = meta.icon;
                  const isActive = config.is_enabled;

                  return (
                    <Card key={config.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className={cn(
                              'p-2.5 rounded-lg',
                              isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                            )}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground">{meta.label}</h3>
                                <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
                                  {isActive ? 'Actif' : 'En pause'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                Scope: {config.scope || 'global'} · Seuil: {(config.threshold_score || 0) * 100}%
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Zap className="h-3 w-3" /> {config.actions_today || 0} actions aujourd'hui
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> Max {config.max_daily_actions || '∞'}/jour
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
                          <Switch
                            checked={isActive}
                            onCheckedChange={(checked) => toggleMutation.mutate({ id: config.id, enabled: checked })}
                            disabled={toggleMutation.isPending}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Activité récente */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions récentes</CardTitle>
                <CardDescription>Historique des {recentLogs.length} dernières actions automatisées</CardDescription>
              </CardHeader>
              <CardContent>
                {recentLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune action enregistrée
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentLogs.map(log => (
                      <div key={log.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          {log.status === 'applied' ? (
                            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                          ) : log.status === 'reverted' ? (
                            <XCircle className="h-4 w-4 text-destructive shrink-0" />
                          ) : (
                            <Clock className="h-4 w-4 text-warning shrink-0" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {log.action_type} — {log.field_name || 'N/A'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {log.old_value && `${log.old_value} → `}{log.new_value || ''}
                              {log.confidence_score && ` · Confiance: ${Math.round(log.confidence_score * 100)}%`}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: fr })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights IA */}
          <TabsContent value="insights">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" /> Recommandations actives
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recommendations.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      Aucune recommandation en attente
                    </div>
                  ) : (
                    recommendations.slice(0, 5).map(rec => (
                      <div key={rec.id} className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
                        <div className={cn(
                          'w-2 h-2 rounded-full mt-1.5 shrink-0',
                          rec.confidence_score >= 0.8 ? 'bg-destructive' :
                            rec.confidence_score >= 0.5 ? 'bg-amber-500' : 'bg-blue-500'
                        )} />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-foreground">{rec.title}</span>
                          {rec.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            Confiance: {Math.round(rec.confidence_score * 100)}%
                            {rec.impact_estimate && ` · Impact: ${rec.impact_estimate}`}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" /> Statistiques agents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Agents configurés</span>
                      <span className="font-semibold text-foreground">{configs.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Agents actifs</span>
                      <span className="font-semibold text-foreground">{activeAgents}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Actions totales (logs)</span>
                      <span className="font-semibold text-foreground">{recentLogs.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Taux de succès</span>
                      <span className="font-semibold text-foreground">{avgSuccess}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Recommandations en attente</span>
                      <span className="font-semibold text-foreground">{recommendations.length}</span>
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
