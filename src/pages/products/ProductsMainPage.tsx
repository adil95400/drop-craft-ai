/**
 * Page principale de gestion des produits - Design Channable Premium
 * Utilise le hook unifié et le wrapper pour toutes les actions
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUnifiedProducts } from '@/hooks/useUnifiedProducts';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useAuditFilters } from '@/hooks/useAuditFilters';
import { useProductsAudit } from '@/hooks/useProductAuditEngine';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
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
import { ProductsDebugPanel } from '@/components/debug/ProductsDebugPanel';
import { ProductsStatsHeader } from '@/components/products/ProductsStatsHeader';
import { ProductsQuickFilters } from '@/components/products/ProductsQuickFilters';
import { ProductViewModal } from '@/components/modals/ProductViewModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { 
  Package, Loader2, TrendingUp, AlertCircle, Archive, DollarSign, 
  Target, Sparkles, CheckCircle, Filter, Edit3, Wand2, Plus,
  LayoutGrid, List, RefreshCw, Download, Upload, Search, Eye,
  ArrowUpRight, Settings, Zap, BarChart3
} from 'lucide-react';
import { useModalContext } from '@/hooks/useModalHelpers';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedProduct } from '@/hooks/useUnifiedProducts';


// Composant de carte statistique premium
interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
}

function StatCard({ label, value, change, changeType = 'positive', icon: Icon, color, onClick }: StatCardProps) {
  const colorClasses = {
    primary: 'from-primary/20 to-primary/5 border-primary/30 text-primary',
    success: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-500',
    warning: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-500',
    danger: 'from-red-500/20 to-red-500/5 border-red-500/30 text-red-500',
    info: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-500',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "cursor-pointer p-4 rounded-xl border bg-gradient-to-br backdrop-blur-sm transition-all duration-300",
        colorClasses[color]
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn("p-2 rounded-lg bg-background/50")}>
          <Icon className="h-4 w-4" />
        </div>
        {change && (
          <Badge 
            variant="outline" 
            className={cn(
              "text-[10px] px-1.5 py-0.5",
              changeType === 'positive' && 'text-emerald-600 border-emerald-300 bg-emerald-50/50',
              changeType === 'negative' && 'text-red-600 border-red-300 bg-red-50/50',
              changeType === 'neutral' && 'text-muted-foreground border-muted bg-muted/50'
            )}
          >
            {change}
          </Badge>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </motion.div>
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
  
  // Calcul des audits pour tous les produits
  const { auditResults, stats: auditStats } = useProductsAudit(products);
  
  const { openModal } = useModalContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'standard' | 'audit'>('standard');
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showBulkEnrichment, setShowBulkEnrichment] = useState(false);
  const [expertMode, setExpertMode] = useState<boolean>(false);
  const [quickFilter, setQuickFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [viewModalProduct, setViewModalProduct] = useState<UnifiedProduct | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleEdit = (product: any) => {
    navigate(`/products/${product.id}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const product = products.find(p => p.id === id);
      
      // Déterminer la table source en fonction du type de produit
      let tableName: 'products' | 'imported_products' | 'catalog_products' = 'products';
      const source = product?.source as string;
      if (source === 'imported' || source === 'imported_products') {
        tableName = 'imported_products';
      } else if (source === 'catalog' || source === 'catalog_products') {
        tableName = 'catalog_products';
      }

      // Essayer de supprimer de la table déterminée
      let { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      // Si échec, essayer toutes les tables
      if (error) {
        const tables = ['products', 'imported_products', 'catalog_products'] as const;
        for (const table of tables) {
          if (table === tableName) continue;
          const result = await supabase
            .from(table)
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
          if (!result.error) {
            error = null;
            break;
          }
        }
      }

      if (error) throw error;
      
      toast({
        title: 'Produit supprimé',
        description: 'Le produit a été supprimé avec succès'
      });
      
      queryClient.invalidateQueries({ queryKey: ['unified-products'] });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de supprimer le produit',
        variant: 'destructive'
      });
    }
  };

  const handleView = (product: UnifiedProduct) => {
    setViewModalProduct(product);
  };

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['unified-products'] });
    toast({ title: 'Catalogue actualisé' });
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

  const finalFilteredProducts = viewMode === 'audit' ? auditFilteredProducts : filteredProducts;

  // Filtrer par recherche
  const displayProducts = searchTerm 
    ? finalFilteredProducts.filter(p => 
        (p as any).title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p as any).sku?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : finalFilteredProducts;

  return (
    <ChannablePageWrapper
      title="Catalogue Produits"
      subtitle="Gestion centralisée"
      description="Gérez tous vos produits en un seul endroit. Importez, optimisez et publiez sur vos canaux."
      heroImage="products"
      badge={{
        label: `${stats.total} produits`,
        icon: Package
      }}
      actions={
        <>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background/50 border-border/50"
            />
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="bg-background/50 border-border/50"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setDisplayMode(m => m === 'grid' ? 'list' : 'grid')}
            className="bg-background/50 border-border/50"
          >
            {displayMode === 'grid' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </Button>

          <Button
            size="sm"
            onClick={() => navigate('/products/create')}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau produit
          </Button>
        </>
      }
    >
      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Total Produits"
          value={stats.total}
          icon={Package}
          color="primary"
          onClick={() => setViewMode('standard')}
        />
        <StatCard
          label="Score Moyen"
          value={auditStats.averageScore}
          change={auditStats.excellentCount + ' excellents'}
          changeType="positive"
          icon={Target}
          color="info"
          onClick={() => setViewMode('audit')}
        />
        <StatCard
          label="À Corriger"
          value={auditStats.poorCount}
          change="Score < 40"
          changeType={auditStats.poorCount > 0 ? 'negative' : 'neutral'}
          icon={AlertCircle}
          color="danger"
          onClick={() => setViewMode('audit')}
        />
        <StatCard
          label="Actifs"
          value={stats.active}
          change={`${stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(0) : 0}%`}
          changeType="positive"
          icon={CheckCircle}
          color="success"
        />
        <StatCard
          label="Stock Faible"
          value={stats.lowStock}
          change="< 10 unités"
          changeType={stats.lowStock > 0 ? 'negative' : 'neutral'}
          icon={Archive}
          color="warning"
          onClick={() => updateFilter('lowStock', true)}
        />
        <StatCard
          label="Valeur Stock"
          value={`€${(stats.totalValue / 1000).toFixed(1)}k`}
          icon={DollarSign}
          color="primary"
        />
      </div>

      {/* Barre d'actions */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Modes de vue */}
            <div className="flex rounded-lg border border-border/50 overflow-hidden">
              <Button
                variant={viewMode === 'standard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('standard')}
                className="rounded-none"
              >
                <Package className="h-4 w-4 mr-2" />
                Standard
              </Button>
              <Button
                variant={viewMode === 'audit' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('audit')}
                className="rounded-none"
              >
                <Target className="h-4 w-4 mr-2" />
                Audit
              </Button>
            </div>

            <div className="h-6 w-px bg-border/50" />

            {/* Mode Expert */}
            <Button
              variant={expertMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setExpertMode(!expertMode)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {expertMode ? 'Mode Expert' : 'Mode Simple'}
            </Button>

            {/* Filtres avancés */}
            <Sheet open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                      !
                    </Badge>
                  )}
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

            <div className="flex-1" />

            {/* Actions de sélection */}
            {selectedProducts.length > 0 && (
              <>
                <Badge variant="secondary">
                  {selectedProducts.length} sélectionné(s)
                </Badge>
                <Sheet open={showBulkEdit} onOpenChange={setShowBulkEdit}>
                  <SheetTrigger asChild>
                    <Button variant="default" size="sm">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Éditer
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
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
              </>
            )}

            {/* Enrichissement IA */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkEnrichment(true)}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Enrichir IA
            </Button>

          </div>
        </CardContent>
      </Card>

      {/* Grille de produits */}
      <AnimatePresence mode="wait">
        {displayProducts.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 border-2 border-dashed rounded-2xl bg-muted/30"
          >
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucun produit trouvé</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchTerm 
                ? `Aucun produit ne correspond à "${searchTerm}"`
                : 'Commencez par ajouter vos premiers produits'}
            </p>
            <div className="flex gap-3 justify-center">
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  Effacer la recherche
                </Button>
              )}
              <Button onClick={() => navigate('/products/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un produit
              </Button>
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
    </ChannablePageWrapper>
  );
}
