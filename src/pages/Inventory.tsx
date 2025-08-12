import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/layouts/AppLayout";
import { Link } from "react-router-dom";
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
  Download,
  Upload,
  Truck,
  Clock,
  CheckCircle,
  X
} from "lucide-react";

const Inventory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const handleExport = () => {
    toast({
      title: "Export démarré",
      description: "Votre inventaire sera téléchargé dans quelques instants",
    });
  };

  const handleImport = () => {
    navigate('/import');
  };

  const handleNewProduct = () => {
    navigate('/catalogue');
    toast({
      title: "Nouveau produit",
      description: "Formulaire de création de produit ouvert",
    });
  };

  const handleRestock = (productName: string) => {
    toast({
      title: "Réapprovisionnement",
      description: `Demande de réappro pour ${productName} envoyée`,
    });
  };

  const products = [
    {
      id: "PRD-001",
      name: "Montre Connectée Pro",
      sku: "WCH-PRO-001",
      category: "Électronique",
      stock: 23,
      lowStockThreshold: 10,
      price: 199,
      supplier: "TechSupply Co",
      lastUpdated: "Il y a 2h",
      status: "active",
      image: ""
    },
    {
      id: "PRD-002", 
      name: "Écouteurs Bluetooth",
      sku: "EBT-001",
      category: "Audio",
      stock: 5,
      lowStockThreshold: 15,
      price: 89,
      supplier: "AudioMax",
      lastUpdated: "Il y a 1h",
      status: "low_stock",
      image: ""
    },
    {
      id: "PRD-003",
      name: "Chargeur Sans Fil",
      sku: "CSF-001",
      category: "Accessoires",
      stock: 0,
      lowStockThreshold: 20,
      price: 45,
      supplier: "PowerTech",
      lastUpdated: "Il y a 30 min",
      status: "out_of_stock",
      image: ""
    },
    {
      id: "PRD-004",
      name: "Coque iPhone Premium",
      sku: "CIP-001",
      category: "Accessoires",
      stock: 156,
      lowStockThreshold: 25,
      price: 25,
      supplier: "CaseMaster",
      lastUpdated: "Il y a 4h",
      status: "active",
      image: ""
    }
  ];

  const stats = [
    { title: "Total Produits", value: "2,341", change: "+5.2%", icon: Package },
    { title: "Stock Faible", value: "47", change: "+12%", icon: AlertTriangle },
    { title: "Ruptures", value: "8", change: "-25%", icon: X },
    { title: "Valeur Stock", value: "€234,567", change: "+8.1%", icon: BarChart3 }
  ];

  const lowStockProducts = products.filter(p => p.status === "low_stock" || p.status === "out_of_stock");

  const getStatusBadge = (status: string, stock: number, threshold: number) => {
    if (stock === 0) {
      return <Badge variant="destructive">Rupture</Badge>;
    } else if (stock <= threshold) {
      return <Badge variant="secondary" className="bg-warning text-warning-foreground">Stock faible</Badge>;
    } else {
      return <Badge variant="default" className="bg-success text-success-foreground">En stock</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" />
            Inventaire
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestion intelligente du stock avec IA prédictive
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button variant="outline" onClick={handleImport}>
            <Upload className="mr-2 h-4 w-4" />
            Importer
          </Button>
          <Link to="/inventory-ultra-pro">
            <Button 
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Inventory Ultra Pro
            </Button>
          </Link>
          <Button variant="hero" onClick={handleNewProduct}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau Produit
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
                <p className="text-xs text-success">{stat.change} vs mois dernier</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="low-stock">Stock Faible</TabsTrigger>
            <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
            <TabsTrigger value="movements">Mouvements</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            {/* Search and Filters */}
            <Card className="border-border bg-card shadow-card">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher des produits..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select className="px-4 py-2 border border-border rounded-md bg-background">
                    <option>Toutes les catégories</option>
                    <option>Électronique</option>
                    <option>Audio</option>
                    <option>Accessoires</option>
                  </select>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtres
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Products List */}
            <div className="grid gap-4">
              {products.map((product) => (
                <Card key={product.id} className="border-border bg-card shadow-card hover:shadow-glow transition-all duration-300">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{product.name}</h3>
                            {getStatusBadge(product.status, product.stock, product.lowStockThreshold)}
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div>SKU: {product.sku} • {product.category}</div>
                            <div>Fournisseur: {product.supplier}</div>
                            <div>Mis à jour: {product.lastUpdated}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-8">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Stock</div>
                          <div className={`text-2xl font-bold ${
                            product.stock === 0 ? 'text-destructive' : 
                            product.stock <= product.lowStockThreshold ? 'text-warning' : 
                            'text-success'
                          }`}>
                            {product.stock}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Seuil</div>
                          <div className="font-semibold">{product.lowStockThreshold}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Prix</div>
                          <div className="font-semibold">€{product.price}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Valeur Stock</div>
                          <div className="font-semibold">€{(product.stock * product.price).toLocaleString()}</div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/catalogue/${product.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/catalogue/${product.id}/edit`)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleRestock(product.name)}>
                            <Truck className="mr-2 h-4 w-4" />
                            Réappro
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="low-stock" className="space-y-6">
            <Card className="border-border bg-card shadow-card">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    Produits en Stock Faible
                </CardTitle>
                <CardDescription>Produits nécessitant un réapprovisionnement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lowStockProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.sku} • {product.supplier}</div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Stock actuel</div>
                          <div className={`font-semibold ${product.stock === 0 ? 'text-destructive' : 'text-warning'}`}>
                            {product.stock}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Seuil</div>
                          <div className="font-semibold">{product.lowStockThreshold}</div>
                        </div>
                        <Button variant="hero" size="sm" onClick={() => handleRestock(product.name)}>
                          <Truck className="mr-2 h-4 w-4" />
                          Réapprovisionner
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-6">
            <Card className="border-border bg-card shadow-card">
              <CardHeader>
                <CardTitle>Fournisseurs</CardTitle>
                <CardDescription>Gestion des partenaires et fournisseurs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: "TechSupply Co", products: 45, status: "Actif", lastOrder: "Il y a 2 jours" },
                    { name: "AudioMax", products: 23, status: "Actif", lastOrder: "Il y a 1 semaine" },
                    { name: "PowerTech", products: 12, status: "Inactif", lastOrder: "Il y a 1 mois" },
                    { name: "CaseMaster", products: 67, status: "Actif", lastOrder: "Hier" }
                  ].map((supplier, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{supplier.name}</h3>
                        <Badge variant={supplier.status === "Actif" ? "default" : "secondary"}>
                          {supplier.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>{supplier.products} produits</div>
                        <div>Dernière commande: {supplier.lastOrder}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movements" className="space-y-6">
            <Card className="border-border bg-card shadow-card">
              <CardHeader>
                <CardTitle>Mouvements de Stock</CardTitle>
                <CardDescription>Historique des entrées et sorties</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: "Vente", product: "Montre Connectée Pro", quantity: -2, date: "Il y a 1h", reason: "Commande #ORD-001" },
                    { type: "Réception", product: "Écouteurs Bluetooth", quantity: +50, date: "Il y a 3h", reason: "Livraison fournisseur" },
                    { type: "Ajustement", product: "Chargeur Sans Fil", quantity: -5, date: "Il y a 1 jour", reason: "Produits endommagés" },
                    { type: "Vente", product: "Coque iPhone Premium", quantity: -8, date: "Il y a 2 jours", reason: "Commandes multiples" }
                  ].map((movement, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${
                          movement.type === "Vente" ? "bg-red-100 text-red-600" :
                          movement.type === "Réception" ? "bg-green-100 text-green-600" :
                          "bg-orange-100 text-orange-600"
                        }`}>
                          {movement.type === "Vente" && <TrendingDown className="h-4 w-4" />}
                          {movement.type === "Réception" && <TrendingUp className="h-4 w-4" />}
                          {movement.type === "Ajustement" && <Edit className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-medium">{movement.product}</div>
                          <div className="text-sm text-muted-foreground">{movement.reason}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${movement.quantity > 0 ? 'text-success' : 'text-destructive'}`}>
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                        </div>
                        <div className="text-sm text-muted-foreground">{movement.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Inventory;