import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRealOrders } from '@/hooks/useRealOrders';
import { Skeleton } from '@/components/ui/skeleton';
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
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from '@tanstack/react-query';

const OrdersCenter = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { orders: realOrders, isLoading } = useRealOrders();
  const [searchTerm, setSearchTerm] = useState("");
  
  const orders = realOrders || [];
  
  const refetch = () => queryClient.invalidateQueries({ queryKey: ['orders'] });

  const getStatusIcon = (status: string) => {
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
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      processing: "default",
      shipped: "secondary",
      delivered: "secondary",
      cancelled: "destructive",
    };

    const labels: Record<string, string> = {
      pending: "En attente",
      processing: "En traitement",
      shipped: "Expédié",
      delivered: "Livré",
      cancelled: "Annulé",
    };

    return (
      <Badge variant={variants[status] || "outline"} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {labels[status] || status}
      </Badge>
    );
  };

  const handleViewOrder = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  const handlePrintLabel = (orderId: string) => {
    toast.success(`Étiquette d'expédition générée pour la commande ${orderId}`);
  };

  const handleExport = () => {
    if (!orders || orders.length === 0) {
      toast.error('Aucune commande à exporter');
      return;
    }

    const headers = ['Numéro', 'Client', 'Date', 'Statut', 'Montant', 'Devise', 'Articles', 'Plateforme'];
    const csvData = orders.map(order => [
      order.order_number || '',
      order.customer_name || '',
      new Date(order.created_at).toLocaleDateString('fr-FR'),
      order.status || '',
      order.total_amount?.toFixed(2) || '0',
      order.currency || 'EUR',
      order.items?.length || 0,
      order.platform || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `commandes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`${orders.length} commandes exportées`);
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ordersByStatus = {
    all: filteredOrders.length,
    pending: filteredOrders.filter((o) => o.status === "pending").length,
    processing: filteredOrders.filter((o) => o.status === "processing").length,
    shipped: filteredOrders.filter((o) => o.status === "shipped").length,
    delivered: filteredOrders.filter((o) => o.status === "delivered").length,
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

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
              <Button variant="outline" size="sm" onClick={refetch}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
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
                        <p className="font-medium">{order.order_number}</p>
                        {getStatusBadge(order.status)}
                        <Badge variant="outline">{order.platform || 'Direct'}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Client: {order.customer_name} • {order.items?.length || 0} article(s) • {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold">{order.total_amount?.toFixed(2) || '0.00'} {order.currency || 'EUR'}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewOrder(order.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrintLabel(order.order_number || order.id)}
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
                            <p className="font-medium">{order.order_number}</p>
                            {getStatusBadge(order.status)}
                            <Badge variant="outline">{order.platform || 'Direct'}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Client: {order.customer_name} • {order.items?.length || 0} article(s) • {new Date(order.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold">{order.total_amount?.toFixed(2) || '0.00'} {order.currency || 'EUR'}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewOrder(order.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrintLabel(order.order_number || order.id)}
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
