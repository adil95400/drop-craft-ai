import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MoreHorizontal,
  RefreshCw,
  XCircle,
  Truck,
  ExternalLink,
  Eye,
  Send,
} from "lucide-react";
import { FulfillmentOrder, useFulfillmentOrders, useFulfillmentEvents } from "@/hooks/useFulfillmentOrders";

interface FulfillmentOrdersTableProps {
  orders: FulfillmentOrder[];
  onRetry: (orderId: string) => void;
  onCancel: (orderId: string) => void;
  onSyncTracking: (orderId: string) => void;
  onInjectTracking: (orderId: string) => void;
  isLoading?: boolean;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const statusLabels: Record<string, string> = {
  pending: "En attente",
  processing: "En cours",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  failed: "Échouée",
  cancelled: "Annulée",
};

export function FulfillmentOrdersTable({
  orders,
  onRetry,
  onCancel,
  onSyncTracking,
  onInjectTracking,
  isLoading,
}: FulfillmentOrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<FulfillmentOrder | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Truck className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Aucune commande</h3>
        <p className="text-muted-foreground mt-1">
          Les commandes automatiques apparaîtront ici
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Commande</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Tracking</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{order.store_order_id}</span>
                    <span className="text-xs text-muted-foreground">
                      {order.store_platform}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{order.customer_name || "—"}</span>
                    <span className="text-xs text-muted-foreground">
                      {order.customer_email || ""}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{order.supplier_name || "—"}</span>
                    {order.supplier_order_id && (
                      <span className="text-xs text-muted-foreground">
                        #{order.supplier_order_id}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {order.total_amount?.toFixed(2)} {order.currency}
                    </span>
                    {order.profit_margin !== undefined && (
                      <span className={`text-xs ${order.profit_margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {order.profit_margin >= 0 ? "+" : ""}{order.profit_margin.toFixed(2)}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[order.status] || statusColors.pending}>
                    {statusLabels[order.status] || order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {order.tracking_number ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">{order.tracking_number}</span>
                      {order.tracking_url && (
                        <a
                          href={order.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {format(new Date(order.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Voir détails
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onSyncTracking(order.id)}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync tracking
                      </DropdownMenuItem>
                      {order.tracking_number && (
                        <DropdownMenuItem onClick={() => onInjectTracking(order.id)}>
                          <Send className="h-4 w-4 mr-2" />
                          Envoyer tracking
                        </DropdownMenuItem>
                      )}
                      {order.status === "failed" && order.retry_count < 3 && (
                        <DropdownMenuItem onClick={() => onRetry(order.id)}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Réessayer
                        </DropdownMenuItem>
                      )}
                      {!["cancelled", "delivered"].includes(order.status) && (
                        <DropdownMenuItem
                          onClick={() => onCancel(order.id)}
                          className="text-destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Annuler
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <OrderDetailsDialog
        order={selectedOrder}
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </>
  );
}

function OrderDetailsDialog({
  order,
  open,
  onClose,
}: {
  order: FulfillmentOrder | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data: events } = useFulfillmentEvents(order?.id || "");

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Détails de la commande {order.store_order_id}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Client</h4>
              <p>{order.customer_name}</p>
              <p className="text-sm text-muted-foreground">{order.customer_email}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Fournisseur</h4>
              <p>{order.supplier_name || "Non assigné"}</p>
              {order.supplier_order_id && (
                <p className="text-sm text-muted-foreground">#{order.supplier_order_id}</p>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Montant</h4>
              <p className="font-medium">{order.total_amount?.toFixed(2)} {order.currency}</p>
              {order.cost_price && (
                <p className="text-sm text-muted-foreground">
                  Coût: {order.cost_price.toFixed(2)} | Marge: {order.profit_margin?.toFixed(2)}
                </p>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Statut</h4>
              <Badge className={statusColors[order.status]}>
                {statusLabels[order.status]}
              </Badge>
            </div>
          </div>

          {order.tracking_number && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Tracking</h4>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Truck className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-mono">{order.tracking_number}</p>
                  <p className="text-sm text-muted-foreground">{order.carrier}</p>
                </div>
                {order.tracking_url && (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-primary hover:underline flex items-center gap-1"
                  >
                    Suivre <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Articles</h4>
            <div className="space-y-2">
              {order.order_items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p>{item.quantity}x {item.price.toFixed(2)}</p>
                    {item.cost_price && (
                      <p className="text-sm text-muted-foreground">Coût: {item.cost_price.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {events && events.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Historique</h4>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-2 border-l-2 border-muted pl-4"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{event.event_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.created_at), "dd/MM/yyyy HH:mm:ss")}
                        </p>
                      </div>
                      <Badge variant={event.event_status === "success" ? "default" : "destructive"}>
                        {event.event_status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
