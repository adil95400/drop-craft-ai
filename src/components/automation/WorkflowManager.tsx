import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  MoreHorizontal, 
  Search, 
  Filter,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Workflow,
  BarChart3,
  Settings,
  Zap
} from 'lucide-react';
import { logError } from '@/utils/consoleCleanup';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface WorkflowData {
  id: string;
  name: string;
  description: string;
  status: string;
  execution_count: number;
  success_count: number;
  failure_count: number;
  success_rate: string;
  last_executed_at: string;
  created_at: string;
}

interface PerformanceAnalysis {
  total_workflows: number;
  active_workflows: number;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  success_rate: string;
  avg_execution_time: string;
  most_used_workflow: string;
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    action: string;
  }>;
}

export function WorkflowManager() {
  const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
  const [performance, setPerformance] = useState<PerformanceAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('workflows');

  useEffect(() => {
    loadWorkflows();
    loadPerformanceData();
  }, []);

  const loadWorkflows = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('automation-engine', {
        body: {
          action: 'get_workflows',
          limit: 100
        }
      });

      if (error) throw error;
      setWorkflows(data.workflows || []);
    } catch (error) {
      logError(error as Error, 'Error loading workflows');
      toast.error('Erreur lors du chargement des workflows');
    }
  };

  const loadPerformanceData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('automation-engine', {
        body: {
          action: 'analyze_automation_performance'
        }
      });

      if (error) throw error;
      setPerformance(data.analysis);
      setWorkflows(data.workflows || []);
    } catch (error) {
      logError(error as Error, 'Error loading performance data');
    } finally {
      setLoading(false);
    }
  };

  const executeWorkflow = async (workflowId: string) => {
    try {
      toast.info('Exécution du workflow en cours...');
      
      const { data, error } = await supabase.functions.invoke('automation-engine', {
        body: {
          action: 'execute_workflow',
          workflowId,
          inputData: { manual_trigger: true, timestamp: new Date().toISOString() }
        }
      });

      if (error) throw error;
      
      toast.success(`Workflow exécuté avec succès ! ${data.steps_executed} étapes complétées`);
      loadWorkflows(); // Refresh data
      
    } catch (error) {
      logError(error as Error, 'Error executing workflow');
      toast.error('Erreur lors de l\'exécution du workflow');
    }
  };

  const optimizeWorkflow = async (workflowId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('automation-engine', {
        body: {
          action: 'optimize_workflow',
          workflowId
        }
      });

      if (error) throw error;
      
      if (data.optimizations.length > 0) {
        toast.success(`${data.optimizations.length} optimisations suggérées`);
      } else {
        toast.info('Ce workflow est déjà optimisé');
      }
      
    } catch (error) {
      logError(error as Error, 'Error optimizing workflow');
      toast.error('Erreur lors de l\'optimisation');
    }
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle;
      case 'paused': return Pause;
      case 'draft': return Clock;
      default: return Clock;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      {performance && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Workflows Actifs</p>
                  <p className="text-2xl font-bold">{performance.active_workflows}</p>
                </div>
                <Workflow className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Exécutions (30j)</p>
                  <p className="text-2xl font-bold">{performance.total_executions}</p>
                </div>
                <Play className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taux de Succès</p>
                  <p className="text-2xl font-bold text-green-600">{performance.success_rate}</p>
                </div>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Temps Moyen</p>
                  <p className="text-2xl font-bold">{performance.avg_execution_time}</p>
                </div>
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
          <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un workflow..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-input rounded-md text-sm"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="active">Actifs</option>
                    <option value="paused">En pause</option>
                    <option value="draft">Brouillons</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workflows List */}
          <div className="grid gap-4">
            {filteredWorkflows.map((workflow) => {
              const StatusIcon = getStatusIcon(workflow.status);
              return (
                <Card key={workflow.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Workflow className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{workflow.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {workflow.description || 'Aucune description'}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge className={getStatusColor(workflow.status)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {workflow.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {workflow.execution_count} exécutions
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {workflow.success_rate} succès
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => executeWorkflow(workflow.id)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Exécuter
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => optimizeWorkflow(workflow.id)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Optimiser
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {filteredWorkflows.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Workflow className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg font-medium mb-2">Aucun workflow trouvé</p>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Modifiez vos filtres pour voir plus de résultats'
                      : 'Créez votre premier workflow d\'automatisation'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {performance && (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Statistiques Détaillées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-4">Métriques d'Exécution</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total exécutions</span>
                          <span className="font-medium">{performance.total_executions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Succès</span>
                          <span className="font-medium text-green-600">{performance.successful_executions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Échecs</span>
                          <span className="font-medium text-red-600">{performance.failed_executions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Temps moyen</span>
                          <span className="font-medium">{performance.avg_execution_time}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-4">Workflows</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total workflows</span>
                          <span className="font-medium">{performance.total_workflows}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Actifs</span>
                          <span className="font-medium text-green-600">{performance.active_workflows}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Plus utilisé</span>
                          <span className="font-medium">{performance.most_used_workflow}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {performance?.recommendations && performance.recommendations.length > 0 ? (
            <div className="space-y-4">
              {performance.recommendations.map((rec, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-yellow-100">
                        {rec.type === 'warning' ? (
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        ) : (
                          <Zap className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">{rec.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                        <p className="text-sm font-medium text-primary">{rec.action}</p>
                      </div>
                      <Badge variant={rec.type === 'warning' ? 'destructive' : 'default'}>
                        {rec.type === 'warning' ? 'Attention' : 'Optimisation'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600 opacity-50" />
                <p className="text-lg font-medium mb-2">Tout fonctionne parfaitement !</p>
                <p className="text-muted-foreground">
                  Aucune recommandation d'optimisation pour le moment
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}