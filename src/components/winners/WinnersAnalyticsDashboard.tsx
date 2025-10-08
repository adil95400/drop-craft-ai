import { Card } from "@/components/ui/card";
import { TrendingUp, Target, DollarSign, Zap, Award, ShoppingCart } from "lucide-react";
import { WinnersStats } from "@/domains/winners/types";

interface WinnersAnalyticsDashboardProps {
  stats: WinnersStats;
  isLoading?: boolean;
}

export const WinnersAnalyticsDashboard = ({ stats, isLoading }: WinnersAnalyticsDashboardProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-muted rounded w-3/4"></div>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      label: "Produits Analysés",
      value: stats.totalAnalyzed.toLocaleString(),
      icon: Target,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      label: "Winners Détectés",
      value: stats.winnersDetected.toLocaleString(),
      icon: Award,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      label: "Score Moyen",
      value: `${stats.averageScore.toFixed(1)}/100`,
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      label: "Taux de Réussite",
      value: `${stats.successRate.toFixed(1)}%`,
      icon: Zap,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    {
      label: "Profit Potentiel",
      value: `€${((stats.winnersDetected * 25.5).toFixed(0))}`,
      icon: DollarSign,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10"
    },
    {
      label: "Opportunités",
      value: Math.floor(stats.successRate / 10).toString(),
      icon: ShoppingCart,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">{metric.label}</p>
              <p className="text-3xl font-bold">{metric.value}</p>
            </div>
            <div className={`${metric.bgColor} p-3 rounded-lg`}>
              <metric.icon className={`h-6 w-6 ${metric.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
