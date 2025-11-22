import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  Printer,
} from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  platform: string;
  date: string;
  items: number;
}

const OrdersCenter = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [orders] = useState<Order[]>([
    {
      id: "1",
      orderNumber: "ORD-2024-001",
      customer: "Jean Dupont",
      total: 450.00,
      status: "delivered",
      platform: "Shopify",
      date: "2024-01-15",
      items: 2,
    },
    {
      id: "2",
      orderNumber: "ORD-2024-002",
      customer: "Marie Martin",
      total: 320.00,
      status: "processing",
      platform: "Amazon",
      date: "2024-01-20",
      items: 1,
    },
    {
      id: "3",
      orderNumber: "ORD-2024-003",
      customer: "Pierre Durant",
      total: 180.00,
      status: "shipped",
      platform: "eBay",
      date: "2024-01-25",
      items: 3,
    },
    {
      id: "4",
      orderNumber: "ORD-2024-004",
      customer: "Sophie Bernard",
      total: 625.00,
      status: "pending",
      platform: "Shopify",
      date: "2024-01-28",
      items: 4,
    },
  ]);

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "processing":
        return <Package className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: Order["status"]) => {
    const variants: Record<Order["status"], "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      processing: "default",
      shipped: "secondary",
      delivered: "secondary",
      cancelled: "destructive",
    };

    const labels: Record<Order["status"], string> = {
      pending: "En attente",
      processing: "En traitement",
      shipped: "Expédié",
      delivered: "Livré",
      cancelled: "Annulé",
    };

    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {labels[status]}
      </Badge>
    );
  };

  const handleViewOrder = (orderId: string) => {
    toast.info(`Affichage de la commande ${orderId}`);
  };

  const handlePrintLabel = (orderId: string) => {
    toast.success(`Étiquette d'expédition générée pour ${orderId}`);
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ordersByStatus = {
    all: filteredOrders.length,
    pending: filteredOrders.filter((o) => o.status === "pending").length,
    processing: filteredOrders.filter((o) => o.status === "processing").length,
    shipped: filteredOrders.filter((o) => o.status === "shipped").length,
    delivered: filteredOrders.filter((o) => o.status === "delivered").length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Centre de Commandes</h1>
        <p className="text-muted-foreground">
          Gérez toutes vos commandes depuis une interface unifiée
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersByStatus.all}</div>
            <p className="text-xs text-muted-foreground">Toutes commandes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-600">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersByStatus.pending}</div>
            <p className="text-xs text-muted-foreground">À traiter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-600">En traitement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersByStatus.processing}</div>
            <p className="text-xs text-muted-foreground">En cours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-600">Expédiées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersByStatus.shipped}</div>
            <p className="text-xs text-muted-foreground">En livraison</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600">Livrées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersByStatus.delivered}</div>
            <p className="text-xs text-muted-foreground">Complétées</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Toutes les commandes</CardTitle>
              <CardDescription>Vue unifiée de toutes vos marketplaces</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par numéro ou client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">Toutes ({ordersByStatus.all})</TabsTrigger>
              <TabsTrigger value="pending">En attente ({ordersByStatus.pending})</TabsTrigger>
              <TabsTrigger value="processing">En cours ({ordersByStatus.processing})</TabsTrigger>
              <TabsTrigger value="shipped">Expédiées ({ordersByStatus.shipped})</TabsTrigger>
              <TabsTrigger value="delivered">Livrées ({ordersByStatus.delivered})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <p className="font-medium">{order.orderNumber}</p>
                        {getStatusBadge(order.status)}
                        <Badge variant="outline">{order.platform}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Client: {order.customer} • {order.items} article(s) • {order.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold">{order.total.toFixed(2)} €</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewOrder(order.orderNumber)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrintLabel(order.orderNumber)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            {["pending", "processing", "shipped", "delivered"].map((status) => (
              <TabsContent key={status} value={status} className="space-y-4 mt-4">
                {filteredOrders
                  .filter((order) => order.status === status)
                  .map((order) => (
                    <div
                      key={order.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <p className="font-medium">{order.orderNumber}</p>
                            {getStatusBadge(order.status)}
                            <Badge variant="outline">{order.platform}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Client: {order.customer} • {order.items} article(s) • {order.date}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold">{order.total.toFixed(2)} €</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewOrder(order.orderNumber)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrintLabel(order.orderNumber)}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersCenter;
