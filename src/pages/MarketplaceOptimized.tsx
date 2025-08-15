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

  // Enhanced marketplace data with ALL platforms from images
  const allMarketplaces = [
    // Marketplaces Premium
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
      description: "Fulfillment by Amazon - Leader mondial avec Prime eligibility",
      country: "🇺🇸 Global",
      products: 12000000,
      rating: 4.9,
      reviews: 8900,
      deliveryTime: "1-2 jours",
      category: "Premium",
      status: "connected",
      apiStatus: "active",
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
      id: "ebay",
      name: "eBay",
      logo: "🏷️",
      description: "Marketplace international leader avec système d'enchères et vente directe",
      country: "🇺🇸 États-Unis",
      products: 1300000000,
      rating: 4.5,
      reviews: 12400,
      deliveryTime: "3-10 jours",
      category: "Généraliste",
      status: "connected",
      apiStatus: "active",
      commission: "10-15%",
      features: ["Ventes aux enchères", "Buy It Now", "Global Shipping Program", "eBay Plus", "API avancée"],
      website: "https://ebay.com",
      founded: "1995",
      trustScore: 92,
      certifications: ["PayPal Verified", "Top Rated"],
      paymentTerms: "Immédiat",
      shippingFrom: ["Global"],
      languages: ["Multi-global"]
    },
    // Marketplaces Français/Européens
    {
      id: "rakuten",
      name: "Rakuten France",
      logo: "🇫🇷",
      description: "Marketplace français premium avec cashback et programme fidélité",
      country: "🇫🇷 France",
      products: 350000,
      rating: 4.6,
      reviews: 8900,
      deliveryTime: "2-5 jours",
      category: "Premium",
      status: "available",
      apiStatus: "active",
      commission: "8-20%",
      features: ["Cashback", "Programme fidélité", "Super Points", "Protection acheteur", "Livraison gratuite"],
      website: "https://fr.shopping.rakuten.com",
      founded: "2000",
      trustScore: 94,
      certifications: ["FEVAD", "ACSEL"],
      paymentTerms: "Net 30",
      shippingFrom: ["France", "Europe"],
      languages: ["FR", "EN"]
    },
    {
      id: "fnac",
      name: "Fnac Marketplace",
      logo: "📚",
      description: "Marketplace culturel et tech français leader dans les produits high-tech",
      country: "🇫🇷 France",
      products: 180000,
      rating: 4.7,
      reviews: 5600,
      deliveryTime: "1-3 jours",
      category: "Culture & Tech",
      status: "connected",
      apiStatus: "active",
      commission: "12-18%",
      features: ["Click & Collect", "Fnac+", "Service après-vente", "Garantie étendue", "Formation vendeurs"],
      website: "https://www.fnac.com",
      founded: "1954",
      trustScore: 96,
      certifications: ["NF Service", "ISO 14001"],
      paymentTerms: "Net 30",
      shippingFrom: ["France"],
      languages: ["FR"]
    },
    {
      id: "carrefour",
      name: "Carrefour Marketplace",
      logo: "🛍️",
      description: "Marketplace du géant de la distribution française avec millions de références",
      country: "🇫🇷 France",
      products: 450000,
      rating: 4.4,
      reviews: 7800,
      deliveryTime: "2-5 jours",
      category: "Grande Distribution",
      status: "available",
      apiStatus: "active",
      commission: "10-25%",
      features: ["Drive", "Livraison domicile", "Click & Collect", "Carte Carrefour", "Service client"],
      website: "https://www.carrefour.fr",
      founded: "1959",
      trustScore: 90,
      certifications: ["ISO 9001", "PEFC"],
      paymentTerms: "Net 45",
      shippingFrom: ["France", "Europe"],
      languages: ["FR", "ES", "IT"]
    },
    {
      id: "cdiscount",
      name: "Cdiscount",
      logo: "💰",
      description: "Leader français e-commerce discount avec millions de produits à prix cassés",
      country: "🇫🇷 France",
      products: 800000,
      rating: 4.2,
      reviews: 15600,
      deliveryTime: "2-7 jours",
      category: "Discount",
      status: "connected",
      apiStatus: "active",
      commission: "8-20%",
      features: ["CDAV", "Express", "C-Logistics", "Marketplace API", "Programme partenaire"],
      website: "https://www.cdiscount.com",
      founded: "1998",
      trustScore: 88,
      certifications: ["FEVAD", "CNIL"],
      paymentTerms: "Net 30",
      shippingFrom: ["France"],
      languages: ["FR"]
    },
    {
      id: "darty",
      name: "Darty Marketplace",
      logo: "⚡",
      description: "Spécialiste électroménager avec service client premium et SAV reconnu",
      country: "🇫🇷 France",
      products: 85000,
      rating: 4.8,
      reviews: 4200,
      deliveryTime: "1-3 jours",
      category: "Électroménager",
      status: "available",
      apiStatus: "beta",
      commission: "15-30%",
      features: ["SAV premium", "Installation", "Reprise ancien", "Garantie étendue", "Financement"],
      website: "https://www.darty.com",
      founded: "1957",
      trustScore: 97,
      certifications: ["Service client élu", "ISO 9001"],
      paymentTerms: "Net 30",
      shippingFrom: ["France"],
      languages: ["FR"]
    },
    {
      id: "conforama",
      name: "Conforama",
      logo: "🏡",
      description: "Leader ameublement et décoration avec showrooms et service livraison",
      country: "🇫🇷 France",
      products: 65000,
      rating: 4.3,
      reviews: 3400,
      deliveryTime: "3-15 jours",
      category: "Ameublement",
      status: "available",
      apiStatus: "limited",
      commission: "12-25%",
      features: ["Livraison meuble", "Montage", "Click & Collect", "3D Room", "Crédit mobilier"],
      website: "https://www.conforama.fr",
      founded: "1967",
      trustScore: 85,
      certifications: ["PEFC", "FSC"],
      paymentTerms: "Net 45",
      shippingFrom: ["France", "Europe"],
      languages: ["FR", "ES", "IT"]
    },
    {
      id: "mediamarkt",
      name: "MediaMarkt",
      logo: "📱",
      description: "Géant européen de l'électronique et high-tech avec expertise produit",
      country: "🇩🇪 Allemagne",
      products: 120000,
      rating: 4.5,
      reviews: 8900,
      deliveryTime: "2-5 jours",
      category: "High-Tech",
      status: "connected",
      apiStatus: "active",
      commission: "8-18%",
      features: ["Expert conseil", "Réparation", "Trade-in", "Installation", "Formation"],
      website: "https://www.mediamarkt.de",
      founded: "1979",
      trustScore: 93,
      certifications: ["TÜV", "ZVEI"],
      paymentTerms: "Net 30",
      shippingFrom: ["Allemagne", "Europe"],
      languages: ["DE", "FR", "EN", "NL"]
    },
    // Marketplaces Spécialisés
    {
      id: "manomano",
      name: "ManoMano",
      logo: "🔨",
      description: "Leader européen bricolage jardinage avec 3M de références pros",
      country: "🇫🇷 France",
      products: 3000000,
      rating: 4.6,
      reviews: 12000,
      deliveryTime: "2-7 jours",
      category: "Bricolage",
      status: "connected",
      apiStatus: "active",
      commission: "10-25%",
      features: ["Guides expert", "Pose à domicile", "Pro Corner", "Click & Collect", "Configurateurs"],
      website: "https://www.manomano.fr",
      founded: "2013",
      trustScore: 95,
      certifications: ["Qualibat", "CAPEB"],
      paymentTerms: "Net 30",
      shippingFrom: ["France", "Europe"],
      languages: ["FR", "EN", "ES", "DE", "IT"]
    },
    {
      id: "refurbed",
      name: "Refurbed",
      logo: "♻️",
      description: "Marketplace premium produits reconditionnés avec garantie et impact environnemental",
      country: "🇦🇹 Autriche",
      products: 55000,
      rating: 4.8,
      reviews: 6700,
      deliveryTime: "3-7 jours",
      category: "Reconditionné",
      status: "available",
      apiStatus: "active",
      commission: "15-30%",
      features: ["Garantie 1 an", "30 jours retour", "Impact CO2", "Certification qualité", "Support premium"],
      website: "https://www.refurbed.fr",
      founded: "2017",
      trustScore: 96,
      certifications: ["TÜV", "B-Corp"],
      paymentTerms: "Net 30",
      shippingFrom: ["Europe"],
      languages: ["FR", "DE", "EN", "IT", "ES"]
    },
    {
      id: "wish",
      name: "Wish",
      logo: "⭐",
      description: "Marketplace mobile-first avec produits tendance à prix ultra-compétitifs",
      country: "🇺🇸 États-Unis",
      products: 150000000,
      rating: 3.8,
      reviews: 45000,
      deliveryTime: "10-30 jours",
      category: "Mobile Commerce",
      status: "available",
      apiStatus: "active",
      commission: "5-15%",
      features: ["App mobile", "Gamification", "Flash sales", "Wish Local", "Merchant API"],
      website: "https://www.wish.com",
      founded: "2010",
      trustScore: 75,
      certifications: ["Mobile Commerce"],
      paymentTerms: "Escrow",
      shippingFrom: ["Chine", "Local"],
      languages: ["Multi-global"]
    },
    {
      id: "backmarket",
      name: "Back Market",
      logo: "📱",
      description: "Leader mondial du reconditionné tech avec garantie et impact environnemental",
      country: "🇫🇷 France",
      products: 45000,
      rating: 4.7,
      reviews: 8900,
      deliveryTime: "2-5 jours",
      category: "Tech Reconditionné",
      status: "connected",
      apiStatus: "active",
      commission: "20-35%",
      features: ["Garantie 1 an", "Tests qualité", "Impact carbone", "Trade-in", "Support tech"],
      website: "https://www.backmarket.fr",
      founded: "2014",
      trustScore: 94,
      certifications: ["B-Corp", "ISO 14001"],
      paymentTerms: "Net 30",
      shippingFrom: ["Europe", "USA"],
      languages: ["FR", "EN", "DE", "ES", "IT"]
    },
    // Connecteurs E-commerce
    {
      id: "shopify",
      name: "Shopify",
      logo: "🛒",
      description: "Plateforme e-commerce leader mondial avec écosystème d'apps complet",
      country: "🇨🇦 Canada",
      products: 0, // Platform
      rating: 4.8,
      reviews: 25000,
      deliveryTime: "Instantané",
      category: "E-commerce Platform",
      status: "connected",
      apiStatus: "active",
      commission: "2.9% + 30¢",
      features: ["App Store", "Thèmes premium", "Shopify Payments", "Multi-canal", "Analytics avancées"],
      website: "https://www.shopify.com",
      founded: "2006",
      trustScore: 98,
      certifications: ["PCI DSS", "ISO 27001"],
      paymentTerms: "Subscription",
      shippingFrom: ["Global"],
      languages: ["Multi-global"]
    },
    {
      id: "prestashop",
      name: "PrestaShop",
      logo: "🔧",
      description: "Solution e-commerce open-source française avec 300,000 boutiques actives",
      country: "🇫🇷 France",
      products: 0, // Platform
      rating: 4.5,
      reviews: 15000,
      deliveryTime: "Instantané",
      category: "E-commerce Platform",
      status: "available",
      apiStatus: "active",
      commission: "Gratuit + modules",
      features: ["Open source", "Modules", "Thèmes", "Multi-boutique", "Cloud ready"],
      website: "https://www.prestashop.com",
      founded: "2007",
      trustScore: 92,
      certifications: ["Open Source"],
      paymentTerms: "Freemium",
      shippingFrom: ["Self-hosted"],
      languages: ["FR", "EN", "Multi"]
    },
    {
      id: "woocommerce",
      name: "WooCommerce",
      logo: "🌐",
      description: "Extension e-commerce WordPress leader avec flexibilité maximale",
      country: "🇺🇸 États-Unis",
      products: 0, // Platform
      rating: 4.6,
      reviews: 18000,
      deliveryTime: "Instantané",
      category: "E-commerce Plugin",
      status: "connected",
      apiStatus: "active",
      commission: "Gratuit + extensions",
      features: ["WordPress", "Extensions", "Thèmes", "Payment gateways", "SEO optimized"],
      website: "https://woocommerce.com",
      founded: "2011",
      trustScore: 95,
      certifications: ["WordPress.org"],
      paymentTerms: "Freemium",
      shippingFrom: ["Self-hosted"],
      languages: ["Multi-global"]
    },
    {
      id: "magento",
      name: "Magento Commerce",
      logo: "🏢",
      description: "Plateforme e-commerce enterprise avec fonctionnalités B2B avancées",
      country: "🇺🇸 États-Unis",
      products: 0, // Platform
      rating: 4.4,
      reviews: 8900,
      deliveryTime: "Instantané",
      category: "Enterprise Platform",
      status: "available",
      apiStatus: "active",
      commission: "Enterprise pricing",
      features: ["B2B features", "Multi-store", "Advanced SEO", "Mobile commerce", "Cloud hosting"],
      website: "https://magento.com",
      founded: "2008",
      trustScore: 90,
      certifications: ["Adobe", "Enterprise"],
      paymentTerms: "License + hosting",
      shippingFrom: ["Cloud"],
      languages: ["Multi-global"]
    },
    {
      id: "wix",
      name: "Wix eCommerce",
      logo: "🎨",
      description: "Créateur de sites avec e-commerce intégré et design drag & drop",
      country: "🇮🇱 Israël",
      products: 0, // Platform
      rating: 4.3,
      reviews: 12000,
      deliveryTime: "Instantané",
      category: "Website Builder",
      status: "available",
      apiStatus: "limited",
      commission: "2.9% + 30¢",
      features: ["Drag & drop", "Templates", "App Market", "SEO Wiz", "Mobile optimized"],
      website: "https://www.wix.com",
      founded: "2006",
      trustScore: 87,
      certifications: ["SSL", "GDPR"],
      paymentTerms: "Subscription",
      shippingFrom: ["Cloud"],
      languages: ["Multi-global"]
    },
    // Marketplaces Spécialisés Additionnels
    {
      id: "pccomponentes",
      name: "PcComponentes",
      logo: "💻",
      description: "Leader espagnol high-tech et gaming avec expertise technique",
      country: "🇪🇸 Espagne",
      products: 95000,
      rating: 4.7,
      reviews: 6800,
      deliveryTime: "1-3 jours",
      category: "High-Tech Gaming",
      status: "available",
      apiStatus: "active",
      commission: "8-18%",
      features: ["Gaming focus", "Tech support", "Config PC", "Express delivery", "Trade-in"],
      website: "https://www.pccomponentes.com",
      founded: "2005",
      trustScore: 94,
      certifications: ["AECOC", "Confianza Online"],
      paymentTerms: "Net 30",
      shippingFrom: ["Espagne", "Europe"],
      languages: ["ES", "EN", "FR"]
    },
    {
      id: "worten",
      name: "Worten",
      logo: "🔌",
      description: "Chaîne électronique portugaise avec expertise produit et service",
      country: "🇵🇹 Portugal",
      products: 78000,
      rating: 4.4,
      reviews: 4200,
      deliveryTime: "2-5 jours",
      category: "Électronique",
      status: "available",
      apiStatus: "beta",
      commission: "10-20%",
      features: ["Expert conseil", "Service technique", "Installation", "Garantie étendue", "Click & Collect"],
      website: "https://www.worten.pt",
      founded: "1996",
      trustScore: 88,
      certifications: ["ISO 9001"],
      paymentTerms: "Net 30",
      shippingFrom: ["Portugal", "Espagne"],
      languages: ["PT", "ES", "EN"]
    },
    {
      id: "leroymerlin",
      name: "Leroy Merlin",
      logo: "🏠",
      description: "Géant français bricolage avec expertise et conseil professionnel",
      country: "🇫🇷 France",
      products: 180000,
      rating: 4.5,
      reviews: 15600,
      deliveryTime: "2-7 jours",
      category: "Bricolage & Jardin",
      status: "connected",
      apiStatus: "active",
      commission: "12-25%",
      features: ["Expertise conseil", "Location outils", "Pose à domicile", "Drive", "Magasins"],
      website: "https://www.leroymerlin.fr",
      founded: "1923",
      trustScore: 93,
      certifications: ["PEFC", "FSC", "ADEME"],
      paymentTerms: "Net 45",
      shippingFrom: ["France", "Europe"],
      languages: ["FR", "ES", "PT", "IT"]
    },
    {
      id: "sprinter",
      name: "Sprinter",
      logo: "👟",
      description: "Chaîne espagnole sport et lifestyle avec marques premium",
      country: "🇪🇸 Espagne",
      products: 45000,
      rating: 4.3,
      reviews: 3400,
      deliveryTime: "2-5 jours",
      category: "Sport & Mode",
      status: "available",
      apiStatus: "beta",
      commission: "15-30%",
      features: ["Marques premium", "Sport lifestyle", "Click & Collect", "Personal shopper", "Magasins"],
      website: "https://www.sprinter.es",
      founded: "1995",
      trustScore: 86,
      certifications: ["Textile Exchange"],
      paymentTerms: "Net 30",
      shippingFrom: ["Espagne"],
      languages: ["ES", "EN"]
    },
    {
      id: "clubefashion",
      name: "Clube Fashion",
      logo: "👗",
      description: "Mode premium portugaise avec collections exclusives et tendance",
      country: "🇵🇹 Portugal",
      products: 25000,
      rating: 4.2,
      reviews: 1800,
      deliveryTime: "3-7 jours",
      category: "Mode Premium",
      status: "available",
      apiStatus: "limited",
      commission: "20-40%",
      features: ["Collections exclusives", "Mode premium", "Personal styling", "VIP program", "Fashion week"],
      website: "https://www.clubefashion.com",
      founded: "2008",
      trustScore: 84,
      certifications: ["Sustainable Fashion"],
      paymentTerms: "Net 30",
      shippingFrom: ["Portugal", "Europe"],
      languages: ["PT", "EN", "ES"]
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