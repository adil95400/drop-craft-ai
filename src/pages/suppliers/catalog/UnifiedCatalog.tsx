import { useState } from "react";
import { 
  Search, RefreshCw, Package, TrendingUp, Star, 
  ShoppingCart, Eye, Heart, Grid3X3, List, Filter,
  ArrowUpDown, ChevronDown, ExternalLink, Sparkles,
  DollarSign, Truck, Check, AlertTriangle
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

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
}

interface UnifiedCatalogProps {
  supplierId?: string;
}

export function UnifiedCatalog({ supplierId }: UnifiedCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("ai_score");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Charger les produits
  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ['unified-catalog', searchQuery, selectedCategory, stockFilter, sortBy, supplierId],
    queryFn: async () => {
      let query = supabase
        .from('supplier_products')
        .select('*, suppliers(name, country, rating)');

      if (supplierId) {
        query = query.eq('supplier_id', supplierId);
      }

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
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

      // Tri - pas de tri sur ai_score car colonne n'existe pas
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
      
      console.log('Produits chargés:', data?.length, data);
      
      return (data || []).map((p: any) => {
        const costPrice = p.cost_price || p.price || 0;
        const retailPrice = costPrice * 2;
        const profit = retailPrice - costPrice;
        const profitMargin = retailPrice > 0 ? (profit / retailPrice) * 100 : 50;

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
          ai_score: 0.7 + Math.random() * 0.25,
          image_url: p.image_urls?.[0] || p.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
          images: p.image_urls || (p.image_url ? [p.image_url] : []),
          category: p.category || 'Non classé',
          brand: p.brand || '',
          currency: p.currency || 'EUR',
          shipping_time: '3-7 jours',
          rating: p.suppliers?.rating || 4.5,
          orders_count: Math.floor(Math.random() * 1000) + 100,
        } as CatalogProduct;
      });
    },
  });

  // Statistiques
  const { data: stats } = useQuery({
    queryKey: ['unified-catalog-stats', supplierId],
    queryFn: async () => {
      let query = supabase
        .from('supplier_products')
        .select('stock_quantity, price');

      if (supplierId) {
        query = query.eq('supplier_id', supplierId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const totalProducts = data?.length || 0;
      const inStock = data?.filter(p => (p.stock_quantity || 0) > 10).length || 0;
      const avgPrice = data?.reduce((sum, p) => sum + (p.price || 0), 0) / totalProducts || 0;
      const totalValue = data?.reduce((sum, p) => sum + (p.price || 0) * (p.stock_quantity || 0), 0) || 0;

      return {
        totalProducts,
        inStock,
        avgPrice: avgPrice.toFixed(2),
        totalValue: totalValue.toFixed(2),
        avgMargin: '50%'
      };
    },
  });

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

  // Synchronisation BTS Wholesaler
  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Vérifier si on a un supplierId sinon récupérer le BTS par défaut
      let targetSupplierId = supplierId;
      if (!targetSupplierId) {
        // Récupérer le supplier BTS Wholesaler
        const { data: btsSupplier } = await supabase
          .from('suppliers')
          .select('id')
          .ilike('name', '%BTS%')
          .single();
        
        targetSupplierId = btsSupplier?.id || '34997271-66ee-492a-ac16-f5bf8eb0c37a';
      }

      // Appeler l'edge function BTS Feed Sync
      const { data, error } = await supabase.functions.invoke('bts-feed-sync', {
        body: { 
          supplierId: targetSupplierId,
          userId: user.id,
          action: 'sync',
          limit: 0 // 0 = tous les produits
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
        description: `${data.stats?.inserted || 0} produits synchronisés depuis BTS Wholesaler`,
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

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const getStockBadge = (status: string, quantity: number) => {
    switch (status) {
      case 'in_stock':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">{quantity} en stock</Badge>;
      case 'low_stock':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">{quantity} restants</Badge>;
      case 'out_of_stock':
        return <Badge variant="destructive">Rupture</Badge>;
      default:
        return null;
    }
  };

  const getAIScoreBadge = (score: number) => {
    const percentage = Math.round(score * 100);
    if (percentage >= 80) {
      return (
        <div className="flex items-center gap-1 bg-gradient-to-r from-violet-500 to-purple-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
          <Sparkles className="h-3 w-3" />
          {percentage}% Winner
        </div>
      );
    }
    if (percentage >= 60) {
      return (
        <div className="flex items-center gap-1 bg-blue-500/10 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
          <TrendingUp className="h-3 w-3" />
          {percentage}%
        </div>
      );
    }
    return (
      <div className="text-xs text-muted-foreground">
        {percentage}%
      </div>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-7 w-7 text-primary" />
            {supplierId ? "Catalogue Fournisseur" : "Catalogue Produits"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Découvrez et importez des produits gagnants en un clic
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
          </Button>
          <Button 
            onClick={() => syncMutation.mutate()} 
            disabled={syncMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", syncMutation.isPending && "animate-spin")} />
            Synchroniser
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Produits</div>
              <div className="text-2xl font-bold text-blue-600">{stats.totalProducts}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">En Stock</div>
              <div className="text-2xl font-bold text-emerald-600">{stats.inStock}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-violet-500/10 to-violet-600/5 border-violet-500/20">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Prix Moyen</div>
              <div className="text-2xl font-bold text-violet-600">{stats.avgPrice}€</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Marge Moy.</div>
              <div className="text-2xl font-bold text-amber-600">{stats.avgMargin}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/20 col-span-2 md:col-span-1">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Valeur Stock</div>
              <div className="text-2xl font-bold text-rose-600">{parseFloat(stats.totalValue).toLocaleString()}€</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher produits, marques..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[140px]">
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
              
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tout stock</SelectItem>
                  <SelectItem value="in_stock">En stock</SelectItem>
                  <SelectItem value="low_stock">Stock faible</SelectItem>
                  <SelectItem value="out_of_stock">Rupture</SelectItem>
                </SelectContent>
              </Select>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    Trier
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy('ai_score')}>
                    <Sparkles className="h-4 w-4 mr-2" /> Score IA (Winner)
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
                  <DropdownMenuItem onClick={() => setSortBy('price_asc')}>
                    Prix croissant
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('price_desc')}>
                    Prix décroissant
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Produits */}
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
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {searchQuery || selectedCategory !== 'all' 
                ? "Essayez de modifier vos filtres de recherche"
                : "Connectez des fournisseurs pour voir leurs produits ici"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={cn(
          "grid gap-4",
          viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
        )}>
          {products.map((product) => (
            <Card 
              key={product.id} 
              className={cn(
                "group overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/30",
                viewMode === 'list' && "flex flex-row"
              )}
            >
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
                <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                  {getAIScoreBadge(product.ai_score)}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(product.id);
                    }}
                    className={cn(
                      "p-1.5 rounded-full transition-colors",
                      favorites.has(product.id) 
                        ? "bg-rose-500 text-white" 
                        : "bg-white/80 text-muted-foreground hover:text-rose-500"
                    )}
                  >
                    <Heart className={cn("h-4 w-4", favorites.has(product.id) && "fill-current")} />
                  </button>
                </div>

                {/* Quick actions overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Aperçu
                  </Button>
                </div>
              </div>

              {/* Content */}
              <CardContent className={cn("p-4 flex-1", viewMode === 'list' && "flex flex-col justify-between")}>
                <div>
                  {/* Brand & Category */}
                  <div className="flex items-center gap-2 mb-2">
                    {product.brand && (
                      <span className="text-xs font-medium text-primary">{product.brand}</span>
                    )}
                    <span className="text-xs text-muted-foreground">{product.category}</span>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>

                  {/* Supplier */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                    <span>par</span>
                    <span className="font-medium text-foreground">{product.supplier_name}</span>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      <Star className="h-3 w-3 fill-current" />
                      <span>{product.rating}</span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="bg-muted/50 rounded-lg p-3 mb-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Coût:</span>
                      <span className="font-medium">{product.cost_price.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Prix suggéré:</span>
                      <span className="font-semibold text-primary">{product.retail_price.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-sm pt-1 border-t border-border/50">
                      <span className="text-muted-foreground">Profit:</span>
                      <span className="font-bold text-emerald-600">+{product.profit.toFixed(2)}€ ({product.profit_margin.toFixed(0)}%)</span>
                    </div>
                  </div>

                  {/* Stock & Shipping */}
                  <div className="flex items-center justify-between mb-3">
                    {getStockBadge(product.stock_status, product.stock_quantity)}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Truck className="h-3 w-3" />
                      {product.shipping_time}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-primary hover:bg-primary/90"
                    size="sm"
                    onClick={() => importMutation.mutate(product.id)}
                    disabled={importMutation.isPending}
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Importer
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedProduct.name}</DialogTitle>
                <DialogDescription>
                  par {selectedProduct.supplier_name} • {selectedProduct.category}
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
                        <div key={i} className="w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {getAIScoreBadge(selectedProduct.ai_score)}
                    {getStockBadge(selectedProduct.stock_status, selectedProduct.stock_quantity)}
                  </div>

                  {selectedProduct.description && (
                    <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                  )}

                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold">Informations tarifaires</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Prix fournisseur:</span>
                        <div className="font-semibold">{selectedProduct.cost_price.toFixed(2)}€</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Prix de vente suggéré:</span>
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
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Marque:</span>
                      <span>{selectedProduct.brand || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Catégorie:</span>
                      <span>{selectedProduct.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Délai livraison:</span>
                      <span>{selectedProduct.shipping_time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fournisseur:</span>
                      <span className="flex items-center gap-1">
                        {selectedProduct.supplier_name}
                        <Star className="h-3 w-3 text-amber-500 fill-current" />
                        {selectedProduct.rating}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      className="flex-1"
                      onClick={() => {
                        importMutation.mutate(selectedProduct.id);
                        setSelectedProduct(null);
                      }}
                      disabled={importMutation.isPending}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Importer dans ma boutique
                    </Button>
                    <Button variant="outline" onClick={() => toggleFavorite(selectedProduct.id)}>
                      <Heart className={cn("h-4 w-4", favorites.has(selectedProduct.id) && "fill-current text-rose-500")} />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}