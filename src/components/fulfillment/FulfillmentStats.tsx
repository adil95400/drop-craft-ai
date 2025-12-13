import { Card, CardContent } from "@/components/ui/card";
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Clock,
  TrendingUp,
  AlertTriangle,
  Loader2
} from "lucide-react";

interface FulfillmentStatsProps {
  stats: {
    total: number;
    pending: number;
    processing: number;
    confirmed: number;
    shipped: number;
    delivered: number;
    failed: number;
  };
}

export function FulfillmentStats({ stats }: FulfillmentStatsProps) {
  const statCards = [
    {
      label: "En attente",
      value: stats.pending,
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      label: "En cours",
      value: stats.processing,
      icon: Loader2,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Confirmées",
      value: stats.confirmed,
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Expédiées",
      value: stats.shipped,
      icon: Truck,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Livrées",
      value: stats.delivered,
      icon: Package,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Échouées",
      value: stats.failed,
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
  ];

  const successRate = stats.total > 0 
    ? ((stats.confirmed + stats.shipped + stats.delivered) / stats.total * 100).toFixed(1)
    : "0";

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
      {/* Total Card */}
      <Card className="col-span-2 md:col-span-1 bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Taux de succès: <span className="font-medium text-foreground">{successRate}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Status Cards */}
      {statCards.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
