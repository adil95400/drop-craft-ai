import { useState, lazy, Suspense } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, List, Activity, Plus, Play, Pause, Trash2, RefreshCw, CheckCircle2, XCircle, Clock, FlaskConical, LayoutTemplate, GitBranch, BarChart3, Terminal, Calendar } from 'lucide-react';
import { useAutomationWorkflows, useAutomationStats } from '@/hooks/useAutomationRealData';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { AdvancedFeatureGuide } from '@/components/guide';
import { ADVANCED_GUIDES } from '@/components/guide';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

// Lazy load enterprise components
const WorkflowSandbox = lazy(() => import('@/components/automation/WorkflowSandbox').then(m => ({ default: m.WorkflowSandbox })));
const WorkflowTemplates = lazy(() => import('@/components/automation/WorkflowTemplates').then(m => ({ default: m.WorkflowTemplates })));

// Lazy load engine components
const AutomationFlowCanvas = lazy(() => import('@/components/automation/engine/AutomationFlowCanvas').then(m => ({ default: m.AutomationFlowCanvas })));
const AutomationExecutionTimeline = lazy(() => import('@/components/automation/engine/AutomationExecutionTimeline').then(m => ({ default: m.AutomationExecutionTimeline })));
const AutomationConditionBuilder = lazy(() => import('@/components/automation/engine/AutomationConditionBuilder').then(m => ({ default: m.AutomationConditionBuilder })));
const AutomationMetricsDashboard = lazy(() => import('@/components/automation/engine/AutomationMetricsDashboard').then(m => ({ default: m.AutomationMetricsDashboard })));
const AutomationEventLog = lazy(() => import('@/components/automation/engine/AutomationEventLog').then(m => ({ default: m.AutomationEventLog })));
const AutomationScheduler = lazy(() => import('@/components/automation/engine/AutomationScheduler').then(m => ({ default: m.AutomationScheduler })));

export default function AutomationPage() {
  const [activeTab, setActiveTab] = useState('list');
  const [deleteWorkflowId, setDeleteWorkflowId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { 
    data: workflows = [], 
    isLoading: isLoadingWorkflows, 
    refetch 
  } = useAutomationWorkflows();
  
  const { data: stats, isLoading: isLoadingStats } = useAutomationStats();
  
  const isLoading = isLoadingWorkflows || isLoadingStats;
  const statsData = stats || { totalWorkflows: 0, activeWorkflows: 0, totalExecutions: 0, successRate: 0 };
  
  const toggleWorkflow = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('automation_workflows')
        .update({ is_active: !isActive })
        .eq('id', id);
      if (error) throw error;
      toast({ title: isActive ? 'Workflow désactivé' : 'Workflow activé' });
      refetch();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };
  const deleteWorkflow = async (id: string) => {
    try {
      const { error } = await supabase
        .from('automation_workflows')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Workflow supprimé' });
      refetch();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };
  const runWorkflow = async (id: string) => {
    try {
      const { error } = await supabase
        .from('automation_workflows')
        .update({ last_run_at: new Date().toISOString(), run_count: (workflows.find(w => w.id === id)?.execution_count || 0) + 1 })
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Exécution lancée' });
      refetch();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'schedule': return <Clock className="h-4 w-4" />;
      case 'event': return <Zap className="h-4 w-4" />;
      case 'webhook': return <Activity className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const LazyFallback = <Skeleton className="h-[400px] w-full rounded-xl" />;

  return (
    <ChannablePageWrapper
      title="Automation Engine"
      subtitle="Workflows & Rules"
      description="Automatisez vos tâches avec un moteur de règles intelligent"
      heroImage="ai"
      badge={{ label: "AI Powered", icon: Zap }}
      actions={
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      }
    >

        <AdvancedFeatureGuide {...ADVANCED_GUIDES.automation} />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Zap className="h-4 w-4" />
                    <span className="text-xs">Total Workflows</span>
                  </div>
                  <p className="text-2xl font-bold">{statsData.totalWorkflows}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-xs">Actifs</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{statsData.activeWorkflows}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Activity className="h-4 w-4" />
                    <span className="text-xs">Exécutions</span>
                  </div>
                  <p className="text-2xl font-bold">{statsData.totalExecutions}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs">Taux succès</span>
                  </div>
                  <p className="text-2xl font-bold">{statsData.successRate.toFixed(1)}%</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="w-full max-w-4xl grid grid-cols-5 lg:grid-cols-10 h-auto">
            <TabsTrigger value="list" className="flex items-center gap-1 text-xs px-2 py-1.5">
              <List className="h-3 w-3" />
              <span className="hidden sm:inline">Workflows</span>
            </TabsTrigger>
            <TabsTrigger value="flow" className="flex items-center gap-1 text-xs px-2 py-1.5">
              <GitBranch className="h-3 w-3" />
              <span className="hidden sm:inline">Flow</span>
            </TabsTrigger>
            <TabsTrigger value="conditions" className="flex items-center gap-1 text-xs px-2 py-1.5">
              <Zap className="h-3 w-3" />
              <span className="hidden sm:inline">Règles</span>
            </TabsTrigger>
            <TabsTrigger value="scheduler" className="flex items-center gap-1 text-xs px-2 py-1.5">
              <Calendar className="h-3 w-3" />
              <span className="hidden sm:inline">Planning</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-1 text-xs px-2 py-1.5">
              <LayoutTemplate className="h-3 w-3" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-1 text-xs px-2 py-1.5">
              <Clock className="h-3 w-3" />
              <span className="hidden sm:inline">Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-1 text-xs px-2 py-1.5">
              <BarChart3 className="h-3 w-3" />
              <span className="hidden sm:inline">Métriques</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-1 text-xs px-2 py-1.5">
              <Terminal className="h-3 w-3" />
              <span className="hidden sm:inline">Logs</span>
            </TabsTrigger>
            <TabsTrigger value="sandbox" className="flex items-center gap-1 text-xs px-2 py-1.5">
              <FlaskConical className="h-3 w-3" />
              <span className="hidden sm:inline">Sandbox</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-1 text-xs px-2 py-1.5">
              <Activity className="h-3 w-3" />
              <span className="hidden sm:inline">Activité</span>
            </TabsTrigger>
          </TabsList>

          {/* Workflows List */}
          <TabsContent value="list" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-4 w-64 mb-4" />
                      <Skeleton className="h-4 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : workflows.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <CardTitle className="mb-2">Aucune automation</CardTitle>
                  <CardDescription className="mb-4">
                    Créez votre première automation pour automatiser vos workflows
                  </CardDescription>
                  <Button onClick={() => setActiveTab('templates')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Parcourir les templates
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{workflow.name}</CardTitle>
                            <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                              {workflow.is_active ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>
                          <CardDescription>{workflow.description}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => runWorkflow(workflow.id)} disabled={!workflow.is_active}>
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => toggleWorkflow(workflow.id, workflow.is_active)}>
                            {workflow.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setDeleteWorkflowId(workflow.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          {getTriggerIcon(workflow.trigger_type)}
                          <span className="capitalize">{workflow.trigger_type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="h-4 w-4" />
                          {Array.isArray(workflow.steps) ? workflow.steps.length : 0} étape{(Array.isArray(workflow.steps) ? workflow.steps.length : 0) !== 1 ? 's' : ''}
                        </div>
                        <div>Exécuté {workflow.execution_count} fois</div>
                        {workflow.last_run_at && (
                          <div className="ml-auto text-xs">
                            Dernière exécution: {formatDistanceToNow(new Date(workflow.last_run_at), { addSuffix: true, locale: fr })}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Flow Canvas */}
          <TabsContent value="flow">
            <Suspense fallback={LazyFallback}>
              <AutomationFlowCanvas />
            </Suspense>
          </TabsContent>

          {/* Condition Builder */}
          <TabsContent value="conditions">
            <Suspense fallback={LazyFallback}>
              <AutomationConditionBuilder />
            </Suspense>
          </TabsContent>

          {/* Scheduler */}
          <TabsContent value="scheduler">
            <Suspense fallback={LazyFallback}>
              <AutomationScheduler />
            </Suspense>
          </TabsContent>

          {/* Templates */}
          <TabsContent value="templates">
            <Suspense fallback={LazyFallback}>
              <WorkflowTemplates />
            </Suspense>
          </TabsContent>

          {/* Execution Timeline */}
          <TabsContent value="timeline">
            <Suspense fallback={LazyFallback}>
              <AutomationExecutionTimeline />
            </Suspense>
          </TabsContent>

          {/* Metrics Dashboard */}
          <TabsContent value="metrics">
            <Suspense fallback={LazyFallback}>
              <AutomationMetricsDashboard />
            </Suspense>
          </TabsContent>

          {/* Event Logs */}
          <TabsContent value="logs">
            <Suspense fallback={LazyFallback}>
              <AutomationEventLog />
            </Suspense>
          </TabsContent>

          {/* Sandbox */}
          <TabsContent value="sandbox">
            <Suspense fallback={LazyFallback}>
              <WorkflowSandbox />
            </Suspense>
          </TabsContent>

          {/* Activity */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Journal d'activité</CardTitle>
                <CardDescription>Historique des exécutions de vos automations</CardDescription>
              </CardHeader>
              <CardContent>
                {workflows.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucune activité récente</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {workflows.slice(0, 10).map((workflow, index) => (
                      <div 
                        key={`${workflow.id}-${index}`}
                        className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className={cn(
                          "p-2 rounded-full",
                          workflow.is_active ? "bg-green-100" : "bg-gray-100"
                        )}>
                          {workflow.is_active ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{workflow.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {workflow.execution_count} exécution{workflow.execution_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {workflow.trigger_type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      <ConfirmDialog
        open={!!deleteWorkflowId}
        onOpenChange={(open) => { if (!open) setDeleteWorkflowId(null) }}
        title="Supprimer cette automation ?"
        description="Cette action est irréversible."
        confirmText="Supprimer"
        variant="destructive"
        onConfirm={() => { if (deleteWorkflowId) { deleteWorkflow(deleteWorkflowId); setDeleteWorkflowId(null) } }}
      />
      </ChannablePageWrapper>
  );
}
