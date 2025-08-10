import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface AITask {
  id: string
  user_id: string
  job_type: string
  input_data: any
  output_data?: any
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  error_message?: string
  started_at?: string
  completed_at?: string
  created_at: string
}

export interface AIInsight {
  id: string
  analysis_type: 'sales_trends' | 'customer_behavior' | 'inventory_optimization' | 'conversion_optimization' | 'fraud_detection'
  data: any
  analysis: string
  actionable_insights: string
  confidence_score: number
  generated_at: string
}

export interface AIAutomation {
  id: string
  campaign_type: 'email_sequence' | 'social_media' | 'retargeting' | 'loyalty_program' | 'content_marketing'
  target_audience: any
  strategy: string
  workflows: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  performance_metrics?: any
  created_at: string
}

export const useAI = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [processingTasks, setProcessingTasks] = useState<Set<string>>(new Set())

  // Get AI optimization tasks
  const { data: aiTasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['ai-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_optimization_jobs')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data.map(item => ({
        ...item,
        input_data: item.input_data || {},
        output_data: item.output_data || {}
      })) as AITask[]
    }
  })

  // AI Content Optimization
  const optimizeContent = useMutation({
    mutationFn: async (params: {
      task: string
      productData: any
      marketData?: any
      language?: string
      tone?: string
      length?: string
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-optimizer', {
        body: params
      })
      
      if (error) throw error
      return data
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Optimisation IA terminée",
        description: `${getTaskDescription(variables.task)} généré avec succès`,
      })
      queryClient.invalidateQueries({ queryKey: ['ai-tasks'] })
    },
    onError: (error) => {
      toast({
        title: "Erreur d'optimisation",
        description: "Impossible de traiter la demande d'optimisation IA",
        variant: "destructive",
      })
    }
  })

  // AI Insights Analysis
  const generateInsights = useMutation({
    mutationFn: async (params: {
      analysisType: string
      data: any
      timeRange?: string
      metrics?: string[]
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: params
      })
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast({
        title: "Analyse IA terminée",
        description: "Insights générés avec succès",
      })
      queryClient.invalidateQueries({ queryKey: ['ai-insights'] })
    },
    onError: (error) => {
      toast({
        title: "Erreur d'analyse",
        description: "Impossible de générer les insights IA",
        variant: "destructive",
      })
    }
  })

  // AI Marketing Automation
  const createAutomation = useMutation({
    mutationFn: async (params: {
      campaignType: string
      targetAudience: any
      products: any[]
      businessGoals: string
      budget: number
      timeframe?: string
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-automation', {
        body: params
      })
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast({
        title: "Automation créée",
        description: "Stratégie marketing automatisée générée avec succès",
      })
      queryClient.invalidateQueries({ queryKey: ['ai-automations'] })
    },
    onError: (error) => {
      toast({
        title: "Erreur d'automation",
        description: "Impossible de créer l'automation marketing",
        variant: "destructive",
      })
    }
  })

  // Bulk AI Processing
  const bulkOptimize = useMutation({
    mutationFn: async (params: {
      products: any[]
      tasks: string[]
      batchSize?: number
    }) => {
      const { products, tasks, batchSize = 10 } = params
      const results = []
      
      // Process in batches to avoid rate limits
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize)
        
        const batchPromises = batch.flatMap(product =>
          tasks.map(async task => {
            try {
              const { data } = await supabase.functions.invoke('ai-optimizer', {
                body: {
                  task,
                  productData: product,
                  language: 'fr',
                  tone: 'professional'
                }
              })
              return { productId: product.id, task, success: true, data }
            } catch (error) {
              return { productId: product.id, task, success: false, error: error.message }
            }
          })
        )
        
        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults)
        
        // Small delay between batches
        if (i + batchSize < products.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
      return results
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length
      const totalCount = results.length
      
      toast({
        title: "Optimisation en masse terminée",
        description: `${successCount}/${totalCount} tâches réussies`,
      })
      queryClient.invalidateQueries({ queryKey: ['ai-tasks'] })
    },
    onError: (error) => {
      toast({
        title: "Erreur d'optimisation en masse",
        description: "Certaines tâches ont échoué",
        variant: "destructive",
      })
    }
  })

  // Smart Product Analysis
  const analyzeProduct = useMutation({
    mutationFn: async (productId: string) => {
      // Get product data first
      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()
      
      if (!product) throw new Error('Product not found')
      
      // Run multiple AI analyses
      const analyses = await Promise.all([
        supabase.functions.invoke('ai-optimizer', {
          body: {
            task: 'seo_optimization',
            productData: product
          }
        }),
        supabase.functions.invoke('ai-optimizer', {
          body: {
            task: 'price_optimization',
            productData: product
          }
        }),
        supabase.functions.invoke('ai-optimizer', {
          body: {
            task: 'market_analysis',
            productData: product
          }
        })
      ])
      
      return {
        productId,
        seoAnalysis: analyses[0].data,
        priceAnalysis: analyses[1].data,
        marketAnalysis: analyses[2].data
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Analyse produit terminée",
        description: "Toutes les analyses IA sont disponibles",
      })
    }
  })

  const getTaskDescription = (task: string): string => {
    const descriptions: Record<string, string> = {
      'product_description': 'Description produit',
      'seo_optimization': 'Optimisation SEO',
      'price_optimization': 'Optimisation prix',
      'market_analysis': 'Analyse marché',
      'category_suggestion': 'Suggestion catégorie'
    }
    return descriptions[task] || task
  }

  return {
    // Data
    aiTasks,
    processingTasks,
    
    // Loading states
    isLoadingTasks,
    isOptimizing: optimizeContent.isPending,
    isGeneratingInsights: generateInsights.isPending,
    isCreatingAutomation: createAutomation.isPending,
    isBulkOptimizing: bulkOptimize.isPending,
    isAnalyzingProduct: analyzeProduct.isPending,
    
    // Actions
    optimizeContent: optimizeContent.mutate,
    generateInsights: generateInsights.mutate,
    createAutomation: createAutomation.mutate,
    bulkOptimize: bulkOptimize.mutate,
    analyzeProduct: analyzeProduct.mutate,
    
    // Utilities
    getTaskDescription
  }
}