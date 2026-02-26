/**
 * Page Produits style Channable avec design moderne
 * Architecture refactorisée pour une meilleure maintenabilité
 */

import { useMemo, useState, useCallback, useEffect } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useUnifiedProducts } from '@/hooks/useUnifiedProducts'
import { useProductFilters } from '@/hooks/useProductFilters'
import { useAuditFilters } from '@/hooks/useAuditFilters'
import { useProductsAudit } from '@/hooks/useProductAuditEngine'
import { usePriceRules } from '@/hooks/usePriceRules'
import { BulkEnrichmentDialog } from '@/components/enrichment'
import { ProductsDebugPanel } from '@/components/debug/ProductsDebugPanel'
import { ProductViewModal } from '@/components/modals/ProductViewModal'
import { AdvancedFiltersPanel } from '@/components/products/AdvancedFiltersPanel'
import { BulkEditPanel } from '@/components/products/BulkEditPanel'
import { PlatformExportDialog } from '@/components/products/export/PlatformExportDialog'

import {
  ChannableCategoryFilter,
} from '@/components/channable'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Package, Loader2, Plus, RefreshCw, GitBranch, Edit3, Upload, Trash2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { productsApi } from '@/services/api/client'
import { UnifiedProduct } from '@/hooks/useUnifiedProducts'
import { ChannableCategory } from '@/components/channable/types'

// Composants catalogue refactorisés
import {
  ProductsStatsSection,
  ProductsQuickActionsBar,
  ProductsLowStockAlert,
  ProductsAuditView,
  ProductsStandardView,
  ProductsRulesView
} from '@/components/products/catalog'

// Command Center
import {
  CommandCenterSection,
  SmartFiltersBar,
  useCommandCenterData,
  useSmartFilteredProducts,
  ViewModeSelector,
  useViewModePreference,
  ActionCardType,
  SmartFilterType,
  ViewMode,
  // Phase 3
  AIRecommendationsPanel,
  ROIMiniDashboard,
  StockPredictionsAlert,
  // Phase 4
  BulkActionsBar,
  // V3
  CommandCenterV3,
  PredictiveCommandCenter,
  PrescriptiveCommandCenterV3,
  useAIPriorityEngine,
  useAISortedProducts,
  AISortSelector,
  AISortMode
} from '@/components/products/command-center'

// Stock Predictions Hook
import { useStockPredictions } from '@/hooks/useStockPredictions'

// Composants règles
import { RuleBuilder } from '@/components/rules/RuleBuilder'
import { RuleTemplatesDialog } from '@/components/rules/RuleTemplatesDialog'
import { RuleTesterDialog } from '@/components/rules/RuleTesterDialog'
import { useProductRules } from '@/hooks/useProductRules'
import { ProductRule } from '@/lib/rules/ruleTypes'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type MainView = 'products' | 'rules'

export default function ChannableProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // === DATA HOOKS ===
  const { products, stats, isLoading, error, refetch } = useUnifiedProducts()
  const { filters, filteredProducts, categories, updateFilter, resetFilters, hasActiveFilters } = useProductFilters(products)
  const { 
    filters: auditFilters, 
    filteredProducts: auditFilteredProducts, 
    updateFilter: updateAuditFilter, 
    resetFilters: resetAuditFilters,
    activeCount: auditActiveCount 
  } = useAuditFilters(filteredProducts)
  const { auditResults, stats: auditStats } = useProductsAudit(products)
  
  // Stock Predictions (Phase 3)
  const { criticalAlerts, stats: stockPredictionStats } = useStockPredictions()
  
  // V3: Price Rules for AI Engine
  const { data: priceRules = [] } = usePriceRules()
  const priceRulesActive = priceRules.some((r: any) => r.is_active && r.apply_to === 'all')
  
  // V3: AI Priority Engine
  const aiEngineResult = useAIPriorityEngine({
    products,
    auditResults,
    priceRulesActive
  })
  
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
  } = useProductRules()

  // === UI STATE ===
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const { getStoredMode, setStoredMode } = useViewModePreference()
  const [viewMode, setViewMode] = useState<ViewMode>(getStoredMode())
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [showBulkEnrichment, setShowBulkEnrichment] = useState(false)
  const [showPlatformExport, setShowPlatformExport] = useState(false)
  const [expertMode, setExpertMode] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [viewModalProduct, setViewModalProduct] = useState<UnifiedProduct | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [smartFilter, setSmartFilter] = useState<SmartFilterType>('all')
  const [useV3CommandCenter] = useState(true) // V3 Prescriptive activé par défaut
  
  // V3: AI Sorting State
  const [aiSortMode, setAiSortMode] = useState<AISortMode>('ai_priority')
  const [aiSortAscending, setAiSortAscending] = useState(false)

  // Handler for view mode change with persistence
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode)
    setStoredMode(mode)
  }, [setStoredMode])

  // === RULES STATE ===
  const initialMainView = searchParams.get('tab') === 'rules' ? 'rules' : 'products'
  const [mainView, setMainView] = useState<MainView>(initialMainView)
  const [ruleSubTab, setRuleSubTab] = useState<'catalog' | 'pricing' | 'feeds' | 'executions'>('catalog')
  const [builderOpen, setBuilderOpen] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [testerOpen, setTesterOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<ProductRule | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null)

  // === URL SYNC ===
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab')
    if (tabFromUrl === 'rules') {
      setMainView('rules')
      const subTab = searchParams.get('subTab')
      if (subTab && ['catalog', 'pricing', 'feeds', 'executions'].includes(subTab)) {
        setRuleSubTab(subTab as any)
      }
    } else {
      setMainView('products')
    }
  }, [searchParams])

  // === HANDLERS ===
  const handleMainViewChange = useCallback((view: MainView) => {
    setMainView(view)
    if (view === 'rules') {
      setSearchParams({ tab: 'rules', subTab: ruleSubTab })
    } else {
      setSearchParams({})
    }
  }, [setSearchParams, ruleSubTab])

  const handleRuleSubTabChange = useCallback((subTab: 'catalog' | 'pricing' | 'feeds' | 'executions') => {
    setRuleSubTab(subTab)
    setSearchParams({ tab: 'rules', subTab })
  }, [setSearchParams])

  const handleEditRule = useCallback((rule: ProductRule) => {
    setSelectedRule(rule)
    setBuilderOpen(true)
  }, [])

  const handleNewRule = useCallback(() => {
    setSelectedRule(undefined)
    setBuilderOpen(true)
  }, [])

  const handleDeleteRule = useCallback((ruleId: string) => {
    setRuleToDelete(ruleId)
    setDeleteDialogOpen(true)
  }, [])

  const confirmDeleteRule = useCallback(() => {
    if (ruleToDelete) {
      deleteRule(ruleToDelete)
      setDeleteDialogOpen(false)
      setRuleToDelete(null)
    }
  }, [ruleToDelete, deleteRule])

  const handleSelectTemplate = useCallback(async (templateId: string) => {
    await createFromTemplate(templateId)
    setTemplatesOpen(false)
  }, [createFromTemplate])

  const handleTestRule = useCallback((rule: ProductRule) => {
    setSelectedRule(rule)
    setTesterOpen(true)
  }, [])

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
    } as any)
    toast({ title: 'Règle dupliquée', description: 'La copie a été créée avec succès' })
  }, [createRule, toast])

  const handleEdit = useCallback((product: UnifiedProduct) => {
    navigate(`/products/${product.id}/edit`)
  }, [navigate])

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const handleDelete = useCallback(async (id: string) => {
    setDeleteConfirmId(id)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirmId) return

    try {
      await productsApi.delete(deleteConfirmId)
      
      toast({ title: 'Produit supprimé', description: 'Le produit a été supprimé avec succès' })
      
      await refetch()
      queryClient.invalidateQueries({ queryKey: ['unified-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de supprimer le produit',
        variant: 'destructive'
      })
    }
    setDeleteConfirmId(null)
  }, [deleteConfirmId, toast, refetch, queryClient])

  const handleView = useCallback((product: UnifiedProduct) => {
    setViewModalProduct(product)
  }, [])

  const handleRefresh = useCallback(() => {
    refetch()
    queryClient.invalidateQueries({ queryKey: ['unified-products'] })
    toast({ title: 'Catalogue actualisé' })
  }, [refetch, queryClient, toast])

  const handleBulkDelete = useCallback(async () => {
    if (selectedProducts.length === 0) return

    setIsBulkDeleting(true)
    try {
      const { importExportService } = await import('@/services/importExportService')
      const success = await importExportService.bulkDelete(selectedProducts)
      
      if (success) {
        toast({ 
          title: '✅ Suppression réussie', 
          description: `${selectedProducts.length} produit(s) supprimé(s)` 
        })
        setSelectedProducts([])
        setBulkDeleteDialogOpen(false)
        handleRefresh()
      }
    } catch (error) {
      console.error('Bulk delete error:', error)
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de supprimer les produits',
        variant: 'destructive'
      })
    } finally {
      setIsBulkDeleting(false)
    }
  }, [selectedProducts, toast, handleRefresh])

  // === DERIVED DATA ===
  const categoryFilters: ChannableCategory[] = useMemo(() => [
    { id: 'all', label: 'Tous', count: stats.total, icon: Package },
    { id: 'active', label: 'Actifs', count: stats.active, icon: Package },
    { id: 'inactive', label: 'Inactifs', count: stats.inactive, icon: Package },
    { id: 'lowstock', label: 'Stock faible', count: stats.lowStock, icon: Package },
    { id: 'excellent', label: 'Excellents', count: auditStats.excellentCount, icon: Package },
    { id: 'optimize', label: 'À optimiser', count: auditStats.poorCount, icon: Package }
  ], [stats, auditStats])

  // Command Center data
  const commandCenterData = useCommandCenterData({ 
    products, 
    auditResults 
  })
  
  // Smart filtered products
  const smartFilteredProducts = useSmartFilteredProducts(
    filteredProducts, 
    commandCenterData, 
    smartFilter
  )
  
  // V3: AI Sorted products
  const aiSortedProducts = useAISortedProducts({
    products: smartFilter !== 'all' ? smartFilteredProducts : filteredProducts,
    engineResult: aiEngineResult,
    sortMode: aiSortMode,
    ascending: aiSortAscending
  })

  const finalFilteredProducts = viewMode === 'audit' 
    ? auditFilteredProducts 
    : aiSortedProducts

  // Handler for Command Center card clicks
  const handleCommandCardClick = useCallback((type: ActionCardType, productIds: string[]) => {
    // Apply smart filter based on card type
    const filterMap: Record<ActionCardType, SmartFilterType> = {
      stock: 'at_risk',
      quality: 'at_risk',
      price_rule: 'no_price_rule',
      ai: 'ai_recommended',
      sync: 'not_synced'
    }
    setSmartFilter(filterMap[type])
    toast({ 
      title: `Filtre appliqué`, 
      description: `${productIds.length} produits affichés` 
    })
  }, [toast])

  // Handler for AI Recommendations
  const handleRecommendationAction = useCallback((rec: { productId: string; type: string }) => {
    if (rec.type === 'restock') {
      toast({ title: 'Réapprovisionnement', description: 'Ouverture du module de commande...' })
    } else if (rec.type === 'optimize_content') {
      navigate(`/products/${rec.productId}/edit`)
    } else {
      toast({ title: 'Action', description: `Traitement de l'action: ${rec.type}` })
    }
  }, [toast, navigate])

  // Handler for stock reorder
  const handleStockReorder = useCallback((productId: string, quantity: number) => {
    toast({ 
      title: 'Commander', 
      description: `Commande de ${quantity} unités en cours de préparation` 
    })
  }, [toast])

  // Handler for bulk actions
  const handleBulkAction = useCallback(async (actionId: string, productIds: string[]) => {
    const { importExportService } = await import('@/services/importExportService')
    
    try {
      switch (actionId) {
        case 'apply_price_rule':
          // Appliquer un multiplicateur de prix (ex: +10%)
          await importExportService.bulkUpdatePrices(productIds, 1.10)
          toast({ title: 'Règle de prix appliquée', description: `${productIds.length} produits mis à jour (+10%)` })
          setSelectedProducts([])
          handleRefresh()
          break
        case 'sync_stores':
          await importExportService.bulkUpdateStatus(productIds, 'active')
          toast({ title: 'Synchronisation terminée', description: `${productIds.length} produits activés` })
          setSelectedProducts([])
          handleRefresh()
          break
        case 'optimize_ai':
          setShowBulkEnrichment(true)
          break
        case 'add_tag':
          setShowBulkEdit(true)
          break
        case 'export':
          setShowPlatformExport(true)
          break
        case 'delete':
          setBulkDeleteDialogOpen(true)
          break
        default:
          toast({ title: 'Action', description: `Action ${actionId} sur ${productIds.length} produits` })
      }
    } catch (error) {
      console.error('Bulk action failed:', error)
      toast({ 
        title: 'Erreur', 
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive'
      })
    }
  }, [toast, handleRefresh])

  const handleClearSelection = useCallback(() => {
    setSelectedProducts([])
  }, [])

  // === LOADING STATE ===
  if (isLoading) {
    return (
      <ChannablePageWrapper title="Catalogue Produits" description="Chargement en cours…" heroImage="products" badge={{ label: 'Catalogue', icon: Package }}>
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </ChannablePageWrapper>
    )
  }

  // === RENDER ===
  return (
    <ChannablePageWrapper
      title={mainView === 'products' ? 'Catalogue Produits' : 'Moteur de Règles'}
      description={mainView === 'products' 
        ? `${stats.total} produits — Gérez, analysez et optimisez`
        : `${rules.length} règles — Automatisez la gestion`
      }
      heroImage="products"
      badge={{ label: mainView === 'products' ? 'Catalogue' : 'Règles', icon: mainView === 'products' ? Package : GitBranch }}
      actions={
        mainView === 'rules' ? (
          <>
            <Button size="sm" onClick={handleNewRule} className="gap-1.5 h-9">
              <Plus className="h-4 w-4" />
              Nouvelle règle
            </Button>
            <Button size="sm" variant="outline" onClick={() => setTemplatesOpen(true)} className="h-9">
              Templates
            </Button>
          </>
        ) : undefined
      }
    >
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
        <ProductsRulesView
          rules={rules}
          templates={templates}
          stats={rulesStats}
          isLoading={rulesLoading}
          subTab={ruleSubTab}
          onSubTabChange={handleRuleSubTabChange}
          onNewRule={handleNewRule}
          onEditRule={handleEditRule}
          onTestRule={handleTestRule}
          onDuplicateRule={handleDuplicateRule}
          onDeleteRule={handleDeleteRule}
          onToggleRule={(params) => toggleRule(params)}
          onSelectTemplate={handleSelectTemplate}
        />
      ) : (
        <>
          {/* 🆕 Command Center V3 Prescriptif - Hub de pilotage business */}
          {useV3CommandCenter ? (
            <PrescriptiveCommandCenterV3
              products={products}
              auditResults={auditResults}
              onFilterChange={setSmartFilter}
              onProductSelect={setSelectedProducts}
              isLoading={isLoading}
            />
          ) : (
            <>
              {/* Legacy Command Center V2 */}
              <CommandCenterSection
                products={products}
                auditResults={auditResults}
                onCardClick={handleCommandCardClick}
                isLoading={isLoading}
              />

              {/* Phase 3: IA Prédictive Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  {criticalAlerts.length > 0 && (
                    <StockPredictionsAlert
                      alerts={criticalAlerts}
                      onViewProduct={(id) => {
                        const product = products.find(p => p.id === id)
                        if (product) handleView(product)
                      }}
                      onReorder={handleStockReorder}
                      maxVisible={3}
                    />
                  )}
                  
                  <div className={criticalAlerts.length > 0 ? 'mt-4' : ''}>
                    <ROIMiniDashboard
                      products={products}
                      currency="€"
                      isLoading={isLoading}
                    />
                  </div>
                </div>
                
                <AIRecommendationsPanel
                  recommendations={commandCenterData.recommendations}
                  onActionClick={handleRecommendationAction}
                  onViewProduct={(id) => {
                    const product = products.find(p => p.id === id)
                    if (product) handleView(product)
                  }}
                  maxVisible={5}
                  isLoading={isLoading}
                />
              </div>
            </>
          )}

          {/* 🆕 Smart Filters Bar */}
          <SmartFiltersBar
            activeFilter={smartFilter}
            onFilterChange={setSmartFilter}
            data={commandCenterData}
            totalProducts={stats.total}
          />

          {/* Stats Grid */}
          <ProductsStatsSection 
            stats={{
              total: stats.total,
              active: stats.active,
              inactive: stats.inactive,
              lowStock: stats.lowStock,
              totalValue: stats.totalValue,
              avgPrice: stats.avgPrice,
              totalMargin: stats.totalProfit
            }} 
            auditStats={{
              averageScore: auditStats.averageScore,
              excellentCount: auditStats.excellentCount,
              goodCount: auditStats.goodCount,
              averageCount: 0,
              poorCount: auditStats.poorCount
            }} 
            compact 
          />

          {/* Quick Actions & View Mode Toggle */}
          <ProductsQuickActionsBar
            onRefresh={handleRefresh}
            onEnrich={() => setShowBulkEnrichment(true)}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            expertMode={expertMode}
            onExpertModeChange={setExpertMode}
            hasActiveFilters={hasActiveFilters || auditActiveCount > 0}
            onShowFilters={() => setShowAdvancedFilters(true)}
            onResetFilters={() => {
              resetFilters()
              resetAuditFilters()
            }}
            isLoading={isLoading}
            isAISorted={['ai_priority', 'risk_first', 'opportunity_first'].includes(aiSortMode)}
          />

          {/* V3: AI Sort Selector */}
          {useV3CommandCenter && viewMode !== 'audit' && (
            <div className="flex items-center justify-end">
              <AISortSelector
                currentMode={aiSortMode}
                ascending={aiSortAscending}
                onModeChange={setAiSortMode}
                onDirectionChange={setAiSortAscending}
                isAIDefault={true}
              />
            </div>
          )}

          {/* Bulk Actions Bar */}
          {selectedProducts.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg"
            >
              <Badge variant="secondary" className="bg-primary/20 text-primary font-medium">
                {selectedProducts.length} sélectionné(s)
              </Badge>
              
              <div className="flex-1" />
              
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => setShowPlatformExport(true)}
              >
                <Upload className="h-4 w-4" />
                Exporter
              </Button>

              <Sheet open={showBulkEdit} onOpenChange={setShowBulkEdit}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Edit3 className="h-4 w-4" />
                    Éditer
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
                  <BulkEditPanel
                    selectedProducts={products.filter(p => selectedProducts.includes(p.id))}
                    onComplete={() => {
                      setShowBulkEdit(false)
                      setSelectedProducts([])
                      handleRefresh()
                    }}
                    onCancel={() => setShowBulkEdit(false)}
                  />
                </SheetContent>
              </Sheet>

              <Button 
                variant="destructive" 
                size="sm" 
                className="gap-2"
                onClick={() => setBulkDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>

              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedProducts([])}
              >
                Désélectionner
              </Button>
            </motion.div>
          )}

          {/* Category Filter Pills */}
          <ChannableCategoryFilter
            categories={categoryFilters}
            selectedCategory={activeTab}
            onCategoryChange={(cat) => {
              setActiveTab(cat)
              if (cat === 'all') {
                resetFilters()
              } else if (cat === 'active') {
                updateFilter('status', 'active')
              } else if (cat === 'inactive') {
                updateFilter('status', 'inactive')
              } else if (cat === 'lowstock') {
                updateFilter('lowStock', true)
              } else if (cat === 'excellent' || cat === 'optimize') {
                setViewMode('audit')
              }
            }}
            variant="pills"
            showAll={false}
          />

          {/* Low Stock Alert */}
          <ProductsLowStockAlert
            lowStockCount={stats.lowStock}
            onViewLowStock={() => updateFilter('lowStock', true)}
          />

          {/* Main Content */}
          {viewMode === 'audit' ? (
            <ProductsAuditView
              products={finalFilteredProducts}
              allProducts={products}
              filteredProducts={auditFilteredProducts}
              expertMode={expertMode}
              onExpertModeChange={setExpertMode}
              selectedProducts={selectedProducts}
              onSelectionChange={setSelectedProducts}
              auditFilters={auditFilters}
              onAuditFilterChange={updateAuditFilter}
              onAuditFiltersReset={resetAuditFilters}
              auditActiveCount={auditActiveCount}
              filters={filters}
              categories={categories}
              onFilterChange={updateFilter}
              onResetFilters={resetFilters}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              onRefresh={handleRefresh}
              isLoading={isLoading}
            />
          ) : (
            <ProductsStandardView
              products={finalFilteredProducts}
              allProducts={products}
              totalCount={stats.total}
              filters={filters}
              categories={categories}
              onFilterChange={updateFilter}
              onResetFilters={resetFilters}
              hasActiveFilters={hasActiveFilters}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              onRefresh={handleRefresh}
              isLoading={isLoading}
              selectedProducts={selectedProducts}
              onSelectionChange={setSelectedProducts}
              viewMode={viewMode}
              productBadges={aiEngineResult.productBadges}
              isAISorted={aiSortMode === 'ai_priority' || aiSortMode === 'risk_first' || aiSortMode === 'opportunity_first'}
            />
          )}
        </>
      )}

      {/* Advanced Filters Sheet */}
      <Sheet open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
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
              scoreMax: 100,
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
              updateFilter('search', newFilters.search)
              updateFilter('category', newFilters.categories.length > 0 ? newFilters.categories[0] : 'all')
              updateFilter('source', newFilters.sources.length > 0 ? newFilters.sources[0] as any : 'all')
              updateFilter('status', newFilters.status.length > 0 ? newFilters.status[0] as any : 'all')
              updateFilter('priceRange', [newFilters.priceMin, newFilters.priceMax])
              updateFilter('lowStock', newFilters.hasLowStock === true)
              updateFilter('sortBy', newFilters.sortBy as any)
              updateFilter('sortOrder', newFilters.sortOrder)
            }}
            categories={categories}
            suppliers={[]}
            sources={['products', 'imported', 'premium', 'catalog', 'shopify', 'published', 'feed', 'supplier']}
            productCount={products.length}
            filteredCount={finalFilteredProducts.length}
          />
        </SheetContent>
      </Sheet>

      {/* Dialogs produits */}
      <BulkEnrichmentDialog
        open={showBulkEnrichment}
        onOpenChange={setShowBulkEnrichment}
        productIds={selectedProducts}
        onComplete={() => {
          setShowBulkEnrichment(false)
          setSelectedProducts([])
          handleRefresh()
        }}
      />

      <ProductsDebugPanel />
      
      <ProductViewModal
        open={!!viewModalProduct}
        onOpenChange={(open) => !open && setViewModalProduct(null)}
        product={viewModalProduct}
        aiBadge={viewModalProduct ? aiEngineResult.productBadges.get(viewModalProduct.id) : undefined}
        onEdit={() => {
          if (viewModalProduct) {
            handleEdit(viewModalProduct)
            setViewModalProduct(null)
          }
        }}
        onDelete={() => {
          if (viewModalProduct) {
            handleDelete(viewModalProduct.id)
            setViewModalProduct(null)
          }
        }}
        onDuplicate={async () => {
          if (viewModalProduct) {
            try {
              const { data: { user } } = await supabase.auth.getUser()
              if (!user) throw new Error('Non authentifié')
              
              const productTitle = viewModalProduct.name || (viewModalProduct as any).title || 'Produit sans nom'
              
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
                }])
              
              if (error) throw error
              
              toast({
                title: '✅ Produit dupliqué',
                description: `"${viewModalProduct.name}" a été copié avec succès`,
              })
              
              setViewModalProduct(null)
              handleRefresh()
            } catch (error) {
              toast({
                title: 'Erreur',
                description: error instanceof Error ? error.message : 'Impossible de dupliquer le produit',
                variant: 'destructive',
              })
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

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {selectedProducts.length} produit(s) ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Tous les produits sélectionnés seront définitivement supprimés de votre catalogue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete} 
              disabled={isBulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Platform Export Dialog */}
      <PlatformExportDialog
        open={showPlatformExport}
        onOpenChange={setShowPlatformExport}
        productIds={selectedProducts}
        productNames={products
          .filter(p => selectedProducts.includes(p.id))
          .map(p => p.name)}
        onSuccess={() => {
          setSelectedProducts([])
          toast({ title: 'Export terminé', description: 'Les produits ont été exportés avec succès' })
        }}
      />

      {/* Bulk Actions Bar - Phase 4 */}
      <BulkActionsBar
        selectedCount={selectedProducts.length}
        selectedIds={selectedProducts}
        onClear={handleClearSelection}
        onAction={handleBulkAction}
        isVisible={selectedProducts.length > 0}
      />

      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => { if (!open) setDeleteConfirmId(null) }}
        title="Supprimer ce produit ?"
        description="Le produit sera définitivement supprimé."
        confirmText="Supprimer"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </ChannablePageWrapper>
  )
}
