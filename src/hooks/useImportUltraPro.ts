import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface ImportedProduct {
  id: string
  user_id: string
  import_id?: string
  name: string
  description?: string
  price: number
  cost_price?: number
  currency: string
  sku?: string
  category?: string
  supplier_name?: string
  supplier_url?: string
  supplier_product_id?: string
  image_urls?: string[]
  video_urls?: string[]
  tags?: string[]
  keywords?: string[]
  meta_title?: string
  meta_description?: string
  status: 'draft' | 'published' | 'archived'
  review_status: 'pending' | 'approved' | 'rejected'
  ai_optimized?: boolean
  ai_optimization_data?: any
  ai_score?: number
  ai_recommendations?: any
  import_quality_score?: number
  data_completeness_score?: number
  created_at: string
  updated_at: string
  reviewed_at?: string
  published_at?: string
}

export interface ScheduledImport {
  id: string
  user_id: string
  name: string
  platform: string
  frequency: 'daily' | 'weekly' | 'monthly'
  next_execution: string
  last_execution?: string
  is_active: boolean
  filter_config?: any
  optimization_settings?: any
  created_at: string
  updated_at: string
}

export interface AIOptimizationJob {
  id: string
  user_id: string
  job_type: 'image_optimization' | 'translation' | 'price_optimization' | 'seo_enhancement'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  input_data: any
  output_data?: any
  progress: number
  error_message?: string
  started_at?: string
  completed_at?: string
  created_at: string
}

export const useImportUltraPro = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [bulkImportProgress, setBulkImportProgress] = useState(0)
  const [activeBulkImport, setActiveBulkImport] = useState<string | null>(null)
  const [currentAIJob, setCurrentAIJob] = useState<string | null>(null)

  // Get imported products
  const { data: importedProducts = [], isLoading: isLoadingProducts } = useQuery({
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

  // Get scheduled imports
  const { data: scheduledImports = [], isLoading: isLoadingSchedules } = useQuery({
    queryKey: ['scheduled-imports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_imports')
        .select('*')
        .order('next_execution', { ascending: true })
      
      if (error) throw error
      return data as ScheduledImport[]
    }
  })

  // Get AI optimization jobs
  const { data: aiJobs = [], isLoading: isLoadingAI } = useQuery({
    queryKey: ['ai-optimization-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_optimization_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (error) throw error
      return data as AIOptimizationJob[]
    }
  })

  // Bulk import mutation
  const bulkImport = useMutation({
    mutationFn: async (params: {
      type: 'complete_catalog' | 'trending_products' | 'winners_detected' | 'global_bestsellers'
      platform: string
      filters?: any
    }) => {
      setActiveBulkImport(params.type)
      setBulkImportProgress(0)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Call the appropriate integration edge function based on platform
      let functionName = 'aliexpress-integration'
      if (params.platform === 'bigbuy') functionName = 'bigbuy-integration'
      
      // Update progress to 10% - starting import
      setBulkImportProgress(10)

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          importType: params.type,
          filters: params.filters || {},
          userId: user.id
        }
      })

      if (error) {
        console.error('Import function error:', error)
        throw new Error(`Import failed: ${error.message}`)
      }

      if (!data.success) {
        throw new Error(data.error || 'Import failed')
      }

      // Simulate real-time progress updates
      const progressSteps = [20, 40, 60, 80, 95, 100]
      for (const step of progressSteps) {
        setBulkImportProgress(step)
        await new Promise(resolve => setTimeout(resolve, 800))
      }

      return data.data
    },
    onSuccess: (data) => {
      toast({
        title: "Import en masse terminé",
        description: `${data.imported} produits importés avec succès`,
      })
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      setActiveBulkImport(null)
      setBulkImportProgress(0)
    },
    onError: (error) => {
      toast({
        title: "Erreur d'import",
        description: "Impossible de terminer l'import en masse",
        variant: "destructive",
      })
      setActiveBulkImport(null)
      setBulkImportProgress(0)
    }
  })

  // AI optimization mutation
  const startAIOptimization = useMutation({
    mutationFn: async (params: {
      job_type: AIOptimizationJob['job_type']
      input_data: any
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('ai_optimization_jobs')
        .insert([{
          user_id: user.id,
          job_type: params.job_type,
          input_data: params.input_data,
          status: 'pending'
        }])
        .select()
        .single()
      
      if (error) throw error

      setCurrentAIJob(data.id)

      // Call the AI optimization edge function
      const { error: functionError } = await supabase.functions.invoke('ai-optimizer', {
        body: {
          jobId: data.id,
          jobType: params.job_type,
          inputData: params.input_data
        }
      })

      if (functionError) {
        console.error('AI optimization function error:', functionError)
      }

      return data
    },
    onSuccess: () => {
      toast({
        title: "Optimisation IA lancée",
        description: "Le traitement par IA a commencé",
      })
      queryClient.invalidateQueries({ queryKey: ['ai-optimization-jobs'] })
    },
    onError: (error) => {
      toast({
        title: "Erreur d'optimisation",
        description: "Impossible de lancer l'optimisation IA",
        variant: "destructive"
      })
      setCurrentAIJob(null)
    }
  })

  // Schedule import mutation
  const createScheduledImport = useMutation({
    mutationFn: async (params: {
      name: string
      platform: string
      frequency: ScheduledImport['frequency']
      next_execution: string
      filter_config?: any
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('scheduled_imports')
        .insert([{
          user_id: user.id,
          ...params
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast({
        title: "Import planifié créé",
        description: "Votre import automatique a été configuré",
      })
      queryClient.invalidateQueries({ queryKey: ['scheduled-imports'] })
    }
  })

  // Toggle scheduled import
  const toggleScheduledImport = useMutation({
    mutationFn: async (params: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('scheduled_imports')
        .update({ is_active: params.is_active })
        .eq('id', params.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-imports'] })
    }
  })

  return {
    importedProducts,
    scheduledImports,
    aiJobs,
    isLoadingProducts,
    isLoadingSchedules,
    isLoadingAI,
    bulkImportProgress,
    activeBulkImport,
    bulkImport: bulkImport.mutate,
    isBulkImporting: bulkImport.isPending,
    startAIOptimization: startAIOptimization.mutate,
    isAIOptimizing: startAIOptimization.isPending,
    createScheduledImport: createScheduledImport.mutate,
    toggleScheduledImport: toggleScheduledImport.mutate,
    // Additional methods needed by ImportUltraProInterface
    createImport: bulkImport.mutate,
    bulkOptimizeWithAI: startAIOptimization.mutate,
    isCreatingImport: bulkImport.isPending,
    isCreatingScheduled: createScheduledImport.isPending,
    isBulkOptimizing: startAIOptimization.isPending
  }
}

// Generate mock products for different import types
function generateMockProducts(type: string, platform: string): any[] {
  const baseProducts = [
    {
      source_platform: platform,
      name: "Smartphone Gaming Pro Max",
      description: "Smartphone haute performance pour gaming",
      original_price: 599.99,
      import_price: 350.00,
      suggested_price: 549.99,
      category: "Électronique",
      tags: ["gaming", "performance", "android"],
      image_urls: ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"],
      ai_score: 8.5
    },
    {
      source_platform: platform,
      name: "Écouteurs Sans Fil Premium",
      description: "Écouteurs bluetooth de qualité supérieure",
      original_price: 149.99,
      import_price: 80.00,
      suggested_price: 129.99,
      category: "Audio",
      tags: ["bluetooth", "premium", "wireless"],
      image_urls: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"],
      ai_score: 7.8
    }
  ]

  let count = 100
  if (type === 'complete_catalog') count = 5000
  else if (type === 'trending_products') count = 1000
  else if (type === 'winners_detected') count = 150

  return Array.from({ length: count }, (_, i) => ({
    ...baseProducts[i % baseProducts.length],
    name: `${baseProducts[i % baseProducts.length].name} - Variant ${i + 1}`,
    original_product_id: `${platform}_${Date.now()}_${i}`,
    sku: `SKU-${platform.toUpperCase()}-${i + 1}`
  }))
}