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
  Zap
} from 'lucide-react';
import { useWorkflows, useWorkflowExecutions, useWorkflowStats, useCreateWorkflow, useDeleteWorkflow, useExecuteWorkflow, useUpdateWorkflow } from '@/hooks/useWorkflows';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function WorkflowBuilderDashboard() {
  const [activeTab, setActiveTab] = useState('workflows');

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
    return <Badge variant={config.variant} className="flex items-center">{config.icon}{status}</Badge>;
  };

  const getTriggerBadge = (type: string) => {
    const labels: Record<string, string> = {
      manual: 'Manuel',
      event: 'Événement',
      schedule: 'Planifié',
      webhook: 'Webhook'
    };
    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total workflows</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalWorkflows || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeWorkflows || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exécutions</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalExecutions || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de succès</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.successRate?.toFixed(0) || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="executions">Historique</TabsTrigger>
          </TabsList>

          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau workflow
          </Button>
        </div>

        <TabsContent value="workflows">
          <Card>
            <CardHeader>
              <CardTitle>Mes workflows</CardTitle>
              <CardDescription>Créez et gérez vos workflows d'automatisation</CardDescription>
            </CardHeader>
            <CardContent>
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
                          ? formatDistanceToNow(new Date(workflow.last_executed_at), { addSuffix: true, locale: fr })
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
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleToggleActive(workflow.id, workflow.is_active)}
                          >
                            {workflow.is_active ? <Pause className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(workflow.id)}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions">
          <Card>
            <CardHeader>
              <CardTitle>Historique des exécutions</CardTitle>
              <CardDescription>Dernières exécutions de vos workflows</CardDescription>
            </CardHeader>
            <CardContent>
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
                        {formatDistanceToNow(new Date(execution.started_at), { addSuffix: true, locale: fr })}
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
