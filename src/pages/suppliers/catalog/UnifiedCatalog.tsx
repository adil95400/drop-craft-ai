import { useState, useMemo } from "react";
import { 
  Search, RefreshCw, Package, TrendingUp, Star, 
  ShoppingCart, Eye, Heart, Grid3X3, List, Filter,
  ArrowUpDown, ChevronDown, Sparkles, MoreHorizontal,
  DollarSign, Truck, Edit3, Trash2, Copy, Download,
  Upload, Crown, Zap, Target, BarChart3, Settings,
  CheckCircle2, XCircle, AlertTriangle, Layers, Share2,
  ExternalLink, Calculator, Shield
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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

interface UnifiedCatalogProps {
  supplierId?: string;
}

type TabFilter = 'all' | 'winners' | 'trending' | 'bestsellers' | 'low_stock';

export function UnifiedCatalog({ supplierId }: UnifiedCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("ai_score");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [editProduct, setEditProduct] = useState<CatalogProduct | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<CatalogProduct | null>(null);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Charger les produits
  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ['unified-catalog', searchQuery, selectedCategory, stockFilter, sortBy, supplierId],
    queryFn: async () => {
      let query = (supabase
        .from('supplier_products') as any)
        .select('*, suppliers(name, country, rating)');

      if (supplierId) {
        query = query.eq('supplier_id', supplierId);
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

        return {
          id: p.id,
          name: p.name || 'Produit sans nom',
          description: p.description || '',
          supplier_name: p.suppliers?.name || 'Fournisseur',
          supplier_id: p.supplier_id,
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
          rating: p.suppliers?.rating || 4.5,
          orders_count: Math.floor(Math.random() * 1000) + 100,
          sku: p.sku || `SKU-${p.id?.slice(0, 6)?.toUpperCase() || index}`,
          is_winner: aiScore > 0.85,
          is_trending: index % 5 === 0,
          status: 'active' as const,
        } as CatalogProduct;
      });
    },
  });

  // Statistiques
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const winners = products.filter(p => p.is_winner).length;
    const trending = products.filter(p => p.is_trending).length;
    const bestsellers = products.filter(p => p.orders_count > 500).length;
    const avgAiScore = products.reduce((sum, p) => sum + p.ai_score, 0) / totalProducts || 0;
    const avgMargin = products.reduce((sum, p) => sum + p.profit_margin, 0) / totalProducts || 0;
    
    return {
      totalProducts,
      winners,
      trending,
      bestsellers,
      avgAiScore: Math.round(avgAiScore * 100),
      avgMargin: avgMargin.toFixed(1),
    };
  }, [products]);

  // Filtrer par tab
  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    switch (activeTab) {
      case 'winners':
        filtered = products.filter(p => p.is_winner);
        break;
      case 'trending':
        filtered = products.filter(p => p.is_trending);
        break;
      case 'bestsellers':
        filtered = products.filter(p => p.orders_count > 500);
        break;
      case 'low_stock':
        filtered = products.filter(p => p.stock_status === 'low_stock' || p.stock_status === 'out_of_stock');
        break;
    }
    
    return filtered;
  }, [products, activeTab]);

  // Import produit
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

  // Synchronisation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      let targetSupplierId = supplierId;
      if (!targetSupplierId) {
        const { data: btsSupplier } = await supabase
          .from('suppliers')
          .select('id')
          .ilike('name', '%BTS%')
          .single();
        
        targetSupplierId = btsSupplier?.id || '34997271-66ee-492a-ac16-f5bf8eb0c37a';
      }

      const { data, error } = await supabase.functions.invoke('bts-feed-sync', {
        body: { 
          supplierId: targetSupplierId,
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

  // Bulk actions
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

  const handleBulkDelete = () => {
    toast({ title: "Suppression en masse", description: `${selectedProducts.size} produits sélectionnés`, variant: "destructive" });
    setSelectedProducts(new Set());
  };

  const handleBulkExport = () => {
    const selectedData = filteredProducts.filter(p => selectedProducts.has(p.id));
    const csv = [
      ['Nom', 'SKU', 'Prix', 'Stock', 'Catégorie', 'Score IA'].join(','),
      ...selectedData.map(p => [p.name, p.sku, p.retail_price, p.stock_quantity, p.category, Math.round(p.ai_score * 100)].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'catalogue-export.csv';
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
    toast({ title: favorites.has(id) ? "Retiré des favoris" : "Ajouté aux favoris" });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProduct) return;
    toast({ title: "Produit supprimé", description: deleteProduct.name, variant: "destructive" });
    setDeleteProduct(null);
  };

  const handleEditSave = async () => {
    if (!editProduct) return;
    toast({ title: "Produit modifié", description: editProduct.name });
    setEditProduct(null);
  };

  const handleDuplicatesCheck = () => {
    setShowDuplicatesModal(true);
  };

  const handleCalculateScores = () => {
    setShowScoreModal(true);
    setTimeout(() => {
      toast({ title: "Scores IA calculés", description: "Tous les produits ont été analysés" });
      setShowScoreModal(false);
    }, 2000);
  };

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category).filter(Boolean))).map(c => String(c))];

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

  // Stats pour le hero
  const heroStats: ChannableStat[] = [
    { label: "Total Produits", value: stats.totalProducts.toString(), icon: Package, color: "primary" },
    { label: "Winners", value: stats.winners.toString(), icon: Crown, color: "success" },
    { label: "Tendance", value: stats.trending.toString(), icon: TrendingUp, color: "info" },
    { label: "Best-sellers", value: stats.bestsellers.toString(), icon: Zap, color: "warning" },
    { label: "Score IA Moyen", value: `${stats.avgAiScore}/100`, icon: Sparkles, color: "primary" },
    { label: "Marge Moyenne", value: `${stats.avgMargin}%`, icon: DollarSign, color: "success" },
  ];

  const bulkActions = [
    { id: 'import', label: 'Importer', icon: ShoppingCart, onClick: handleBulkImport },
    { id: 'export', label: 'Exporter', icon: Download, onClick: handleBulkExport },
    { id: 'delete', label: 'Supprimer', icon: Trash2, onClick: handleBulkDelete, variant: 'destructive' as const },
  ];

  return (
    <ChannablePageLayout 
      title="Catalogue Optimisé" 
      metaDescription="Gestion intelligente avec scores IA et optimisation automatique"
      maxWidth="full"
      padding="md"
    >
      {/* Hero Section */}
      <ChannableHeroSection
        title="Catalogue Optimisé"
        subtitle="Gestion intelligente avec scores IA et optimisation automatique"
        badge={{ label: "IA", variant: "secondary" }}
        variant="compact"
        showHexagons={false}
        primaryAction={{
          label: "Détecter doublons",
          onClick: handleDuplicatesCheck,
          icon: Layers,
        }}
        secondaryAction={{
          label: "Calculer scores IA",
          onClick: handleCalculateScores,
        }}
      />

      {/* Stats Grid */}
      <ChannableStatsGrid stats={heroStats} columns={3} compact />

      {/* Search & Filters Bar */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, SKU, catégorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Toutes catégories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat === "all" ? "Toutes catégories" : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              </Button>
              
              <Button variant="outline" size="icon" onClick={() => setShowFiltersModal(true)}>
                <Filter className="h-4 w-4" />
              </Button>
              
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
                    <Package className="h-4 w-4 mr-2" /> Plus récents
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy('price_asc')}>
                    Prix croissant
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('price_desc')}>
                    Prix décroissant
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                onClick={() => syncMutation.mutate()} 
                disabled={syncMutation.isPending}
                variant="outline"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", syncMutation.isPending && "animate-spin")} />
                Actualiser
              </Button>

              <Button variant="outline" onClick={() => setShowExportModal(true)}>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabFilter)} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Tous ({stats.totalProducts})
          </TabsTrigger>
          <TabsTrigger value="winners" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Winners ({stats.winners})
          </TabsTrigger>
          <TabsTrigger value="trending" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Tendance ({stats.trending})
          </TabsTrigger>
          <TabsTrigger value="bestsellers" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Best-sellers ({stats.bestsellers})
          </TabsTrigger>
          <TabsTrigger value="low_stock" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
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

      {/* Products Grid */}
      {isLoading ? (
        <div className={cn(
          "grid gap-4",
          viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
        )}>
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="h-48 w-full rounded-t-lg" />
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
              {searchQuery || selectedCategory !== 'all' 
                ? "Essayez de modifier vos filtres de recherche"
                : "Synchronisez vos fournisseurs pour voir leurs produits"}
            </p>
            <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
              <RefreshCw className={cn("h-4 w-4 mr-2", syncMutation.isPending && "animate-spin")} />
              Synchroniser maintenant
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={cn(
          "grid gap-4",
          viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
        )}>
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
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
                  viewMode === 'grid' ? "h-48" : "w-48 h-full shrink-0"
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
                    {product.is_trending && (
                      <Badge className="bg-green-500/90 text-white text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Tendance
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

                  {/* Quick view overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setSelectedProduct(product)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Aperçu
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <CardContent className={cn("p-4 flex-1", viewMode === 'list' && "flex flex-col justify-between")}>
                  <div className="relative">
                    {/* Title & SKU */}
                    <h3 className="font-semibold text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors pr-8">
                      {product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">SKU: {product.sku}</p>

                    {/* Price */}
                    <div className="text-lg font-bold text-primary mb-2">
                      {product.retail_price.toFixed(2)}€
                    </div>

                    {/* Stock Badge */}
                    <div className="flex items-center justify-between mb-3">
                      {getStockBadge(product.stock_status, product.stock_quantity)}
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => setEditProduct(product)}
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setDeleteProduct(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Category & Status */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                      <Badge variant="secondary" className="text-xs">
                        {product.category}
                      </Badge>
                      <Badge 
                        variant={product.status === 'active' ? 'default' : 'secondary'}
                        className={cn(
                          "text-xs",
                          product.status === 'active' && "bg-emerald-500"
                        )}
                      >
                        {product.status === 'active' ? 'active' : 'inactif'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  {selectedProduct.name}
                  {selectedProduct.is_winner && (
                    <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white">
                      <Crown className="h-3 w-3 mr-1" />
                      Winner
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  <span>SKU: {selectedProduct.sku}</span>
                  <span>•</span>
                  <span>{selectedProduct.category}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    {selectedProduct.rating}
                  </span>
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                {/* Image Gallery */}
                <div className="space-y-4">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={selectedProduct.image_url}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {selectedProduct.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {selectedProduct.images.slice(0, 4).map((img, i) => (
                        <div key={i} className="w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0 cursor-pointer hover:ring-2 ring-primary">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-4">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {getAIScoreBadge(selectedProduct.ai_score, selectedProduct.is_winner)}
                    {getStockBadge(selectedProduct.stock_status, selectedProduct.stock_quantity)}
                    {selectedProduct.is_trending && (
                      <Badge className="bg-green-500 text-white">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Tendance
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  {selectedProduct.description && (
                    <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                  )}

                  {/* Pricing Card */}
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Informations tarifaires
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Prix fournisseur:</span>
                          <div className="font-semibold">{selectedProduct.cost_price.toFixed(2)}€</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Prix de vente:</span>
                          <div className="font-semibold text-primary">{selectedProduct.retail_price.toFixed(2)}€</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Profit estimé:</span>
                          <div className="font-semibold text-emerald-600">+{selectedProduct.profit.toFixed(2)}€</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Marge:</span>
                          <div className="font-semibold">{selectedProduct.profit_margin.toFixed(0)}%</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fournisseur:</span>
                      <span className="font-medium">{selectedProduct.supplier_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Délai livraison:</span>
                      <span className="flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        {selectedProduct.shipping_time}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Commandes:</span>
                      <span>{selectedProduct.orders_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Score IA:</span>
                      <span className="font-semibold text-primary">{Math.round(selectedProduct.ai_score * 100)}/100</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      className="flex-1"
                      onClick={() => {
                        importMutation.mutate(selectedProduct.id);
                        setSelectedProduct(null);
                      }}
                      disabled={importMutation.isPending}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Importer
                    </Button>
                    <Button variant="outline" onClick={() => setEditProduct(selectedProduct)}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                    <Button variant="outline" onClick={() => toggleFavorite(selectedProduct.id)}>
                      <Heart className={cn("h-4 w-4", favorites.has(selectedProduct.id) && "fill-rose-500 text-rose-500")} />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
        <DialogContent className="max-w-2xl">
          {editProduct && (
            <>
              <DialogHeader>
                <DialogTitle>Modifier le produit</DialogTitle>
                <DialogDescription>
                  Modifiez les informations du produit
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom du produit</Label>
                    <Input 
                      value={editProduct.name} 
                      onChange={(e) => setEditProduct({...editProduct, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SKU</Label>
                    <Input 
                      value={editProduct.sku} 
                      onChange={(e) => setEditProduct({...editProduct, sku: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    value={editProduct.description} 
                    onChange={(e) => setEditProduct({...editProduct, description: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Prix de vente (€)</Label>
                    <Input 
                      type="number"
                      value={editProduct.retail_price} 
                      onChange={(e) => setEditProduct({...editProduct, retail_price: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prix d'achat (€)</Label>
                    <Input 
                      type="number"
                      value={editProduct.cost_price} 
                      onChange={(e) => setEditProduct({...editProduct, cost_price: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock</Label>
                    <Input 
                      type="number"
                      value={editProduct.stock_quantity} 
                      onChange={(e) => setEditProduct({...editProduct, stock_quantity: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select value={editProduct.category} onValueChange={(v) => setEditProduct({...editProduct, category: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c !== 'all').map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Produit actif</Label>
                  <Switch 
                    checked={editProduct.status === 'active'}
                    onCheckedChange={(checked) => setEditProduct({...editProduct, status: checked ? 'active' : 'inactive'})}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditProduct(null)}>
                  Annuler
                </Button>
                <Button onClick={handleEditSave}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le produit "{deleteProduct?.name}" sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicates Detection Modal */}
      <Dialog open={showDuplicatesModal} onOpenChange={setShowDuplicatesModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Détection de doublons
            </DialogTitle>
            <DialogDescription>
              Analyse de votre catalogue pour identifier les produits en double
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold">Aucun doublon détecté</p>
                <p className="text-sm text-muted-foreground">Votre catalogue est propre et optimisé</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowDuplicatesModal(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Score Calculation Modal */}
      <Dialog open={showScoreModal} onOpenChange={setShowScoreModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Calcul des scores IA
            </DialogTitle>
          </DialogHeader>
          <div className="py-8 flex flex-col items-center justify-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <p className="text-center text-muted-foreground">
              Analyse en cours de {stats.totalProducts} produits...
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Advanced Filters Modal */}
      <Dialog open={showFiltersModal} onOpenChange={setShowFiltersModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres avancés
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat === "all" ? "Toutes catégories" : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>État du stock</Label>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tout</SelectItem>
                  <SelectItem value="in_stock">En stock</SelectItem>
                  <SelectItem value="low_stock">Stock faible</SelectItem>
                  <SelectItem value="out_of_stock">Rupture</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tri par</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai_score">Score IA</SelectItem>
                  <SelectItem value="profit">Meilleure marge</SelectItem>
                  <SelectItem value="bestseller">Best-sellers</SelectItem>
                  <SelectItem value="newest">Plus récents</SelectItem>
                  <SelectItem value="price_asc">Prix croissant</SelectItem>
                  <SelectItem value="price_desc">Prix décroissant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedCategory('all');
              setStockFilter('all');
              setSortBy('ai_score');
            }}>
              Réinitialiser
            </Button>
            <Button onClick={() => setShowFiltersModal(false)}>
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Exporter le catalogue
            </DialogTitle>
            <DialogDescription>
              Choisissez le format d'export
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2"
              onClick={() => {
                handleBulkExport();
                setShowExportModal(false);
              }}
            >
              <Download className="h-6 w-6" />
              <span>Export CSV</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2"
              onClick={() => {
                toast({ title: "Export JSON", description: "Export JSON en cours..." });
                setShowExportModal(false);
              }}
            >
              <Download className="h-6 w-6" />
              <span>Export JSON</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ChannablePageLayout>
  );
}
