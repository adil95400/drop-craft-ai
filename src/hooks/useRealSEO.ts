import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export interface SEOAnalysis {
  id: string
  url: string
  title?: string
  meta_description?: string
  h1_tag?: string
  accessibility_score?: number
  best_practices_score?: number
  performance_score?: number
  seo_score?: number
  overall_score: number
  domain: string
  competitors_data?: any
  content_analysis?: any
  issues?: any
  recommendations?: string[]
  analyzed_at: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface SEOKeyword {
  id: string
  keyword: string
  search_volume?: number
  difficulty_score?: number
  cpc?: number
  current_position?: number
  target_url?: string
  competition?: string
  tracking_active: boolean
  related_keywords?: string[]
  trends?: any
  user_id: string
  created_at: string
  updated_at: string
}

export const useRealSEO = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: analyses = [], isLoading: isLoadingAnalyses } = useQuery({
    queryKey: ['seo-analyses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seo_analyses')
        .select('*')
        .order('analyzed_at', { ascending: false })

      if (error) throw error
      return data as unknown as SEOAnalysis[]
    },
  })

  const { data: keywords = [], isLoading: isLoadingKeywords } = useQuery({
    queryKey: ['seo-keywords'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seo_keywords')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as unknown as SEOKeyword[]
    },
  })

  const analyzeUrl = useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch('/functions/v1/seo-optimizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'analyze_url',
          url
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse SEO')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-analyses'] })
      toast({
        title: "Analyse SEO terminée",
        description: "L'analyse de la page a été effectuée avec succès",
      })
    }
  })

  const addKeyword = useMutation({
    mutationFn: async (keyword: Omit<SEOKeyword, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('seo_keywords')
        .insert([{ ...keyword, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-keywords'] })
      toast({
        title: "Mot-clé ajouté",
        description: "Le mot-clé a été ajouté au suivi SEO",
      })
    }
  })

  const updateKeyword = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SEOKeyword> }) => {
      const { data, error } = await supabase
        .from('seo_keywords')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-keywords'] })
      toast({
        title: "Mot-clé mis à jour",
        description: "Le suivi du mot-clé a été mis à jour",
      })
    }
  })

  const stats = {
    totalAnalyses: analyses.length,
    averageScore: analyses.length > 0 
      ? analyses.reduce((sum, a) => sum + a.overall_score, 0) / analyses.length 
      : 0,
    totalKeywords: keywords.length,
    achievedKeywords: keywords.filter(k => k.tracking_active).length,
    improvingKeywords: keywords.filter(k => !k.tracking_active).length,
    trackingKeywords: keywords.filter(k => k.tracking_active).length,
    totalPages: analyses.length
  }

  return {
    analyses,
    keywords,
    stats,
    seoData: analyses, // backward compatibility
    isLoading: isLoadingAnalyses || isLoadingKeywords,
    analyzeUrl: analyzeUrl.mutate,
    analyzeSEO: analyzeUrl.mutate, // backward compatibility
    generateContent: analyzeUrl.mutate, // backward compatibility
    addKeyword: addKeyword.mutate,
    updateKeyword: updateKeyword.mutate,
    isAnalyzing: analyzeUrl.isPending,
    isGenerating: analyzeUrl.isPending, // backward compatibility
    isAddingKeyword: addKeyword.isPending,
    isUpdatingKeyword: updateKeyword.isPending
  }
}