import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Bot, 
  Brain, 
  Zap, 
  TrendingUp,
  BarChart3,
  Settings,
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface AITask {
  id: string;
  job_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  input_data: any;
  output_data?: any;
  error_message?: string;
  created_at: string;
  completed_at?: string;
  started_at?: string;
}

interface AIModel {
  id: string;
  name: string;
  type: 'text' | 'image' | 'analysis' | 'prediction';
  status: 'active' | 'training' | 'inactive';
  accuracy: number;
  usage_count: number;
  cost_per_use: number;
  last_trained_at: string;
}

const AdminAI = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<AITask[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeTasks: 0,
    completedTasks: 0,
    successRate: 0,
    totalCost: 0
  });

  useEffect(() => {
    if (user) {
      fetchAIData();
    }
  }, [user]);

  const fetchAIData = async () => {
    try {
      setLoading(true);
      
      // Fetch AI optimization jobs
      const { data: jobs, error: jobsError } = await supabase
        .from('ai_optimization_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (jobsError) throw jobsError;
      
      const formattedTasks: AITask[] = (jobs || []).map(job => ({
        id: job.id,
        job_type: job.job_type,
        status: job.status as AITask['status'],
        priority: job.priority || 0,
        input_data: job.input_data,
        output_data: job.output_data,
        error_message: job.error_message,
        created_at: job.created_at,
        completed_at: job.completed_at,
        started_at: job.started_at
      }));
      
      setTasks(formattedTasks);
      
      // Calculate stats
      const completed = formattedTasks.filter(t => t.status === 'completed').length;
      const failed = formattedTasks.filter(t => t.status === 'failed').length;
      const active = formattedTasks.filter(t => t.status === 'processing').length;
      const total = completed + failed;
      
      setStats({
        activeTasks: active,
        completedTasks: completed,
        successRate: total > 0 ? Math.round((completed / total) * 100) : 100,
        totalCost: formattedTasks.length * 0.05 // Estimate $0.05 per job
      });
      
      // Create mock models based on job types found
      const jobTypes = [...new Set(formattedTasks.map(t => t.job_type))];
      const modelData: AIModel[] = jobTypes.slice(0, 5).map((type, i) => ({
        id: `model-${i}`,
        name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        type: ['text', 'prediction', 'analysis', 'image'][i % 4] as AIModel['type'],
        status: 'active' as const,
        accuracy: 85 + Math.random() * 10,
        usage_count: formattedTasks.filter(t => t.job_type === type).length,
        cost_per_use: 0.02 + Math.random() * 0.08,
        last_trained_at: new Date().toISOString()
      }));
      
      // Add default models if none found
      if (modelData.length === 0) {
        modelData.push(
          { id: '1', name: 'Product Description Generator', type: 'text', status: 'active', accuracy: 92.5, usage_count: 0, cost_per_use: 0.02, last_trained_at: new Date().toISOString() },
          { id: '2', name: 'Price Predictor', type: 'prediction', status: 'active', accuracy: 87.3, usage_count: 0, cost_per_use: 0.05, last_trained_at: new Date().toISOString() },
          { id: '3', name: 'Image Optimizer', type: 'image', status: 'active', accuracy: 85.1, usage_count: 0, cost_per_use: 0.08, last_trained_at: new Date().toISOString() }
        );
      }
      
      setModels(modelData);
      
    } catch (error) {
      console.error('Error fetching AI data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données IA",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Bot className="w-4 h-4 text-gray-600" />;
    }
  };

  const getModelStatusBadge = (status: AIModel['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Actif</Badge>;
      case 'training':
        return <Badge variant="secondary">Formation</Badge>;
      case 'inactive':
        return <Badge variant="outline">Inactif</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">IA Assistant</h1>
          <p className="text-muted-foreground">Gérez vos modèles IA et tâches d'automation</p>
        </div>
        <Button>
          <Bot className="w-4 h-4 mr-2" />
          Nouvelle Tâche IA
        </Button>
      </div>

      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tasks">Tâches IA</TabsTrigger>
          <TabsTrigger value="models">Modèles</TabsTrigger>
          <TabsTrigger value="settings">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tâches Actives</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeTasks}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tâches Terminées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedTasks}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Taux Succès</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.successRate}%</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Coût Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalCost.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {tasks.map((task) => (
              <Card key={task.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(task.status)}
                      <div>
                        <CardTitle className="text-lg capitalize">
                          {task.job_type.replace(/_/g, ' ')}
                        </CardTitle>
                        <CardDescription>
                          Créée le {new Date(task.created_at).toLocaleDateString('fr-FR')}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                        {task.status}
                      </Badge>
                      {task.started_at && task.completed_at && (
                        <Badge variant="outline">
                          {Math.round((new Date(task.completed_at).getTime() - new Date(task.started_at).getTime()))}ms
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {task.status === 'processing' && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progression</span>
                        <span>En cours...</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300 animate-pulse" 
                          style={{ width: '60%' }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {task.output_data && (
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <p className="text-sm font-medium mb-1">Résultats:</p>
                      <pre className="text-xs text-muted-foreground">
                        {JSON.stringify(task.output_data, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {task.error_message && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      <p className="text-sm font-medium text-destructive mb-1">Erreur:</p>
                      <p className="text-xs text-destructive">{task.error_message}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <div className="grid gap-4">
            {models.map((model) => (
              <Card key={model.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5" />
                        {model.name}
                      </CardTitle>
                      <CardDescription>
                        Type: {model.type} • Précision: {model.accuracy}%
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getModelStatusBadge(model.status)}
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Utilisations</p>
                      <p className="font-semibold">{model.usage_count.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Coût/usage</p>
                      <p className="font-semibold">${model.cost_per_use}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Précision</p>
                      <p className="font-semibold">{model.accuracy}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Dernière formation</p>
                      <p className="font-semibold">
                        {new Date(model.last_trained_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration IA</CardTitle>
              <CardDescription>Paramètres généraux des modèles IA</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Budget mensuel maximum</label>
                  <Input placeholder="500" />
                </div>
                <div>
                  <label className="text-sm font-medium">Seuil d'alerte coût</label>
                  <Input placeholder="80%" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button>
                  <Settings className="w-4 h-4 mr-2" />
                  Sauvegarder
                </Button>
                <Button variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAI;