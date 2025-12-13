import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  Package, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Clock,
  TrendingUp,
  AlertTriangle,
  Settings,
  Play,
  Pause,
  Zap
} from "lucide-react";
import { FulfillmentOrdersTable } from "./FulfillmentOrdersTable";
import { FulfillmentRuleBuilder } from "./FulfillmentRuleBuilder";
import { FulfillmentTimeline } from "./FulfillmentTimeline";
import { SupplierStatusCards } from "./SupplierStatusCards";
import { FulfillmentStats } from "./FulfillmentStats";
import { useFulfillmentOrders } from "@/hooks/useFulfillmentOrders";
import { useFulfillmentRules } from "@/hooks/useFulfillmentRules";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

export function FulfillmentDashboard() {
  const [isRuleBuilderOpen, setIsRuleBuilderOpen] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(true);
  
  const { toast } = useToast();
  const { orders, isLoading: ordersLoading, refetch: refetchOrders, retryOrder, cancelOrder, syncTracking, injectTracking } = useFulfillmentOrders();
  const { rules, isLoading: rulesLoading, createRule, updateRule, deleteRule } = useFulfillmentRules();
  

  const handleRetry = async (orderId: string) => {
    try {
      await retryOrder.mutateAsync(orderId);
      toast({ title: "Commande relancée", description: "La commande est en cours de traitement" });
    } catch {
      toast({ title: "Erreur", description: "Impossible de relancer la commande", variant: "destructive" });
    }
  };

  const handleCancel = async (orderId: string) => {
    try {
      await cancelOrder.mutateAsync(orderId);
      toast({ title: "Commande annulée" });
    } catch {
      toast({ title: "Erreur", description: "Impossible d'annuler la commande", variant: "destructive" });
    }
  };

  const handleSyncTracking = async (orderId: string) => {
    try {
      await syncTracking.mutateAsync(orderId);
      toast({ title: "Tracking synchronisé" });
    } catch {
      toast({ title: "Erreur", description: "Impossible de synchroniser le tracking", variant: "destructive" });
    }
  };

  const handleInjectTracking = async (orderId: string) => {
    try {
      await injectTracking.mutateAsync(orderId);
      toast({ title: "Tracking envoyé", description: "Le numéro de suivi a été envoyé à la boutique" });
    } catch {
      toast({ title: "Erreur", description: "Impossible d'envoyer le tracking", variant: "destructive" });
    }
  };

  const handleSaveRule = async (ruleData: any) => {
    try {
      if (selectedRuleId) {
        await updateRule.mutateAsync({ id: selectedRuleId, ...ruleData });
        toast({ title: "Règle mise à jour" });
      } else {
        await createRule.mutateAsync(ruleData);
        toast({ title: "Règle créée" });
      }
      setIsRuleBuilderOpen(false);
      setSelectedRuleId(null);
    } catch {
      toast({ title: "Erreur", description: "Impossible de sauvegarder la règle", variant: "destructive" });
    }
  };

  const toggleAutomation = () => {
    setIsAutomationEnabled(!isAutomationEnabled);
    toast({
      title: isAutomationEnabled ? "Automation désactivée" : "Automation activée",
      description: isAutomationEnabled 
        ? "Les commandes ne seront plus traitées automatiquement" 
        : "Les commandes seront traitées automatiquement",
    });
  };

  // Calculate stats
  const stats = {
    total: orders?.length || 0,
    pending: orders?.filter(o => o.status === "pending").length || 0,
    processing: orders?.filter(o => o.status === "processing").length || 0,
    confirmed: orders?.filter(o => o.status === "confirmed").length || 0,
    shipped: orders?.filter(o => o.status === "shipped").length || 0,
    delivered: orders?.filter(o => o.status === "delivered").length || 0,
    failed: orders?.filter(o => o.status === "failed").length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Auto-Fulfillment</h1>
          <p className="text-muted-foreground">
            Gestion automatisée des commandes fournisseurs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isAutomationEnabled ? "default" : "outline"}
            onClick={toggleAutomation}
            className="gap-2"
          >
            {isAutomationEnabled ? (
              <>
                <Zap className="h-4 w-4" />
                Automation Active
              </>
            ) : (
              <>
                <Pause className="h-4 w-4" />
                Automation Pause
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => refetchOrders()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
          <Button onClick={() => { setSelectedRuleId(null); setIsRuleBuilderOpen(true); }} className="gap-2">
            <Settings className="h-4 w-4" />
            Nouvelle règle
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <FulfillmentStats stats={stats} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="orders" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Commandes</span>
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2">
            <Truck className="h-4 w-4" />
            <span className="hidden sm:inline">Fournisseurs</span>
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Règles</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Historique</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Commandes Auto-Fulfillment</span>
                <Badge variant="outline">{stats.total} commandes</Badge>
              </CardTitle>
              <CardDescription>
                Suivi des commandes traitées automatiquement via vos fournisseurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FulfillmentOrdersTable
                orders={orders || []}
                onRetry={handleRetry}
                onCancel={handleCancel}
                onSyncTracking={handleSyncTracking}
                onInjectTracking={handleInjectTracking}
                isLoading={ordersLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <SupplierStatusCards />
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Règles d'automatisation</CardTitle>
              <CardDescription>
                Configurez les règles pour le routage automatique des commandes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : rules?.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Aucune règle configurée</h3>
                  <p className="text-muted-foreground mb-4">
                    Créez votre première règle pour automatiser le routage des commandes
                  </p>
                  <Button onClick={() => setIsRuleBuilderOpen(true)}>
                    Créer une règle
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {rules?.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{rule.name}</h4>
                          <Badge variant={rule.is_active ? "default" : "secondary"}>
                            {rule.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">Priorité: {rule.priority}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {rule.description || `${rule.conditions?.length || 0} conditions • ${rule.actions?.length || 0} actions`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRuleId(rule.id);
                            setIsRuleBuilderOpen(true);
                          }}
                        >
                          Modifier
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => deleteRule.mutate(rule.id)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <FulfillmentTimeline />
        </TabsContent>
      </Tabs>

      {/* Rule Builder Sheet */}
      <Sheet open={isRuleBuilderOpen} onOpenChange={setIsRuleBuilderOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {selectedRuleId ? "Modifier la règle" : "Nouvelle règle d'automatisation"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FulfillmentRuleBuilder
              rule={rules?.find(r => r.id === selectedRuleId)}
              onSave={handleSaveRule}
              onCancel={() => {
                setIsRuleBuilderOpen(false);
                setSelectedRuleId(null);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
