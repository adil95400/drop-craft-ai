import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, TrendingUp, CheckCircle2 } from "lucide-react";
import { useRealSuppliers } from "@/hooks/useRealSuppliers";
import { Skeleton } from "@/components/ui/skeleton";

export function RealSupplierStats() {
  const { suppliers, stats, isLoading } = useRealSuppliers();
  
  const statCards = [
    {
      title: "Fournisseurs connectés",
      value: stats.active || 0,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-500/10"
    },
    {
      title: "Total fournisseurs",
      value: stats.total || 0,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Note moyenne",
      value: stats.averageRating ? stats.averageRating.toFixed(1) : "0.0",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-500/10"
    },
    {
      title: "Pays couverts",
      value: Object.keys(stats.topCountries || {}).length,
      icon: ShoppingCart,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.title === "Taux de succès" ? "30 derniers jours" : "Total"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
