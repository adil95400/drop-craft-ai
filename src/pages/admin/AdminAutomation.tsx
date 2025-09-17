import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  Zap, 
  Play, 
  Pause, 
  Settings, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Plus
} from 'lucide-react';

interface AutomationRule {
  id: string;
  name: string;
  rule_type: string;
  trigger_conditions: any;
  actions: any[];
  is_active: boolean;
  execution_count: number;
  success_rate: number;
  last_executed_at?: string;
  performance_metrics: any;
}

interface AutomationExecution {
  id: string;
  workflow_id: string;
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  execution_time_ms?: number;
  step_results: any[];
}

const AdminAutomation = () => {
  const { toast } = useToast();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAutomationData();
  }, []);

  const fetchAutomationData = async () => {
    try {
      // Simulate fetching automation data
      const mockRules: AutomationRule[] = [
        {
          id: '1',
          name: 'Auto-reorder Stock Faible',
          rule_type: 'stock_management',
          trigger_conditions: { threshold: 10 },
          actions: [{ type: 'auto_reorder', quantity: 50 }],
          is_active: true,
          execution_count: 45,
          success_rate: 97.8,
          last_executed_at: '2024-01-19T10:30:00Z',
          performance_metrics: { time_saved_hours: 15.5 }
        },
        {
          id: '2',
          name: 'Email Confirmation Automatique',
          rule_type: 'order_automation',
          trigger_conditions: { order_status: 'completed' },
          actions: [{ type: 'send_email', template: 'order_confirmation' }],
          is_active: true,
          execution_count: 123,
          success_rate: 99.2,
          last_executed_at: '2024-01-20T14:15:00Z',
          performance_metrics: { emails_sent: 123, open_rate: 87.3 }
        },
        {
          id: '3',
          name: 'Optimisation Prix Dynamique',
          rule_type: 'pricing_automation',
          trigger_conditions: { competition_change: true },
          actions: [{ type: 'update_price', strategy: 'competitive' }],
          is_active: false,
          execution_count: 28,
          success_rate: 85.7,
          last_executed_at: '2024-01-18T09:20:00Z',
          performance_metrics: { revenue_impact: 2450.80 }
        }
      ];

      const mockExecutions: AutomationExecution[] = [
        {
          id: '1',
          workflow_id: '1',
          status: 'completed',
          started_at: '2024-01-20T10:30:00Z',
          completed_at: '2024-01-20T10:32:15Z',
          execution_time_ms: 135000,
          step_results: [
            { step: 'Check stock levels', success: true, duration_ms: 50000 },
            { step: 'Find suppliers', success: true, duration_ms: 35000 },
            { step: 'Create order', success: true, duration_ms: 50000 }
          ]
        },
        {
          id: '2',
          workflow_id: '2',
          status: 'running',
          started_at: '2024-01-20T15:45:00Z',
          step_results: [
            { step: 'Process orders', success: true, duration_ms: 25000 }
          ]
        }
      ];

      setRules(mockRules);
      setExecutions(mockExecutions);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données d'automation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      setRules(prev => prev.map(rule => 
        rule.id === ruleId ? { ...rule, is_active: isActive } : rule
      ));
      
      toast({
        title: "Règle mise à jour",
        description: `Règle ${isActive ? 'activée' : 'désactivée'} avec succès`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la règle",
        variant: "destructive"
      });
    }
  };

  const getExecutionStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automation Center</h1>
          <p className="text-muted-foreground">Gérez vos règles d'automation et workflows</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Règle
        </Button>
      </div>

      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rules">Règles d'Automation</TabsTrigger>
          <TabsTrigger value="executions">Exécutions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      {rule.name}
                    </CardTitle>
                    <CardDescription>
                      Type: {rule.rule_type.replace('_', ' ')} • 
                      Exécutions: {rule.execution_count} • 
                      Succès: {rule.success_rate.toFixed(1)}%
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRule(rule.id, !rule.is_active)}
                    >
                      {rule.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                      {rule.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Dernière exécution</p>
                    <p className="font-semibold">
                      {rule.last_executed_at ? 
                        new Date(rule.last_executed_at).toLocaleDateString('fr-FR') : 
                        'Jamais'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Taux de succès</p>
                    <p className="font-semibold">{rule.success_rate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Actions configurées</p>
                    <p className="font-semibold">{rule.actions.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Impact</p>
                    <p className="font-semibold text-green-600">
                      {rule.performance_metrics?.time_saved_hours ? 
                        `${rule.performance_metrics.time_saved_hours}h économisées` :
                        'Positif'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          {executions.map((execution) => (
            <Card key={execution.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getExecutionStatusIcon(execution.status)}
                    <div>
                      <CardTitle className="text-lg">
                        Workflow {execution.workflow_id}
                      </CardTitle>
                      <CardDescription>
                        Démarré le {new Date(execution.started_at).toLocaleString('fr-FR')}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={execution.status === 'completed' ? 'default' : 'secondary'}>
                    {execution.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {execution.step_results.map((step, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-2 bg-secondary/30 rounded">
                      <span>{step.step}</span>
                      <div className="flex items-center gap-2">
                        {step.success ? 
                          <CheckCircle className="w-4 h-4 text-green-600" /> : 
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        }
                        <span className="text-muted-foreground">{step.duration_ms}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Temps Économisé</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">156.5h</div>
                <p className="text-xs text-muted-foreground">Ce mois</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Coût Économisé</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$3,912</div>
                <p className="text-xs text-muted-foreground">Basé sur $25/h</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Efficacité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94.2%</div>
                <p className="text-xs text-muted-foreground">Taux de succès global</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAutomation;