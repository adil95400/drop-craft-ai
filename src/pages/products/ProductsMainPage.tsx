/**
 * Page principale de gestion des produits - Design moderne premium
 * Utilise le hook unifié et le wrapper pour toutes les actions
 */

import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUnifiedProducts } from '@/hooks/useUnifiedProducts';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useAuditFilters } from '@/hooks/useAuditFilters';
import { useProductsAudit } from '@/hooks/useProductAuditEngine';
import { ProductsPageWrapper } from '@/components/products/ProductsPageWrapper';
import { BulkEditPanel } from '@/components/products/BulkEditPanel';
import { BulkEnrichmentDialog } from '@/components/enrichment';
import { AdvancedFiltersPanel } from '@/components/products/AdvancedFiltersPanel';
import { ProductViewModal } from '@/components/modals/ProductViewModal';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { 
  Package, Loader2, TrendingUp, AlertCircle, Archive, DollarSign, 
  Target, Sparkles, CheckCircle, Filter, Edit3, Wand2, Plus,
  LayoutGrid, List, RefreshCw, Search, Zap, BarChart3, 
  ShoppingBag, Layers, Star, Eye, Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedProduct } from '@/hooks/useUnifiedProducts';
import { Helmet } from 'react-helmet-async';

// Composant de carte statistique moderne
interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  onClick?: () => void;
  delay?: number;
}

function StatCard({ label, value, change, changeType = 'positive', icon: Icon, color, onClick, delay = 0 }: StatCardProps) {
  const colorMap = {
    primary: {
      bg: 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent',
      border: 'border-primary/20 hover:border-primary/40',
      icon: 'bg-primary/10 text-primary',
      glow: 'group-hover:shadow-primary/20'
    },
    success: {
      bg: 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent',
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      icon: 'bg-emerald-500/10 text-emerald-500',
      glow: 'group-hover:shadow-emerald-500/20'
    },
    warning: {
      bg: 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent',
      border: 'border-amber-500/20 hover:border-amber-500/40',
      icon: 'bg-amber-500/10 text-amber-500',
      glow: 'group-hover:shadow-amber-500/20'
    },
    danger: {
      bg: 'bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent',
      border: 'border-red-500/20 hover:border-red-500/40',
      icon: 'bg-red-500/10 text-red-500',
      glow: 'group-hover:shadow-red-500/20'
    },
    info: {
      bg: 'bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent',
      border: 'border-blue-500/20 hover:border-blue-500/40',
      icon: 'bg-blue-500/10 text-blue-500',
      glow: 'group-hover:shadow-blue-500/20'
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent',
      border: 'border-purple-500/20 hover:border-purple-500/40',
      icon: 'bg-purple-500/10 text-purple-500',
      glow: 'group-hover:shadow-purple-500/20'
    }
  };

  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer p-5 rounded-2xl border backdrop-blur-sm transition-all duration-300",
        "shadow-sm hover:shadow-xl",
        colors.bg,
        colors.border,
        colors.glow
      )}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/5 to-transparent" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2.5 rounded-xl", colors.icon)}>
            <Icon className="h-5 w-5" />
          </div>
          {change && (
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px] px-2 py-0.5 font-medium border-none",
                changeType === 'positive' && 'bg-emerald-500/10 text-emerald-600',
                changeType === 'negative' && 'bg-red-500/10 text-red-600',
                changeType === 'neutral' && 'bg-muted text-muted-foreground'
              )}
            >
              {change}
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

// Quick Filter Button Component
function QuickFilterButton({ 
  active, 
  onClick, 
  icon: Icon, 
  label, 
  count 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ElementType; 
  label: string; 
  count?: number;
}) {
  return (
    <Button
      variant={active ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className={cn(
        "gap-2 transition-all duration-200",
        active 
          ? "bg-primary shadow-lg shadow-primary/25" 
          : "bg-background/50 hover:bg-accent border-border/50"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
      {count !== undefined && count > 0 && (
        <Badge variant="secondary" className={cn("ml-1 h-5 min-w-5 p-0 flex items-center justify-center text-[10px]", active && "bg-primary-foreground/20 text-primary-foreground")}>
          {count}
        </Badge>
      )}
    </Button>
  );
}

export default function ProductsMainPage() {
  const navigate = useNavigate();
  const { products, stats, isLoading, error, refetch } = useUnifiedProducts();
  const { filters, filteredProducts, categories, updateFilter, resetFilters, hasActiveFilters } = useProductFilters(products);
  const { 
    filters: auditFilters, 
    filteredProducts: auditFilteredProducts, 
    updateFilter: updateAuditFilter, 
    resetFilters: resetAuditFilters,
    activeCount: auditActiveCount 
  } = useAuditFilters(filteredProducts);
  
  const { auditResults, stats: auditStats } = useProductsAudit(products);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'active' | 'lowStock' | 'toOptimize'>('all');
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showBulkEnrichment, setShowBulkEnrichment] = useState(false);
  const [viewModalProduct, setViewModalProduct] = useState<UnifiedProduct | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleEdit = useCallback((product: UnifiedProduct) => {
    navigate(`/products/${product.id}/edit`);
  }, [navigate]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const product = products.find(p => p.id === id);
      let tableName: 'products' | 'imported_products' | 'catalog_products' = 'products';
      const source = product?.source as string;
      if (source === 'imported' || source === 'imported_products') {
        tableName = 'imported_products';
      } else if (source === 'catalog' || source === 'catalog_products') {
        tableName = 'catalog_products';
      }

      let { error } = await supabase.from(tableName).delete().eq('id', id).eq('user_id', user.id);

      if (error) {
        const tables = ['products', 'imported_products', 'catalog_products'] as const;
        for (const table of tables) {
          if (table === tableName) continue;
          const result = await supabase.from(table).delete().eq('id', id).eq('user_id', user.id);
          if (!result.error) {
            error = null;
            break;
          }
        }
      }

      if (error) throw error;
      
      toast({ title: 'Produit supprimé', description: 'Le produit a été supprimé avec succès' });
      queryClient.invalidateQueries({ queryKey: ['unified-products'] });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de supprimer le produit',
        variant: 'destructive'
      });
    }
  }, [products, toast, queryClient]);

  const handleView = useCallback((product: UnifiedProduct) => {
    setViewModalProduct(product);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    queryClient.invalidateQueries({ queryKey: ['unified-products'] });
    toast({ title: 'Catalogue actualisé', description: `${stats.total} produits chargés` });
    setTimeout(() => setIsRefreshing(false), 500);
  }, [refetch, queryClient, toast, stats.total]);

  // Filtrage selon le mode de vue
  const modeFilteredProducts = useMemo(() => {
    switch (viewMode) {
      case 'active':
        return filteredProducts.filter(p => p.status === 'active');
      case 'lowStock':
        return filteredProducts.filter(p => (p.stock_quantity || 0) < 10);
      case 'toOptimize':
        return filteredProducts.filter(p => ((p as any).ai_score || 50) < 60);
      default:
        return filteredProducts;
    }
  }, [filteredProducts, viewMode]);

  // Filtrer par recherche
  const displayProducts = useMemo(() => {
    if (!searchTerm) return modeFilteredProducts;
    const search = searchTerm.toLowerCase();
    return modeFilteredProducts.filter(p => 
      p.name?.toLowerCase().includes(search) ||
      p.sku?.toLowerCase().includes(search) ||
      p.category?.toLowerCase().includes(search)
    );
  }, [modeFilteredProducts, searchTerm]);

  // Loading state moderne
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 flex items-center justify-center mx-auto">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
            <div className="absolute inset-0 animate-ping opacity-20">
              <div className="h-20 w-20 rounded-full bg-primary/20 mx-auto" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Chargement du catalogue</h3>
            <p className="text-sm text-muted-foreground">Préparation de vos produits...</p>
          </div>
          <Progress value={45} className="w-48 mx-auto h-1.5" />
        </motion.div>
      </div>
    );
  }

  const qualityScore = auditStats.averageScore;
  const lowStockCount = stats.lowStock || 0;
  const toOptimizeCount = auditStats.poorCount || 0;

  return (
    <>
      <Helmet>
        <title>Produits - ShopOpti</title>
        <meta name="description" content="Gérez votre catalogue de produits" />
      </Helmet>
      
      <div className="space-y-6 pb-8">
        {/* Header moderne */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-background to-primary/10 border border-border/50 p-6 md:p-8"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Catalogue Produits</h1>
                    <p className="text-muted-foreground">Gérez et optimisez vos {stats.total} produits</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un produit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-background/80 backdrop-blur border-border/50 h-10"
                  />
                </div>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="bg-background/80 backdrop-blur border-border/50 h-10 w-10"
                      >
                        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Actualiser</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="flex rounded-lg border border-border/50 overflow-hidden bg-background/80 backdrop-blur">
                  <Button
                    variant={displayMode === 'grid' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setDisplayMode('grid')}
                    className="rounded-none h-10 w-10"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={displayMode === 'list' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setDisplayMode('list')}
                    className="rounded-none h-10 w-10"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  onClick={() => navigate('/products/create')}
                  className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 h-10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau produit
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Total Produits"
            value={stats.total}
            icon={Package}
            color="primary"
            onClick={() => setViewMode('all')}
            delay={0}
          />
          <StatCard
            label="Produits Actifs"
            value={stats.active}
            change={`${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%`}
            changeType="positive"
            icon={CheckCircle}
            color="success"
            onClick={() => setViewMode('active')}
            delay={0.05}
          />
          <StatCard
            label="Score Qualité"
            value={`${qualityScore}%`}
            change={auditStats.excellentCount > 0 ? `${auditStats.excellentCount} excellent` : undefined}
            changeType={qualityScore >= 70 ? 'positive' : 'neutral'}
            icon={Star}
            color="purple"
            delay={0.1}
          />
          <StatCard
            label="À Optimiser"
            value={toOptimizeCount}
            change="Score < 60"
            changeType={toOptimizeCount > 0 ? 'negative' : 'neutral'}
            icon={Sparkles}
            color="warning"
            onClick={() => setViewMode('toOptimize')}
            delay={0.15}
          />
          <StatCard
            label="Stock Faible"
            value={lowStockCount}
            change="< 10 unités"
            changeType={lowStockCount > 0 ? 'negative' : 'neutral'}
            icon={AlertCircle}
            color="danger"
            onClick={() => setViewMode('lowStock')}
            delay={0.2}
          />
          <StatCard
            label="Valeur Stock"
            value={`${(stats.totalValue / 1000).toFixed(1)}k€`}
            icon={DollarSign}
            color="info"
            delay={0.25}
          />
        </div>

        {/* Actions et Filtres rapides */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Filtres rapides */}
                <div className="flex flex-wrap items-center gap-2">
                  <QuickFilterButton
                    active={viewMode === 'all'}
                    onClick={() => setViewMode('all')}
                    icon={Layers}
                    label="Tous"
                    count={stats.total}
                  />
                  <QuickFilterButton
                    active={viewMode === 'active'}
                    onClick={() => setViewMode('active')}
                    icon={CheckCircle}
                    label="Actifs"
                    count={stats.active}
                  />
                  <QuickFilterButton
                    active={viewMode === 'lowStock'}
                    onClick={() => setViewMode('lowStock')}
                    icon={AlertCircle}
                    label="Stock faible"
                    count={lowStockCount}
                  />
                  <QuickFilterButton
                    active={viewMode === 'toOptimize'}
                    onClick={() => setViewMode('toOptimize')}
                    icon={Sparkles}
                    label="À optimiser"
                    count={toOptimizeCount}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {selectedProducts.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2"
                    >
                      <Badge variant="secondary" className="bg-primary/10 text-primary font-medium">
                        {selectedProducts.length} sélectionné(s)
                      </Badge>
                      <Sheet open={showBulkEdit} onOpenChange={setShowBulkEdit}>
                        <SheetTrigger asChild>
                          <Button variant="default" size="sm" className="gap-2">
                            <Edit3 className="h-4 w-4" />
                            Éditer
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
                          <SheetHeader>
                            <SheetTitle>Édition en masse</SheetTitle>
                          </SheetHeader>
                          <BulkEditPanel
                            selectedProducts={products.filter(p => selectedProducts.includes(p.id))}
                            onComplete={() => {
                              setShowBulkEdit(false);
                              setSelectedProducts([]);
                              handleRefresh();
                            }}
                            onCancel={() => setShowBulkEdit(false)}
                          />
                        </SheetContent>
                      </Sheet>
                    </motion.div>
                  )}

                  <Sheet open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2 bg-background/50">
                        <Filter className="h-4 w-4" />
                        Filtres avancés
                        {hasActiveFilters && (
                          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>Filtres avancés</SheetTitle>
                      </SheetHeader>
                      <AdvancedFiltersPanel
                        filters={{
                          search: filters.search,
                          categories: filters.category !== 'all' ? [filters.category] : [],
                          suppliers: [],
                          sources: filters.source !== 'all' ? [filters.source] : [],
                          status: filters.status !== 'all' ? [filters.status] : [],
                          priceMin: filters.priceRange[0],
                          priceMax: filters.priceRange[1],
                          marginMin: 0,
                          marginMax: 100,
                          stockMin: 0,
                          stockMax: 10000,
                          ratingMin: 0,
                          scoreMin: 0,
                          scoreMax: auditFilters.seoScoreMax ?? 100,
                          hasImages: null,
                          hasSEO: null,
                          isBestseller: null,
                          isTrending: null,
                          isWinner: null,
                          hasLowStock: filters.lowStock ? true : null,
                          needsOptimization: null,
                          sortBy: filters.sortBy,
                          sortOrder: filters.sortOrder
                        }}
                        onFiltersChange={(newFilters) => {
                          updateFilter('search', newFilters.search);
                          updateFilter('category', newFilters.categories.length > 0 ? newFilters.categories[0] : 'all');
                          updateFilter('source', newFilters.sources.length > 0 ? newFilters.sources[0] as any : 'all');
                          updateFilter('status', newFilters.status.length > 0 ? newFilters.status[0] as any : 'all');
                          updateFilter('priceRange', [newFilters.priceMin, newFilters.priceMax]);
                          updateFilter('lowStock', newFilters.hasLowStock === true);
                          updateFilter('sortBy', newFilters.sortBy as any);
                          updateFilter('sortOrder', newFilters.sortOrder);
                          toast({ title: 'Filtres appliqués' });
                          setShowAdvancedFilters(false);
                        }}
                        categories={categories}
                        suppliers={[]}
                        sources={['products', 'imported', 'premium', 'catalog', 'shopify', 'published', 'feed', 'supplier']}
                        productCount={products.length}
                        filteredCount={displayProducts.length}
                      />
                    </SheetContent>
                  </Sheet>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkEnrichment(true)}
                    className="gap-2 bg-background/50"
                  >
                    <Wand2 className="h-4 w-4" />
                    Enrichir IA
                  </Button>

                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Réinitialiser
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Grille de produits */}
        <AnimatePresence mode="wait">
          {displayProducts.length > 0 ? (
            <motion.div
              key="products"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ProductsPageWrapper
                products={displayProducts}
                allProducts={products}
                filters={filters}
                categories={categories}
                onRefresh={handleRefresh}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                onSelectionChange={setSelectedProducts}
                selectedProducts={selectedProducts}
              />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative overflow-hidden rounded-3xl border-2 border-dashed border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 p-16"
            >
              <div className="absolute inset-0 bg-grid-pattern opacity-5" />
              <div className="relative z-10 text-center">
                <div className="inline-flex p-4 rounded-full bg-muted/50 mb-6">
                  <Package className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Aucun produit trouvé</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {searchTerm 
                    ? `Aucun produit ne correspond à "${searchTerm}"`
                    : viewMode !== 'all'
                      ? 'Aucun produit dans cette catégorie'
                      : 'Commencez par ajouter vos premiers produits'}
                </p>
                <div className="flex gap-3 justify-center">
                  {(searchTerm || viewMode !== 'all') && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm('');
                        setViewMode('all');
                      }}
                    >
                      Voir tous les produits
                    </Button>
                  )}
                  <Button onClick={() => navigate('/products/create')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Ajouter un produit
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals */}
        <BulkEnrichmentDialog
          open={showBulkEnrichment}
          onOpenChange={setShowBulkEnrichment}
          productIds={selectedProducts.length > 0 ? selectedProducts : products.slice(0, 50).map(p => p.id)}
          onComplete={() => {
            setShowBulkEnrichment(false);
            handleRefresh();
          }}
        />

        {viewModalProduct && (
          <ProductViewModal
            product={viewModalProduct}
            open={!!viewModalProduct}
            onOpenChange={() => setViewModalProduct(null)}
          />
        )}
      </div>
    </>
  );
}
