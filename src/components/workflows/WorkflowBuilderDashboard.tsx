import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  GitBranch, 
  Plus,
  Play,
  Pause,
  Trash2,
  Settings,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  ChevronRight
} from 'lucide-react';
import { useWorkflows, useWorkflowExecutions, useWorkflowStats, useCreateWorkflow, useDeleteWorkflow, useExecuteWorkflow, useUpdateWorkflow } from '@/hooks/useWorkflows';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export function WorkflowBuilderDashboard() {
  const [activeTab, setActiveTab] = useState('workflows');
  const isMobile = useIsMobile();

  const { data: workflows = [] } = useWorkflows();
  const { data: executions = [] } = useWorkflowExecutions();
  const { data: stats } = useWorkflowStats();
  const createWorkflow = useCreateWorkflow();
  const deleteWorkflow = useDeleteWorkflow();
  const executeWorkflow = useExecuteWorkflow();
  const updateWorkflow = useUpdateWorkflow();

  const handleCreate = () => {
    createWorkflow.mutate({ 
      name: 'Nouveau workflow',
      trigger_type: 'manual',
      category: 'general'
    });
  };

  const handleExecute = (workflowId: string) => {
    executeWorkflow.mutate({ workflowId });
  };

  const handleToggleActive = (id: string, currentState: boolean) => {
    updateWorkflow.mutate({ id, updates: { is_active: !currentState } });
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer ce workflow ?')) {
      deleteWorkflow.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      running: { variant: 'secondary', icon: <Clock className="h-3 w-3 mr-1 animate-spin" /> },
      completed: { variant: 'default', icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
      failed: { variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" /> },
      cancelled: { variant: 'outline', icon: <Pause className="h-3 w-3 mr-1" /> }
    };
    const config = variants[status] || variants.running;
    return <Badge variant={config.variant} className="flex items-center text-xs">{config.icon}{status}</Badge>;
  };

  const getTriggerBadge = (type: string) => {
    const labels: Record<string, string> = {
      manual: 'Manuel',
      event: 'Événement',
      schedule: 'Planifié',
      webhook: 'Webhook'
    };
    return <Badge variant="outline" className="text-xs">{labels[type] || type}</Badge>;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Grid */}
      <div className={cn(
        'grid gap-3 sm:gap-4',
        isMobile ? 'grid-cols-2' : 'grid-cols-4'
      )}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total workflows</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">{stats?.totalWorkflows || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Actifs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">{stats?.activeWorkflows || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Exécutions</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">{stats?.totalExecutions || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Taux de succès</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">{stats?.successRate?.toFixed(0) || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className={cn(
          'flex gap-3',
          isMobile ? 'flex-col' : 'justify-between items-center'
        )}>
          <div className="overflow-x-auto touch-pan-x">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="workflows" className="min-h-[44px] px-4">
                Workflows
              </TabsTrigger>
              <TabsTrigger value="executions" className="min-h-[44px] px-4">
                Historique
              </TabsTrigger>
            </TabsList>
          </div>
          

          <Button onClick={handleCreate} className="min-h-[44px] shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            {isMobile ? 'Nouveau' : 'Nouveau workflow'}
          </Button>
        </div>

        <TabsContent value="workflows" className="mt-4">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Mes workflows</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Créez et gérez vos workflows d'automatisation</CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              {isMobile ? (
                // Mobile: Card layout
                <div className="divide-y">
                  {workflows.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8 text-sm">
                      Aucun workflow créé
                    </div>
                  ) : (
                    workflows.map((workflow) => (
                      <MobileWorkflowCard
                        key={workflow.id}
                        workflow={workflow}
                        onExecute={() => handleExecute(workflow.id)}
                        onToggle={() => handleToggleActive(workflow.id, workflow.is_active)}
                        onDelete={() => handleDelete(workflow.id)}
                        getTriggerBadge={getTriggerBadge}
                      />
                    ))
                  )}
                </div>
              ) : (
                // Desktop: Table layout
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Déclencheur</TableHead>
                      <TableHead>Étapes</TableHead>
                      <TableHead>Exécutions</TableHead>
                      <TableHead>Dernière exécution</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workflows.map((workflow) => (
                      <TableRow key={workflow.id}>
                        <TableCell className="font-medium">{workflow.name}</TableCell>
                        <TableCell>{getTriggerBadge(workflow.trigger_type)}</TableCell>
                        <TableCell>{(workflow.steps || []).length}</TableCell>
                        <TableCell>{workflow.execution_count}</TableCell>
                        <TableCell>
                          {workflow.last_executed_at 
                            ? formatDistanceToNow(new Date(workflow.last_executed_at), { addSuffix: true, locale: getDateFnsLocale() })
                            : 'Jamais'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                            {workflow.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleExecute(workflow.id)}
                              disabled={!workflow.is_active}
                              className="h-9 w-9 p-0"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleToggleActive(workflow.id, workflow.is_active)}
                              className="h-9 w-9 p-0"
                            >
                              {workflow.is_active ? <Pause className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(workflow.id)}
                              className="h-9 w-9 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {workflows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Aucun workflow créé
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions" className="mt-4">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Historique des exécutions</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Dernières exécutions de vos workflows</CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              {isMobile ? (
                // Mobile: Card layout
                <div className="divide-y">
                  {executions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8 text-sm">
                      Aucune exécution
                    </div>
                  ) : (
                    executions.map((execution) => (
                      <MobileExecutionCard
                        key={execution.id}
                        execution={execution}
                        getStatusBadge={getStatusBadge}
                      />
                    ))
                  )}
                </div>
              ) : (
                // Desktop: Table layout
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Workflow</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Étapes</TableHead>
                      <TableHead>Durée</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executions.map((execution) => (
                      <TableRow key={execution.id}>
                        <TableCell className="font-medium">{execution.workflow?.name || 'N/A'}</TableCell>
                        <TableCell>{getStatusBadge(execution.status)}</TableCell>
                        <TableCell>{execution.current_step}/{execution.total_steps}</TableCell>
                        <TableCell>
                          {execution.duration_ms ? `${(execution.duration_ms / 1000).toFixed(1)}s` : '-'}
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(execution.started_at), { addSuffix: true, locale: getDateFnsLocale() })}
                        </TableCell>
                      </TableRow>
                    ))}
                    {executions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Aucune exécution
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Mobile Workflow Card Component
function MobileWorkflowCard({
  workflow,
  onExecute,
  onToggle,
  onDelete,
  getTriggerBadge,
}: {
  workflow: any;
  onExecute: () => void;
  onToggle: () => void;
  onDelete: () => void;
  getTriggerBadge: (type: string) => React.ReactNode;
}) {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{workflow.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            {getTriggerBadge(workflow.trigger_type)}
            <Badge variant={workflow.is_active ? 'default' : 'secondary'} className="text-xs">
              {workflow.is_active ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{(workflow.steps || []).length} étapes</span>
        <span>{workflow.execution_count} exécutions</span>
        <span>
          {workflow.last_executed_at 
            ? formatDistanceToNow(new Date(workflow.last_executed_at), { addSuffix: true, locale: getDateFnsLocale() })
            : 'Jamais'}
        </span>
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onExecute}
          disabled={!workflow.is_active}
          className="flex-1 min-h-[44px]"
        >
          <Play className="h-4 w-4 mr-1" />
          Exécuter
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onToggle}
          className="min-h-[44px] px-3"
        >
          {workflow.is_active ? <Pause className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onDelete}
          className="min-h-[44px] px-3 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Mobile Execution Card Component
function MobileExecutionCard({
  execution,
  getStatusBadge,
}: {
  execution: any;
  getStatusBadge: (status: string) => React.ReactNode;
}) {
  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-medium text-sm truncate">{execution.workflow?.name || 'N/A'}</h4>
        {getStatusBadge(execution.status)}
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Étapes: {execution.current_step}/{execution.total_steps}</span>
        <span>
          {execution.duration_ms ? `${(execution.duration_ms / 1000).toFixed(1)}s` : '-'}
        </span>
        <span>
          {formatDistanceToNow(new Date(execution.started_at), { addSuffix: true, locale: getDateFnsLocale() })}
        </span>
      </div>
    </div>
  );
}
