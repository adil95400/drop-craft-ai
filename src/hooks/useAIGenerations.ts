/**
 * Hook: useAIGenerations — Overlay IA (cache, coût, traçabilité)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { AIGeneration } from '@/domains/commerce/types'

export function useAIGenerations(userId?: string, targetType?: string, targetId?: string) {
  const qc = useQueryClient()
  const key = ['ai-generations', userId, targetType, targetId]

  const query = useQuery({
    queryKey: key,
    enabled: !!userId && !!targetId,
    queryFn: async () => {
      let q = supabase.from('ai_generations').select('*').eq('user_id', userId!)
      if (targetType) q = q.eq('target_type', targetType)
      if (targetId) q = q.eq('target_id', targetId)
      const { data, error } = await q.order('created_at', { ascending: false }).limit(20)
      if (error) throw error
      return data as AIGeneration[]
    },
  })

  const create = useMutation({
    mutationFn: async (input: Omit<AIGeneration, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('ai_generations')
        .insert({ ...input, user_id: userId! })
        .select()
        .single()
      if (error) throw error
      return data as AIGeneration
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, create }
}
