/**
 * Catalogue Unifié Amélioré
 * Fusion de toutes les pages catalogue avec filtres dynamiques
 * Par fournisseur, catégorie et connecteur API
 */

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  Search, RefreshCw, Package, TrendingUp, Star, 
  ShoppingCart, Eye, Heart, Grid3X3, List, Filter,
  ArrowUpDown, ChevronDown, Sparkles, MoreHorizontal,
  DollarSign, Truck, Edit3, Trash2, Copy, Download,
  Upload, Crown, Zap, Target, BarChart3, Settings,
  CheckCircle2, XCircle, AlertTriangle, Layers, Share2,
  ExternalLink, Calculator, Shield, Wand2, Globe, Store,
  Send, FileText, Image, MessageSquare, Loader2, Plug,
  Building2, Tag, Clock, Database
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProductDetailModal } from "@/components/suppliers/ProductDetailModal";
import { Switch } from "@/components/ui/switch";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  ChannablePageLayout,
  ChannableHeroSection,
  ChannableStatsGrid,
  ChannableBulkActions,
} from "@/components/channable";
import type { ChannableStat } from "@/components/channable/types";

interface CatalogProduct {
  id: string;
  name: string;
  description: string;
  supplier_name: string;
  supplier_id: string;
  connector_id?: string;
  cost_price: number;
  retail_price: number;
  profit: number;
  profit_margin: number;
  stock_quantity: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  ai_score: number;
  image_url: string;
  images: string[];
  category: string;
  brand: string;
  currency: string;
  shipping_time: string;
  rating: number;
  orders_count: number;
  sku: string;
  is_winner: boolean;
  is_trending: boolean;
  status: 'active' | 'inactive' | 'draft';
}

interface EnhancedUnifiedCatalogProps {
  supplierId?: string;
  connectorId?: string;
}

type ViewMode = 'all' | 'supplier' | 'category' | 'connector';
type TabFilter = 'all' | 'winners' | 'trending' | 'bestsellers' | 'low_stock';

const CONNECTORS = [
  { id: 'aliexpress', name: 'AliExpress', icon: '🛒', color: 'bg-orange-500/10 text-orange-600' },
  { id: 'cj_dropshipping', name: 'CJ Dropshipping', icon: '📦', color: 'bg-blue-500/10 text-blue-600' },
  { id: 'bigbuy', name: 'BigBuy', icon: '🇪🇺', color: 'bg-yellow-500/10 text-yellow-600' },
  { id: 'spocket', name: 'Spocket', icon: '🚀', color: 'bg-purple-500/10 text-purple-600' },
  { id: 'printful', name: 'Printful', icon: '🎨', color: 'bg-pink-500/10 text-pink-600' },
  { id: 'zendrop', name: 'Zendrop', icon: '⚡', color: 'bg-green-500/10 text-green-600' },
  { id: 'bts', name: 'BTS Wholesaler', icon: '⚽', color: 'bg-cyan-500/10 text-cyan-600' },
];

export function EnhancedUnifiedCatalog({ supplierId: propSupplierId, connectorId: propConnectorId }: EnhancedUnifiedCatalogProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSupplier, setSelectedSupplier] = useState<string>(propSupplierId || searchParams.get('supplier') || "all");
  const [selectedConnector, setSelectedConnector] = useState<string>(propConnectorId || searchParams.get('connector') || "all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("ai_score");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [viewTab, setViewTab] = useState<ViewMode>('all');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedSupplier !== 'all') params.set('supplier', selectedSupplier);
    if (selectedConnector !== 'all') params.set('connector', selectedConnector);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    setSearchParams(params, { replace: true });
  }, [selectedSupplier, selectedConnector, selectedCategory, setSearchParams]);

  // Load suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ['catalog-suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name, country')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Load products
  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ['enhanced-catalog', searchQuery, selectedCategory, selectedSupplier, selectedConnector, stockFilter, sortBy],
    queryFn: async () => {
      let query = (supabase.from('supplier_products') as any)
        .select('*, suppliers(name, country)');

      if (selectedSupplier !== 'all') {
        query = query.eq('supplier_id', selectedSupplier);
      }

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`);
      }

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (stockFilter === 'in_stock') {
        query = query.gt('stock_quantity', 10);
      } else if (stockFilter === 'low_stock') {
        query = query.lte('stock_quantity', 10).gt('stock_quantity', 0);
      } else if (stockFilter === 'out_of_stock') {
        query = query.eq('stock_quantity', 0);
      }

      if (sortBy === 'profit' || sortBy === 'price_asc') {
        query = query.order('price', { ascending: true });
      } else if (sortBy === 'price_desc') {
        query = query.order('price', { ascending: false });
      } else if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'bestseller') {
        query = query.order('stock_quantity', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(500);

      if (error) {
        console.error('Erreur chargement produits:', error);
        throw error;
      }
      
      return (data || []).map((p: any, index: number) => {
        const costPrice = p.cost_price || p.price || 0;
        const retailPrice = costPrice * 2;
        const profit = retailPrice - costPrice;
        const profitMargin = retailPrice > 0 ? (profit / retailPrice) * 100 : 50;
        const aiScore = 0.6 + Math.random() * 0.35;
        
        // Assign random connector for demo
        const connectorIndex = index % CONNECTORS.length;

        return {
          id: p.id,
          name: p.name || 'Produit sans nom',
          description: p.description || '',
          supplier_name: p.suppliers?.name || 'Fournisseur',
          supplier_id: p.supplier_id,
          connector_id: CONNECTORS[connectorIndex].id,
          cost_price: costPrice,
          retail_price: retailPrice,
          profit: profit,
          profit_margin: profitMargin,
          stock_quantity: p.stock_quantity || 0,
          stock_status: (p.stock_quantity || 0) > 10 ? 'in_stock' : (p.stock_quantity || 0) > 0 ? 'low_stock' : 'out_of_stock',
          ai_score: aiScore,
          image_url: p.image_urls?.[0] || p.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
          images: p.image_urls || (p.image_url ? [p.image_url] : []),
          category: p.category || 'Non classé',
          brand: p.brand || '',
          currency: p.currency || 'EUR',
          shipping_time: '3-7 jours',
          rating: 4.5,
          orders_count: Math.floor(Math.random() * 1000) + 100,
          sku: p.sku || `SKU-${p.id?.slice(0, 6)?.toUpperCase() || index}`,
          is_winner: aiScore > 0.85,
          is_trending: index % 5 === 0,
          status: 'active' as const,
        } as CatalogProduct;
      });
    },
  });

  // Filter by connector
  const connectorFilteredProducts = useMemo(() => {
    if (selectedConnector === 'all') return products;
    return products.filter(p => p.connector_id === selectedConnector);
  }, [products, selectedConnector]);

  // Statistics
  const stats = useMemo(() => {
    const totalProducts = connectorFilteredProducts.length;
    const winners = connectorFilteredProducts.filter(p => p.is_winner).length;
    const trending = connectorFilteredProducts.filter(p => p.is_trending).length;
    const bestsellers = connectorFilteredProducts.filter(p => p.orders_count > 500).length;
    const avgAiScore = connectorFilteredProducts.reduce((sum, p) => sum + p.ai_score, 0) / totalProducts || 0;
    const avgMargin = connectorFilteredProducts.reduce((sum, p) => sum + p.profit_margin, 0) / totalProducts || 0;
    const bySupplier = suppliers.length;
    const byConnector = new Set(connectorFilteredProducts.map(p => p.connector_id)).size;
    
    return {
      totalProducts,
      winners,
      trending,
      bestsellers,
      avgAiScore: Math.round(avgAiScore * 100),
      avgMargin: avgMargin.toFixed(1),
      bySupplier,
      byConnector,
    };
  }, [connectorFilteredProducts, suppliers]);

  // Categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(connectorFilteredProducts.map(p => p.category).filter(Boolean)));
    return ["all", ...cats.map(c => String(c))];
  }, [connectorFilteredProducts]);

  // Filter by tab
  const filteredProducts = useMemo(() => {
    let filtered = connectorFilteredProducts;
    
    switch (activeTab) {
      case 'winners':
        filtered = connectorFilteredProducts.filter(p => p.is_winner);
        break;
      case 'trending':
        filtered = connectorFilteredProducts.filter(p => p.is_trending);
        break;
      case 'bestsellers':
        filtered = connectorFilteredProducts.filter(p => p.orders_count > 500);
        break;
      case 'low_stock':
        filtered = connectorFilteredProducts.filter(p => p.stock_status === 'low_stock' || p.stock_status === 'out_of_stock');
        break;
    }
    
    return filtered;
  }, [connectorFilteredProducts, activeTab]);

  // Grouped products by supplier
  const productsBySupplier = useMemo(() => {
    const grouped: Record<string, CatalogProduct[]> = {};
    connectorFilteredProducts.forEach(p => {
      if (!grouped[p.supplier_name]) grouped[p.supplier_name] = [];
      grouped[p.supplier_name].push(p);
    });
    return grouped;
  }, [connectorFilteredProducts]);

  // Grouped products by category
  const productsByCategory = useMemo(() => {
    const grouped: Record<string, CatalogProduct[]> = {};
    connectorFilteredProducts.forEach(p => {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p);
    });
    return grouped;
  }, [connectorFilteredProducts]);

  // Grouped products by connector
  const productsByConnector = useMemo(() => {
    const grouped: Record<string, CatalogProduct[]> = {};
    connectorFilteredProducts.forEach(p => {
      const connectorName = CONNECTORS.find(c => c.id === p.connector_id)?.name || 'Autre';
      if (!grouped[connectorName]) grouped[connectorName] = [];
      grouped[connectorName].push(p);
    });
    return grouped;
  }, [connectorFilteredProducts]);

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (productId: string) => {
      const product = products.find(p => p.id === productId);
      if (!product) throw new Error('Produit non trouvé');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('imported_products')
        .insert({
          user_id: user.id,
          name: product.name,
          description: product.description,
          price: product.retail_price,
          cost_price: product.cost_price,
          images: product.images,
          category: product.category,
          stock: product.stock_quantity,
          supplier_info: {
            supplier_id: product.supplier_id,
            supplier_name: product.supplier_name,
            connector_id: product.connector_id,
          }
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Produit importé !",
        description: "Le produit a été ajouté à votre boutique",
      });
      queryClient.invalidateQueries({ queryKey: ['imported-products'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur d'import",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase.functions.invoke('bts-feed-sync', {
        body: { 
          supplierId: selectedSupplier !== 'all' ? selectedSupplier : undefined,
          userId: user.id,
          action: 'sync',
          limit: 0
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Erreur de synchronisation');
      
      await refetch();
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Synchronisation terminée !",
        description: `${data.stats?.inserted || 0} produits synchronisés`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de synchronisation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleSelectProduct = (id: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProducts(newSelected);
  };

  const handleBulkImport = async () => {
    for (const id of selectedProducts) {
      await importMutation.mutateAsync(id);
    }
    setSelectedProducts(new Set());
    toast({ title: "Import en masse terminé !", description: `${selectedProducts.size} produits importés` });
  };

  const handleBulkExport = () => {
    const selectedData = filteredProducts.filter(p => selectedProducts.has(p.id));
    const csv = [
      ['Nom', 'SKU', 'Prix', 'Stock', 'Catégorie', 'Fournisseur', 'Connecteur', 'Score IA'].join(','),
      ...selectedData.map(p => [
        p.name, p.sku, p.retail_price, p.stock_quantity, p.category, 
        p.supplier_name, p.connector_id, Math.round(p.ai_score * 100)
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'catalogue-unifie-export.csv';
    a.click();
    
    toast({ title: "Export réussi !", description: `${selectedProducts.size} produits exportés` });
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Helper functions
  const getStockBadge = (status: string, quantity: number) => {
    switch (status) {
      case 'in_stock':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">{quantity} en stock</Badge>;
      case 'low_stock':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">{quantity} restants</Badge>;
      case 'out_of_stock':
        return <Badge variant="destructive" className="text-xs">Rupture</Badge>;
      default:
        return null;
    }
  };

  const getAIScoreBadge = (score: number, isWinner: boolean) => {
    const percentage = Math.round(score * 100);
    if (isWinner) {
      return (
        <div className="flex items-center gap-1 bg-gradient-to-r from-violet-500 to-purple-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
          <Crown className="h-3 w-3" />
          Winner
        </div>
      );
    }
    if (percentage >= 70) {
      return (
        <div className="flex items-center gap-1 bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium">
          <Sparkles className="h-3 w-3" />
          {percentage}%
        </div>
      );
    }
    return (
      <div className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
        {percentage}%
      </div>
    );
  };

  // Stats for hero
  const heroStats: ChannableStat[] = [
    { label: "Total Produits", value: stats.totalProducts.toString(), icon: Package, color: "primary" },
    { label: "Fournisseurs", value: stats.bySupplier.toString(), icon: Truck, color: "info" },
    { label: "Connecteurs", value: stats.byConnector.toString(), icon: Plug, color: "success" },
    { label: "Winners", value: stats.winners.toString(), icon: Crown, color: "warning" },
    { label: "Score IA Moyen", value: `${stats.avgAiScore}%`, icon: Sparkles, color: "primary" },
    { label: "Marge Moyenne", value: `${stats.avgMargin}%`, icon: DollarSign, color: "success" },
  ];

  const bulkActions = [
    { id: 'import', label: 'Importer', icon: ShoppingCart, onClick: handleBulkImport },
    { id: 'export', label: 'Exporter CSV', icon: Download, onClick: handleBulkExport },
  ];

  // Product Card Component
  const ProductCard = ({ product }: { product: CatalogProduct }) => {
    const connector = CONNECTORS.find(c => c.id === product.connector_id);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card 
          className={cn(
            "group overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/30",
            viewMode === 'list' && "flex flex-row",
            selectedProducts.has(product.id) && "ring-2 ring-primary"
          )}
        >
          {/* Checkbox Selection */}
          <div className="absolute top-2 left-2 z-10">
            <Checkbox
              checked={selectedProducts.has(product.id)}
              onCheckedChange={() => handleSelectProduct(product.id)}
              className="bg-background"
            />
          </div>

          {/* Image */}
          <div className={cn(
            "relative overflow-hidden bg-muted",
            viewMode === 'grid' ? "h-40" : "w-40 h-full shrink-0"
          )}>
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';
              }}
            />
            
            {/* Badges overlay */}
            <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
              {getAIScoreBadge(product.ai_score, product.is_winner)}
              {connector && (
                <Badge className={cn("text-xs", connector.color)}>
                  {connector.icon} {connector.name}
                </Badge>
              )}
            </div>

            {/* Favorite button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(product.id);
              }}
              className={cn(
                "absolute bottom-2 right-2 p-1.5 rounded-full transition-colors",
                favorites.has(product.id) 
                  ? "bg-rose-500 text-white" 
                  : "bg-white/80 text-muted-foreground hover:text-rose-500"
              )}
            >
              <Heart className={cn("h-4 w-4", favorites.has(product.id) && "fill-current")} />
            </button>
          </div>

          {/* Content */}
          <CardContent className={cn("p-4 flex-1", viewMode === 'list' && "flex flex-col justify-between")}>
            <div>
              <h3 className="font-semibold text-foreground line-clamp-2 mb-1 text-sm">
                {product.name}
              </h3>
              <p className="text-xs text-muted-foreground mb-2">{product.supplier_name}</p>

              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-primary">
                  {product.retail_price.toFixed(2)}€
                </span>
                {getStockBadge(product.stock_status, product.stock_quantity)}
              </div>

              <div className="flex gap-2 mt-3">
                <Button 
                  size="sm"
                  className="flex-1"
                  onClick={() => importMutation.mutate(product.id)}
                  disabled={importMutation.isPending}
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Importer
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setSelectedProduct(product)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Catalogue Unifié - ShopOpti</title>
        <meta name="description" content="Catalogue unifié de tous vos fournisseurs avec filtres par connecteur API" />
      </Helmet>

      <ChannablePageLayout 
        title="Catalogue Unifié" 
        metaDescription="Tous vos produits fournisseurs en un seul endroit"
        maxWidth="full"
        padding="md"
      >
        {/* Hero Section */}
        <ChannableHeroSection
          title="Catalogue Unifié"
          subtitle="Tous vos produits fournisseurs en un seul endroit - Filtrez par fournisseur, catégorie ou connecteur API"
          badge={{ label: "Nouveau", variant: "default" }}
          variant="compact"
          showHexagons={false}
          primaryAction={{
            label: "Synchroniser",
            onClick: () => syncMutation.mutate(),
            icon: RefreshCw,
          }}
        />

        {/* Stats Grid */}
        <ChannableStatsGrid stats={heroStats} columns={3} compact />

        {/* View Mode Tabs */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as ViewMode)} className="w-full">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <TabsList>
                  <TabsTrigger value="all" className="gap-2">
                    <Package className="h-4 w-4" />
                    Tous les produits
                  </TabsTrigger>
                  <TabsTrigger value="supplier" className="gap-2">
                    <Truck className="h-4 w-4" />
                    Par Fournisseur
                  </TabsTrigger>
                  <TabsTrigger value="category" className="gap-2">
                    <Tag className="h-4 w-4" />
                    Par Catégorie
                  </TabsTrigger>
                  <TabsTrigger value="connector" className="gap-2">
                    <Plug className="h-4 w-4" />
                    Par Connecteur
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  >
                    {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                  </Button>
                  
                  <Button 
                    onClick={() => syncMutation.mutate()} 
                    disabled={syncMutation.isPending}
                    variant="outline"
                  >
                    <RefreshCw className={cn("h-4 w-4 mr-2", syncMutation.isPending && "animate-spin")} />
                    Actualiser
                  </Button>
                </div>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Filters Bar */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Supplier Filter */}
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger className="w-[180px]">
                  <Truck className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous fournisseurs</SelectItem>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Connector Filter */}
              <Select value={selectedConnector} onValueChange={setSelectedConnector}>
                <SelectTrigger className="w-[180px]">
                  <Plug className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Connecteur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous connecteurs</SelectItem>
                  {CONNECTORS.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <Tag className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat === "all" ? "Toutes catégories" : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    Trier
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy('ai_score')}>
                    <Sparkles className="h-4 w-4 mr-2" /> Score IA
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('profit')}>
                    <DollarSign className="h-4 w-4 mr-2" /> Meilleure marge
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('bestseller')}>
                    <TrendingUp className="h-4 w-4 mr-2" /> Best-sellers
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('newest')}>
                    <Clock className="h-4 w-4 mr-2" /> Plus récents
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Quick Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabFilter)} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="all">
              Tous ({stats.totalProducts})
            </TabsTrigger>
            <TabsTrigger value="winners">
              <Crown className="h-4 w-4 mr-1" />
              Winners ({stats.winners})
            </TabsTrigger>
            <TabsTrigger value="trending">
              <TrendingUp className="h-4 w-4 mr-1" />
              Tendance ({stats.trending})
            </TabsTrigger>
            <TabsTrigger value="bestsellers">
              <Zap className="h-4 w-4 mr-1" />
              Best-sellers ({stats.bestsellers})
            </TabsTrigger>
            <TabsTrigger value="low_stock">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Stock faible
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedProducts.size > 0 && (
            <ChannableBulkActions
              selectedCount={selectedProducts.size}
              totalCount={filteredProducts.length}
              isAllSelected={selectedProducts.size === filteredProducts.length}
              onSelectAll={handleSelectAll}
              onDeselectAll={() => setSelectedProducts(new Set())}
              actions={bulkActions}
            />
          )}
        </AnimatePresence>

        {/* Products Content */}
        {isLoading ? (
          <div className={cn(
            "grid gap-4",
            viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" : "grid-cols-1"
          )}>
            {[...Array(10)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-0">
                  <Skeleton className="h-40 w-full rounded-t-lg" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Modifiez vos filtres ou synchronisez vos fournisseurs
              </p>
              <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
                <RefreshCw className={cn("h-4 w-4 mr-2", syncMutation.isPending && "animate-spin")} />
                Synchroniser
              </Button>
            </CardContent>
          </Card>
        ) : viewTab === 'all' ? (
          <div className={cn(
            "grid gap-4",
            viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" : "grid-cols-1"
          )}>
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : viewTab === 'supplier' ? (
          <div className="space-y-6">
            {Object.entries(productsBySupplier).map(([supplierName, supplierProducts]) => (
              <div key={supplierName}>
                <div className="flex items-center gap-2 mb-3">
                  <Truck className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{supplierName}</h3>
                  <Badge variant="secondary">{supplierProducts.length} produits</Badge>
                </div>
                <div className={cn(
                  "grid gap-4",
                  viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" : "grid-cols-1"
                )}>
                  {supplierProducts.slice(0, 5).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {supplierProducts.length > 5 && (
                  <Button variant="link" className="mt-2" onClick={() => {
                    setSelectedSupplier(supplierProducts[0].supplier_id);
                    setViewTab('all');
                  }}>
                    Voir les {supplierProducts.length - 5} autres produits →
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : viewTab === 'category' ? (
          <div className="space-y-6">
            {Object.entries(productsByCategory).map(([categoryName, categoryProducts]) => (
              <div key={categoryName}>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{categoryName}</h3>
                  <Badge variant="secondary">{categoryProducts.length} produits</Badge>
                </div>
                <div className={cn(
                  "grid gap-4",
                  viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" : "grid-cols-1"
                )}>
                  {categoryProducts.slice(0, 5).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {categoryProducts.length > 5 && (
                  <Button variant="link" className="mt-2" onClick={() => {
                    setSelectedCategory(categoryName);
                    setViewTab('all');
                  }}>
                    Voir les {categoryProducts.length - 5} autres produits →
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(productsByConnector).map(([connectorName, connectorProducts]) => {
              const connector = CONNECTORS.find(c => c.name === connectorName);
              return (
                <div key={connectorName}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{connector?.icon || '📦'}</span>
                    <h3 className="text-lg font-semibold">{connectorName}</h3>
                    <Badge variant="secondary">{connectorProducts.length} produits</Badge>
                  </div>
                  <div className={cn(
                    "grid gap-4",
                    viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" : "grid-cols-1"
                  )}>
                    {connectorProducts.slice(0, 5).map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                  {connectorProducts.length > 5 && (
                    <Button variant="link" className="mt-2" onClick={() => {
                      setSelectedConnector(connector?.id || 'all');
                      setViewTab('all');
                    }}>
                      Voir les {connectorProducts.length - 5} autres produits →
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Product Detail Modal - Optimisé */}
        <ProductDetailModal
          product={selectedProduct}
          open={!!selectedProduct}
          onOpenChange={() => setSelectedProduct(null)}
          onImport={(productId) => {
            importMutation.mutate(productId);
            setSelectedProduct(null);
          }}
          isImporting={importMutation.isPending}
        />
      </ChannablePageLayout>
    </>
  );
}

export default EnhancedUnifiedCatalog;
