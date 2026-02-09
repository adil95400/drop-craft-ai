/**
 * Hook centralisé pour la logique de la page /products
 * Sépare la logique métier de l'UI pour une meilleure maintenabilité
 */

import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useUnifiedProducts, UnifiedProduct } from '@/hooks/useUnifiedProducts'
import { productsApi } from '@/services/api/client'
import { useProductFilters } from '@/hooks/useProductFilters'
import { useAuditFilters } from '@/hooks/useAuditFilters'
import { useProductsAudit } from '@/hooks/useProductAuditEngine'
import { usePriceRules } from '@/hooks/usePriceRules'
import { useStockPredictions } from '@/hooks/useStockPredictions'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import {
  useAIPriorityEngine,
  useAISortedProducts,
  AISortMode,
  SmartFilterType,
  ViewMode
} from '@/components/products/command-center'

export interface ProductsPageState {
  selectedProducts: string[]
  viewMode: ViewMode
  smartFilter: SmartFilterType
  aiSortMode: AISortMode
  aiSortAscending: boolean
  showAdvancedFilters: boolean
  showBulkEdit: boolean
  showBulkEnrichment: boolean
  showPlatformExport: boolean
  expertMode: boolean
  activeTab: string
  viewModalProduct: UnifiedProduct | null
  bulkDeleteDialogOpen: boolean
  isBulkDeleting: boolean
}

export interface ProductsPageActions {
  setSelectedProducts: (ids: string[]) => void
  setViewMode: (mode: ViewMode) => void
  setSmartFilter: (filter: SmartFilterType) => void
  setAiSortMode: (mode: AISortMode) => void
  setAiSortAscending: (asc: boolean) => void
  setShowAdvancedFilters: (show: boolean) => void
  setShowBulkEdit: (show: boolean) => void
  setShowBulkEnrichment: (show: boolean) => void
  setShowPlatformExport: (show: boolean) => void
  setExpertMode: (expert: boolean) => void
  setActiveTab: (tab: string) => void
  setViewModalProduct: (product: UnifiedProduct | null) => void
  setBulkDeleteDialogOpen: (open: boolean) => void
  handleEdit: (product: UnifiedProduct) => void
  handleDelete: (id: string) => Promise<void>
  handleView: (product: UnifiedProduct) => void
  handleRefresh: () => void
  handleBulkDelete: () => Promise<void>
  handleClearSelection: () => void
  handleDuplicate: (product: UnifiedProduct) => Promise<void>
}

export function useProductsPage() {
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
  const { criticalAlerts, stats: stockPredictionStats } = useStockPredictions()
  const { data: priceRules = [] } = usePriceRules()
  
  const priceRulesActive = useMemo(() => 
    priceRules.some((r: any) => r.is_active && r.apply_to === 'all'),
    [priceRules]
  )

  // === UI STATE ===
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('standard')
  const [smartFilter, setSmartFilter] = useState<SmartFilterType>('all')
  const [aiSortMode, setAiSortMode] = useState<AISortMode>('ai_priority')
  const [aiSortAscending, setAiSortAscending] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [showBulkEnrichment, setShowBulkEnrichment] = useState(false)
  const [showPlatformExport, setShowPlatformExport] = useState(false)
  const [expertMode, setExpertMode] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [viewModalProduct, setViewModalProduct] = useState<UnifiedProduct | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  // V3: AI Priority Engine
  const aiEngineResult = useAIPriorityEngine({
    products,
    auditResults,
    priceRulesActive
  })

  // === HANDLERS ===
  const handleEdit = useCallback((product: UnifiedProduct) => {
    navigate(`/products/${product.id}/edit`)
  }, [navigate])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return

    try {
      await productsApi.delete(id)
      
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
  }, [toast, refetch, queryClient])

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

  const handleClearSelection = useCallback(() => {
    setSelectedProducts([])
  }, [])

  const handleDuplicate = useCallback(async (product: UnifiedProduct) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      const productTitle = product.name || (product as any).title || 'Produit sans nom'
      
      const { error } = await supabase
        .from('products')
        .insert([{
          user_id: user.id,
          title: `${productTitle} (copie)`,
          name: `${productTitle} (copie)`,
          description: product.description || null,
          price: product.price || 0,
          cost_price: product.cost_price || 0,
          sku: product.sku ? `${product.sku}-COPY` : null,
          category: product.category || null,
          image_url: product.image_url || null,
          stock_quantity: product.stock_quantity || 0,
          status: 'draft',
        }])
      
      if (error) throw error
      
      toast({
        title: '✅ Produit dupliqué',
        description: `"${product.name}" a été copié avec succès`,
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
  }, [toast, handleRefresh])

  // V3: AI Sorted products
  const aiSortedProducts = useAISortedProducts({
    products: smartFilter !== 'all' ? filteredProducts : filteredProducts,
    engineResult: aiEngineResult,
    sortMode: aiSortMode,
    ascending: aiSortAscending
  })

  const finalFilteredProducts = viewMode === 'audit' 
    ? auditFilteredProducts 
    : aiSortedProducts

  return {
    // Data
    products,
    stats,
    isLoading,
    error,
    filteredProducts,
    finalFilteredProducts,
    categories,
    auditResults,
    auditStats,
    criticalAlerts,
    stockPredictionStats,
    aiEngineResult,
    
    // Filters
    filters,
    auditFilters,
    hasActiveFilters,
    auditActiveCount,
    updateFilter,
    resetFilters,
    updateAuditFilter,
    resetAuditFilters,
    
    // State
    selectedProducts,
    viewMode,
    smartFilter,
    aiSortMode,
    aiSortAscending,
    showAdvancedFilters,
    showBulkEdit,
    showBulkEnrichment,
    showPlatformExport,
    expertMode,
    activeTab,
    viewModalProduct,
    bulkDeleteDialogOpen,
    isBulkDeleting,
    
    // Setters
    setSelectedProducts,
    setViewMode,
    setSmartFilter,
    setAiSortMode,
    setAiSortAscending,
    setShowAdvancedFilters,
    setShowBulkEdit,
    setShowBulkEnrichment,
    setShowPlatformExport,
    setExpertMode,
    setActiveTab,
    setViewModalProduct,
    setBulkDeleteDialogOpen,
    
    // Handlers
    handleEdit,
    handleDelete,
    handleView,
    handleRefresh,
    handleBulkDelete,
    handleClearSelection,
    handleDuplicate,
  }
}
