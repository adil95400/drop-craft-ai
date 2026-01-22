import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useUnifiedStores, Store } from '@/hooks/useUnifiedStores'

export interface MultiStoreImportResult {
  storeId: string
  storeName: string
  success: boolean
  productId?: string
  error?: string
}

export interface MultiStoreImportProgress {
  total: number
  completed: number
  successful: number
  failed: number
  results: MultiStoreImportResult[]
}

export interface ProductImportData {
  title: string
  description?: string
  price?: number
  compare_at_price?: number
  cost_price?: number
  sku?: string
  barcode?: string
  images?: string[]
  video_urls?: string[]
  variants?: any[]
  category?: string
  tags?: string[]
  source_url?: string
  source_platform?: string
  brand?: string
  weight?: number
  dimensions?: { length?: number; width?: number; height?: number }
}

export function useMultiStoreImport() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { stores } = useUnifiedStores()
  
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([])
  const [progress, setProgress] = useState<MultiStoreImportProgress>({
    total: 0,
    completed: 0,
    successful: 0,
    failed: 0,
    results: []
  })

  // Toggle store selection
  const toggleStore = useCallback((storeId: string) => {
    setSelectedStoreIds(prev => 
      prev.includes(storeId) 
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    )
  }, [])

  // Select all stores
  const selectAllStores = useCallback(() => {
    setSelectedStoreIds(stores.filter(s => s.is_active).map(s => s.id))
  }, [stores])

  // Deselect all stores
  const deselectAllStores = useCallback(() => {
    setSelectedStoreIds([])
  }, [])

  // Check if store is selected
  const isStoreSelected = useCallback((storeId: string) => {
    return selectedStoreIds.includes(storeId)
  }, [selectedStoreIds])

  // Get selected stores
  const getSelectedStores = useCallback((): Store[] => {
    return stores.filter(s => selectedStoreIds.includes(s.id))
  }, [stores, selectedStoreIds])

  // Import to single store
  const importToStore = async (
    store: Store, 
    product: ProductImportData
  ): Promise<MultiStoreImportResult> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Prepare product data with store-specific settings
      const storeSettings = store.settings || {}
      const productData = {
        user_id: user.id,
        name: product.title,
        description: product.description || '',
        price: product.price || 0,
        cost_price: product.cost_price || 0,
        sku: product.sku || `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        image_urls: product.images || [],
        video_urls: product.video_urls || [],
        source_url: product.source_url,
        source_platform: product.source_platform,
        brand: product.brand,
        category: product.category,
        variants: product.variants || [],
        status: 'imported',
        currency: store.currency || 'EUR',
        metadata: {
          imported_at: new Date().toISOString(),
          import_source: 'multi-store',
          store_id: store.id,
          store_name: store.name,
          target_platform: storeSettings.platform || store.name.toLowerCase(),
          store_settings: storeSettings,
          tags: product.tags || [],
          compare_at_price: product.compare_at_price,
          weight: product.weight,
          dimensions: product.dimensions
        }
      }

      // Insert into imported_products table
      const { data, error } = await supabase
        .from('imported_products')
        .insert(productData)
        .select('id')
        .single()

      if (error) throw error

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'multi_store_import',
        description: `Produit "${product.title}" importé vers ${store.name}`,
        entity_type: 'imported_product',
        entity_id: data.id,
        details: {
          store_id: store.id,
          store_name: store.name,
          product_title: product.title
        }
      })

      return {
        storeId: store.id,
        storeName: store.name,
        success: true,
        productId: data.id
      }
    } catch (error: any) {
      return {
        storeId: store.id,
        storeName: store.name,
        success: false,
        error: error.message || 'Erreur inconnue'
      }
    }
  }

  // Multi-store import mutation
  const multiStoreImportMutation = useMutation({
    mutationFn: async (product: ProductImportData) => {
      const selectedStores = getSelectedStores()
      
      if (selectedStores.length === 0) {
        throw new Error('Aucune boutique sélectionnée')
      }

      // Reset progress
      setProgress({
        total: selectedStores.length,
        completed: 0,
        successful: 0,
        failed: 0,
        results: []
      })

      const results: MultiStoreImportResult[] = []

      // Import to each store in parallel
      const importPromises = selectedStores.map(async (store) => {
        const result = await importToStore(store, product)
        
        // Update progress
        setProgress(prev => ({
          ...prev,
          completed: prev.completed + 1,
          successful: result.success ? prev.successful + 1 : prev.successful,
          failed: result.success ? prev.failed : prev.failed + 1,
          results: [...prev.results, result]
        }))

        return result
      })

      const allResults = await Promise.all(importPromises)
      results.push(...allResults)

      return {
        total: selectedStores.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['unified-stores'] })

      if (data.failed === 0) {
        toast({
          title: "Import multi-boutiques réussi",
          description: `Produit importé vers ${data.successful} boutique(s)`
        })
      } else if (data.successful > 0) {
        toast({
          title: "Import partiellement réussi",
          description: `${data.successful} réussi(s), ${data.failed} échec(s)`,
          variant: "default"
        })
      } else {
        toast({
          title: "Échec de l'import",
          description: `Aucune boutique n'a pu recevoir le produit`,
          variant: "destructive"
        })
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur d'import",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  return {
    // Store selection
    stores,
    selectedStoreIds,
    toggleStore,
    selectAllStores,
    deselectAllStores,
    isStoreSelected,
    getSelectedStores,
    setSelectedStoreIds,
    
    // Import
    importToMultipleStores: multiStoreImportMutation.mutate,
    importToMultipleStoresAsync: multiStoreImportMutation.mutateAsync,
    isImporting: multiStoreImportMutation.isPending,
    progress,
    
    // Computed
    selectedCount: selectedStoreIds.length,
    hasSelection: selectedStoreIds.length > 0
  }
}
