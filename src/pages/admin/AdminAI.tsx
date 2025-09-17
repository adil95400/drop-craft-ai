import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
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
  task_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  input_data: any;
  output_data?: any;
  error_message?: string;
  created_at: string;
  processing_time_ms?: number;
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
  const [tasks, setTasks] = useState<AITask[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAIData();
  }, []);

  const fetchAIData = async () => {
    try {
      // Simulate fetching AI tasks and models
      const mockTasks: AITask[] = [
        {
          id: '1',
          task_type: 'product_optimization',
          status: 'completed',
          progress: 100,
          input_data: { products_count: 150 },
          output_data: { optimized: 148, improved_conversion: '15%' },
          created_at: '2024-01-15T10:30:00Z',
          processing_time_ms: 2500
        },
        {
          id: '2',
          task_type: 'price_optimization',
          status: 'running',
          progress: 65,
          input_data: { products_count: 80 },
          created_at: '2024-01-20T14:20:00Z'
        },
        {
          id: '3',
          task_type: 'content_generation',
          status: 'pending',
          progress: 0,
          input_data: { articles_needed: 10 },
          created_at: '2024-01-20T16:00:00Z'
        }
      ];

      const mockModels: AIModel[] = [
        {
          id: '1',
          name: 'Product Description Generator',
          type: 'text',
          status: 'active',
          accuracy: 92.5,
          usage_count: 1420,
          cost_per_use: 0.02,
          last_trained_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'Price Predictor',
          type: 'prediction',
          status: 'active',
          accuracy: 87.3,
          usage_count: 890,
          cost_per_use: 0.05,
          last_trained_at: '2024-01-10T00:00:00Z'
        },
        {
          id: '3',
          name: 'Image Optimizer',
          type: 'image',
          status: 'training',
          accuracy: 85.1,
          usage_count: 450,
          cost_per_use: 0.08,
          last_trained_at: '2023-12-20T00:00:00Z'
        }
      ];

      setTasks(mockTasks);
      setModels(mockModels);
    } catch (error) {
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
                <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'running').length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tâches Terminées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'completed').length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Taux Succès</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94.2%</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Coût Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$127.50</div>
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
                          {task.task_type.replace('_', ' ')}
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
                      {task.processing_time_ms && (
                        <Badge variant="outline">
                          {task.processing_time_ms}ms
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {task.status === 'running' && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progression</span>
                        <span>{task.progress}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${task.progress}%` }}
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