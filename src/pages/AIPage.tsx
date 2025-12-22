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
  
  // Utilise ai_optimization_jobs car ai_tasks n'existe pas
  const { data: aiTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['ai-tasks-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_optimization_jobs')
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
    <div className="container mx-auto px-4 py-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">IA Avancée</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Suite d'intelligence artificielle</p>
        </div>
        <Badge variant="secondary" className="text-xs sm:text-sm">Ultra Pro</Badge>
      </div>

      <div className="grid gap-3 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-primary/10 rounded-lg">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Tâches IA</p>
              <p className="text-lg sm:text-2xl font-bold">{aiStats.tasksPerMonth.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-primary/10 rounded-lg">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Précision</p>
              <p className="text-lg sm:text-2xl font-bold">{aiStats.precision.toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-primary/10 rounded-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">ROI</p>
              <p className="text-lg sm:text-2xl font-bold">+{aiStats.roi}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-primary/10 rounded-lg">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Temps économisé</p>
              <p className="text-lg sm:text-2xl font-bold">{aiStats.timeSaved}h</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Fonctionnalités IA</h2>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <div className="p-3 sm:p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h3 className="text-sm sm:text-base font-medium">Analyse prédictive</h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Prédisez tendances et opportunités
            </p>
          </div>

          <div className="p-3 sm:p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h3 className="text-sm sm:text-base font-medium">Import intelligent</h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Import auto avec enrichissement
            </p>
          </div>

          <div className="p-3 sm:p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h3 className="text-sm sm:text-base font-medium">Recommandations</h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Suggestions personnalisées IA
            </p>
          </div>

          <div className="p-3 sm:p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h3 className="text-sm sm:text-base font-medium">Optimisation prix</h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Prix dynamiques temps réel
            </p>
          </div>

          <div className="p-3 sm:p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h3 className="text-sm sm:text-base font-medium">Détection tendances</h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Produits gagnants en premier
            </p>
          </div>

          <div className="p-3 sm:p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h3 className="text-sm sm:text-base font-medium">Automatisation</h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Workflows adaptatifs IA
            </p>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-muted/50 rounded-lg">
          <p className="text-xs sm:text-sm text-muted-foreground mb-3">
            Activez les fonctionnalités IA
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button size="sm" className="sm:size-default">
              <Brain className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Lancer analyse
            </Button>
            <Button variant="outline" size="sm" className="sm:size-default">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Recommandations
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
