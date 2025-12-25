import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { GitBranch, Play, Pause, Plus, Settings, Workflow, Loader2, MoreHorizontal, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useRealAutomation } from '@/hooks/useRealAutomation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const WorkflowBuilderPage: React.FC = () => {
  const { workflows, executions, stats, isLoading, createWorkflow, updateWorkflow, isCreating } = useRealAutomation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({ 
    name: '', 
    description: '', 
    trigger_type: 'manual' 
  });

  const handleCreateWorkflow = async () => {
    if (!newWorkflow.name) return;
    
    createWorkflow({
      name: newWorkflow.name,
      description: newWorkflow.description,
      trigger_type: newWorkflow.trigger_type,
      trigger_config: {},
      steps: [],
      status: 'draft',
    });
    setNewWorkflow({ name: '', description: '', trigger_type: 'manual' });
    setIsAddDialogOpen(false);
  };

  const handleToggleStatus = (workflow: any) => {
    const newStatus = workflow.status === 'active' ? 'paused' : 'active';
    updateWorkflow({ id: workflow.id, updates: { status: newStatus } });
  };

  const handleDeleteWorkflow = async (id: string) => {
    try {
      const { error } = await supabase.from('automation_workflows').delete().eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] });
      toast({ title: "Workflow supprimé" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer", variant: "destructive" });
    }
  };

  // Calculate today's executions
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayExecutions = executions.filter(e => new Date(e.started_at) >= today).length;
  const successfulExecutions = executions.filter(e => e.status === 'success').length;
  const failedExecutions = executions.filter(e => e.status === 'error').length;
  const successRate = executions.length > 0 
    ? ((successfulExecutions / executions.length) * 100).toFixed(1) 
    : '100';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Workflow Builder</h1>
          <p className="text-muted-foreground">
            Créez et gérez vos workflows d'automatisation
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau workflow
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau workflow</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                  placeholder="Ex: Traitement des commandes"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                  placeholder="Décrivez le but de ce workflow..."
                />
              </div>
              <div className="space-y-2">
                <Label>Type de déclencheur</Label>
                <Select 
                  value={newWorkflow.trigger_type} 
                  onValueChange={(value) => setNewWorkflow({ ...newWorkflow, trigger_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manuel</SelectItem>
                    <SelectItem value="schedule">Planifié</SelectItem>
                    <SelectItem value="event">Événement</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateWorkflow} disabled={isCreating || !newWorkflow.name} className="w-full">
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Créer le workflow
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards - Real Data */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workflows actifs</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.activeWorkflows}</div>
                <p className="text-xs text-muted-foreground">
                  {workflows.filter(w => w.status === 'draft').length} en brouillon
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exécutions aujourd'hui</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{todayExecutions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{stats.totalExecutions} total</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de succès</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{successRate}%</div>
                <p className="text-xs text-muted-foreground">{failedExecutions} échecs</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total workflows</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{workflows.length}</div>
                <p className="text-xs text-muted-foreground">Tous types confondus</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      <Card>
        <CardHeader>
          <CardTitle>Vos workflows</CardTitle>
          <CardDescription>Gérez et surveillez vos automatisations</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : workflows.length > 0 ? (
            <div className="space-y-4">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <GitBranch className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{workflow.name}</h3>
                      <p className="text-sm text-muted-foreground">{workflow.description || 'Aucune description'}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground">
                          Déclencheur: {workflow.trigger_type}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {workflow.steps?.length || 0} étapes
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {workflow.execution_count.toLocaleString()} exécutions
                        </span>
                        {workflow.last_executed_at && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              Dernière: {format(new Date(workflow.last_executed_at), 'dd/MM à HH:mm', { locale: fr })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={workflow.status === 'active' ? 'default' : workflow.status === 'paused' ? 'secondary' : 'outline'}
                    >
                      {workflow.status === 'active' ? 'Actif' : workflow.status === 'paused' ? 'En pause' : 'Brouillon'}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleToggleStatus(workflow)}
                    >
                      {workflow.status === 'active' ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Configurer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteWorkflow(workflow.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Workflow className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun workflow</h3>
              <p className="text-muted-foreground mb-4">
                Créez votre premier workflow d'automatisation
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau workflow
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Executions */}
      {executions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Exécutions récentes</CardTitle>
            <CardDescription>Historique des dernières exécutions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {executions.slice(0, 5).map((execution) => (
                <div key={execution.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {execution.status === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : execution.status === 'error' ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        Workflow #{execution.workflow_id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(execution.started_at), 'PPp', { locale: fr })}
                        {execution.execution_time_ms && ` • ${execution.execution_time_ms}ms`}
                      </p>
                    </div>
                  </div>
                  <Badge variant={execution.status === 'success' ? 'default' : 'destructive'}>
                    {execution.status === 'success' ? 'Succès' : execution.status === 'error' ? 'Erreur' : 'En cours'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkflowBuilderPage;
