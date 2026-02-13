import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { importJobsApi } from '@/services/api/client'

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

  // Fetch imported products - transform imported_products table data
  const { 
    data: importedProducts = [], 
    isLoading: isLoadingProducts,
    refetch: refetchProducts
  } = useQuery({
    queryKey: ['imported-products'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('imported_products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Transform to ImportedProduct interface
      return (data || []).map((item: any): ImportedProduct => ({
        id: item.id,
        user_id: item.user_id,
        name: item.product_id || 'Produit importé',
        description: '',
        price: item.price || 0,
        currency: 'EUR',
        category: item.category,
        status: (item.status as any) || 'draft',
        supplier_name: item.source_platform,
        image_urls: [],
        tags: [],
        created_at: item.created_at,
        updated_at: item.created_at
      }))
    }
  })

  // Fetch import history via API V1, with fallback to background_jobs
  const { 
    data: importHistory = [], 
    isLoading: isLoadingHistory,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ['import-history'],
    queryFn: async () => {
      try {
        const resp = await importJobsApi.list({ per_page: 50 })
        return (resp.items || []).map((job: any) => ({
          id: job.job_id || job.id,
          platform: job.name || job.job_type || 'Import',
          source_url: job.source_url || '',
          status: job.status,
          products_imported: job.progress?.success ?? 0,
          products_failed: job.progress?.failed ?? 0,
          error_message: job.error_message || '',
          created_at: job.created_at,
        }))
      } catch {
        // Fallback: query background_jobs directly
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []
        const { data } = await supabase
          .from('background_jobs')
          .select('*')
          .eq('user_id', user.id)
          .in('job_type', ['import', 'csv_import', 'url_import', 'feed_import', 'bulk_import'])
          .order('created_at', { ascending: false })
          .limit(50)
        return (data || []).map((job: any) => ({
          id: job.id,
          platform: job.name || job.job_subtype || job.job_type || 'Import',
          source_url: job.input_data?.url || job.input_data?.source_url || '',
          status: job.status,
          products_imported: job.items_succeeded || 0,
          products_failed: job.items_failed || 0,
          error_message: job.error_message || '',
          created_at: job.created_at,
        }))
      }
    }
  })

  // CSV Import
  const csvImportMutation = useMutation({
    mutationFn: async (file: File) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      setProgress(10)

      const csvContent = await file.text()
      
      setProgress(30)

      // Call CSV import edge function
      const { data, error } = await supabase.functions.invoke('csv-import', {
        body: { 
          csvContent, 
          userId: user.id,
          source: 'manual'
        }
      })

      if (error) throw error

      setProgress(100)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['import-history'] })
      toast({
        title: "Import CSV réussi",
        description: `${data?.successCount || 0} produits importés`
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
        description: `${data?.imported || 0} produits importés (${data?.variantsImported || 0} variantes)`
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

      // Call URL import edge function
      const { data, error } = await supabase.functions.invoke('url-import', {
        body: { url }
      })

      if (error) throw error

      setProgress(100)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['import-history'] })
      toast({
        title: "Import URL réussi",
        description: "Produit importé avec succès"
      })
      setTimeout(() => setProgress(0), 2000)
    },
    onError: (error: any) => {
      toast({
        title: "Erreur d'import URL",
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
      .update({
        category: updates.category,
        price: updates.price,
        status: updates.status
      })
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
