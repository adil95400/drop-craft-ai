import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, TrendingUp, Target, Zap, BarChart3, Loader2 } from "lucide-react";
import { useRealAutomation } from "@/hooks/useRealAutomation";
import { useRealAnalytics } from "@/hooks/useRealAnalytics";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChannablePageWrapper, ChannableStatsGrid } from "@/components/channable";

export default function AIPage() {
  const { stats: automationStats } = useRealAutomation();
  const { analytics, isLoading: analyticsLoading } = useRealAnalytics();
  
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

  const stats = [
    {
      label: 'Tâches IA',
      value: aiStats.tasksPerMonth.toLocaleString(),
      icon: Brain,
      color: 'primary' as const,
      change: 15,
      trend: 'up' as const,
    },
    {
      label: 'Précision',
      value: `${aiStats.precision.toFixed(1)}%`,
      icon: Sparkles,
      color: 'success' as const,
      change: 2.3,
      trend: 'up' as const,
    },
    {
      label: 'ROI',
      value: `+${aiStats.roi}%`,
      icon: TrendingUp,
      color: 'info' as const,
    },
    {
      label: 'Temps économisé',
      value: `${aiStats.timeSaved}h`,
      icon: Zap,
      color: 'warning' as const,
    },
  ];

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
    <ChannablePageWrapper
      title="IA Avancée"
      subtitle="Intelligence Artificielle"
      description="Exploitez la puissance de l'IA pour optimiser vos opérations, prédire les tendances et automatiser vos tâches."
      heroImage="ai"
      badge={{ label: 'Ultra Pro', icon: Brain }}
      actions={
        <>
          <Button className="bg-primary hover:bg-primary/90">
            <Brain className="h-4 w-4 mr-2" />
            Lancer analyse
          </Button>
          <Button variant="outline" className="bg-background/50">
            <Sparkles className="h-4 w-4 mr-2" />
            Recommandations
          </Button>
        </>
      }
    >
      {/* Stats Grid */}
      <ChannableStatsGrid stats={stats} columns={4} />

      {/* Features Card */}
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Fonctionnalités IA
        </h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <div className="p-4 border rounded-xl bg-background/50 hover:bg-background/80 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-medium">Analyse prédictive</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Prédisez tendances et opportunités
            </p>
          </div>

          <div className="p-4 border rounded-xl bg-background/50 hover:bg-background/80 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-medium">Import intelligent</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Import auto avec enrichissement
            </p>
          </div>

          <div className="p-4 border rounded-xl bg-background/50 hover:bg-background/80 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-medium">Recommandations</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Suggestions personnalisées IA
            </p>
          </div>

          <div className="p-4 border rounded-xl bg-background/50 hover:bg-background/80 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-medium">Optimisation prix</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Prix dynamiques temps réel
            </p>
          </div>

          <div className="p-4 border rounded-xl bg-background/50 hover:bg-background/80 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-medium">Détection tendances</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Produits gagnants en premier
            </p>
          </div>

          <div className="p-4 border rounded-xl bg-background/50 hover:bg-background/80 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-medium">Automatisation</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Workflows adaptatifs IA
            </p>
          </div>
        </div>
      </Card>
    </ChannablePageWrapper>
  );
}
