import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Package,
  Truck,
  Clock,
  TrendingUp,
  Settings,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SupplierStats {
  id: string;
  name: string;
  platform: string;
  is_connected: boolean;
  orders_total: number;
  orders_success: number;
  orders_failed: number;
  orders_pending: number;
  avg_processing_time: number;
  success_rate: number;
}

export function SupplierStatusCards() {
  const { data: suppliers, isLoading, refetch } = useQuery({
    queryKey: ["supplier-fulfillment-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: orders } = await supabase
        .from("auto_fulfillment_orders")
        .select("*")
        .eq("user_id", user.id);

      if (!orders || orders.length === 0) return [];

      const supplierMap = new Map<string, any[]>();
      orders.forEach(order => {
        const supplierId = order.supplier_id || "unknown";
        if (!supplierMap.has(supplierId)) supplierMap.set(supplierId, []);
        supplierMap.get(supplierId)!.push(order);
      });

      const stats: SupplierStats[] = [];
      supplierMap.forEach((supplierOrders, supplierId) => {
        if (supplierId === "unknown") return;
        const total = supplierOrders.length;
        const success = supplierOrders.filter(o => ["confirmed", "shipped", "delivered"].includes(o.status)).length;
        const failed = supplierOrders.filter(o => o.status === "failed").length;
        const pending = supplierOrders.filter(o => ["pending", "processing"].includes(o.status)).length;

        stats.push({
          id: supplierId,
          name: supplierOrders[0]?.supplier_name || "Fournisseur",
          platform: "dropshipping",
          is_connected: true,
          orders_total: total,
          orders_success: success,
          orders_failed: failed,
          orders_pending: pending,
          avg_processing_time: 0,
          success_rate: total > 0 ? Math.round((success / total) * 100) : 0,
        });
      });
      return stats;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!suppliers || suppliers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Truck className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Aucun fournisseur connecté</h3>
          <p className="text-muted-foreground text-center mb-4">
            Connectez vos fournisseurs pour activer l'auto-fulfillment
          </p>
          <Button asChild>
            <a href="/suppliers">Gérer les fournisseurs</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Fournisseurs connectés</h3>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((supplier) => (
          <Card key={supplier.id} className="relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-green-500`} />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{supplier.name}</CardTitle>
              <CardDescription>
                <Badge variant="default" className="text-xs bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Connecté
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Taux de succès</span>
                  <span className="font-medium">{supplier.success_rate}%</span>
                </div>
                <Progress value={supplier.success_rate} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-medium">{supplier.orders_total}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Succès</p>
                    <p className="font-medium text-green-600">{supplier.orders_success}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Échouées</p>
                    <p className="font-medium text-red-600">{supplier.orders_failed}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">En cours</p>
                    <p className="font-medium text-yellow-600">{supplier.orders_pending}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
