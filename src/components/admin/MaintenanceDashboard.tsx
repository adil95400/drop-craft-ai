import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Wrench, 
  Database, 
  HardDrive, 
  RefreshCcw, 
  Trash2, 
  Shield, 
  CheckCircle,
  Clock,
  Play,
  Pause
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  type: 'backup' | 'cleanup' | 'security' | 'optimization';
  status: 'scheduled' | 'running' | 'completed' | 'failed';
  progress: number;
  lastRun?: Date;
  nextRun?: Date;
  frequency: 'daily' | 'weekly' | 'monthly';
  automatic: boolean;
}

export const MaintenanceDashboard: React.FC = () => {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);

  useEffect(() => {
    const mockTasks: MaintenanceTask[] = [
      {
        id: '1',
        name: 'Sauvegarde complète',
        description: 'Sauvegarde de toutes les données utilisateurs et système',
        type: 'backup',
        status: 'scheduled',
        progress: 0,
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 2 * 60 * 60 * 1000),
        frequency: 'daily',
        automatic: true
      },
      {
        id: '2',
        name: 'Nettoyage des logs',
        description: 'Suppression des anciens logs (> 30 jours)',
        type: 'cleanup',
        status: 'completed',
        progress: 100,
        lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        frequency: 'weekly',
        automatic: true
      },
      {
        id: '3',
        name: 'Scan de sécurité',
        description: 'Analyse des vulnérabilités et des accès non autorisés',
        type: 'security',
        status: 'running',
        progress: 65,
        lastRun: new Date(),
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000),
        frequency: 'daily',
        automatic: true
      },
      {
        id: '4',
        name: 'Optimisation de la base',
        description: 'Réindexation et optimisation des performances',
        type: 'optimization',
        status: 'scheduled',
        progress: 0,
        lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        frequency: 'weekly',
        automatic: false
      }
    ];

    setTasks(mockTasks);
  }, []);

  const getStatusColor = (status: MaintenanceTask['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'running': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
    }
  };

  const getTypeIcon = (type: MaintenanceTask['type']) => {
    switch (type) {
      case 'backup': return <Database className="h-4 w-4" />;
      case 'cleanup': return <Trash2 className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'optimization': return <RefreshCcw className="h-4 w-4" />;
    }
  };

  const runTask = async (taskId: string) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'running', progress: 0 }
          : task
      )
    );

    // Simuler l'exécution de la tâche
    const progressInterval = setInterval(() => {
      setTasks(prev => 
        prev.map(task => {
          if (task.id === taskId && task.status === 'running') {
            const newProgress = Math.min(task.progress + 10, 100);
            return {
              ...task,
              progress: newProgress,
              status: newProgress === 100 ? 'completed' : 'running',
              lastRun: newProgress === 100 ? new Date() : task.lastRun
            };
          }
          return task;
        })
      );
    }, 500);

    setTimeout(() => {
      clearInterval(progressInterval);
      toast({
        title: "Tâche terminée",
        description: "La tâche de maintenance s'est terminée avec succès"
      });
    }, 5000);
  };

  const toggleAutomatic = (taskId: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, automatic: !task.automatic }
          : task
      )
    );

    toast({
      title: "Configuration mise à jour",
      description: "Les paramètres de la tâche automatique ont été modifiés"
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Maintenance Système
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {tasks.map((task) => (
            <Card key={task.id} className="border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(task.type)}
                    <div>
                      <h4 className="font-medium text-sm">{task.name}</h4>
                      <p className="text-xs text-muted-foreground">{task.description}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(task.status)}>
                    {task.status === 'scheduled' && 'Programmée'}
                    {task.status === 'running' && 'En cours'}
                    {task.status === 'completed' && 'Terminée'}
                    {task.status === 'failed' && 'Échec'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.status === 'running' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progression</span>
                      <span>{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-2" />
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Dernière exécution:</span>
                    <span>{task.lastRun?.toLocaleString() || 'Jamais'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Prochaine exécution:</span>
                    <span>{task.nextRun?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Fréquence:</span>
                    <Badge variant="outline">
                      {task.frequency === 'daily' && 'Quotidien'}
                      {task.frequency === 'weekly' && 'Hebdomadaire'}
                      {task.frequency === 'monthly' && 'Mensuel'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleAutomatic(task.id)}
                      className="flex items-center gap-1"
                    >
                      {task.automatic ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      {task.automatic ? 'Désactiver' : 'Activer'}
                    </Button>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => runTask(task.id)}
                    disabled={task.status === 'running'}
                    className="flex items-center gap-1"
                  >
                    <Play className="h-3 w-3" />
                    Exécuter
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Actions globales</h4>
              <p className="text-sm text-muted-foreground">Gestion de toutes les tâches de maintenance</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Programmer tout
              </Button>
              <Button size="sm">
                Exécuter tout
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};