import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock,
  RefreshCw,
  Zap,
  TrendingUp
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface RuleExecution {
  id: string;
  rule_id: string;
  rule_name: string;
  order_id: string;
  executed_at: string;
  success: boolean;
  actions_executed: number;
  duration_ms: number;
  error?: string;
}

export function RulesExecutionMonitor() {
  const [isRunning, setIsRunning] = useState(false);

  const { data: executions, isLoading, refetch } = useQuery({
    queryKey: ["rule-executions"],
    queryFn: async () => {
      const { data: events, error } = await supabase
        .from("fulfillment_events")
        .select("*")
        .eq("event_type", "rule_action_executed")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Group by execution
      const grouped: Record<string, RuleExecution> = {};
      for (const event of events || []) {
        const eventData = event.event_data as Record<string, any> || {};
        const key = `${event.fulfillment_order_id}-${eventData.rule_id}`;
        
        if (!grouped[key]) {
          grouped[key] = {
            id: event.id,
            rule_id: eventData.rule_id || "unknown",
            rule_name: eventData.rule_name || "Règle",
            order_id: event.fulfillment_order_id || "unknown",
            executed_at: event.created_at,
            success: eventData.success !== false,
            actions_executed: 1,
            duration_ms: event.duration_ms || 0,
            error: event.error_details || undefined,
          };
        } else {
          grouped[key].actions_executed++;
          if (eventData.success === false) {
            grouped[key].success = false;
            grouped[key].error = event.error_details || undefined;
          }
        }
      }

      return Object.values(grouped).slice(0, 20);
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["rule-execution-stats"],
    queryFn: async () => {
      const { data: rules } = await supabase
        .from("fulfillment_rules")
        .select("execution_count, is_active")
        .eq("is_active", true);

      const totalExecutions = rules?.reduce((sum, r) => sum + (r.execution_count || 0), 0) || 0;
      const activeRules = rules?.length || 0;

      return { totalExecutions, activeRules };
    },
  });

  const triggerManualRun = async () => {
    setIsRunning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Fetch pending orders to process
      const { data: pendingOrders } = await supabase
        .from("auto_fulfillment_orders")
        .select("id, order_items, total_amount, supplier_id")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .limit(10);

      if (!pendingOrders?.length) {
        toast.info("Aucune commande en attente à traiter");
        return;
      }

      let processed = 0;
      for (const order of pendingOrders) {
        const orderData = {
          price: order.total_amount,
          quantity: 1,
          supplier: order.supplier_id,
          ...(order.order_items as Record<string, any>),
        };

        const { error } = await supabase.functions.invoke("rules-engine-executor", {
          body: {
            order_id: order.id,
            order_data: orderData,
            user_id: user.id,
          },
        });

        if (!error) processed++;
      }

      toast.success(`${processed} commande(s) traitée(s) par le moteur de règles`);
      refetch();
    } catch (error) {
      console.error("Error running rules:", error);
      toast.error("Erreur lors de l'exécution des règles");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Exécutions des règles
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              Rafraîchir
            </Button>
            <Button
              size="sm"
              onClick={triggerManualRun}
              disabled={isRunning}
            >
              <Play className={`h-4 w-4 mr-1 ${isRunning ? "animate-pulse" : ""}`} />
              {isRunning ? "Exécution..." : "Exécuter maintenant"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Exécutions totales
            </div>
            <p className="text-2xl font-bold">{stats?.totalExecutions || 0}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4" />
              Règles actives
            </div>
            <p className="text-2xl font-bold">{stats?.activeRules || 0}</p>
          </div>
        </div>

        {/* Recent executions */}
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement...
              </div>
            ) : executions?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune exécution récente
              </div>
            ) : (
              executions?.map((exec) => (
                <div
                  key={exec.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    {exec.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{exec.rule_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Commande: {exec.order_id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={exec.success ? "default" : "destructive"}>
                      {exec.actions_executed} action(s)
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(exec.executed_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
