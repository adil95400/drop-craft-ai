import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface ImportedProduct {
  id: string
  user_id: string
  original_product_id?: string
  source_platform: string
  name: string
  description?: string
  original_price?: number
  import_price?: number
  suggested_price?: number
  currency: string
  sku?: string
  category?: string
  subcategory?: string
  tags?: string[]
  image_urls?: string[]
  supplier_info?: any
  seo_optimized: boolean
  translation_status: 'original' | 'translated' | 'optimized'
  ai_score: number
  competition_level: 'low' | 'medium' | 'high'
  trend_score: number
  status: 'pending' | 'approved' | 'rejected' | 'imported'
  import_job_id?: string
  metadata?: any
  created_at: string
  updated_at: string
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
      type: 'complete_catalog' | 'trending_products' | 'winners_detected'
      platform: string
      filters?: any
    }) => {
      setActiveBulkImport(params.type)
      setBulkImportProgress(0)

      // Simulate bulk import with progress
      const mockProducts = generateMockProducts(params.type, params.platform)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Process in batches
      const batchSize = 50
      let processed = 0
      
      for (let i = 0; i < mockProducts.length; i += batchSize) {
        const batch = mockProducts.slice(i, i + batchSize)
        
        const { error } = await supabase
          .from('imported_products')
          .insert(batch.map(product => ({
            user_id: user.id,
            source_platform: product.source_platform!,
            name: product.name!,
            description: product.description,
            original_price: product.original_price,
            import_price: product.import_price,
            suggested_price: product.suggested_price,
            currency: product.currency || 'EUR',
            sku: product.sku,
            category: product.category,
            subcategory: product.subcategory,
            tags: product.tags,
            image_urls: product.image_urls,
            ai_score: product.ai_score || 0,
            trend_score: product.trend_score || 0,
            competition_level: product.competition_level || 'medium',
            translation_status: product.translation_status || 'original',
            status: product.status || 'pending',
            original_product_id: product.original_product_id
          })))
        
        if (error) throw error
        
        processed += batch.length
        setBulkImportProgress((processed / mockProducts.length) * 100)
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      return { imported: mockProducts.length }
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

      // Simulate AI processing
      setTimeout(async () => {
        await supabase
          .from('ai_optimization_jobs')
          .update({
            status: 'processing',
            started_at: new Date().toISOString(),
            progress: 50
          })
          .eq('id', data.id)
        
        setTimeout(async () => {
          await supabase
            .from('ai_optimization_jobs')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              progress: 100,
              output_data: { processed: true, optimized_count: Math.floor(Math.random() * 100) + 50 }
            })
            .eq('id', data.id)
          
          queryClient.invalidateQueries({ queryKey: ['ai-optimization-jobs'] })
        }, 3000)
      }, 1000)

      return data
    },
    onSuccess: () => {
      toast({
        title: "Optimisation IA lancée",
        description: "Le traitement par IA a commencé",
      })
      queryClient.invalidateQueries({ queryKey: ['ai-optimization-jobs'] })
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
function generateMockProducts(type: string, platform: string): Partial<ImportedProduct>[] {
  const baseProducts = [
    {
      source_platform: platform,
      name: "Smartphone Gaming Pro Max",
      description: "Smartphone haute performance pour gaming",
      original_price: 599.99,
      import_price: 350.00,
      suggested_price: 549.99,
      category: "Électronique",
      subcategory: "Smartphones",
      tags: ["gaming", "performance", "android"],
      image_urls: ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"],
      ai_score: 8.5,
      trend_score: 9.2,
      competition_level: "medium" as const,
      translation_status: "original" as const,
      status: "pending" as const
    },
    {
      source_platform: platform,
      name: "Écouteurs Sans Fil Premium",
      description: "Écouteurs bluetooth de qualité supérieure",
      original_price: 149.99,
      import_price: 80.00,
      suggested_price: 129.99,
      category: "Audio",
      subcategory: "Écouteurs",
      tags: ["bluetooth", "premium", "wireless"],
      image_urls: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"],
      ai_score: 7.8,
      trend_score: 8.1,
      competition_level: "high" as const,
      translation_status: "original" as const,
      status: "pending" as const
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