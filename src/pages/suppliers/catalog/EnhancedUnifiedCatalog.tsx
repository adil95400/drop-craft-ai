/**
 * Catalogue Unifié Amélioré et Optimisé
 * Version 100% fonctionnelle avec pagination, filtres avancés et performance
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  RefreshCw, Package, TrendingUp, 
  Grid3X3, List, Crown, Zap, DollarSign, 
  AlertTriangle, Truck, Plug, Tag, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChannableStatsGrid,
  ChannableBulkActions,
} from "@/components/channable";
import { ChannablePageWrapper } from "@/components/channable/ChannablePageWrapper";
import type { ChannableStat } from "@/components/channable/types";
import { ProductDetailModal } from "@/components/suppliers/ProductDetailModal";
import { 
  CatalogProductCard, 
  CatalogFilters, 
  CatalogPagination,
  type CatalogProduct,
  type CatalogFiltersState 
} from "@/components/suppliers/catalog";

// Connecteurs disponibles
const CONNECTORS = [
  { id: 'aliexpress', name: 'AliExpress', icon: '🛒', color: 'bg-orange-500/10 text-orange-600' },
  { id: 'cj_dropshipping', name: 'CJ Dropshipping', icon: '📦', color: 'bg-blue-500/10 text-blue-600' },
  { id: 'bigbuy', name: 'BigBuy', icon: '🇪🇺', color: 'bg-yellow-500/10 text-yellow-600' },
  { id: 'spocket', name: 'Spocket', icon: '🚀', color: 'bg-purple-500/10 text-purple-600' },
  { id: 'printful', name: 'Printful', icon: '🎨', color: 'bg-pink-500/10 text-pink-600' },
  { id: 'zendrop', name: 'Zendrop', icon: '⚡', color: 'bg-green-500/10 text-green-600' },
  { id: 'bts', name: 'BTS Wholesaler', icon: '⚽', color: 'bg-cyan-500/10 text-cyan-600' },
];

type TabFilter = 'all' | 'winners' | 'trending' | 'bestsellers' | 'low_stock';

const DEFAULT_FILTERS: CatalogFiltersState = {
  searchQuery: '',
  selectedSupplier: 'all',
  selectedConnector: 'all',
  selectedCategory: 'all',
  stockFilter: 'all',
  sortBy: 'ai_score',
  priceRange: [0, 1000],
  marginRange: [0, 100],
  onlyWinners: false,
  onlyTrending: false,
  onlyInStock: false,
};

export function EnhancedUnifiedCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Filters state
  const [filters, setFilters] = useState<CatalogFiltersState>({
    ...DEFAULT_FILTERS,
    selectedSupplier: searchParams.get('supplier') || 'all',
    selectedConnector: searchParams.get('connector') || 'all',
    selectedCategory: searchParams.get('category') || 'all',
  });

  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  // Selection
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // Modal
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.selectedSupplier !== 'all') params.set('supplier', filters.selectedSupplier);
    if (filters.selectedConnector !== 'all') params.set('connector', filters.selectedConnector);
    if (filters.selectedCategory !== 'all') params.set('category', filters.selectedCategory);
    setSearchParams(params, { replace: true });
  }, [filters.selectedSupplier, filters.selectedConnector, filters.selectedCategory, setSearchParams]);

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
    staleTime: 5 * 60 * 1000,
  });

  // Load products
  const { data: rawProducts = [], isLoading, refetch } = useQuery({
    queryKey: ['enhanced-catalog', filters.searchQuery, filters.selectedSupplier, filters.stockFilter, filters.sortBy],
    queryFn: async () => {
      let query = (supabase.from('supplier_products') as any)
        .select('*, suppliers(name, country)');

      if (filters.selectedSupplier !== 'all') {
        query = query.eq('supplier_id', filters.selectedSupplier);
      }

      if (filters.searchQuery) {
        query = query.or(`name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%,sku.ilike.%${filters.searchQuery}%`);
      }

      if (filters.stockFilter === 'in_stock') {
        query = query.gt('stock_quantity', 10);
      } else if (filters.stockFilter === 'low_stock') {
        query = query.lte('stock_quantity', 10).gt('stock_quantity', 0);
      } else if (filters.stockFilter === 'out_of_stock') {
        query = query.eq('stock_quantity', 0);
      }

      // Sorting
      if (filters.sortBy === 'price_asc') {
        query = query.order('price', { ascending: true });
      } else if (filters.sortBy === 'price_desc') {
        query = query.order('price', { ascending: false });
      } else if (filters.sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(1000);

      if (error) {
        console.error('Erreur chargement produits:', error);
        throw error;
      }
      
      return (data || []).map((p: any, index: number) => {
        const costPrice = p.cost_price || p.price || 0;
        const retailPrice = p.retail_price || (costPrice > 0 ? costPrice * 1.8 : 0);
        const profit = retailPrice - costPrice;
        const profitMargin = retailPrice > 0 ? (profit / retailPrice) * 100 : 0;
        const aiScore = p.ai_score ?? 0;
        const connectorIndex = index % CONNECTORS.length;
        const stockQty = p.stock_quantity ?? 0;

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
          stock_quantity: stockQty,
          stock_status: stockQty > 10 ? 'in_stock' : stockQty > 0 ? 'low_stock' : 'out_of_stock',
          ai_score: aiScore,
          image_url: p.image_urls?.[0] || p.image_url || '/placeholder.svg',
          images: p.image_urls || (p.image_url ? [p.image_url] : []),
          category: p.category || 'Non classé',
          brand: p.brand || '',
          currency: p.currency || 'EUR',
          shipping_time: p.shipping_time || 'N/A',
          rating: p.rating ?? 0,
          orders_count: p.orders_count ?? 0,
          sku: p.sku || `SKU-${p.id?.slice(0, 6)?.toUpperCase() || index}`,
          is_winner: aiScore > 0.88,
          is_trending: p.is_trending ?? false,
          status: 'active' as const,
          delivery_time: p.shipping_time || 'N/A',
          supplier_rating: p.supplier_rating ?? 0,
        } as CatalogProduct;
      });
    },
    staleTime: 2 * 60 * 1000,
  });

  // Apply all filters
  const filteredProducts = useMemo(() => {
    let filtered = [...rawProducts];

    // Connector filter
    if (filters.selectedConnector !== 'all') {
      filtered = filtered.filter(p => p.connector_id === filters.selectedConnector);
    }

    // Category filter
    if (filters.selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === filters.selectedCategory);
    }

    // Price range
    filtered = filtered.filter(p => 
      p.retail_price >= filters.priceRange[0] && 
      p.retail_price <= filters.priceRange[1]
    );

    // Margin range
    filtered = filtered.filter(p => 
      p.profit_margin >= filters.marginRange[0] && 
      p.profit_margin <= filters.marginRange[1]
    );

    // Quick filters
    if (filters.onlyWinners) {
      filtered = filtered.filter(p => p.is_winner);
    }
    if (filters.onlyTrending) {
      filtered = filtered.filter(p => p.is_trending);
    }
    if (filters.onlyInStock) {
      filtered = filtered.filter(p => p.stock_status === 'in_stock');
    }

    // Tab filter
    switch (activeTab) {
      case 'winners':
        filtered = filtered.filter(p => p.is_winner);
        break;
      case 'trending':
        filtered = filtered.filter(p => p.is_trending);
        break;
      case 'bestsellers':
        filtered = filtered.filter(p => p.orders_count > 500);
        break;
      case 'low_stock':
        filtered = filtered.filter(p => p.stock_status === 'low_stock' || p.stock_status === 'out_of_stock');
        break;
    }

    // Sort
    if (filters.sortBy === 'ai_score') {
      filtered.sort((a, b) => b.ai_score - a.ai_score);
    } else if (filters.sortBy === 'profit') {
      filtered.sort((a, b) => b.profit_margin - a.profit_margin);
    } else if (filters.sortBy === 'bestseller') {
      filtered.sort((a, b) => b.orders_count - a.orders_count);
    }

    return filtered;
  }, [rawProducts, filters, activeTab]);

  // Categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(rawProducts.map(p => p.category).filter(Boolean)));
    return ["all", ...cats.map(c => String(c))];
  }, [rawProducts]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredProducts.length;
    const winners = filteredProducts.filter(p => p.is_winner).length;
    const trending = filteredProducts.filter(p => p.is_trending).length;
    const bestsellers = filteredProducts.filter(p => p.orders_count > 500).length;
    const lowStock = filteredProducts.filter(p => p.stock_status !== 'in_stock').length;
    const avgAiScore = total > 0 ? filteredProducts.reduce((sum, p) => sum + p.ai_score, 0) / total : 0;
    const avgMargin = total > 0 ? filteredProducts.reduce((sum, p) => sum + p.profit_margin, 0) / total : 0;
    
    return { total, winners, trending, bestsellers, lowStock, avgAiScore: Math.round(avgAiScore * 100), avgMargin: avgMargin.toFixed(1) };
  }, [filteredProducts]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, activeTab]);

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (productId: string) => {
      const product = rawProducts.find(p => p.id === productId);
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
          supplierId: filters.selectedSupplier !== 'all' ? filters.selectedSupplier : undefined,
          userId: user.id,
          action: 'sync',
          limit: 0
        }
      });

      if (error) throw error;
      await refetch();
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Synchronisation terminée !",
        description: `${data?.stats?.inserted || 0} produits synchronisés`,
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

  // Handlers
  const handleFiltersChange = useCallback((newFilters: Partial<CatalogFiltersState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setActiveTab('all');
  }, []);

  const handleSelectProduct = useCallback((id: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedProducts.size === paginatedProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(paginatedProducts.map(p => p.id)));
    }
  }, [selectedProducts.size, paginatedProducts]);

  const handleBulkImport = async () => {
    for (const id of selectedProducts) {
      await importMutation.mutateAsync(id);
    }
    setSelectedProducts(new Set());
  };

  const handleBulkExport = () => {
    const selectedData = paginatedProducts.filter(p => selectedProducts.has(p.id));
    const csv = [
      ['Nom', 'SKU', 'Prix Vente', 'Prix Achat', 'Marge', 'Stock', 'Catégorie', 'Fournisseur', 'Score IA'].join(','),
      ...selectedData.map(p => [
        `"${p.name}"`, p.sku, p.retail_price.toFixed(2), p.cost_price.toFixed(2),
        `${p.profit_margin.toFixed(1)}%`, p.stock_quantity, p.category, 
        p.supplier_name, Math.round(p.ai_score * 100)
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `catalogue-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    
    toast({ title: "Export réussi !", description: `${selectedProducts.size} produits exportés` });
  };

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Stats for hero
  const heroStats: ChannableStat[] = [
    { label: "Produits", value: stats.total.toString(), icon: Package, color: "primary" },
    { label: "Winners", value: stats.winners.toString(), icon: Crown, color: "warning" },
    { label: "Score IA", value: `${stats.avgAiScore}%`, icon: Sparkles, color: "info" },
    { label: "Marge Moy.", value: `${stats.avgMargin}%`, icon: DollarSign, color: "success" },
  ];

  const bulkActions = [
    { id: 'import', label: 'Importer', icon: Package, onClick: handleBulkImport },
    { id: 'export', label: 'Exporter CSV', icon: Sparkles, onClick: handleBulkExport },
  ];

  return (
    <>
      <Helmet>
        <title>Catalogue Fournisseurs | ShopOpti</title>
        <meta name="description" content="Catalogue unifié de tous vos fournisseurs avec filtres avancés" />
      </Helmet>

      <ChannablePageWrapper 
        title="Catalogue Fournisseurs" 
        description="Explorez et importez des produits de tous vos fournisseurs connectés"
        heroImage="suppliers"
        badge={{ label: `${stats.total} produits` }}
        actions={
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", syncMutation.isPending && "animate-spin")} />
            {syncMutation.isPending ? "Synchronisation..." : "Synchroniser"}
          </Button>
        }
      >
        {/* Stats */}
        <ChannableStatsGrid stats={heroStats} columns={4} compact />

        {/* Filters */}
        <CatalogFilters
          filters={filters}
          suppliers={suppliers}
          connectors={CONNECTORS}
          categories={categories}
          onFiltersChange={handleFiltersChange}
          onReset={handleResetFilters}
          onSync={() => syncMutation.mutate()}
          isSyncing={syncMutation.isPending}
          totalProducts={rawProducts.length}
          filteredCount={filteredProducts.length}
        />

        {/* Quick Tabs + View Toggle */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabFilter)}>
            <TabsList>
              <TabsTrigger value="all">
                <Package className="h-4 w-4 mr-1.5" />
                Tous ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="winners">
                <Crown className="h-4 w-4 mr-1.5" />
                Winners ({stats.winners})
              </TabsTrigger>
              <TabsTrigger value="trending">
                <TrendingUp className="h-4 w-4 mr-1.5" />
                Tendance ({stats.trending})
              </TabsTrigger>
              <TabsTrigger value="bestsellers">
                <Zap className="h-4 w-4 mr-1.5" />
                Best-sellers ({stats.bestsellers})
              </TabsTrigger>
              <TabsTrigger value="low_stock">
                <AlertTriangle className="h-4 w-4 mr-1.5" />
                Stock faible ({stats.lowStock})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        <AnimatePresence>
          {selectedProducts.size > 0 && (
            <ChannableBulkActions
              selectedCount={selectedProducts.size}
              totalCount={paginatedProducts.length}
              selectedIds={Array.from(selectedProducts)}
              isAllSelected={selectedProducts.size === paginatedProducts.length}
              onSelectAll={handleSelectAll}
              onDeselectAll={() => setSelectedProducts(new Set())}
              actions={bulkActions}
            />
          )}
        </AnimatePresence>

        {/* Products Grid/List */}
        {isLoading ? (
          <div className={cn(
            "grid gap-4",
            viewMode === 'grid' 
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" 
              : "grid-cols-1"
          )}>
            {[...Array(pageSize)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-0">
                  <Skeleton className="aspect-square w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : paginatedProducts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Modifiez vos filtres ou synchronisez vos fournisseurs
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleResetFilters}>
                  Réinitialiser les filtres
                </Button>
                <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
                  <RefreshCw className={cn("h-4 w-4 mr-2", syncMutation.isPending && "animate-spin")} />
                  Synchroniser
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className={cn(
            "grid gap-4",
            viewMode === 'grid' 
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" 
              : "grid-cols-1"
          )}>
            {paginatedProducts.map((product) => (
              <CatalogProductCard
                key={product.id}
                product={product}
                connector={CONNECTORS.find(c => c.id === product.connector_id)}
                isSelected={selectedProducts.has(product.id)}
                isFavorite={favorites.has(product.id)}
                viewMode={viewMode}
                onSelect={handleSelectProduct}
                onFavorite={toggleFavorite}
                onImport={(id) => importMutation.mutate(id)}
                onView={setSelectedProduct}
                isImporting={importMutation.isPending}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && filteredProducts.length > 0 && (
          <CatalogPagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredProducts.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        )}

        {/* Product Detail Modal */}
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
      </ChannablePageWrapper>
    </>
  );
}

export default EnhancedUnifiedCatalog;
