import { useState } from "react";
import { Search, Filter, RefreshCw, Download, TrendingUp, Package, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface UnifiedProduct {
  id: string;
  title: string;
  description: string;
  supplier_name: string;
  cost_price: number;
  retail_price: number;
  suggested_price: number;
  stock_quantity: number;
  stock_status: string;
  profit_margin: number;
  ai_score: number;
  main_image_url: string;
  category: string;
  sync_status: string;
  last_synced_at: string;
}

export function UnifiedCatalog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("ai_score");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Charger les produits du catalogue unifié
  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ['unified-catalog', searchQuery, selectedCategory, stockFilter, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('supplier_products_unified')
        .select('*')
        .eq('is_active', true);

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (stockFilter !== 'all') {
        query = query.eq('stock_status', stockFilter);
      }

      // Tri
      if (sortBy === 'ai_score') {
        query = query.order('ai_score', { ascending: false, nullsFirst: false });
      } else if (sortBy === 'profit_margin') {
        query = query.order('profit_margin', { ascending: false, nullsFirst: false });
      } else if (sortBy === 'price_asc') {
        query = query.order('retail_price', { ascending: true });
      } else if (sortBy === 'price_desc') {
        query = query.order('retail_price', { ascending: false });
      } else if (sortBy === 'stock') {
        query = query.order('stock_quantity', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as UnifiedProduct[];
    },
  });

  // Statistiques
  const { data: stats } = useQuery({
    queryKey: ['unified-catalog-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_products_unified')
        .select('stock_status, profit_margin, cost_price')
        .eq('is_active', true);

      if (error) throw error;

      const totalProducts = data.length;
      const inStock = data.filter(p => p.stock_status === 'in_stock').length;
      const lowStock = data.filter(p => p.stock_status === 'low_stock').length;
      const outOfStock = data.filter(p => p.stock_status === 'out_of_stock').length;
      const avgMargin = data.reduce((sum, p) => sum + (p.profit_margin || 0), 0) / totalProducts;
      const totalValue = data.reduce((sum, p) => sum + (p.cost_price || 0), 0);

      return {
        totalProducts,
        inStock,
        lowStock,
        outOfStock,
        avgMargin: avgMargin.toFixed(1),
        totalValue: totalValue.toFixed(2)
      };
    },
  });

  // Synchronisation complète
  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('supplier-unified-sync', {
        body: { force_full_sync: true }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['unified-catalog'] });
      queryClient.invalidateQueries({ queryKey: ['unified-catalog-stats'] });
      
      toast({
        title: "Synchronisation terminée",
        description: `${data.stats.imported} produits importés, ${data.stats.updated} mis à jour`,
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

  // Catégories uniques
  const categories = ["all", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const getStockBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <Badge variant="default" className="bg-green-500">En stock</Badge>;
      case 'low_stock':
        return <Badge variant="default" className="bg-yellow-500">Stock faible</Badge>;
      case 'out_of_stock':
        return <Badge variant="destructive">Rupture</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Catalogue Unifié</h1>
          <p className="text-muted-foreground mt-2">
            Tous vos produits fournisseurs en un seul endroit
          </p>
        </div>
        <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
          <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          Synchroniser
        </Button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Produits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.inStock}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Stock faible</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rupture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Marge Moy.</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgMargin}%</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Valeur Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalValue}€</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat} className="capitalize">
                    {cat === "all" ? "Toutes" : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="in_stock">En stock</SelectItem>
                <SelectItem value="low_stock">Stock faible</SelectItem>
                <SelectItem value="out_of_stock">Rupture</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ai_score">Score IA</SelectItem>
                <SelectItem value="profit_margin">Marge</SelectItem>
                <SelectItem value="price_asc">Prix croissant</SelectItem>
                <SelectItem value="price_desc">Prix décroissant</SelectItem>
                <SelectItem value="stock">Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des produits */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-48 w-full" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {searchQuery || selectedCategory !== 'all' || stockFilter !== 'all'
                ? 'Aucun produit trouvé avec ces critères'
                : 'Aucun produit dans le catalogue. Connectez vos fournisseurs pour commencer.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                {product.main_image_url && (
                  <img
                    src={product.main_image_url}
                    alt={product.title}
                    className="w-full h-48 object-cover rounded-md mb-3"
                  />
                )}
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-2">{product.title}</CardTitle>
                  {product.ai_score && (
                    <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                      <TrendingUp className="h-3 w-3" />
                      {(product.ai_score * 100).toFixed(0)}%
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-sm line-clamp-2">
                  {product.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fournisseur:</span>
                  <span className="font-medium">{product.supplier_name}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Prix coût:</span>
                  <span className="font-semibold">{product.cost_price?.toFixed(2)}€</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Prix vente:</span>
                  <span className="font-semibold text-lg">{product.retail_price?.toFixed(2)}€</span>
                </div>
                
                {product.suggested_price && product.suggested_price !== product.retail_price && (
                  <div className="flex items-center justify-between bg-blue-500/10 p-2 rounded-md">
                    <span className="text-sm text-blue-600">Prix suggéré IA:</span>
                    <span className="font-semibold text-blue-600">{product.suggested_price?.toFixed(2)}€</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Marge:</span>
                  <Badge variant={product.profit_margin > 30 ? "default" : "secondary"}>
                    {product.profit_margin?.toFixed(1)}%
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Stock:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{product.stock_quantity}</span>
                    {getStockBadge(product.stock_status)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span>Sync: {new Date(product.last_synced_at).toLocaleString('fr-FR')}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}