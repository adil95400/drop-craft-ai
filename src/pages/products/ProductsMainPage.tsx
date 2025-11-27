import { useMemo, useState } from 'react';
import { useUnifiedProducts } from '@/hooks/useUnifiedProducts';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useAuditFilters } from '@/hooks/useAuditFilters';
import { ProductsPageWrapper } from '@/components/products/ProductsPageWrapper';
import { CatalogQualityDashboard } from '@/components/products/CatalogQualityDashboard';
import { AdvancedAuditFilters } from '@/components/products/AdvancedAuditFilters';
import { BulkAIActions } from '@/components/products/BulkAIActions';
import { DuplicateDetector } from '@/components/products/DuplicateDetector';
import { OptimizationSimulator } from '@/components/products/OptimizationSimulator';
import { PriorityManager } from '@/components/products/PriorityManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Loader2, TrendingUp, AlertCircle, Archive, DollarSign, Target, Sparkles } from 'lucide-react';
import { useModals } from '@/hooks/useModals';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * Page principale de gestion des produits
 * Utilise le hook unifié et le wrapper pour toutes les actions
 */
export default function ProductsMainPage() {
  const { products, stats, isLoading, error, refetch } = useUnifiedProducts();
  const { filters, filteredProducts, categories, updateFilter, resetFilters, hasActiveFilters } = useProductFilters(products);
  const { 
    filters: auditFilters, 
    filteredProducts: auditFilteredProducts, 
    updateFilter: updateAuditFilter, 
    resetFilters: resetAuditFilters,
    activeCount: auditActiveCount 
  } = useAuditFilters(filteredProducts);
  const { openModal } = useModals();
  const { toast } = useToast();
  const { invalidateQueries } = useQueryClient();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'standard' | 'audit'>('standard');

  const handleEdit = (product: any) => {
    openModal('createProduct', { productId: product.id });
  };

  const handleDelete = async (id: string) => {
    // Confirmation de suppression
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    try {
      const { importExportService } = await import('@/services/importExportService');
      await importExportService.bulkDelete([id]);
      
      toast({
        title: 'Produit supprimé',
        description: 'Le produit a été supprimé avec succès'
      });
      
      // Invalider le cache pour recharger les produits
      invalidateQueries({ queryKey: ['unified-products'] });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de supprimer le produit',
        variant: 'destructive'
      });
    }
  };

  const handleView = (product: any) => {
    openModal('productDetails', { productId: product.id });
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
    invalidateQueries({ queryKey: ['unified-products'] });
  };

  const finalFilteredProducts = viewMode === 'audit' ? auditFilteredProducts : filteredProducts;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6 space-y-6 animate-in fade-in duration-500">
        {/* En-tête optimisé */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Catalogue Produits
            </h1>
            <p className="text-muted-foreground mt-2">
              Gérez tous vos produits en un seul endroit
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'standard' ? 'default' : 'outline'}
              onClick={() => setViewMode('standard')}
              className="gap-2"
            >
              <Package className="h-4 w-4" />
              Vue Standard
            </Button>
            <Button
              variant={viewMode === 'audit' ? 'default' : 'outline'}
              onClick={() => setViewMode('audit')}
              className="gap-2"
            >
              <Target className="h-4 w-4" />
              Vue Audit
            </Button>
          </div>
        </div>

        {/* Statistiques rapides basées sur vraies données */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Produits
                </CardTitle>
                <Package className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {Object.values(stats.bySource).reduce((a, b) => a + b, 0)} au total
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Produits Actifs
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0}% du total
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Stock Faible
                </CardTitle>
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-3xl font-bold",
                stats.lowStock > 0 ? "text-orange-600" : "text-muted-foreground"
              )}>
                {stats.lowStock}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Produits nécessitant un réassort
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Produits Inactifs
                </CardTitle>
                <Archive className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground">{stats.inactive}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Non disponibles à la vente
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Marge Moyenne
                </CardTitle>
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {stats.avgMargin.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Profit: {stats.totalProfit.toFixed(2)} €
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        {stats.lowStock > 0 && (
          <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-900">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-foreground">
                      Attention: {stats.lowStock} produit(s) en stock faible
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Pensez à réapprovisionner pour éviter les ruptures
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilter('lowStock', true)}
                  className="bg-background"
                >
                  Voir les produits
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vue conditionnelle selon le mode */}
        {viewMode === 'audit' ? (
          <Tabs defaultValue="quality" className="space-y-6">
            <TabsList>
              <TabsTrigger value="quality" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Qualité Catalogue
              </TabsTrigger>
              <TabsTrigger value="filters" className="gap-2">
                <Target className="h-4 w-4" />
                Filtres Audit
              </TabsTrigger>
              <TabsTrigger value="duplicates" className="gap-2">
                <AlertCircle className="h-4 w-4" />
                Doublons
              </TabsTrigger>
              <TabsTrigger value="simulator" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Simulateur
              </TabsTrigger>
              <TabsTrigger value="products" className="gap-2">
                <Package className="h-4 w-4" />
                Liste Produits ({finalFilteredProducts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quality" className="space-y-6">
              <CatalogQualityDashboard products={products} />
            </TabsContent>

            <TabsContent value="duplicates" className="space-y-6">
              <DuplicateDetector products={products} />
            </TabsContent>

            <TabsContent value="simulator" className="space-y-6">
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
            </TabsContent>

            <TabsContent value="filters" className="space-y-6">
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
