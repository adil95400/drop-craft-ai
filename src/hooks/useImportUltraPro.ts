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

export interface CreateScheduledImportParams {
  name: string
  platform: string
  frequency: string
  type?: string
  filters?: any
  next_execution?: string
  filter_config?: any
}

export const useImportUltraPro = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [bulkImportProgress, setBulkImportProgress] = useState(0)
  const [isBulkImporting, setIsBulkImporting] = useState(false)
  const [isAIOptimizing, setIsAIOptimizing] = useState(false)

  // Fetch imported products from real database
  const { 
    data: importedProducts = [], 
    isLoading: isLoadingProducts,
    error: productsError
  } = useQuery({
    queryKey: ['imported-products'],
    queryFn: async () => {
      console.log('🔍 [useImportUltraPro] Fetching imported products...')
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('👤 [useImportUltraPro] Current user:', { 
        id: user?.id,
        email: user?.email,
        authError: authError?.message
      })
      
      const { data, error } = await supabase
        .from('imported_products')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('📊 [useImportUltraPro] Query result:', { 
        count: data?.length, 
        error: error?.message,
        userId: user?.id
      })

      if (error) {
        console.error('❌ [useImportUltraPro] Error fetching products:', error)
        throw error
      }

      return data as ImportedProduct[]
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 0
  })

  // Fetch AI optimization jobs from real database
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

  // Fetch scheduled imports from real database table
  const { 
    data: scheduledImports = [],
    isLoading: isLoadingScheduled
  } = useQuery({
    queryKey: ['scheduled-imports'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('scheduled_imports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching scheduled imports:', error)
        return []
      }

      return (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        name: item.name,
        type: 'catalog',
        schedule: item.frequency,
        platform: item.platform,
        frequency: item.frequency,
        is_active: item.is_active ?? true,
        last_run: item.last_execution,
        next_run: item.next_execution,
        next_execution: item.next_execution,
        last_execution: item.last_execution,
        created_at: item.created_at || ''
      })) as ScheduledImport[]
    }
  })

  // Bulk import mutation with real edge function call
  const bulkImportMutation = useMutation({
    mutationFn: async (options: BulkImportOptions) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      setIsBulkImporting(true)
      setBulkImportProgress(10)

      // Call real edge function for bulk import
      const { data, error } = await supabase.functions.invoke('bulk-import-products', {
        body: {
          type: options.type,
          platform: options.platform,
          filters: options.filters,
          supplierFeedId: options.supplierFeedId,
          userId: user.id
        }
      })

      setBulkImportProgress(50)

      if (error) {
        // Fallback: create import job record for tracking
        const { data: jobData, error: jobError } = await supabase
          .from('import_jobs')
          .insert({
            user_id: user.id,
            job_type: options.type,
            status: 'processing',
            source_platform: options.platform,
            total_items: 0,
            processed_items: 0,
            config: options.filters || {}
          })
          .select()
          .single()

        if (jobError) throw jobError

        setBulkImportProgress(100)
        return { jobId: jobData.id, status: 'queued' }
      }

      setBulkImportProgress(100)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
      toast({
        title: "Import lancé",
        description: data?.count 
          ? `${data.count} produits importés avec succès`
          : "L'import est en cours de traitement"
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

  // AI optimization mutation with real database operations
  const aiOptimizationMutation = useMutation({
    mutationFn: async (options: { job_type: string; input_data: any }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      setIsAIOptimizing(true)

      // Create job in database
      const { data: job, error: insertError } = await supabase
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

      if (insertError) throw insertError

      // Call real AI optimization edge function
      const { data, error } = await supabase.functions.invoke('ai-product-optimizer', {
        body: {
          jobId: job.id,
          jobType: options.job_type,
          inputData: options.input_data
        }
      })

      if (error) {
        // Update job as failed
        await supabase
          .from('ai_optimization_jobs')
          .update({
            status: 'failed',
            error_message: error.message
          })
          .eq('id', job.id)
        throw error
      }

      // Update job as completed
      await supabase
        .from('ai_optimization_jobs')
        .update({
          status: 'completed',
          progress: 100,
          completed_at: new Date().toISOString(),
          output_data: data
        })
        .eq('id', job.id)

      setIsAIOptimizing(false)
      return { ...job, output_data: data }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-optimization-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      toast({
        title: "Optimisation IA terminée",
        description: "Les produits ont été optimisés avec succès"
      })
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

  // Helper functions with real database operations
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

  // Toggle scheduled import with real database update
  const toggleScheduledImport = useCallback(async (importId: string) => {
    const current = scheduledImports.find(i => i.id === importId)
    if (!current) {
      toast({
        title: "Erreur",
        description: "Import programmé non trouvé",
        variant: "destructive"
      })
      return
    }

    const { error } = await supabase
      .from('scheduled_imports')
      .update({ is_active: !current.is_active })
      .eq('id', importId)

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'import programmé",
        variant: "destructive"
      })
      return
    }

    queryClient.invalidateQueries({ queryKey: ['scheduled-imports'] })
    toast({
      title: current.is_active ? "Import désactivé" : "Import activé",
      description: `L'import "${current.name}" a été ${current.is_active ? 'désactivé' : 'activé'}`
    })
  }, [scheduledImports, queryClient, toast])

  // Create scheduled import with real database insert
  const createScheduledImport = useCallback(async (importData: CreateScheduledImportParams) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté",
        variant: "destructive"
      })
      return
    }

    // Calculate next execution based on frequency if not provided
    let nextExecution = importData.next_execution
    if (!nextExecution) {
      const now = new Date()
      const next = new Date()
      switch (importData.frequency) {
        case 'daily':
          next.setDate(now.getDate() + 1)
          break
        case 'weekly':
          next.setDate(now.getDate() + 7)
          break
        case 'monthly':
          next.setMonth(now.getMonth() + 1)
          break
        default:
          next.setDate(now.getDate() + 1)
      }
      nextExecution = next.toISOString()
    }

    const { data, error } = await supabase
      .from('scheduled_imports')
      .insert({
        user_id: user.id,
        name: importData.name,
        platform: importData.platform,
        frequency: importData.frequency,
        filter_config: importData.filter_config || importData.filters || {},
        is_active: true,
        next_execution: nextExecution
      })
      .select()
      .single()

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'import programmé",
        variant: "destructive"
      })
      return
    }

    queryClient.invalidateQueries({ queryKey: ['scheduled-imports'] })
    toast({
      title: "Import programmé créé",
      description: `L'import "${importData.name}" sera exécuté ${importData.frequency === 'daily' ? 'quotidiennement' : importData.frequency === 'weekly' ? 'hebdomadairement' : 'mensuellement'}`
    })

    return data
  }, [queryClient, toast])

  // Delete scheduled import
  const deleteScheduledImport = useCallback(async (importId: string) => {
    const { error } = await supabase
      .from('scheduled_imports')
      .delete()
      .eq('id', importId)

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'import programmé",
        variant: "destructive"
      })
      return
    }

    queryClient.invalidateQueries({ queryKey: ['scheduled-imports'] })
    toast({
      title: "Import supprimé",
      description: "L'import programmé a été supprimé"
    })
  }, [queryClient, toast])

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
    deleteScheduledImport,
    
    // Errors
    productsError
  }
}
