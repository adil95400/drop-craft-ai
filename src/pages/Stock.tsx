import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useRealProducts } from "@/hooks/useRealProducts";

import { 
  Package, 
  Search, 
  Filter, 
  Plus,
  Eye,
  Edit,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Download,
  Settings,
  Clock,
  Truck
} from "lucide-react";

const Stock = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const { products, stats: productStats, isLoading } = useRealProducts();

  const handleExport = () => {
    toast({
      title: "Rapport généré",
      description: "Le rapport de stock sera téléchargé dans quelques instants",
    });
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleNewMovement = () => {
    toast({
      title: "Nouveau mouvement",
      description: "Formulaire de mouvement de stock ouvert",
    });
  };

  const stockMovements = [
    {
      id: 1,
      productName: "Montre Connectée Pro",
      sku: "WCH-PRO-001",
      type: "out",
      quantity: 5,
      currentStock: 18,
      reason: "Ventes",
      date: "2024-01-16 14:30",
      location: "Entrepôt Principal"
    },
    {
      id: 2,
      productName: "Écouteurs Bluetooth",
      sku: "EBT-001", 
      type: "in",
      quantity: 100,
      currentStock: 105,
      reason: "Réapprovisionnement",
      date: "2024-01-16 10:15",
      location: "Entrepôt Principal"
    },
    {
      id: 3,
      productName: "Chargeur Sans Fil",
      sku: "CSF-001",
      type: "adjustment",
      quantity: -3,
      currentStock: 42,
      reason: "Produits défectueux",
      date: "2024-01-15 16:45",
      location: "Entrepôt Principal"
    }
  ];

  const stockAlerts = [
    {
      id: 1,
      productName: "Écouteurs Bluetooth",
      sku: "EBT-001",
      currentStock: 5,
      threshold: 15,
      priority: "high",
      lastUpdated: "Il y a 2h"
    },
    {
      id: 2,
      productName: "Support Téléphone",
      sku: "SPT-001",
      currentStock: 0,
      threshold: 20,
      priority: "critical",
      lastUpdated: "Il y a 30 min"
    },
    {
      id: 3,
      productName: "Câble USB-C",
      sku: "CBC-001",
      currentStock: 8,
      threshold: 25,
      priority: "medium",
      lastUpdated: "Il y a 4h"
    }
  ];

  const warehouses = [
    {
      id: 1,
      name: "Entrepôt Principal",
      location: "Paris, France",
      capacity: 10000,
      used: 7500,
      products: 2341,
      status: "active"
    },
    {
      id: 2,
      name: "Entrepôt Lyon",
      location: "Lyon, France", 
      capacity: 5000,
      used: 3200,
      products: 1456,
      status: "active"
    },
    {
      id: 3,
      name: "Entrepôt Marseille",
      location: "Marseille, France",
      capacity: 3000,
      used: 1800,
      products: 892,
      status: "maintenance"
    }
  ];

  const stats = [
    { title: "Mouvements Aujourd'hui", value: "247", change: "+12%", icon: RefreshCw },
    { title: "Alertes Stock", value: productStats.lowStock?.toString() || "23", change: "-8%", icon: AlertTriangle },
    { title: "Réappros en Cours", value: "12", change: "+5%", icon: Truck },
    { title: "Taux de Rotation", value: "4.2x", change: "+15%", icon: TrendingUp }
  ];

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "in": return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "out": return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "adjustment": return <Edit className="h-4 w-4 text-orange-500" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getMovementType = (type: string) => {
    switch (type) {
      case "in": return "Entrée";
      case "out": return "Sortie";
      case "adjustment": return "Ajustement";
      default: return type;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge variant="destructive">Critique</Badge>;
      case "high":
        return <Badge variant="destructive" className="bg-orange-500">Élevé</Badge>;
      case "medium":
        return <Badge variant="secondary">Moyen</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const handleRestock = (productName: string) => {
    toast({
      title: "Réapprovisionnement",
      description: `Demande de réappro pour ${productName} envoyée`,
    });
  };

  return (
    <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Gestion Stock
            </h1>
            <p className="text-muted-foreground mt-1">
              Suivi et contrôle des stocks en temps réel
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Rapport
            </Button>
            <Button variant="outline" onClick={handleSettings}>
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </Button>
            <Button variant="hero" onClick={handleNewMovement}>
              <Plus className="mr-2 h-4 w-4" />
              Mouvement Stock
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="border-border bg-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-green-500">{stat.change} vs hier</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="movements" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="movements">Mouvements</TabsTrigger>
            <TabsTrigger value="alerts">Alertes</TabsTrigger>
            <TabsTrigger value="warehouses">Entrepôts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="movements" className="space-y-6">
            {/* Search and Filters */}
            <Card className="border-border bg-card shadow-card">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un mouvement..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select className="px-4 py-2 border border-border rounded-md bg-background">
                    <option>Tous les types</option>
                    <option>Entrées</option>
                    <option>Sorties</option>
                    <option>Ajustements</option>
                  </select>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtres
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Movements List */}
            <div className="grid gap-4">
              {stockMovements.map((movement) => (
                <Card key={movement.id} className="border-border bg-card shadow-card hover:shadow-glow transition-all duration-300">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 rounded-lg bg-muted">
                          {getMovementIcon(movement.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{movement.productName}</h3>
                            <Badge variant="outline">{movement.sku}</Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div>Type: {getMovementType(movement.type)} • Raison: {movement.reason}</div>
                            <div>Localisation: {movement.location}</div>
                            <div>Date: {movement.date}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-8">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Quantité</div>
                          <div className={`text-2xl font-bold ${
                            movement.type === "in" ? "text-green-500" : 
                            movement.type === "out" ? "text-red-500" : 
                            "text-orange-500"
                          }`}>
                            {movement.type === "in" ? "+" : movement.type === "adjustment" && movement.quantity < 0 ? "" : movement.type === "out" ? "-" : ""}
                            {Math.abs(movement.quantity)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Stock Actuel</div>
                          <div className="text-2xl font-bold">{movement.currentStock}</div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <Card className="border-border bg-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Alertes de Stock
                </CardTitle>
                <CardDescription>Produits nécessitant une attention immédiate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stockAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <AlertTriangle className={`h-6 w-6 ${
                          alert.priority === "critical" ? "text-red-500" :
                          alert.priority === "high" ? "text-orange-500" :
                          "text-yellow-500"
                        }`} />
                        <div>
                          <div className="font-medium">{alert.productName}</div>
                          <div className="text-sm text-muted-foreground">{alert.sku}</div>
                          <div className="text-xs text-muted-foreground">Mis à jour: {alert.lastUpdated}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Stock</div>
                          <div className={`font-semibold ${alert.currentStock === 0 ? 'text-red-500' : 'text-orange-500'}`}>
                            {alert.currentStock}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Seuil</div>
                          <div className="font-semibold">{alert.threshold}</div>
                        </div>
                        <div>
                          {getPriorityBadge(alert.priority)}
                        </div>
                        <Button variant="hero" size="sm" onClick={() => handleRestock(alert.productName)}>
                          <Truck className="mr-2 h-4 w-4" />
                          Réappro
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="warehouses" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {warehouses.map((warehouse) => (
                <Card key={warehouse.id} className="border-border bg-card shadow-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                      <Badge variant={warehouse.status === "active" ? "default" : "secondary"}>
                        {warehouse.status === "active" ? "Actif" : "Maintenance"}
                      </Badge>
                    </div>
                    <CardDescription>{warehouse.location}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Utilisation</span>
                          <span>{warehouse.used.toLocaleString()} / {warehouse.capacity.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${(warehouse.used / warehouse.capacity) * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {Math.round((warehouse.used / warehouse.capacity) * 100)}% utilisé
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold">{warehouse.products.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">Produits</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{warehouse.capacity - warehouse.used}</div>
                          <div className="text-sm text-muted-foreground">Libre</div>
                        </div>
                      </div>

                      <Button variant="outline" className="w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        Gérer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border bg-card shadow-card">
                <CardHeader>
                  <CardTitle>Évolution du Stock</CardTitle>
                  <CardDescription>Tendances des niveaux de stock</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Graphique d'évolution du stock (Chart.js/Recharts)
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-card">
                <CardHeader>
                  <CardTitle>Rotation des Stocks</CardTitle>
                  <CardDescription>Performance par catégorie de produits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Graphique de rotation (Chart.js/Recharts)
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
    </div>
  );
};

export default Stock;