import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, List, Activity, Plus, Play, Pause, Trash2, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useAutomationWorkflows, useAutomationStats } from '@/hooks/useAutomationRealData';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function AutomationPage() {
  const [activeTab, setActiveTab] = useState('list');
  const { 
    data: workflows = [], 
    isLoading: isLoadingWorkflows, 
    refetch 
  } = useAutomationWorkflows();
  
  const { data: stats, isLoading: isLoadingStats } = useAutomationStats();
  
  const isLoading = isLoadingWorkflows || isLoadingStats;
  const statsData = stats || { totalWorkflows: 0, activeWorkflows: 0, totalExecutions: 0, successRate: 0 };
  
  const toggleWorkflow = async (id: string, isActive: boolean) => {
    console.log('Toggle workflow', id, isActive);
  };
  const deleteWorkflow = async (id: string) => {
    console.log('Delete workflow', id);
  };
  const runWorkflow = async (id: string) => {
    console.log('Run workflow', id);
  };

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'schedule': return <Clock className="h-4 w-4" />;
      case 'event': return <Zap className="h-4 w-4" />;
      case 'webhook': return <Activity className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  return (
    <ChannablePageWrapper
      title="Automation"
      subtitle="Workflows"
      description="Automatisez vos tâches et workflows pour gagner du temps"
      heroImage="ai"
      badge={{ label: "AI Powered", icon: Zap }}
      actions={
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      }
    >

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
          <TabsList className="w-full max-w-md grid grid-cols-3 h-auto">
            <TabsTrigger value="list" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2">
              <List className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Automations</span>
              <span className="xs:hidden">Auto</span>
            </TabsTrigger>
            <TabsTrigger value="builder" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2">
              <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Créer</span>
              <span className="xs:hidden">+</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Activité</span>
              <span className="xs:hidden">Log</span>
            </TabsTrigger>
          </TabsList>

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
                  <Button onClick={() => setActiveTab('builder')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une automation
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => runWorkflow(workflow.id)}
                            disabled={!workflow.is_active}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleWorkflow(workflow.id, workflow.is_active)}
                          >
                            {workflow.is_active ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('Supprimer cette automation ?')) {
                                deleteWorkflow(workflow.id);
                              }
                            }}
                          >
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
                        <div>
                          Exécuté {workflow.execution_count} fois
                        </div>
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

          <TabsContent value="builder" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Créer une nouvelle automation</CardTitle>
                <CardDescription>
                  Configurez les déclencheurs et actions de votre workflow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { type: 'schedule', icon: Clock, label: 'Planifié', desc: 'Exécution automatique à intervalle régulier' },
                    { type: 'event', icon: Zap, label: 'Événement', desc: 'Déclenché par une action utilisateur' },
                    { type: 'webhook', icon: Activity, label: 'Webhook', desc: 'Déclenché par un appel externe' }
                  ].map((trigger) => (
                    <Card 
                      key={trigger.type} 
                      className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all p-4"
                    >
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <trigger.icon className="h-6 w-6 text-primary" />
                        </div>
                        <h4 className="font-medium">{trigger.label}</h4>
                        <p className="text-xs text-muted-foreground">{trigger.desc}</p>
                      </div>
                    </Card>
                  ))}
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  Sélectionnez un type de déclencheur pour commencer
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
      </ChannablePageWrapper>
  );
}
