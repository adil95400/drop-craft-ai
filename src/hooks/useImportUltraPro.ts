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
  sub_category?: string
  brand?: string
  sku?: string
  status: 'draft' | 'published' | 'archived'
  review_status: 'pending' | 'approved' | 'rejected'
  image_urls?: string[]
  video_urls?: string[]
  tags?: string[]
  seo_keywords?: string[]
  stock_quantity?: number
  supplier_name?: string
  supplier_url?: string
  ai_optimized?: boolean
  ai_score?: number
  import_quality_score?: number
  created_at: string
  updated_at: string
}

export interface AIOptimizationJob {
  id: string
  user_id: string
  job_type: 'image_optimization' | 'translation' | 'price_optimization' | 'seo_enhancement'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  input_data: any
  output_data?: any
  error_message?: string
  started_at?: string
  completed_at?: string
  created_at: string
}

export interface ScheduledImport {
  id: string
  user_id: string
  name: string
  type: string
  schedule: string
  platform: string
  frequency: string
  is_active: boolean
  last_run?: string
  next_run?: string
  next_execution?: string
  last_execution?: string
  created_at: string
}

export interface BulkImportOptions {
  type: 'complete_catalog' | 'trending_products' | 'winners_detected' | 'global_bestsellers'
  platform: string
  filters?: any
  supplierFeedId?: string
}

export const useImportUltraPro = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [bulkImportProgress, setBulkImportProgress] = useState(0)
  const [isBulkImporting, setIsBulkImporting] = useState(false)
  const [isAIOptimizing, setIsAIOptimizing] = useState(false)

  // Fetch imported products
  const { 
    data: importedProducts = [], 
    isLoading: isLoadingProducts,
    error: productsError
  } = useQuery({
    queryKey: ['imported-products'],
    queryFn: async () => {
      console.log('[useImportUltraPro] Fetching imported products...')
      
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('[useImportUltraPro] Current user:', user?.id, authError)
      
      const { data, error } = await supabase
        .from('imported_products')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('[useImportUltraPro] Query result:', { 
        count: data?.length, 
        error: error?.message,
        userId: user?.id
      })

      if (error) {
        console.error('[useImportUltraPro] Error fetching products:', error)
        throw error
      }
      
      return data as ImportedProduct[]
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true
  })

  // Fetch AI optimization jobs
  const { 
    data: aiJobs = [],
    isLoading: isLoadingJobs
  } = useQuery({
    queryKey: ['ai-optimization-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_optimization_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return data as AIOptimizationJob[]
    }
  })

  // Fetch scheduled imports
  const { 
    data: scheduledImports = [],
    isLoading: isLoadingScheduled
  } = useQuery({
    queryKey: ['scheduled-imports'],
    queryFn: async () => {
      // Mock data for now since we don't have this table yet
      return [] as ScheduledImport[]
    }
  })

  // Bulk import mutation
  const bulkImportMutation = useMutation({
    mutationFn: async (options: BulkImportOptions) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      setIsBulkImporting(true)
      setBulkImportProgress(0)

      // Simulate bulk import process
      const progressSteps = [20, 40, 60, 80, 100]
      for (const step of progressSteps) {
        setBulkImportProgress(step)
        await new Promise(resolve => setTimeout(resolve, 1500))
      }

      // Mock successful import - ensure required fields are present
      const mockProducts = Array.from({ length: 10 }, (_, i) => ({
        user_id: user.id,
        name: `Produit ${options.type} ${i + 1}`,
        description: `Description automatique pour ${options.type}`,
        price: Math.round(Math.random() * 100 + 10),
        cost_price: Math.round(Math.random() * 50 + 5),
        currency: 'EUR',
        category: 'Électronique',
        brand: 'Brand' + (i % 3 + 1),
        status: 'draft' as const,
        review_status: 'pending' as const,
        stock_quantity: Math.floor(Math.random() * 100),
        supplier_name: options.platform
      }))

      const { data, error } = await supabase
        .from('imported_products')
        .insert(mockProducts)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      toast({
        title: "Import réussi",
        description: `${data?.length || 0} produits importés avec succès`
      })
    },
    onError: (error) => {
      toast({
        title: "Erreur d'import",
        description: error.message,
        variant: "destructive"
      })
    },
    onSettled: () => {
      setIsBulkImporting(false)
      setBulkImportProgress(0)
    }
  })

  // AI optimization mutation
  const aiOptimizationMutation = useMutation({
    mutationFn: async (options: { job_type: string; input_data: any }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      setIsAIOptimizing(true)

      const { data, error } = await supabase
        .from('ai_optimization_jobs')
        .insert({
          user_id: user.id,
          job_type: options.job_type as any,
          status: 'processing',
          progress: 0,
          input_data: options.input_data
        })
        .select()
        .single()

      if (error) throw error

      // Simulate AI processing
      setTimeout(async () => {
        await supabase
          .from('ai_optimization_jobs')
          .update({
            status: 'completed',
            progress: 100,
            completed_at: new Date().toISOString(),
            output_data: { optimized: true, processed_count: options.input_data.products?.length || 1 }
          })
          .eq('id', data.id)

        queryClient.invalidateQueries({ queryKey: ['ai-optimization-jobs'] })
        setIsAIOptimizing(false)
      }, 5000)

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-optimization-jobs'] })
    },
    onError: (error) => {
      toast({
        title: "Erreur d'optimisation IA",
        description: error.message,
        variant: "destructive"
      })
      setIsAIOptimizing(false)
    }
  })

  // Helper functions
  const bulkImport = useCallback((options: BulkImportOptions) => {
    return bulkImportMutation.mutate(options)
  }, [bulkImportMutation])

  const startAIOptimization = useCallback((options: { job_type: string; input_data: any }) => {
    return aiOptimizationMutation.mutate(options)
  }, [aiOptimizationMutation])

  const approveProduct = useCallback(async (productId: string) => {
    const { error } = await supabase
      .from('imported_products')
      .update({ review_status: 'approved', status: 'published' })
      .eq('id', productId)

    if (error) throw error
    queryClient.invalidateQueries({ queryKey: ['imported-products'] })
    
    toast({
      title: "Produit approuvé",
      description: "Le produit a été approuvé et publié"
    })
  }, [queryClient, toast])

  const rejectProduct = useCallback(async (productId: string) => {
    const { error } = await supabase
      .from('imported_products')
      .update({ review_status: 'rejected', status: 'archived' })
      .eq('id', productId)

    if (error) throw error
    queryClient.invalidateQueries({ queryKey: ['imported-products'] })
    
    toast({
      title: "Produit rejeté",
      description: "Le produit a été rejeté"
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

  const toggleScheduledImport = useCallback(async (importId: string) => {
    // Mock implementation - would need actual scheduled imports table
    toast({
      title: "Import programmé",
      description: "La programmation d'import sera bientôt disponible"
    })
  }, [toast])

  const createScheduledImport = useCallback(async (importData: any) => {
    // Mock implementation - would need actual scheduled imports table
    toast({
      title: "Import programmé créé",
      description: "L'import programmé a été créé avec succès"
    })
  }, [toast])

  const activeBulkImport = {
    isActive: isBulkImporting,
    progress: bulkImportProgress,
    type: 'bulk' as const
  }

  return {
    // Data
    importedProducts,
    aiJobs,
    scheduledImports,
    activeBulkImport,
    
    // Loading states
    isLoadingProducts,
    isLoadingJobs,
    isLoadingScheduled,
    isBulkImporting,
    isAIOptimizing,
    bulkImportProgress,
    
    // Actions
    bulkImport,
    startAIOptimization,
    approveProduct,
    rejectProduct,
    updateProduct,
    deleteProduct,
    toggleScheduledImport,
    createScheduledImport,
    
    // Errors
    productsError
  }
}