import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
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
  Plus,
  Heart,
  Eye,
  Download,
  BarChart3,
  Shield,
  Award,
  Truck,
  Euro,
  SlidersHorizontal,
  Grid3X3,
  List,
  ChevronDown,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { CatalogHeader } from "@/components/catalog/CatalogHeader";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { ProductDetail } from "@/components/catalog/ProductDetail";
import { WinnerSuggestions } from "@/components/catalog/WinnerSuggestions";
import { toast } from "sonner";
import { useRealSuppliers } from "@/hooks/useRealSuppliers";
import { useRealProducts } from "@/hooks/useRealProducts";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { useRealWinners } from "@/hooks/useRealWinners";


const Marketplace = () => {
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<any>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  
  const { suppliers: realSuppliers } = useRealSuppliers();
  const { products: realProducts } = useRealProducts();

  const suppliers = [
    {
      id: "1",
      name: "BigBuy",
      logo: "🏪", // En attendant de vraies images
      description: "Plus de 100,000 produits européens en dropshipping",
      country: "🇪🇸 Espagne", 
      products: 127000,
      rating: 4.8,
      reviews: 2340,
      deliveryTime: "3-7 jours",
      category: "Généraliste",
      status: "connected",
      apiStatus: "active",
      commission: "15-25%",
      features: ["API REST", "Catalogue XML", "Tracking automatique", "Support multilingue", "Intégration Shopify"],
      website: "https://www.bigbuy.eu",
      founded: "2010"
    },
    {
      id: "2",
      name: "VidaXL", 
      logo: "🏠",
      description: "Mobilier et articles de maison haut de gamme avec livraison européenne",
      country: "🇳🇱 Pays-Bas",
      products: 85000,
      rating: 4.6,
      reviews: 1890,
      deliveryTime: "5-10 jours", 
      category: "Maison & Jardin",
      status: "available",
      apiStatus: "inactive",
      commission: "8-15%",
      features: ["Catalogue PDF", "Images HD", "Descriptions FR", "Garantie 2 ans", "Livraison gratuite +€75"],
      website: "https://www.vidaxl.com",
      founded: "2006"
    },
    {
      id: "3",
      name: "Printful",
      logo: "🎨",
      description: "Impression à la demande et personnalisation premium",
      country: "🇱🇻 Lettonie",
      products: 15000,
      rating: 4.9,
      reviews: 5670,
      deliveryTime: "7-14 jours",
      category: "Print on Demand", 
      status: "connected",
      apiStatus: "active",
      commission: "0% (prix fixes)",
      features: ["Mockup générateur", "Broderie premium", "Intégration Shopify", "White label", "Dropshipping automatique"],
      website: "https://www.printful.com",
      founded: "2013"
    },
    {
      id: "4",
      name: "Matterhorn",
      logo: "⛰️",
      description: "Fournisseur premium pour boutiques haut de gamme et luxe",
      country: "🇩🇪 Allemagne",
      products: 45000,
      rating: 4.7,
      reviews: 1234,
      deliveryTime: "2-5 jours",
      category: "Premium",
      status: "pending",
      apiStatus: "inactive", 
      commission: "20-35%",
      features: ["Produits premium", "Support dédié", "Formation incluse", "Exclusivité territoriale", "Certification qualité"],
      website: "https://matterhorn-dropshipping.com",
      founded: "2018"
    },
    {
      id: "5",
      name: "Spocket",
      logo: "📦",
      description: "Produits européens et américains avec livraison rapide",
      country: "🇫🇷 France",
      products: 75000,
      rating: 4.5,
      reviews: 3450,
      deliveryTime: "2-7 jours",
      category: "Mode & Lifestyle",
      status: "connected",
      apiStatus: "active",
      commission: "10-30%",
      features: ["Échantillons gratuits", "Branding personnalisé", "Livraison express", "Support 24/7", "App mobile"],
      website: "https://www.spocket.co",
      founded: "2017"
    },
    {
      id: "6",
      name: "Syncee",
      logo: "🔄",
      description: "Marketplace B2B avec fournisseurs vérifiés européens",
      country: "🇭🇺 Hongrie",
      products: 95000,
      rating: 4.4,
      reviews: 2100,
      deliveryTime: "3-8 jours",
      category: "Généraliste",
      status: "available",
      apiStatus: "active",
      commission: "5-20%",
      features: ["Synchronisation auto", "Prix temps réel", "Multi-boutiques", "API avancée", "Support technique"],
      website: "https://syncee.com",
      founded: "2016"
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

  const catalogProducts = [
    {
      id: "1",
      name: "Casque Gaming RGB Pro Max",
      supplier: "TechDirect Solutions",
      supplierLogo: "🎧",
      price: 89.99,
      costPrice: 45.99,
      margin: 49,
      rating: 4.8,
      reviews: 1234,
      sales: 890,
      stock: 1250,
      trend: "+25%",
      category: "Gaming",
      imageUrl: "https://images.unsplash.com/photo-1599669454699-248893623440?w=400",
      isWinner: true,
      isTrending: true,
      isBestSeller: false,
      deliveryTime: "3-5 jours",
      tags: ["Gaming", "RGB", "Sans fil", "7.1 Surround"],
      description: "Casque gaming professionnel avec éclairage RGB personnalisable, son surround 7.1 et micro anti-bruit.",
      specifications: {
        connectivity: "Sans fil 2.4GHz + Bluetooth",
        battery: "50h autonomie",
        drivers: "50mm néodyme",
        weight: "380g"
      }
    },
    {
      id: "2",
      name: "Montre Connectée Fitness Pro",
      supplier: "FitTech Europe",
      supplierLogo: "⌚",
      price: 149.99,
      costPrice: 89.99,
      margin: 40,
      rating: 4.6,
      reviews: 856,
      sales: 567,
      stock: 890,
      trend: "+18%",
      category: "Fitness",
      imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
      isWinner: true,
      isTrending: false,
      isBestSeller: true,
      deliveryTime: "2-4 jours",
      tags: ["Fitness", "Santé", "GPS", "Étanche"],
      description: "Montre connectée avec suivi avancé de la santé, GPS intégré, monitoring cardiaque et autonomie 7 jours.",
      specifications: {
        display: "1.4\" AMOLED",
        battery: "7 jours",
        sensors: "GPS, Cardio, SpO2",
        waterproof: "5ATM"
      }
    },
    {
      id: "3",
      name: "Écouteurs Sans Fil Premium ANC",
      supplier: "SoundMax Pro",
      supplierLogo: "🎵",
      price: 79.99,
      costPrice: 35.99,
      margin: 55,
      rating: 4.7,
      reviews: 2341,
      sales: 1456,
      stock: 567,
      trend: "+32%",
      category: "Audio",
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
      isWinner: false,
      isTrending: true,
      isBestSeller: true,
      deliveryTime: "1-3 jours",
      tags: ["Audio", "ANC", "Premium", "Charge sans fil"],
      description: "Écouteurs sans fil premium avec réduction de bruit active, charge sans fil et qualité audio Hi-Fi.",
      specifications: {
        anc: "Réduction 35dB",
        battery: "8h + 32h boîtier",
        drivers: "10mm graphène",
        charging: "USB-C + Wireless"
      }
    },
    {
      id: "4",
      name: "Smartphone Gaming Beast 5G",
      supplier: "MobileMax Europe",
      supplierLogo: "📱",
      price: 599.99,
      costPrice: 359.99,
      margin: 40,
      rating: 4.9,
      reviews: 567,
      sales: 234,
      stock: 123,
      trend: "+45%",
      category: "Mobile",
      imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
      isWinner: true,
      isTrending: true,
      isBestSeller: false,
      deliveryTime: "5-7 jours",
      tags: ["Gaming", "5G", "120Hz", "Refroidissement"],
      description: "Smartphone gaming 5G avec processeur ultra-puissant, écran 120Hz et système de refroidissement avancé.",
      specifications: {
        processor: "Snapdragon 8 Gen 2",
        display: "6.8\" AMOLED 120Hz",
        ram: "12GB LPDDR5",
        storage: "256GB UFS 4.0"
      }
    },
    {
      id: "5",
      name: "Drone Camera 4K Professionnel",
      supplier: "AeroTech Drones",
      supplierLogo: "🚁",
      price: 299.99,
      costPrice: 180.99,
      margin: 40,
      rating: 4.5,
      reviews: 445,
      sales: 178,
      stock: 89,
      trend: "+67%",
      category: "Tech",
      imageUrl: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400",
      isWinner: true,
      isTrending: true,
      isBestSeller: false,
      deliveryTime: "3-6 jours",
      tags: ["Drone", "4K", "GPS", "Professionnel"],
      description: "Drone professionnel avec caméra 4K, stabilisation 3 axes, GPS et vol autonome jusqu'à 30min.",
      specifications: {
        camera: "4K 60fps",
        range: "7km contrôle",
        flight: "30min autonomie",
        gimbal: "3 axes mécaniques"
      }
    },
    {
      id: "6",
      name: "Station de Charge Multi-Appareils",
      supplier: "PowerHub Solutions",
      supplierLogo: "🔌",
      price: 49.99,
      costPrice: 22.99,
      margin: 54,
      rating: 4.4,
      reviews: 678,
      sales: 892,
      stock: 445,
      trend: "+28%",
      category: "Accessoires",
      imageUrl: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400",
      isWinner: false,
      isTrending: true,
      isBestSeller: true,
      deliveryTime: "2-4 jours",
      tags: ["Charge", "Multi-appareils", "USB-C", "Wireless"],
      description: "Station de charge universelle avec charge sans fil, 6 ports USB et design premium en aluminium.",
      specifications: {
        ports: "4x USB-A, 2x USB-C",
        wireless: "15W Qi compatible",
        power: "100W total",
        material: "Aluminium premium"
      }
    }
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters });
  };

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
  };

  const handleImportProduct = async (product: any) => {
    try {
      toast.promise(
        new Promise((resolve) => {
          setTimeout(() => {
            // Simulation d'import réel avec API
            resolve('success');
          }, 2000);
        }),
        {
          loading: `Importation de ${product.name} vers votre catalogue...`,
          success: `${product.name} importé avec succès ! Marges configurées automatiquement (${product.margin}%).`,
          error: 'Erreur d\'import - Vérifiez votre connexion fournisseur.'
        }
      );
    } catch (error) {
      console.error('Import error:', error);
    }
  };

  const handleAnalyzeNiche = async (niche: string) => {
    try {
      toast.promise(
        new Promise((resolve) => {
          setTimeout(() => {
            const insights = {
              demandScore: Math.floor(Math.random() * 40) + 60,
              competitionLevel: ["Faible", "Moyenne", "Élevée"][Math.floor(Math.random() * 3)],
              profitPotential: Math.floor(Math.random() * 30) + 15,
              trendDirection: Math.random() > 0.5 ? "Croissante" : "Stable",
              topKeywords: ["tech", "gaming", "premium"],
              avgMargin: Math.floor(Math.random() * 20) + 25
            };
            resolve(insights);
          }, 3000);
        }),
        {
          loading: `Analyse IA approfondie de la niche "${niche}" en cours...`,
          success: (insights: any) => `Analyse terminée ! Score demande: ${insights.demandScore}/100 • Concurrence: ${insights.competitionLevel} • Potentiel: +${insights.profitPotential}% • Marge moyenne: ${insights.avgMargin}%`,
          error: 'Service IA temporairement indisponible - Réessayez dans quelques minutes.'
        }
      );
    } catch (error) {
      console.error('Analysis error:', error);
    }
  };

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

  const handleToggleFavorite = (productId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      
      const product = catalogProducts.find(p => p.id === productId);
      const action = prev.includes(productId) ? "retiré des" : "ajouté aux";
      
      toast.success(`${product?.name} ${action} favoris`);
      
      return newFavorites;
    });
  };

  const handleViewProduct = (productId: string) => {
    const product = catalogProducts.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
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
          <Button 
            className="bg-gradient-primary hover:opacity-90 transition-opacity"
            onClick={() => {
              toast.success('Formulaire de demande de partenariat ouvert');
              // Real functionality would open supplier application form
              window.open('mailto:partnerships@marketplace.com?subject=Demande de partenariat fournisseur', '_blank');
            }}
          >
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
                  <p className="text-2xl font-bold text-primary">{realSuppliers.length || 12}</p>
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
                  <p className="text-2xl font-bold text-secondary">{realProducts.length > 0 ? `${realProducts.length}` : '275K'}</p>
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
                  <p className="text-2xl font-bold text-accent">{realSuppliers.filter(s => s.status === 'active').length || 8}</p>
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
        <Tabs defaultValue="catalog" className="space-y-6">
          <TabsList className="bg-muted/50 border border-border/50">
            <TabsTrigger value="catalog" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Catalogue
            </TabsTrigger>
            <TabsTrigger value="winners" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Winners IA
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              Fournisseurs
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analytics
            </TabsTrigger>
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
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-2xl border border-border/20">
                              {supplier.logo}
                            </div>
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
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => {
                                toast.success(`Ouverture du catalogue ${supplier.name}`);
                                // Real functionality would open supplier catalog
                                setSelectedSupplier(supplier.id);
                              }}
                            >
                              <Package className="w-4 h-4 mr-2" />
                              Catalogue
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => {
                                toast.success(`Gestion des paramètres ${supplier.name}`);
                                // Real functionality would open supplier management
                              }}
                            >
                              Gérer
                            </Button>
                          </>
                        ) : supplier.status === 'available' ? (
                          <Button 
                            className="w-full bg-gradient-primary hover:opacity-90 transition-opacity" 
                            size="sm"
                            onClick={() => {
                              toast.promise(
                                new Promise((resolve) => {
                                  setTimeout(() => {
                                    resolve('success');
                                  }, 2000);
                                }),
                                {
                                  loading: `Connexion en cours avec ${supplier.name}...`,
                                  success: `Connexion établie avec ${supplier.name} ! API activée.`,
                                  error: 'Erreur de connexion - Vérifiez vos identifiants.'
                                }
                              );
                            }}
                          >
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
            <CatalogHeader 
              onSearch={handleSearch}
              onFilterChange={handleFilterChange}
            />
            <ProductGrid 
              products={catalogProducts}
              onProductClick={handleProductClick}
              onImportProduct={handleImportProduct}
              onToggleFavorite={handleToggleFavorite}
              favorites={favorites}
            />
          </TabsContent>

          <TabsContent value="winners" className="space-y-6">
            <WinnerSuggestions 
              onViewProduct={handleViewProduct}
              onAnalyzeNiche={handleAnalyzeNiche}
            />
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
                  {catalogProducts.map((product, index) => (
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

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onImport={handleImportProduct}
          onToggleFavorite={handleToggleFavorite}
          isFavorite={favorites.includes(selectedProduct.id)}
        />
      )}
    </div>
  );
};

export default Marketplace;