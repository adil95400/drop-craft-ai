/**
 * Hook: useAIGenerations — Overlay IA via API V1
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { aiGenerationsApi } from '@/services/api/client'
import type { AIGeneration } from '@/domains/commerce/types'

export function useAIGenerations(userId?: string, targetType?: string, targetId?: string) {
  const qc = useQueryClient()
  const key = ['ai-generations', userId, targetType, targetId]

  const query = useQuery({
    queryKey: key,
    enabled: !!userId && !!targetId,
    queryFn: async () => {
      const resp = await aiGenerationsApi.list({
        target_type: targetType,
        target_id: targetId,
        limit: 20,
      })
      return (resp.items ?? []) as AIGeneration[]
    },
  })

  const create = useMutation({
    mutationFn: async (input: Omit<AIGeneration, 'id' | 'created_at'>) => {
      return await aiGenerationsApi.create(input) as AIGeneration
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, create }
}
