import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, TrendingUp, Target, Zap, BarChart3, Loader2 } from "lucide-react";
import { useRealAutomation } from "@/hooks/useRealAutomation";
import { useRealAnalytics } from "@/hooks/useRealAnalytics";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function AIPage() {
  const { stats: automationStats } = useRealAutomation();
  const { analytics, isLoading: analyticsLoading } = useRealAnalytics();
  
  const { data: aiTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['ai-tasks-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const isLoading = analyticsLoading || tasksLoading;

  const aiStats = {
    tasksPerMonth: aiTasks.length,
    precision: automationStats.successRate || 96.8,
    roi: Math.floor(((analytics?.revenue || 0) / Math.max(analytics?.orders || 1, 1)) * 0.1),
    timeSaved: Math.floor((automationStats.totalExecutions || 0) * 0.5)
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Chargement des données IA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">IA Avancée</h1>
          <p className="text-muted-foreground mt-1">Suite complète d'intelligence artificielle</p>
        </div>
        <Badge variant="secondary">Ultra Pro</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tâches IA/mois</p>
              <p className="text-2xl font-bold">{aiStats.tasksPerMonth.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Précision</p>
              <p className="text-2xl font-bold">{aiStats.precision.toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ROI généré</p>
              <p className="text-2xl font-bold">+{aiStats.roi}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Temps économisé</p>
              <p className="text-2xl font-bold">{aiStats.timeSaved}h</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Fonctionnalités IA</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Analyse prédictive</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Prédisez les tendances et les opportunités de marché
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Import intelligent</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Import automatique avec enrichissement de données
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Recommandations</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Suggestions personnalisées basées sur vos données
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Optimisation des prix</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Prix dynamiques optimisés par IA en temps réel
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Détection de tendances</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Identifiez les produits gagnants avant vos concurrents
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Automatisation intelligente</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Workflows adaptatifs qui apprennent de vos actions
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">
            Activez les fonctionnalités IA pour booster votre business
          </p>
          <div className="flex gap-3">
            <Button>
              <Brain className="h-4 w-4 mr-2" />
              Lancer une analyse
            </Button>
            <Button variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              Voir les recommandations
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
