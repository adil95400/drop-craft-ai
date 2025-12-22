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

// Mock data for SEO analyses
const mockAnalyses: SEOAnalysis[] = [
  {
    id: '1',
    url: 'https://example.com',
    title: 'Example Site',
    meta_description: 'An example website',
    overall_score: 85,
    domain: 'example.com',
    analyzed_at: new Date().toISOString(),
    user_id: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

const mockKeywords: SEOKeyword[] = [
  {
    id: '1',
    keyword: 'dropshipping france',
    search_volume: 5400,
    difficulty_score: 45,
    current_position: 12,
    tracking_active: true,
    user_id: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export const useRealSEO = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: analyses = mockAnalyses, isLoading: isLoadingAnalyses } = useQuery({
    queryKey: ['seo-analyses'],
    queryFn: async () => {
      // Use analytics_insights with metric_type for SEO data
      const { data, error } = await (supabase
        .from('analytics_insights')
        .select('*')
        .eq('metric_type', 'seo_analysis')
        .order('created_at', { ascending: false }) as any)

      if (error) {
        console.error('Error fetching SEO analyses:', error)
        return mockAnalyses
      }
      
      if (!data || data.length === 0) return mockAnalyses
      
      return data.map((item: any) => ({
        id: item.id,
        url: item.metadata?.url || '',
        title: item.metadata?.title || '',
        meta_description: item.metadata?.meta_description || '',
        overall_score: item.metric_value || 0,
        domain: item.metadata?.domain || '',
        analyzed_at: item.recorded_at || item.created_at,
        user_id: item.user_id,
        created_at: item.created_at,
        updated_at: item.created_at
      })) as SEOAnalysis[]
    },
  })

  const { data: keywords = mockKeywords, isLoading: isLoadingKeywords } = useQuery({
    queryKey: ['seo-keywords'],
    queryFn: async () => {
      // Use analytics_insights with metric_type for keyword data
      const { data, error } = await (supabase
        .from('analytics_insights')
        .select('*')
        .eq('metric_type', 'seo_keyword')
        .order('created_at', { ascending: false }) as any)

      if (error) {
        console.error('Error fetching SEO keywords:', error)
        return mockKeywords
      }
      
      if (!data || data.length === 0) return mockKeywords
      
      return data.map((item: any) => ({
        id: item.id,
        keyword: item.metric_name || '',
        search_volume: item.metadata?.search_volume,
        difficulty_score: item.metadata?.difficulty_score,
        current_position: item.metric_value,
        tracking_active: item.metadata?.tracking_active ?? true,
        user_id: item.user_id,
        created_at: item.created_at,
        updated_at: item.created_at
      })) as SEOKeyword[]
    },
  })

  const analyzeUrl = useMutation({
    mutationFn: async (url: string) => {
      const response = await supabase.functions.invoke('seo-optimizer', {
        body: {
          action: 'analyze_url',
          url
        }
      })

      if (response.error) {
        throw new Error('Erreur lors de l\'analyse SEO')
      }

      return response.data
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

      const { data, error } = await (supabase
        .from('analytics_insights')
        .insert([{ 
          metric_name: keyword.keyword,
          metric_type: 'seo_keyword',
          metric_value: keyword.current_position || 0,
          metadata: {
            search_volume: keyword.search_volume,
            difficulty_score: keyword.difficulty_score,
            tracking_active: keyword.tracking_active
          },
          user_id: user.id 
        }])
        .select()
        .single() as any)

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
      const { data, error } = await (supabase
        .from('analytics_insights')
        .update({
          metric_name: updates.keyword,
          metric_value: updates.current_position,
          metadata: {
            search_volume: updates.search_volume,
            difficulty_score: updates.difficulty_score,
            tracking_active: updates.tracking_active
          }
        })
        .eq('id', id)
        .select()
        .single() as any)

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
    seoData: analyses,
    isLoading: isLoadingAnalyses || isLoadingKeywords,
    analyzeUrl: analyzeUrl.mutate,
    analyzeSEO: analyzeUrl.mutate,
    generateContent: analyzeUrl.mutate,
    addKeyword: addKeyword.mutate,
    updateKeyword: updateKeyword.mutate,
    isAnalyzing: analyzeUrl.isPending,
    isGenerating: analyzeUrl.isPending,
    isAddingKeyword: addKeyword.isPending,
    isUpdatingKeyword: updateKeyword.isPending
  }
}
