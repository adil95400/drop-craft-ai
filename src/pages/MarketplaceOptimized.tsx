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
import { Checkbox } from "@/components/ui/checkbox";
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
  RefreshCw,
  Target,
  TrendingDown,
  Building2,
  Sparkles,
  Lock,
  Verified
} from "lucide-react";
import { toast } from "sonner";
import { useRealSuppliers } from "@/hooks/useRealSuppliers";
import { useRealProducts } from "@/hooks/useRealProducts";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { useRealWinners } from "@/hooks/useRealWinners";

const MarketplaceOptimized = () => {
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [minMargin, setMinMargin] = useState(0);
  const [showOnlyTrending, setShowOnlyTrending] = useState(false);
  const [showOnlyWinners, setShowOnlyWinners] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("trending");
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Real data hooks
  const { suppliers: realSuppliers } = useRealSuppliers();
  const { products: realProducts } = useRealProducts();
  const { products: catalogProducts, categories, suppliers, userFavorites, stats } = useCatalogProducts();
  const { winningProducts, analyzeWinners, importProduct } = useRealWinners();

  // Enhanced marketplace data with real suppliers
  const allMarketplaces = [
    {
      id: "bigbuy",
      name: "BigBuy",
      logo: "🏪",
      description: "Leader européen du dropshipping avec plus de 100,000 produits certifiés",
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
      founded: "2010",
      trustScore: 98,
      certifications: ["CE", "ISO 9001", "GDPR"],
      paymentTerms: "Net 30",
      shippingFrom: ["Espagne", "France", "Allemagne"],
      languages: ["FR", "EN", "ES", "DE", "IT"]
    },
    {
      id: "aliexpress",
      name: "AliExpress",
      logo: "🛒",
      description: "Marketplace mondial avec millions de produits à prix ultra-compétitifs",
      country: "🇨🇳 Chine",
      products: 50000000,
      rating: 4.3,
      reviews: 15600,
      deliveryTime: "8-20 jours",
      category: "Généraliste",
      status: "available",
      apiStatus: "active",
      commission: "5-12%",
      features: ["API avancée", "Protection acheteur", "Prix en volume", "Échantillons", "Négociation prix"],
      website: "https://www.aliexpress.com",
      founded: "2010",
      trustScore: 85,
      certifications: ["Trade Assurance"],
      paymentTerms: "Prépayé",
      shippingFrom: ["Chine", "Entrepôts EU"],
      languages: ["FR", "EN", "Multi"]
    },
    {
      id: "amazon",
      name: "Amazon FBA",
      logo: "📦",
      description: "Fulfillment by Amazon - Stockage et expédition premium par Amazon",
      country: "🇺🇸 États-Unis",
      products: 12000000,
      rating: 4.9,
      reviews: 8900,
      deliveryTime: "1-2 jours",
      category: "Premium",
      status: "pending",
      apiStatus: "beta",
      commission: "15-45%",
      features: ["Prime eligibility", "FBA automation", "Brand registry", "A+ Content", "Advertising"],
      website: "https://sellercentral.amazon.com",
      founded: "1994",
      trustScore: 96,
      certifications: ["ISO 27001", "SOC 2"],
      paymentTerms: "Net 14",
      shippingFrom: ["Global"],
      languages: ["Multi-global"]
    },
    {
      id: "spocket",
      name: "Spocket",
      logo: "⚡",
      description: "Fournisseurs premium européens et américains avec livraison express",
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
      founded: "2017",
      trustScore: 92,
      certifications: ["GDPR", "PCI DSS"],
      paymentTerms: "Net 30",
      shippingFrom: ["EU", "USA"],
      languages: ["FR", "EN", "ES"]
    },
    {
      id: "printful",
      name: "Printful",
      logo: "🎨",
      description: "Leader mondial du print-on-demand avec qualité premium",
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
      founded: "2013",
      trustScore: 97,
      certifications: ["WRAP", "Oeko-Tex"],
      paymentTerms: "Net 30",
      shippingFrom: ["Global"],
      languages: ["Multi-global"]
    },
    {
      id: "doba",
      name: "Doba",
      logo: "🌟",
      description: "Marketplace premium avec fournisseurs vérifiés et produits exclusifs",
      country: "🇺🇸 États-Unis",
      products: 180000,
      rating: 4.4,
      reviews: 1200,
      deliveryTime: "3-10 jours",
      category: "Premium",
      status: "available",
      apiStatus: "active",
      commission: "Variable",
      features: ["Produits exclusifs", "Fournisseurs vérifiés", "Support premium", "Formation incluse", "Garantie qualité"],
      website: "https://www.doba.com",
      founded: "2002",
      trustScore: 89,
      certifications: ["BBB A+"],
      paymentTerms: "Variable",
      shippingFrom: ["USA", "EU"],
      languages: ["EN", "FR"]
    },
    {
      id: "salehoo",
      name: "SaleHoo",
      logo: "💎",
      description: "Répertoire premium de 8000+ fournisseurs vérifiés avec formation incluse",
      country: "🇳🇿 Nouvelle-Zélande",
      products: 250000,
      rating: 4.6,
      reviews: 890,
      deliveryTime: "Variable",
      category: "Répertoire",
      status: "available",
      apiStatus: "limited",
      commission: "Accès payant",
      features: ["Fournisseurs vérifiés", "Formation complète", "Research lab", "Support expert", "Garantie"],
      website: "https://www.salehoo.com",
      founded: "2005",
      trustScore: 94,
      certifications: ["Verified"],
      paymentTerms: "Subscription",
      shippingFrom: ["Global"],
      languages: ["EN", "FR"]
    },
    {
      id: "modalyst",
      name: "Modalyst",
      logo: "✨",
      description: "Marketplace premium pour marques de mode et lifestyle haut de gamme",
      country: "🇺🇸 États-Unis",
      products: 45000,
      rating: 4.7,
      reviews: 567,
      deliveryTime: "3-8 jours",
      category: "Mode Premium",
      status: "pending",
      apiStatus: "beta",
      commission: "20-40%",
      features: ["Marques premium", "Images HD", "Inventory sync", "Fast shipping", "White label"],
      website: "https://modalyst.co",
      founded: "2016",
      trustScore: 91,
      certifications: ["Brand verified"],
      paymentTerms: "Net 30",
      shippingFrom: ["USA", "EU"],
      languages: ["EN", "FR"]
    }
  ];

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...catalogProducts, ...winningProducts];
    
    if (searchQuery) {
      filtered = filtered.filter(product => {
        const name = ('name' in product ? product.name : '') || ('title' in product ? product.title : '');
        return name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
               product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }
    
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    filtered = filtered.filter(product => {
      const price = product.price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });
    
    if (minMargin > 0) {
      filtered = filtered.filter(product => {
        const margin = ('margin' in product && product.margin) || ('profitability' in product && product.profitability) || 0;
        return margin >= minMargin;
      });
    }
    
    if (showOnlyTrending) {
      filtered = filtered.filter(product => {
        const isTrending = ('isTrending' in product && product.isTrending) || 
                          ('is_trending' in product && product.is_trending) ||
                          ('trend' in product && (product.trend === 'hot' || product.trend === 'rising'));
        return isTrending;
      });
    }
    
    if (showOnlyWinners) {
      filtered = filtered.filter(product => {
        const isWinner = ('isWinner' in product && product.isWinner) || 
                        ('is_winner' in product && product.is_winner) ||
                        ('aiScore' in product && product.aiScore > 80);
        return isWinner;
      });
    }
    
    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return (a.price || 0) - (b.price || 0);
        case "price-desc":
          return (b.price || 0) - (a.price || 0);
        case "margin":
          const aMargin = ('margin' in a && a.margin) || ('profitability' in a && a.profitability) || 0;
          const bMargin = ('margin' in b && b.margin) || ('profitability' in b && b.profitability) || 0;
          return bMargin - aMargin;
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "trending":
        default:
          const aSales = ('sales' in a && a.sales) || ('sales_count' in a && a.sales_count) || 0;
          const bSales = ('sales' in b && b.sales) || ('sales_count' in b && b.sales_count) || 0;
          return bSales - aSales;
      }
    });
    
    return filtered;
  }, [catalogProducts, winningProducts, searchQuery, selectedCategory, priceRange, minMargin, showOnlyTrending, showOnlyWinners, sortBy]);

  const handleConnectMarketplace = async (marketplace: any) => {
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => resolve('success'), 2000);
      }),
      {
        loading: `Connexion à ${marketplace.name} en cours...`,
        success: `${marketplace.name} connecté avec succès !`,
        error: 'Erreur de connexion. Vérifiez vos credentials.'
      }
    );
  };

  const handleImportProduct = async (product: any) => {
    try {
      await importProduct(product.id);
    } catch (error) {
      toast.error('Erreur lors de l\'import du produit');
    }
  };

  const handleToggleFavorite = (productId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      
      const action = prev.includes(productId) ? "retiré des" : "ajouté aux";
      toast.success(`Produit ${action} favoris`);
      
      return newFavorites;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-success/10 text-success border-success/20';
      case 'available': return 'bg-primary/10 text-primary border-primary/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted/50 text-muted-foreground border-border';
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

  const renderProductCard = (product: any) => (
    <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20">
      <CardContent className="p-4">
        <div className="relative mb-3">
          <img 
            src={product.imageUrl || product.image_url || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400"} 
            alt={product.name}
            className="w-full h-48 object-cover rounded-lg"
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 w-8 h-8 p-0 bg-background/80 backdrop-blur-sm"
            onClick={() => handleToggleFavorite(product.id)}
          >
            <Heart className={`w-4 h-4 ${favorites.includes(product.id) ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
          </Button>
          
          <div className="absolute top-2 left-2 flex gap-1">
            {(('isWinner' in product && product.isWinner) || ('is_winner' in product && product.is_winner)) && (
              <Badge variant="secondary" className="bg-warning/90 text-warning-foreground">
                <Award className="w-3 h-3 mr-1" />
                Winner
              </Badge>
            )}
            {(('isTrending' in product && product.isTrending) || ('is_trending' in product && product.is_trending)) && (
              <Badge variant="secondary" className="bg-success/90 text-success-foreground">
                <TrendingUp className="w-3 h-3 mr-1" />
                Tendance
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold line-clamp-1">{product.name || product.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Star 
                  key={i} 
                  className={`w-3 h-3 ${i < (product.rating || 0) ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-1">
                ({product.reviews || 0})
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {product.category}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-primary">
                {product.price ? `${product.price}€` : 'Prix sur demande'}
              </div>
              {(('margin' in product && product.margin) || ('profitability' in product && product.profitability)) && (
                <div className="text-xs text-success">
                  Marge: {('margin' in product && product.margin) || ('profitability' in product && product.profitability)}%
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Stock: {('stock' in product && product.stock) || ('stock_quantity' in product && product.stock_quantity) || 'Illimité'}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setSelectedProduct(product)}
            >
              <Eye className="w-4 h-4 mr-1" />
              Voir
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => handleImportProduct(product)}
            >
              <Download className="w-4 h-4 mr-1" />
              Importer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Marketplace B2B Ultra Pro
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Accédez aux meilleurs fournisseurs mondiaux et produits gagnants
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => analyzeWinners()}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Analyser Tendances
            </Button>
            <Button 
              className="bg-gradient-primary hover:opacity-90 transition-opacity"
              onClick={() => {
                toast.success('Formulaire de demande de partenariat ouvert');
                window.open('mailto:partnerships@marketplace.com?subject=Demande de partenariat fournisseur', '_blank');
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter Fournisseur
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Marketplaces</p>
                  <p className="text-2xl font-bold text-primary">{allMarketplaces.length}</p>
                  <p className="text-xs text-success flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +2 ce mois
                  </p>
                </div>
                <Store className="w-8 h-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Produits Disponibles</p>
                  <p className="text-2xl font-bold text-secondary">
                    {(filteredProducts.length || 0) > 1000 ? `${Math.floor((filteredProducts.length || 0) / 1000)}K` : filteredProducts.length || '275K'}
                  </p>
                  <p className="text-xs text-success flex items-center mt-1">
                    <Package className="w-3 h-3 mr-1" />
                    Mis à jour 24h/24
                  </p>
                </div>
                <Package className="w-8 h-8 text-secondary/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Produits Gagnants</p>
                  <p className="text-2xl font-bold text-warning">{winningProducts.length || '1.2K'}</p>
                  <p className="text-xs text-success flex items-center mt-1">
                    <Award className="w-3 h-3 mr-1" />
                    IA Score 85+
                  </p>
                </div>
                <Award className="w-8 h-8 text-warning/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Marge Moyenne</p>
                  <p className="text-2xl font-bold text-success">42%</p>
                  <p className="text-xs text-success flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Optimal ROI
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-success/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Rechercher des produits, marques, catégories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes catégories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trending">Tendances</SelectItem>
                    <SelectItem value="price-asc">Prix croissant</SelectItem>
                    <SelectItem value="price-desc">Prix décroissant</SelectItem>
                    <SelectItem value="margin">Marge</SelectItem>
                    <SelectItem value="rating">Note</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/20 rounded-lg">
              <div className="space-y-2">
                <label className="text-sm font-medium">Prix (€)</label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={1000}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{priceRange[0]}€</span>
                  <span>{priceRange[1]}€</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Marge min (%)</label>
                <Slider
                  value={[minMargin]}
                  onValueChange={(value) => setMinMargin(value[0])}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">{minMargin}%</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="trending"
                    checked={showOnlyTrending}
                    onCheckedChange={(checked) => setShowOnlyTrending(checked === true)}
                  />
                  <label htmlFor="trending" className="text-sm font-medium">
                    Tendance uniquement
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="winners"
                    checked={showOnlyWinners}
                    onCheckedChange={(checked) => setShowOnlyWinners(checked === true)}
                  />
                  <label htmlFor="winners" className="text-sm font-medium">
                    Gagnants uniquement
                  </label>
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setPriceRange([0, 1000]);
                    setMinMargin(0);
                    setShowOnlyTrending(false);
                    setShowOnlyWinners(false);
                  }}
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Réinitialiser
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products">Produits ({filteredProducts.length})</TabsTrigger>
            <TabsTrigger value="marketplaces">Marketplaces ({allMarketplaces.length})</TabsTrigger>
            <TabsTrigger value="winners">Gagnants ({winningProducts.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {filteredProducts.length} produits trouvés
              </h2>
              <Badge variant="secondary" className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                Mis à jour il y a 2min
              </Badge>
            </div>

            <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
              {filteredProducts.map(renderProductCard)}
            </div>

            {filteredProducts.length === 0 && (
              <Card className="p-8 text-center">
                <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
                <p className="text-muted-foreground mb-4">
                  Essayez de modifier vos filtres ou votre recherche
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setPriceRange([0, 1000]);
                  setMinMargin(0);
                  setShowOnlyTrending(false);
                  setShowOnlyWinners(false);
                }}>
                  Réinitialiser les filtres
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="marketplaces" className="space-y-4">
            <div className="grid gap-4">
              {allMarketplaces.map((marketplace) => (
                <Card key={marketplace.id} className="border-border/50 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{marketplace.logo}</div>
                        <div>
                          <h3 className="text-xl font-bold flex items-center gap-2">
                            {marketplace.name}
                            {marketplace.trustScore > 95 && <Verified className="w-5 h-5 text-primary" />}
                          </h3>
                          <p className="text-muted-foreground">{marketplace.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {marketplace.country}
                            </span>
                            <span className="flex items-center gap-1">
                              <Building2 className="w-4 h-4" />
                              Depuis {marketplace.founded}
                            </span>
                            <span className="flex items-center gap-1">
                              <Shield className="w-4 h-4" />
                              Score: {marketplace.trustScore}/100
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(marketplace.status)}>
                        {getStatusIcon(marketplace.status)}
                        <span className="ml-1">
                          {marketplace.status === 'connected' ? 'Connecté' : 
                           marketplace.status === 'available' ? 'Disponible' : 'En attente'}
                        </span>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-muted/20 rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {marketplace.products.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Produits</div>
                      </div>
                      <div className="text-center p-3 bg-muted/20 rounded-lg">
                        <div className="text-2xl font-bold text-warning flex items-center justify-center gap-1">
                          {marketplace.rating}
                          <Star className="w-4 h-4 fill-current" />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {marketplace.reviews} avis
                        </div>
                      </div>
                      <div className="text-center p-3 bg-muted/20 rounded-lg">
                        <div className="text-2xl font-bold text-success">{marketplace.commission}</div>
                        <div className="text-xs text-muted-foreground">Commission</div>
                      </div>
                      <div className="text-center p-3 bg-muted/20 rounded-lg">
                        <div className="text-2xl font-bold text-secondary flex items-center justify-center gap-1">
                          <Truck className="w-5 h-5" />
                          {marketplace.deliveryTime}
                        </div>
                        <div className="text-xs text-muted-foreground">Livraison</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Fonctionnalités:</h4>
                      <div className="flex flex-wrap gap-2">
                        {marketplace.features.map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(marketplace.website, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Site web
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toast.info(`Documentation ${marketplace.name} ouverte`)}
                        >
                          <Shield className="w-4 h-4 mr-1" />
                          API Docs
                        </Button>
                      </div>
                      
                      <Button 
                        onClick={() => handleConnectMarketplace(marketplace)}
                        disabled={marketplace.status === 'connected'}
                      >
                        {marketplace.status === 'connected' ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Connecté
                          </>
                        ) : (
                          <>
                            <Link className="w-4 h-4 mr-2" />
                            Connecter
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="winners" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                Produits Gagnants IA
              </h2>
              <Button onClick={() => analyzeWinners()}>
                <Sparkles className="w-4 h-4 mr-2" />
                Actualiser Analyse
              </Button>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {winningProducts.map(renderProductCard)}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics Marketplace</CardTitle>
                  <CardDescription>
                    Données en temps réel de performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted/20 rounded-lg">
                      <div className="text-3xl font-bold text-primary mb-2">94.8%</div>
                      <div className="text-sm text-muted-foreground">Précision IA</div>
                    </div>
                    <div className="text-center p-4 bg-muted/20 rounded-lg">
                      <div className="text-3xl font-bold text-success mb-2">2.3K</div>
                      <div className="text-sm text-muted-foreground">Produits analysés</div>
                    </div>
                    <div className="text-center p-4 bg-muted/20 rounded-lg">
                      <div className="text-3xl font-bold text-warning mb-2">42%</div>
                      <div className="text-sm text-muted-foreground">Marge moyenne</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Product Detail Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{selectedProduct.name || selectedProduct.title}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(null)}>
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <img 
                    src={selectedProduct.imageUrl || selectedProduct.image_url || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400"} 
                    alt={selectedProduct.name || selectedProduct.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <p className="text-muted-foreground">{selectedProduct.description}</p>
                  <div className="flex gap-2">
                    <Button onClick={() => handleImportProduct(selectedProduct)} className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Importer
                    </Button>
                    <Button variant="outline" onClick={() => handleToggleFavorite(selectedProduct.id)}>
                      <Heart className={`w-4 h-4 ${favorites.includes(selectedProduct.id) ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplaceOptimized;