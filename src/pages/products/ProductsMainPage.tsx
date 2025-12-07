import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useUnifiedProducts } from '@/hooks/useUnifiedProducts';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useAuditFilters } from '@/hooks/useAuditFilters';
import { useProductsAudit } from '@/hooks/useProductAuditEngine';
import { ProductsPageWrapper } from '@/components/products/ProductsPageWrapper';
import { ProductAuditBadge } from '@/components/products/ProductAuditBadge';
import { CatalogQualityDashboard } from '@/components/products/CatalogQualityDashboard';
import { AdvancedAuditFilters } from '@/components/products/AdvancedAuditFilters';
import { BulkAIActions } from '@/components/products/BulkAIActions';
import { DuplicateDetector } from '@/components/products/DuplicateDetector';
import { OptimizationSimulator } from '@/components/products/OptimizationSimulator';
import { PriorityManager } from '@/components/products/PriorityManager';
import { AdvancedFiltersPanel } from '@/components/products/AdvancedFiltersPanel';
import { BulkEditPanel } from '@/components/products/BulkEditPanel';
import { BulkEnrichmentDialog } from '@/components/enrichment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Package, Loader2, TrendingUp, AlertCircle, Archive, DollarSign, Target, Sparkles, CheckCircle, Filter, Edit3, Wand2 } from 'lucide-react';
import { useModals } from '@/hooks/useModals';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

/**
 * Page principale de gestion des produits
 * Utilise le hook unifié et le wrapper pour toutes les actions
 */
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
  
  // Calcul des audits pour tous les produits
  const { auditResults, stats: auditStats } = useProductsAudit(products);
  
  const { openModal } = useModals();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'standard' | 'audit'>('standard');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showBulkEnrichment, setShowBulkEnrichment] = useState(false);
  const [expertMode, setExpertMode] = useState<boolean>(false);

  const handleEdit = (product: any) => {
    openModal('createProduct', { productId: product.id });
  };

  const handleDelete = async (id: string) => {
    // Confirmation de suppression
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Déterminer la table source du produit
      const product = products.find(p => p.id === id);
      const tableName = product?.source === 'products' ? 'products' : 'imported_products';

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: 'Produit supprimé',
        description: 'Le produit a été supprimé avec succès'
      });
      
      // Invalider le cache pour recharger les produits
      queryClient.invalidateQueries({ queryKey: ['unified-products'] });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de supprimer le produit',
        variant: 'destructive'
      });
    }
  };

  const handleView = (product: any) => {
    navigate(`/products/${product.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] animate-in fade-in duration-300">
        <div className="text-center space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div className="absolute inset-0 animate-ping">
              <Loader2 className="h-12 w-12 mx-auto text-primary/20" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Chargement des produits...</p>
            <p className="text-xs text-muted-foreground">Préparation de votre catalogue</p>
          </div>
        </div>
      </div>
    );
  }

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['unified-products'] });
  };

  const finalFilteredProducts = viewMode === 'audit' ? auditFilteredProducts : filteredProducts;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 animate-in fade-in duration-500">
        {/* En-tête optimisé */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Catalogue Produits
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                Gérez tous vos produits en un seul endroit
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={viewMode === 'standard' ? 'default' : 'outline'}
              onClick={() => setViewMode('standard')}
              size="sm"
              className="gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Vue</span> Standard
            </Button>
            <Button
              variant={viewMode === 'audit' ? 'default' : 'outline'}
              onClick={() => setViewMode('audit')}
              size="sm"
              className="gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Vue</span> Audit
            </Button>
            <Button
              variant={expertMode ? 'default' : 'outline'}
              onClick={() => setExpertMode(!expertMode)}
              size="sm"
              className="gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {expertMode ? 'Expert' : 'Simple'}
            </Button>

            {/* Filtres avancés */}
            <Sheet open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Filtres</span> Avancés
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
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
                  }}
                  categories={categories}
                  suppliers={[]}
                  sources={['products', 'imported', 'premium', 'catalog', 'shopify', 'published', 'feed', 'supplier']}
                  productCount={products.length}
                  filteredCount={finalFilteredProducts.length}
                />
              </SheetContent>
            </Sheet>

            {/* Édition en masse */}
            {selectedProducts.length > 0 && (
              <Sheet open={showBulkEdit} onOpenChange={setShowBulkEdit}>
                <SheetTrigger asChild>
                  <Button variant="default" size="sm" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                    <Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Éditer ({selectedProducts.length})
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
                  <BulkEditPanel
                    selectedProducts={products.filter(p => selectedProducts.includes(p.id))}
                    onComplete={() => {
                      setShowBulkEdit(false);
                      setSelectedProducts([]);
                      handleRefresh();
                      toast({ title: 'Modifications appliquées', description: `${selectedProducts.length} produits mis à jour` });
                    }}
                    onCancel={() => setShowBulkEdit(false)}
                  />
                </SheetContent>
              </Sheet>
            )}

            {/* Enrichissement en masse */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkEnrichment(true)}
              className="gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <Wand2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Enrichir</span>
            </Button>

            <BulkEnrichmentDialog
              open={showBulkEnrichment}
              onOpenChange={setShowBulkEnrichment}
              productIds={selectedProducts.length > 0 ? selectedProducts : products.slice(0, 50).map(p => p.id)}
              onComplete={() => {
                setShowBulkEnrichment(false);
                handleRefresh();
              }}
            />
          </div>
        </div>

        {/* Statistiques rapides basées sur vraies données + Audit */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
          <Card 
            className="hover:shadow-lg hover:scale-105 transition-all duration-300 border-border/50 bg-card/50 backdrop-blur cursor-pointer"
            onClick={() => setViewMode('standard')}
          >
            <CardHeader className="pb-1 sm:pb-3 p-2 sm:p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground truncate">
                  Total
                </CardTitle>
                <Package className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0">
              <div className="text-lg sm:text-3xl font-bold text-foreground">{stats.total}</div>
              <p className="text-[9px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">
                {Object.values(stats.bySource).reduce((a, b) => a + b, 0)} au total
              </p>
            </CardContent>
          </Card>

          {/* Score moyen d'audit */}
          <Card 
            className="hover:shadow-lg hover:scale-105 transition-all duration-300 border-border/50 bg-card/50 backdrop-blur cursor-pointer"
            onClick={() => setViewMode('audit')}
          >
            <CardHeader className="pb-1 sm:pb-3 p-2 sm:p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground truncate">
                  Score
                </CardTitle>
                <Target className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0">
              <div className="text-lg sm:text-3xl font-bold text-purple-600">{auditStats.averageScore}</div>
              <p className="text-[9px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">
                {auditStats.excellentCount} excellents
              </p>
            </CardContent>
          </Card>
          
          {/* Produits à corriger */}
          <Card 
            className="hover:shadow-lg hover:scale-105 transition-all duration-300 border-border/50 bg-card/50 backdrop-blur cursor-pointer"
            onClick={() => setViewMode('audit')}
          >
            <CardHeader className="pb-1 sm:pb-3 p-2 sm:p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground truncate">
                  À Corriger
                </CardTitle>
                <AlertCircle className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0">
              <div className={cn(
                "text-lg sm:text-3xl font-bold",
                auditStats.poorCount > 0 ? "text-red-600" : "text-muted-foreground"
              )}>
                {auditStats.poorCount}
              </div>
              <p className="text-[9px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">
                Score &lt; 40
              </p>
            </CardContent>
          </Card>
          
          <Card 
            className="hover:shadow-lg hover:scale-105 transition-all duration-300 border-border/50 bg-card/50 backdrop-blur cursor-pointer"
            onClick={() => updateFilter('status', 'active')}
          >
            <CardHeader className="pb-1 sm:pb-3 p-2 sm:p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground truncate">
                  Actifs
                </CardTitle>
                <CheckCircle className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0">
              <div className="text-lg sm:text-3xl font-bold text-green-600">{stats.active}</div>
              <p className="text-[9px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">
                {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0}%
              </p>
            </CardContent>
          </Card>
          
          <Card 
            className="hover:shadow-lg hover:scale-105 transition-all duration-300 border-border/50 bg-card/50 backdrop-blur cursor-pointer"
            onClick={() => updateFilter('lowStock', true)}
          >
            <CardHeader className="pb-1 sm:pb-3 p-2 sm:p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground truncate">
                  Stock <span className="hidden sm:inline">Faible</span>
                </CardTitle>
                <AlertCircle className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0">
              <div className={cn(
                "text-lg sm:text-3xl font-bold",
                stats.lowStock > 0 ? "text-orange-600" : "text-muted-foreground"
              )}>
                {stats.lowStock}
              </div>
              <p className="text-[9px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">
                Réassort
              </p>
            </CardContent>
          </Card>
          
          <Card 
            className="hover:shadow-lg hover:scale-105 transition-all duration-300 border-border/50 bg-card/50 backdrop-blur cursor-pointer"
            onClick={() => setViewMode('audit')}
          >
            <CardHeader className="pb-1 sm:pb-3 p-2 sm:p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground truncate">
                  Marge
                </CardTitle>
                <DollarSign className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0">
              <div className="text-lg sm:text-3xl font-bold text-blue-600">
                {stats.avgMargin.toFixed(1)}%
              </div>
              <p className="text-[9px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">
                {stats.totalProfit.toFixed(0)} €
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        {stats.lowStock > 0 && (
          <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-900">
            <CardContent className="p-3 sm:pt-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground text-sm sm:text-base">
                      {stats.lowStock} produit(s) en stock faible
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                      Pensez à réapprovisionner pour éviter les ruptures
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilter('lowStock', true)}
                  className="bg-background w-full sm:w-auto text-xs sm:text-sm"
                >
                  Voir les produits
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vue conditionnelle selon le mode */}
        {viewMode === 'audit' ? (
          <Tabs defaultValue="quality" className="space-y-4 sm:space-y-6">
            <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
              <TabsList className="w-max sm:w-auto">
                <TabsTrigger value="quality" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Qualité</span>
                </TabsTrigger>
                <TabsTrigger value="filters" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                  <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Filtres</span>
                </TabsTrigger>
                <TabsTrigger value="duplicates" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                  <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Doublons</span>
                </TabsTrigger>
                <TabsTrigger value="simulator" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Simulateur</span>
                </TabsTrigger>
                <TabsTrigger value="products" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                  <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Liste</span> ({finalFilteredProducts.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="quality" className="space-y-6">
              <CatalogQualityDashboard products={products} />
            </TabsContent>

            <TabsContent value="duplicates" className="space-y-6">
              {expertMode ? (
                <DuplicateDetector products={products} />
              ) : (
                <Card className="bg-muted/50 border-dashed">
                  <CardContent className="pt-6 text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Activez le <strong>Mode Expert</strong> pour accéder au détecteur de doublons
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="simulator" className="space-y-6">
              {expertMode ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PriorityManager 
                    products={products}
                    onSelectProducts={(ids) => setSelectedProducts(ids)}
                  />
                  <OptimizationSimulator 
                    productIds={selectedProducts.length > 0 ? selectedProducts : products.slice(0, 10).map(p => p.id)}
                    onExecute={handleRefresh}
                  />
                </div>
              ) : (
                <Card className="bg-muted/50 border-dashed">
                  <CardContent className="pt-6 text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Activez le <strong>Mode Expert</strong> pour accéder au simulateur d'optimisation et au gestionnaire de priorités
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="filters" className="space-y-6">
              {!expertMode && (
                <Card className="bg-muted/50 border-dashed">
                  <CardContent className="pt-6 text-center">
                    <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Activez le <strong>Mode Expert</strong> pour accéder aux outils avancés (simulateur, détection doublons, gestionnaire de priorités)
                    </p>
                  </CardContent>
                </Card>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <AdvancedAuditFilters
                    filters={auditFilters}
                    onFilterChange={updateAuditFilter}
                    onReset={resetAuditFilters}
                    activeCount={auditActiveCount}
                  />
                </div>
                <div className="lg:col-span-2 space-y-4">
                  {selectedProducts.length > 0 && (
                    <BulkAIActions
                      selectedProducts={selectedProducts}
                      onComplete={() => {
                        setSelectedProducts([]);
                        handleRefresh();
                      }}
                    />
                  )}
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        Produits filtrés ({finalFilteredProducts.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ProductsPageWrapper
              products={finalFilteredProducts}
              allProducts={products}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              onRefresh={handleRefresh}
              filters={filters}
              categories={categories}
              onFilterChange={updateFilter}
              onResetFilters={resetFilters}
              hasActiveFilters={auditActiveCount > 0}
              onSelectionChange={setSelectedProducts}
              selectedProducts={selectedProducts}
            />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="products" className="space-y-6">
              {selectedProducts.length > 0 && (
                <BulkAIActions
                  selectedProducts={selectedProducts}
                  onComplete={() => {
                    setSelectedProducts([]);
                    handleRefresh();
                  }}
                />
              )}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Tous les produits</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {finalFilteredProducts.length} produit(s)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductsPageWrapper
                    products={finalFilteredProducts}
                    allProducts={products}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                    onRefresh={handleRefresh}
                    filters={filters}
                    categories={categories}
                    onFilterChange={updateFilter}
                    onResetFilters={resetFilters}
                    hasActiveFilters={auditActiveCount > 0}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="border-border/50 bg-card/50 backdrop-blur shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Tous les produits</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {stats.total} produit(s)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductsPageWrapper
                products={filteredProducts}
                allProducts={products}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                onRefresh={handleRefresh}
                filters={filters}
                categories={categories}
                onFilterChange={updateFilter}
                onResetFilters={resetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
