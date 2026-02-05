import React, { useState } from 'react';
import { productionLogger } from '@/utils/productionLogger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  Target, 
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Package
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRealAIOptimizer, OptimizationTask, OptimizationStats } from '@/hooks/useRealAIOptimizer';

export function AIOptimizer() {
  const [runningTask, setRunningTask] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState<OptimizationTask[]>([]);
  const { toast } = useToast();
  const { tasks, stats, isLoading: loading, refetch } = useRealAIOptimizer();

  // Use local tasks for progress tracking
  React.useEffect(() => {
    if (tasks.length > 0) {
      setLocalTasks(tasks);
    }
  }, [tasks]);

  const runOptimization = async (taskId: string) => {
    setRunningTask(taskId);
    
    try {
      // Simuler le processus d'optimisation
      const task = localTasks.find(t => t.id === taskId);
      if (!task) return;

      setLocalTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, status: 'running' as const, progress: 0 }
          : t
      ));

      // Simuler la progression
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setLocalTasks(prev => prev.map(t => 
          t.id === taskId 
            ? { ...t, progress: i }
            : t
        ));
      }

      setLocalTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, status: 'completed' as const, progress: 100 }
          : t
      ));

      toast({
        title: "Optimisation terminée !",
        description: `${task.title} a été exécutée avec succès. Revenus estimés: +${formatCurrency(task.estimated_revenue)}`,
      });

      // Refresh data to get updated stats
      await refetch();

    } catch (error) {
      productionLogger.error('Optimization failed', error as Error, 'AIOptimizer');
      setLocalTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, status: 'failed' as const }
          : t
      ));
      
      toast({
        title: "Erreur d'optimisation",
        description: "Impossible d'exécuter l'optimisation",
        variant: "destructive"
      });
    } finally {
      setRunningTask(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-orange-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pricing': return DollarSign;
      case 'seo': return Target;
      case 'inventory': return Package;
      case 'marketing': return TrendingUp;
      default: return Brain;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center">
            <Brain className="mr-2 h-5 w-5 text-primary" />
            Optimiseur IA
          </h3>
          <p className="text-sm text-muted-foreground">
            Optimisations automatiques basées sur l'intelligence artificielle
          </p>
        </div>
        <Button className="gap-2">
          <Sparkles className="h-4 w-4" />
          Scan Complet IA
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimisations</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.completed_optimizations}/{stats?.total_optimizations}
            </div>
            <Progress 
              value={((stats?.completed_optimizations || 0) / (stats?.total_optimizations || 1)) * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Générés</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats?.revenue_generated || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps Économisé</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.time_saved_hours}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Réussite</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.success_rate}%</div>
            <Progress value={stats?.success_rate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impact Moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avg_impact}/10</div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Tâches d'Optimisation Disponibles</CardTitle>
          <CardDescription>
            Optimisations IA recommandées pour améliorer vos performances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {localTasks.map((task) => {
              const TypeIcon = getTypeIcon(task.type);
              return (
                <div key={task.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <TypeIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{task.title}</h4>
                          <Badge variant="outline" className={getImpactColor(task.impact)}>
                            Impact {task.impact}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                        
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3" />
                            <span className="text-green-600 font-medium">
                              +{formatCurrency(task.estimated_revenue)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{task.estimated_time} min</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Brain className="h-3 w-3" />
                            <span>Confiance: {task.ai_confidence}%</span>
                          </div>
                        </div>

                        {task.status === 'running' && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span>Progression</span>
                              <span>{task.progress}%</span>
                            </div>
                            <Progress value={task.progress} className="h-2" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getEffortColor(task.effort)}`} />
                      
                      <Badge variant={
                        task.status === 'completed' ? 'default' : 
                        task.status === 'running' ? 'secondary' :
                        task.status === 'failed' ? 'destructive' : 'outline'
                      }>
                        {task.status === 'pending' && 'En attente'}
                        {task.status === 'running' && 'En cours'}
                        {task.status === 'completed' && 'Terminé'}
                        {task.status === 'failed' && 'Échec'}
                      </Badge>

                      {task.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => runOptimization(task.id)}
                          disabled={runningTask === task.id}
                        >
                          {runningTask === task.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                              Lancement...
                            </>
                          ) : (
                            <>
                              <Zap className="mr-2 h-3 w-3" />
                              Lancer
                            </>
                          )}
                        </Button>
                      )}

                      {task.status === 'completed' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}

                      {task.status === 'failed' && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}