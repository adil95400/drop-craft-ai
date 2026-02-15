import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export type EnrichLanguage = 'fr' | 'en' | 'es' | 'de' | 'nl'
export type EnrichTone = 'professionnel' | 'créatif' | 'luxe' | 'décontracté' | 'technique'

export interface EnrichmentJob {
  id: string
  status: string
  total_items: number | null
  processed_items: number | null
  failed_items: number | null
  progress_percent: number | null
  progress_message: string | null
  created_at: string
  completed_at: string | null
}

export function useAIEnrichment() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  // Fetch enrichment jobs history
  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ['ai-enrich-jobs', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .eq('job_type', 'ai_enrich')
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) throw error
      return (data || []) as EnrichmentJob[]
    },
    enabled: !!user?.id,
    refetchInterval: (query) => {
      const list = query.state.data || []
      return list.some(j => j.status === 'running' || j.status === 'processing') ? 2000 : false
    },
  })

  // Realtime progress for active job
  useEffect(() => {
    if (!activeJobId) return
    const channel = supabase
      .channel(`enrich-${activeJobId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'background_jobs',
        filter: `id=eq.${activeJobId}`,
      }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['ai-enrich-jobs'] })
        const job = payload.new as any
        if (job.status === 'completed') {
          toast.success(`Enrichissement terminé: ${job.items_succeeded} produits optimisés`)
          setActiveJobId(null)
          queryClient.invalidateQueries({ queryKey: ['products'] })
          queryClient.invalidateQueries({ queryKey: ['catalog-products'] })
        } else if (job.status === 'failed') {
          toast.error('Enrichissement échoué')
          setActiveJobId(null)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeJobId, queryClient])

  // Start enrichment
  const enrichMutation = useMutation({
    mutationFn: async (params: {
      productIds: string[]
      language?: EnrichLanguage
      tone?: EnrichTone
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-enrich-import', {
        body: {
          product_ids: params.productIds,
          language: params.language || 'fr',
          tone: params.tone || 'professionnel',
        },
      })
      if (error) throw error
      if (!data?.success) throw new Error(data?.error || 'Enrichment failed')
      return data
    },
    onSuccess: (data) => {
      setActiveJobId(data.job_id)
      queryClient.invalidateQueries({ queryKey: ['ai-enrich-jobs'] })
      toast.info('Enrichissement IA démarré', { description: 'Suivi en temps réel...' })
    },
    onError: (err: Error) => {
      toast.error('Erreur enrichissement', { description: err.message })
    },
  })

  const activeJob = jobs.find(j => j.id === activeJobId) || jobs.find(j => j.status === 'running')

  // Legacy API compatibility
  const enrichProducts = async (productIds: string[], options?: { language?: string; tone?: string }): Promise<string | null> => {
    try {
      const data = await enrichMutation.mutateAsync({
        productIds,
        language: (options?.language || 'fr') as EnrichLanguage,
        tone: (options?.tone || 'professionnel') as EnrichTone,
      })
      return data?.job_id || null
    } catch {
      return null
    }
  }

  return {
    jobs,
    activeJob,
    isLoadingJobs,
    isEnriching: enrichMutation.isPending || !!activeJob?.status?.match(/running|processing/),
    enrich: enrichMutation.mutate,
    enrichProducts,
    jobId: activeJobId,
  }
}
