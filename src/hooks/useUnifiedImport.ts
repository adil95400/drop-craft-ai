import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface ImportedProduct {
  id: string
  user_id: string
  name: string
  description?: string
  price: number
  cost_price?: number
  currency?: string
  category?: string
  brand?: string
  sku?: string
  status: 'draft' | 'published' | 'archived'
  stock_quantity?: number
  supplier_name?: string
  image_urls?: string[]
  tags?: string[]
  variant_group?: string
  variant_name?: string
  created_at: string
  updated_at: string
}

export interface ImportHistoryRecord {
  id: string
  user_id: string
  platform: string
  source_url: string
  status: string
  products_imported: number
  products_failed: number
  error_message: string
  settings: any
  created_at: string
}

export interface ImportOptions {
  type: 'csv' | 'shopify' | 'api'
  file?: File
  url?: string
  shopifyConfig?: {
    includeVariants: boolean
    filters?: any
  }
}

export const useUnifiedImport = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState(0)
  const [currentImportId, setCurrentImportId] = useState<string | null>(null)

  // Fetch imported products
  const { 
    data: importedProducts = [], 
    isLoading: isLoadingProducts,
    refetch: refetchProducts
  } = useQuery({
    queryKey: ['imported-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('imported_products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as ImportedProduct[]
    }
  })

  // Fetch import history
  const { 
    data: importHistory = [], 
    isLoading: isLoadingHistory,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ['import-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data || []
    }
  })

  // CSV Import
  const csvImportMutation = useMutation({
    mutationFn: async (file: File) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      setProgress(10)

      const csvContent = await file.text()
      
      setProgress(50)

      // Call edge function
      const { data, error } = await supabase.functions.invoke('unified-import/csv', {
        body: { csvContent }
      })

      if (error) throw error

      setProgress(100)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
      toast({
        title: "Import CSV réussi",
        description: `${data.data.recordsImported} produits importés`
      })
      setTimeout(() => setProgress(0), 2000)
    },
    onError: (error: any) => {
      toast({
        title: "Erreur d'import CSV",
        description: error.message,
        variant: "destructive"
      })
      setProgress(0)
    }
  })

  // Shopify Import
  const shopifyImportMutation = useMutation({
    mutationFn: async (options: { includeVariants: boolean; filters?: any }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      setProgress(10)

      // Call shopify-sync function
      const { data, error } = await supabase.functions.invoke('shopify-complete-import', {
        body: {
          includeVariants: options.includeVariants,
          filters: options.filters
        }
      })

      if (error) throw error

      setProgress(100)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
      toast({
        title: "Import Shopify réussi",
        description: `${data.imported} produits importés (${data.variantsImported || 0} variantes)`
      })
      setTimeout(() => setProgress(0), 2000)
    },
    onError: (error: any) => {
      toast({
        title: "Erreur d'import Shopify",
        description: error.message,
        variant: "destructive"
      })
      setProgress(0)
    }
  })

  // API Import (URL)
  const apiImportMutation = useMutation({
    mutationFn: async (url: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      setProgress(10)

      // Call edge function
      const { data, error } = await supabase.functions.invoke('unified-import/url', {
        body: { url }
      })

      if (error) throw error

      setProgress(100)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
      toast({
        title: "Import API réussi",
        description: `${data.data.recordsImported} produits importés`
      })
      setTimeout(() => setProgress(0), 2000)
    },
    onError: (error: any) => {
      toast({
        title: "Erreur d'import API",
        description: error.message,
        variant: "destructive"
      })
      setProgress(0)
    }
  })

  // Product management
  const deleteProduct = useCallback(async (productId: string) => {
    const { error } = await supabase
      .from('imported_products')
      .delete()
      .eq('id', productId)

    if (error) throw error
    
    queryClient.invalidateQueries({ queryKey: ['imported-products'] })
    toast({
      title: "Produit supprimé",
      description: "Le produit a été supprimé avec succès"
    })
  }, [queryClient, toast])

  const updateProduct = useCallback(async (productId: string, updates: Partial<ImportedProduct>) => {
    const { error } = await supabase
      .from('imported_products')
      .update(updates)
      .eq('id', productId)

    if (error) throw error
    queryClient.invalidateQueries({ queryKey: ['imported-products'] })
  }, [queryClient])

  return {
    // Data
    importedProducts,
    importHistory,
    
    // Loading states
    isLoadingProducts,
    isLoadingHistory,
    isImporting: csvImportMutation.isPending || shopifyImportMutation.isPending || apiImportMutation.isPending,
    progress,
    currentImportId,
    
    // Actions
    importCSV: csvImportMutation.mutate,
    importShopify: shopifyImportMutation.mutate,
    importAPI: apiImportMutation.mutate,
    deleteProduct,
    updateProduct,
    refetchProducts,
    refetchHistory,
    
    // Status
    isCSVImporting: csvImportMutation.isPending,
    isShopifyImporting: shopifyImportMutation.isPending,
    isAPIImporting: apiImportMutation.isPending,
  }
}
