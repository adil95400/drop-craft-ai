import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  Package,
  AlertTriangle,
  Search,
  RefreshCw,
  ArrowRight,
  Send,
  Zap,
} from "lucide-react";

const eventIcons: Record<string, any> = {
  order_received: Package,
  supplier_order_placed: Send,
  supplier_order_confirmed: CheckCircle2,
  supplier_order_failed: XCircle,
  tracking_received: Truck,
  tracking_synced: RefreshCw,
  tracking_injected: ArrowRight,
  processing_started: Zap,
  processing_completed: CheckCircle2,
  order_delivered: Package,
  order_cancelled: XCircle,
};

const eventColors: Record<string, string> = {
  success: "border-green-500 bg-green-500/10",
  error: "border-red-500 bg-red-500/10",
  warning: "border-yellow-500 bg-yellow-500/10",
  info: "border-blue-500 bg-blue-500/10",
  pending: "border-gray-500 bg-gray-500/10",
};

const eventLabels: Record<string, string> = {
  order_received: "Commande reçue",
  supplier_order_placed: "Commande fournisseur passée",
  supplier_order_confirmed: "Commande fournisseur confirmée",
  supplier_order_failed: "Échec commande fournisseur",
  tracking_received: "Tracking reçu",
  tracking_synced: "Tracking synchronisé",
  tracking_injected: "Tracking envoyé à la boutique",
  processing_started: "Traitement démarré",
  processing_completed: "Traitement terminé",
  order_delivered: "Commande livrée",
  order_cancelled: "Commande annulée",
};

export function FulfillmentTimeline() {
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Fetch all events without specific orderId
  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ["fulfillment-events-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fulfillment_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  const filteredEvents = events?.filter((event) => {
    const matchesSearch = filter === "" || 
      event.event_type.toLowerCase().includes(filter.toLowerCase()) ||
      event.fulfillment_order_id?.toLowerCase().includes(filter.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || event.event_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <CardTitle>Historique des événements</CardTitle>
            <CardDescription>
              Timeline détaillée des actions d'auto-fulfillment
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="success">Succès</SelectItem>
              <SelectItem value="error">Erreur</SelectItem>
              <SelectItem value="warning">Avertissement</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !filteredEvents || filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">Aucun événement</h3>
            <p className="text-muted-foreground">
              Les événements d'auto-fulfillment apparaîtront ici
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="relative pl-6 border-l-2 border-muted space-y-6">
              {filteredEvents.map((event, index) => {
                const Icon = eventIcons[event.event_type] || Clock;
                const colorClass = eventColors[event.event_status] || eventColors.info;
                
                return (
                  <div key={event.id} className="relative">
                    {/* Timeline dot */}
                    <div className={`absolute -left-[25px] p-1.5 rounded-full border-2 ${colorClass}`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    
                    {/* Event content */}
                    <div className="bg-muted/30 rounded-lg p-4 ml-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium">
                              {eventLabels[event.event_type] || event.event_type}
                            </h4>
                            <Badge
                              variant={event.event_status === "success" ? "default" : 
                                       event.event_status === "error" ? "destructive" : "secondary"}
                            >
                              {event.event_status}
                            </Badge>
                          </div>
                          
                          {event.event_data && Object.keys(event.event_data).length > 0 && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              {Object.entries(event.event_data).map(([key, value]) => (
                                <div key={key} className="flex gap-2">
                                  <span className="font-medium">{key}:</span>
                                  <span>{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {event.error_details && (
                            <div className="mt-2 text-sm text-destructive flex items-start gap-1">
                              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                              <span>{event.error_details}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right shrink-0">
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.created_at), "dd MMM yyyy", { locale: fr })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.created_at), "HH:mm:ss")}
                          </p>
                          {event.duration_ms && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {event.duration_ms}ms
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
