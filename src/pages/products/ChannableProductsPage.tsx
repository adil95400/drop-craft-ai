/**
 * Page Produits style Channable avec design moderne
 * Intègre les règles comme onglet
 */

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUnifiedProducts } from '@/hooks/useUnifiedProducts';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useAuditFilters } from '@/hooks/useAuditFilters';
import { useProductsAudit } from '@/hooks/useProductAuditEngine';
import { ProductsPageWrapper } from '@/components/products/ProductsPageWrapper';
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
import { ProductViewModal } from '@/components/modals/ProductViewModal';
import { SupplierCatalogBrowser } from '@/components/products/SupplierCatalogBrowser';
import {
  ChannablePageLayout,
  ChannableHeroSection,
  ChannableStatsGrid,
  ChannableQuickActions,
  ChannableCategoryFilter,
  ChannableEmptyState
} from '@/components/channable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, Loader2, TrendingUp, AlertCircle, DollarSign, Target, 
  Sparkles, CheckCircle, Filter, Edit3, Wand2, Plus, BarChart3, 
  RefreshCw, Eye, Grid, List, Download, Upload, GitBranch, History, Rss
} from 'lucide-react';
import { useModalContext } from '@/hooks/useModalHelpers';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedProduct } from '@/hooks/useUnifiedProducts';
import { ChannableStat, ChannableQuickAction, ChannableCategory } from '@/components/channable/types';

// Composants règles intégrés
import { CatalogRulesTab } from '@/components/rules/CatalogRulesTab';
import { RulesExecutionHistory } from '@/components/rules/RulesExecutionHistory';
import { FeedRulesDashboard } from '@/components/feed-rules';
import { PriceRulesDashboard } from '@/components/price-rules';
import { RuleBuilder } from '@/components/rules/RuleBuilder';
import { RuleTemplatesDialog } from '@/components/rules/RuleTemplatesDialog';
import { RuleTesterDialog } from '@/components/rules/RuleTesterDialog';
import { useProductRules } from '@/hooks/useProductRules';
import { ProductRule } from '@/lib/rules/ruleTypes';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type MainView = 'products' | 'rules';

export default function ChannableProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
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
  
  // Hook pour les règles
  const { 
    rules, 
    stats: rulesStats, 
    templates,
    isLoading: rulesLoading, 
    toggleRule, 
    deleteRule,
    createRule,
    createFromTemplate,
    isDeleting 
  } = useProductRules();
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'standard' | 'audit'>('standard');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showBulkEnrichment, setShowBulkEnrichment] = useState(false);
  const [expertMode, setExpertMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [viewModalProduct, setViewModalProduct] = useState<UnifiedProduct | null>(null);

  // États pour l'onglet Règles
  const initialMainView = searchParams.get('tab') === 'rules' ? 'rules' : 'products';
  const [mainView, setMainView] = useState<MainView>(initialMainView);
  const [ruleSubTab, setRuleSubTab] = useState<'catalog' | 'pricing' | 'feeds' | 'executions'>('catalog');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [testerOpen, setTesterOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<ProductRule | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

  // Sync URL with tab
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl === 'rules') {
      setMainView('rules');
      const subTab = searchParams.get('subTab');
      if (subTab && ['catalog', 'pricing', 'feeds', 'executions'].includes(subTab)) {
        setRuleSubTab(subTab as any);
      }
    } else {
      setMainView('products');
    }
  }, [searchParams]);

  const handleMainViewChange = useCallback((view: MainView) => {
    setMainView(view);
    if (view === 'rules') {
      setSearchParams({ tab: 'rules', subTab: ruleSubTab });
    } else {
      setSearchParams({});
    }
  }, [setSearchParams, ruleSubTab]);

  const handleRuleSubTabChange = useCallback((subTab: 'catalog' | 'pricing' | 'feeds' | 'executions') => {
    setRuleSubTab(subTab);
    setSearchParams({ tab: 'rules', subTab });
  }, [setSearchParams]);

  // Handlers pour les règles
  const handleEditRule = useCallback((rule: ProductRule) => {
    setSelectedRule(rule);
    setBuilderOpen(true);
  }, []);

  const handleNewRule = useCallback(() => {
    setSelectedRule(undefined);
    setBuilderOpen(true);
  }, []);

  const handleDeleteRule = useCallback((ruleId: string) => {
    setRuleToDelete(ruleId);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDeleteRule = useCallback(() => {
    if (ruleToDelete) {
      deleteRule(ruleToDelete);
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    }
  }, [ruleToDelete, deleteRule]);

  const handleSelectTemplate = useCallback(async (templateId: string) => {
    await createFromTemplate(templateId);
    setTemplatesOpen(false);
  }, [createFromTemplate]);

  const handleTestRule = useCallback((rule: ProductRule) => {
    setSelectedRule(rule);
    setTesterOpen(true);
  }, []);

  const handleDuplicateRule = useCallback((rule: ProductRule) => {
    createRule({
      ...rule,
      id: undefined,
      name: `${rule.name} (copie)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executionCount: 0,
      successCount: 0,
      errorCount: 0,
    } as any);
    toast({ title: 'Règle dupliquée', description: 'La copie a été créée avec succès' });
  }, [createRule, toast]);

  const handleEdit = (product: any) => {
    navigate(`/products/${product.id}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

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

  // Channable Stats
  const productStats: ChannableStat[] = [
    {
      label: 'Total Produits',
      value: stats.total.toLocaleString(),
      icon: Package,
      color: 'primary',
      change: 5.2,
      trend: 'up',
      changeLabel: 'ce mois'
    },
    {
      label: 'Score Qualité',
      value: `${auditStats.averageScore}%`,
      icon: Target,
      color: auditStats.averageScore >= 70 ? 'success' : auditStats.averageScore >= 50 ? 'warning' : 'destructive',
      change: 3,
      trend: 'up',
      changeLabel: 'excellents'
    },
    {
      label: 'À Optimiser',
      value: auditStats.poorCount.toString(),
      icon: AlertCircle,
      color: auditStats.poorCount > 0 ? 'destructive' : 'success',
      changeLabel: 'score < 40'
    },
    {
      label: 'Actifs',
      value: stats.active.toLocaleString(),
      icon: CheckCircle,
      color: 'success',
      change: stats.total > 0 ? ((stats.active / stats.total) * 100) : 0,
      trend: 'neutral',
      changeLabel: '% du total'
    },
    {
      label: 'Stock Faible',
      value: stats.lowStock.toString(),
      icon: AlertCircle,
      color: stats.lowStock > 0 ? 'warning' : 'success',
      changeLabel: 'réassort'
    },
    {
      label: 'Marge Moyenne',
      value: `${stats.avgMargin.toFixed(1)}%`,
      icon: DollarSign,
      color: 'info',
      changeLabel: `${stats.totalProfit.toFixed(0)} €`
    }
  ];

  // Quick Actions
  const quickActions: ChannableQuickAction[] = [
    {
      id: 'add-product',
      label: 'Nouveau produit',
      icon: Plus,
      onClick: () => navigate('/products/create'),
      variant: 'primary'
    },
    {
      id: 'import',
      label: 'Importer',
      icon: Upload,
      onClick: () => toast({ title: 'Import', description: 'Ouverture import' }),
      description: 'CSV/Excel'
    },
    {
      id: 'export',
      label: 'Exporter',
      icon: Download,
      onClick: () => toast({ title: 'Export', description: 'Export en cours' }),
      description: 'Télécharger'
    },
    {
      id: 'enrich',
      label: 'Enrichir IA',
      icon: Wand2,
      onClick: () => setShowBulkEnrichment(true),
      description: 'Optimisation'
    }
  ];

  // Category filters
  const categoryFilters: ChannableCategory[] = [
    { id: 'all', label: 'Tous', count: stats.total, icon: Package },
    { id: 'active', label: 'Actifs', count: stats.active, icon: CheckCircle },
    { id: 'inactive', label: 'Inactifs', count: stats.inactive, icon: AlertCircle },
    { id: 'lowstock', label: 'Stock faible', count: stats.lowStock, icon: AlertCircle },
    { id: 'excellent', label: 'Excellents', count: auditStats.excellentCount, icon: Target },
    { id: 'optimize', label: 'À optimiser', count: auditStats.poorCount, icon: Sparkles }
  ];

  const finalFilteredProducts = viewMode === 'audit' ? auditFilteredProducts : filteredProducts;

  if (isLoading) {
    return (
      <ChannablePageLayout title="Catalogue Produits">
        <div className="flex items-center justify-center min-h-[400px]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
              <div className="absolute inset-0 animate-ping opacity-20">
                <Loader2 className="h-16 w-16 mx-auto text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium">Chargement du catalogue...</p>
              <p className="text-sm text-muted-foreground">Préparation de vos produits</p>
            </div>
          </motion.div>
        </div>
      </ChannablePageLayout>
    );
  }

  return (
    <ChannablePageLayout
      title={mainView === 'products' ? 'Catalogue Produits' : 'Moteur de Règles'}
      metaTitle={mainView === 'products' ? 'Produits' : 'Règles'}
      metaDescription={mainView === 'products' ? 'Gérez et optimisez votre catalogue produits' : 'Automatisez la gestion de vos produits'}
    >
      {/* Hero Section */}
      <ChannableHeroSection
        title={mainView === 'products' ? 'Catalogue Produits' : 'Moteur de Règles'}
        subtitle={mainView === 'products' ? 'Gestion unifiée' : 'Automatisation'}
        description={mainView === 'products' 
          ? 'Gérez, analysez et optimisez tous vos produits depuis une interface centralisée.'
          : 'Automatisez la gestion de vos produits avec des règles intelligentes.'
        }
        badge={{
          label: mainView === 'products' ? `${stats.total} produits` : `${rules.length} règles`,
          icon: mainView === 'products' ? Package : GitBranch
        }}
        primaryAction={{
          label: mainView === 'products' ? 'Nouveau produit' : 'Nouvelle règle',
          onClick: mainView === 'products' ? () => navigate('/products/create') : handleNewRule,
          icon: Plus
        }}
        secondaryAction={mainView === 'products' ? {
          label: 'Actualiser',
          onClick: handleRefresh
        } : {
          label: 'Templates',
          onClick: () => setTemplatesOpen(true)
        }}
        variant="compact"
      />

      {/* Main View Tabs: Products / Rules */}
      <div className="flex items-center gap-2 border-b border-border/50 pb-4">
        <Button
          variant={mainView === 'products' ? 'default' : 'ghost'}
          onClick={() => handleMainViewChange('products')}
          className="gap-2"
        >
          <Package className="h-4 w-4" />
          Produits
          <Badge variant="secondary" className="ml-1">{stats.total}</Badge>
        </Button>
        <Button
          variant={mainView === 'rules' ? 'default' : 'ghost'}
          onClick={() => handleMainViewChange('rules')}
          className="gap-2"
        >
          <GitBranch className="h-4 w-4" />
          Règles
          <Badge variant="secondary" className="ml-1">{rules.length}</Badge>
        </Button>
      </div>

      {/* Contenu selon la vue */}
      {mainView === 'rules' ? (
        /* === VUE RÈGLES === */
        <div className="space-y-6">
          {/* Sub-tabs pour les règles */}
          <Tabs value={ruleSubTab} onValueChange={(v) => handleRuleSubTabChange(v as any)} className="space-y-6">
            <TabsList className="w-full justify-start bg-muted/50 p-1 h-auto flex-wrap">
              <TabsTrigger value="catalog" className="gap-2 py-2">
                <Package className="h-4 w-4" />
                Catalogue
              </TabsTrigger>
              <TabsTrigger value="pricing" className="gap-2 py-2">
                <DollarSign className="h-4 w-4" />
                Prix
              </TabsTrigger>
              <TabsTrigger value="feeds" className="gap-2 py-2">
                <Rss className="h-4 w-4" />
                Feeds
              </TabsTrigger>
              <TabsTrigger value="executions" className="gap-2 py-2">
                <History className="h-4 w-4" />
                Exécutions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="catalog" className="space-y-6">
              <CatalogRulesTab
                rules={rules}
                templates={templates}
                stats={rulesStats}
                isLoading={rulesLoading}
                onNewRule={handleNewRule}
                onEditRule={handleEditRule}
                onTestRule={handleTestRule}
                onDuplicateRule={handleDuplicateRule}
                onDeleteRule={handleDeleteRule}
                onToggleRule={toggleRule}
                onSelectTemplate={handleSelectTemplate}
              />
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <PriceRulesDashboard />
              </motion.div>
            </TabsContent>

            <TabsContent value="feeds" className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <FeedRulesDashboard />
              </motion.div>
            </TabsContent>

            <TabsContent value="executions" className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <RulesExecutionHistory />
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        /* === VUE PRODUITS === */
        <>
          {/* Stats Grid */}
          <ChannableStatsGrid stats={productStats} columns={3} compact />

      {/* Quick Actions & Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <ChannableQuickActions actions={quickActions} variant="compact" />
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant={viewMode === 'standard' ? 'default' : 'outline'}
            onClick={() => setViewMode('standard')}
            size="sm"
            className="gap-2"
          >
            <Grid className="h-4 w-4" />
            Standard
          </Button>
          <Button
            variant={viewMode === 'audit' ? 'default' : 'outline'}
            onClick={() => setViewMode('audit')}
            size="sm"
            className="gap-2"
          >
            <Target className="h-4 w-4" />
            Audit
          </Button>
          <Button
            variant={expertMode ? 'default' : 'outline'}
            onClick={() => setExpertMode(!expertMode)}
            size="sm"
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {expertMode ? 'Expert' : 'Simple'}
          </Button>
          
          <Sheet open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtres
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
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
                }}
                categories={categories}
                suppliers={[]}
                sources={['products', 'imported', 'premium', 'catalog', 'shopify', 'published', 'feed', 'supplier']}
                productCount={products.length}
                filteredCount={finalFilteredProducts.length}
              />
            </SheetContent>
          </Sheet>

          {selectedProducts.length > 0 && (
            <Sheet open={showBulkEdit} onOpenChange={setShowBulkEdit}>
              <SheetTrigger asChild>
                <Button variant="default" size="sm" className="gap-2">
                  <Edit3 className="h-4 w-4" />
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
                  }}
                  onCancel={() => setShowBulkEdit(false)}
                />
              </SheetContent>
            </Sheet>
          )}

          <SupplierCatalogBrowser />
        </div>
      </div>

      {/* Category Filter Pills */}
      <ChannableCategoryFilter
        categories={categoryFilters}
        selectedCategory={activeTab}
        onCategoryChange={(cat) => {
          setActiveTab(cat);
          if (cat === 'all') {
            resetFilters();
          } else if (cat === 'active') {
            updateFilter('status', 'active');
          } else if (cat === 'inactive') {
            updateFilter('status', 'inactive');
          } else if (cat === 'lowstock') {
            updateFilter('lowStock', true);
          } else if (cat === 'excellent' || cat === 'optimize') {
            setViewMode('audit');
          }
        }}
        variant="pills"
        showAll={false}
      />

      {/* Low Stock Alert */}
      {stats.lowStock > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-orange-200 bg-gradient-to-r from-orange-50/50 to-yellow-50/50 dark:from-orange-950/20 dark:to-yellow-950/20 dark:border-orange-900/50">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {stats.lowStock} produit(s) en stock faible
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Pensez à réapprovisionner pour éviter les ruptures
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => updateFilter('lowStock', true)}
                  className="bg-background"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Voir les produits
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Content */}
      {viewMode === 'audit' ? (
        <Tabs defaultValue="quality" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="quality" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Qualité
            </TabsTrigger>
            <TabsTrigger value="filters" className="gap-2">
              <Target className="h-4 w-4" />
              Filtres
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
              Liste ({finalFilteredProducts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quality" className="space-y-6">
            <CatalogQualityDashboard products={products} />
          </TabsContent>

          <TabsContent value="duplicates" className="space-y-6">
            {expertMode ? (
              <DuplicateDetector products={products} />
            ) : (
              <ChannableEmptyState
                icon={AlertCircle}
                title="Mode Expert requis"
                description="Activez le Mode Expert pour accéder au détecteur de doublons"
                action={{
                  label: 'Activer Mode Expert',
                  onClick: () => setExpertMode(true)
                }}
              />
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
              <ChannableEmptyState
                icon={TrendingUp}
                title="Mode Expert requis"
                description="Activez le Mode Expert pour accéder au simulateur d'optimisation"
                action={{
                  label: 'Activer Mode Expert',
                  onClick: () => setExpertMode(true)
                }}
              />
            )}
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
                <Card className="border-border/50 bg-card/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Produits filtrés</span>
                      <Badge variant="secondary">{finalFilteredProducts.length}</Badge>
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
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Tous les produits</span>
                  <Badge variant="secondary">{finalFilteredProducts.length}</Badge>
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
        <Card className="border-border/50 bg-card/50 backdrop-blur shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <span>Catalogue complet</span>
              </div>
              <Badge variant="secondary" className="text-base px-3 py-1">
                {stats.total} produits
              </Badge>
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
        </>
      )}

      {/* Dialogs produits */}
      <BulkEnrichmentDialog
        open={showBulkEnrichment}
        onOpenChange={setShowBulkEnrichment}
        productIds={selectedProducts.length > 0 ? selectedProducts : products.slice(0, 50).map(p => p.id)}
        onComplete={() => {
          setShowBulkEnrichment(false);
          handleRefresh();
        }}
      />

      <ProductsDebugPanel />
      
      <ProductViewModal
        open={!!viewModalProduct}
        onOpenChange={(open) => !open && setViewModalProduct(null)}
        product={viewModalProduct}
        onEdit={() => {
          if (viewModalProduct) {
            handleEdit(viewModalProduct);
            setViewModalProduct(null);
          }
        }}
        onDelete={() => {
          if (viewModalProduct) {
            handleDelete(viewModalProduct.id);
            setViewModalProduct(null);
          }
        }}
        onDuplicate={async () => {
          if (viewModalProduct) {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error('Non authentifié');
              
              const productTitle = viewModalProduct.name || (viewModalProduct as any).title || 'Produit sans nom';
              
              const { error } = await supabase
                .from('products')
                .insert([{
                  user_id: user.id,
                  title: `${productTitle} (copie)`,
                  name: `${productTitle} (copie)`,
                  description: viewModalProduct.description || null,
                  price: viewModalProduct.price || 0,
                  cost_price: viewModalProduct.cost_price || 0,
                  sku: viewModalProduct.sku ? `${viewModalProduct.sku}-COPY` : null,
                  category: viewModalProduct.category || null,
                  image_url: viewModalProduct.image_url || null,
                  stock_quantity: viewModalProduct.stock_quantity || 0,
                  status: 'draft',
                }]);
              
              if (error) throw error;
              
              toast({
                title: '✅ Produit dupliqué',
                description: `"${viewModalProduct.name}" a été copié avec succès`,
              });
              
              setViewModalProduct(null);
              handleRefresh();
            } catch (error) {
              toast({
                title: 'Erreur',
                description: error instanceof Error ? error.message : 'Impossible de dupliquer le produit',
                variant: 'destructive',
              });
            }
          }
        }}
      />

      {/* Dialogs règles */}
      <RuleBuilder
        rule={selectedRule}
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        onSave={() => setBuilderOpen(false)}
      />

      <RuleTemplatesDialog
        open={templatesOpen}
        onOpenChange={setTemplatesOpen}
        onSelectTemplate={handleSelectTemplate}
      />

      {selectedRule && (
        <RuleTesterDialog
          rule={selectedRule}
          open={testerOpen}
          onOpenChange={setTesterOpen}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la règle ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La règle sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteRule} disabled={isDeleting}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ChannablePageLayout>
  );
}
