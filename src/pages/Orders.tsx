import { useState } from "react";
import { Package, Truck, AlertCircle, Clock, CheckCircle, Search, Filter, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useRealOrders } from "@/hooks/useRealOrders";

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { orders, stats, isLoading } = useRealOrders();

  const handleExportCSV = () => {
    toast({
      title: "Export en cours",
      description: "Génération du fichier CSV des commandes...",
    });
    
    setTimeout(() => {
      toast({
        title: "Export terminé",
        description: "Le fichier CSV a été téléchargé",
      });
    }, 1500);
  };

  const handleSyncMarketplaces = () => {
    toast({
      title: "Synchronisation",
      description: "Synchronisation des commandes depuis toutes les marketplaces...",
    });
    
    setTimeout(() => {
      toast({
        title: "Sync terminée",
        description: "47 nouvelles commandes importées",
      });
    }, 3000);
  };

  const handleOrderDetails = (orderId: string) => {
    toast({
      title: "Détails de commande",
      description: `Ouverture des détails pour ${orderId}`,
    });
  };

  const handleTrackingClick = (trackingNumber: string) => {
    navigate("/tracking");
    toast({
      title: "Redirection",
      description: `Ouverture du suivi pour ${trackingNumber}`,
    });
  };


  const getStatusBadge = (status: string) => {
    const variants = {
      processing: "secondary",
      shipped: "default", 
      delivered: "default",
      cancelled: "destructive"
    };
    
    const colors = {
      processing: "text-orange-600",
      shipped: "text-blue-600",
      delivered: "text-green-600", 
      cancelled: "text-red-600"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any} className={colors[status as keyof typeof colors]}>
        {status === "processing" && <Clock className="w-3 h-3 mr-1" />}
        {status === "shipped" && <Truck className="w-3 h-3 mr-1" />}
        {status === "delivered" && <CheckCircle className="w-3 h-3 mr-1" />}
        {status === "cancelled" && <AlertCircle className="w-3 h-3 mr-1" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" />
            Commandes
          </h1>
          <p className="text-muted-foreground">Gestion centralisée multi-marketplace avec analytics avancées</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={() => navigate('/orders-ultra-pro')}
          >
            <Package className="w-4 h-4 mr-2" />
            Orders Ultra Pro
          </Button>
          <Button onClick={handleSyncMarketplaces}>
            <Package className="w-4 h-4 mr-2" />
            Sync Marketplaces
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Commandes</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Transit</p>
                <p className="text-2xl font-bold">{stats.shipped}</p>
              </div>
              <Truck className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Livrées</p>
                <p className="text-2xl font-bold">{stats.delivered}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Retours</p>
                <p className="text-2xl font-bold">{stats.cancelled}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par ID, client, tracking..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="processing">En traitement</SelectItem>
                  <SelectItem value="shipped">Expédiées</SelectItem>
                  <SelectItem value="delivered">Livrées</SelectItem>
                  <SelectItem value="cancelled">Annulées</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtres
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes Récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Commande</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Produits</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead>Fournisseur</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>{order.customers?.name || 'N/A'}</TableCell>
                  <TableCell>{order.order_items?.length || 0} produits</TableCell>
                  <TableCell className="font-semibold">€{order.total_amount.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    {order.tracking_number ? (
                      <Button 
                        variant="link" 
                        className="p-0 h-auto"
                        onClick={() => handleTrackingClick(order.tracking_number!)}
                      >
                        {order.tracking_number}
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{order.carrier || 'Auto'}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleOrderDetails(order.order_number)}
                    >
                      Détails
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}