import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Store, 
  Package, 
  Star, 
  MapPin, 
  Clock, 
  TrendingUp, 
  ShoppingCart,
  Users,
  Zap,
  Globe,
  Search,
  Filter,
  Link,
  CheckCircle,
  AlertCircle,
  Plus
} from "lucide-react";

const Marketplace = () => {
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);

  const suppliers = [
    {
      id: "1",
      name: "BigBuy",
      logo: "",
      description: "Plus de 100,000 produits européens en dropshipping",
      country: "Espagne", 
      products: 127000,
      rating: 4.8,
      reviews: 2340,
      deliveryTime: "3-7 jours",
      category: "Généraliste",
      status: "connected",
      apiStatus: "active",
      commission: "15-25%",
      features: ["API", "Catalogue XML", "Tracking automatique", "Support multilingue"]
    },
    {
      id: "2",
      name: "VidaXL", 
      logo: "",
      description: "Mobilier et articles de maison haut de gamme",
      country: "Pays-Bas",
      products: 85000,
      rating: 4.6,
      reviews: 1890,
      deliveryTime: "5-10 jours", 
      category: "Maison & Jardin",
      status: "available",
      apiStatus: "inactive",
      commission: "8-15%",
      features: ["Catalogue PDF", "Images HD", "Descriptions FR", "Garantie 2 ans"]
    },
    {
      id: "3",
      name: "Printful",
      logo: "",
      description: "Impression à la demande et personnalisation",
      country: "Lettonie",
      products: 15000,
      rating: 4.9,
      reviews: 5670,
      deliveryTime: "7-14 jours",
      category: "Print on Demand", 
      status: "connected",
      apiStatus: "active",
      commission: "0% (prix fixes)",
      features: ["Mockup générateur", "Broderie", "Intégration Shopify", "White label"]
    },
    {
      id: "4",
      name: "Matterhorn",
      logo: "",
      description: "Fournisseur premium pour boutiques haut de gamme",
      country: "Allemagne",
      products: 45000,
      rating: 4.7,
      reviews: 1234,
      deliveryTime: "2-5 jours",
      category: "Premium",
      status: "pending",
      apiStatus: "inactive", 
      commission: "20-35%",
      features: ["Produits premium", "Support dédié", "Formation incluse", "Exclusivité"]
    }
  ];

  const categories = [
    { name: "Électronique", count: 45000, trend: "+12%" },
    { name: "Mode & Beauté", count: 38000, trend: "+8%" },
    { name: "Maison & Jardin", count: 32000, trend: "+15%" },
    { name: "Sport & Loisirs", count: 28000, trend: "+5%" },
    { name: "Auto & Moto", count: 22000, trend: "+18%" },
    { name: "Santé & Bien-être", count: 18000, trend: "+22%" }
  ];

  const topProducts = [
    {
      id: "1",
      name: "Casque Bluetooth Sans Fil",
      supplier: "BigBuy",
      price: "24.99€",
      margin: "45%",
      stock: 1250,
      sales: 890,
      trend: "+25%"
    },
    {
      id: "2", 
      name: "Chaise de Bureau Ergonomique",
      supplier: "VidaXL", 
      price: "189.00€",
      margin: "30%",
      stock: 45,
      sales: 156,
      trend: "+12%"
    },
    {
      id: "3",
      name: "T-Shirt Personnalisé",
      supplier: "Printful",
      price: "19.95€", 
      margin: "60%",
      stock: 9999,
      sales: 2340,
      trend: "+35%"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'available': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4" />;
      case 'available': return <Plus className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Marketplace B2B
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Connectez-vous aux meilleurs fournisseurs européens
            </p>
          </div>
          <Button className="bg-gradient-primary hover:opacity-90 transition-opacity">
            <Link className="w-4 h-4 mr-2" />
            Ajouter Fournisseur
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Fournisseurs</p>
                  <p className="text-2xl font-bold text-primary">12</p>
                </div>
                <Store className="w-8 h-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Produits Dispo</p>
                  <p className="text-2xl font-bold text-secondary">275K</p>
                </div>
                <Package className="w-8 h-8 text-secondary/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Connectés</p>
                  <p className="text-2xl font-bold text-accent">8</p>
                </div>
                <Zap className="w-8 h-8 text-accent/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Note Moyenne</p>
                  <p className="text-2xl font-bold text-gradient">4.7</p>
                </div>
                <Star className="w-8 h-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="suppliers" className="space-y-6">
          <TabsList className="bg-muted/50 border border-border/50">
            <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
            <TabsTrigger value="catalog">Catalogue</TabsTrigger>
            <TabsTrigger value="trending">Tendances</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="suppliers" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <Select defaultValue="all">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  <SelectItem value="generaliste">Généraliste</SelectItem>
                  <SelectItem value="mode">Mode & Beauté</SelectItem>
                  <SelectItem value="maison">Maison & Jardin</SelectItem>
                  <SelectItem value="electronique">Électronique</SelectItem>
                  <SelectItem value="pod">Print on Demand</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="all">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les pays</SelectItem>
                  <SelectItem value="france">France</SelectItem>
                  <SelectItem value="allemagne">Allemagne</SelectItem>
                  <SelectItem value="espagne">Espagne</SelectItem>
                  <SelectItem value="italie">Italie</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="all">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="connected">Connecté</SelectItem>
                  <SelectItem value="available">Disponible</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                </SelectContent>
              </Select>

              <Input 
                placeholder="Rechercher un fournisseur..." 
                className="flex-1 min-w-[300px]"
              />
            </div>

            {/* Suppliers Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {suppliers.map((supplier) => (
                <Card key={supplier.id} className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={supplier.logo} />
                            <AvatarFallback>{supplier.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-lg font-semibold">{supplier.name}</h3>
                            <div className="flex items-center gap-2">
                              <div className="flex">{renderStars(Math.floor(supplier.rating))}</div>
                              <span className="text-sm text-muted-foreground">
                                {supplier.rating} ({supplier.reviews} avis)
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <Badge className={getStatusColor(supplier.status)}>
                          {getStatusIcon(supplier.status)}
                          <span className="ml-1">
                            {supplier.status === 'connected' ? 'Connecté' : 
                             supplier.status === 'available' ? 'Disponible' : 'En attente'}
                          </span>
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="text-muted-foreground text-sm">{supplier.description}</p>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{supplier.country}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span>{supplier.products.toLocaleString()} produits</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{supplier.deliveryTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          <span>Commission {supplier.commission}</span>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="flex flex-wrap gap-1">
                        {supplier.features.slice(0, 3).map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {supplier.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{supplier.features.length - 3} autres
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {supplier.status === 'connected' ? (
                          <>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Package className="w-4 h-4 mr-2" />
                              Catalogue
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1">
                              Gérer
                            </Button>
                          </>
                        ) : supplier.status === 'available' ? (
                          <Button className="w-full bg-gradient-primary hover:opacity-90 transition-opacity" size="sm">
                            <Link className="w-4 h-4 mr-2" />
                            Se Connecter
                          </Button>
                        ) : (
                          <Button variant="outline" className="w-full" size="sm" disabled>
                            <Clock className="w-4 h-4 mr-2" />
                            Demande en cours
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="catalog" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Categories Sidebar */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Catégories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {categories.map((category) => (
                    <div key={category.name} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded cursor-pointer">
                      <div>
                        <p className="font-medium text-sm">{category.name}</p>
                        <p className="text-xs text-muted-foreground">{category.count.toLocaleString()}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {category.trend}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Products Grid */}
              <div className="lg:col-span-3 space-y-4">
                <div className="flex items-center gap-4">
                  <Input 
                    placeholder="Rechercher des produits..." 
                    className="flex-1"
                  />
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtres
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {topProducts.map((product) => (
                    <Card key={product.id} className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                            <Package className="w-12 h-12 text-muted-foreground" />
                          </div>
                          
                          <div>
                            <h3 className="font-medium text-sm">{product.name}</h3>
                            <p className="text-xs text-muted-foreground">par {product.supplier}</p>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-primary">{product.price}</p>
                              <p className="text-xs text-muted-foreground">Marge {product.margin}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {product.trend}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-muted-foreground">Stock</p>
                              <p className="font-medium">{product.stock}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Ventes</p>
                              <p className="font-medium">{product.sales}</p>
                            </div>
                          </div>

                          <Button size="sm" className="w-full">
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Importer
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trending" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Produits Tendance
                  </CardTitle>
                  <CardDescription>
                    Les produits les plus populaires cette semaine
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.supplier}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{product.price}</p>
                        <Badge variant="secondary" className="text-xs">
                          {product.trend}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    Nouveaux Fournisseurs
                  </CardTitle>
                  <CardDescription>
                    Récemment ajoutés à la marketplace
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {suppliers.slice(0, 3).map((supplier) => (
                    <div key={supplier.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>{supplier.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{supplier.name}</p>
                          <p className="text-xs text-muted-foreground">{supplier.country}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Découvrir
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Performance des Fournisseurs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 border border-border rounded-lg flex items-center justify-center text-muted-foreground">
                    Graphique des performances (à implémenter)
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Évolution du Catalogue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 border border-border rounded-lg flex items-center justify-center text-muted-foreground">
                    Graphique de croissance (à implémenter)
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Marketplace;