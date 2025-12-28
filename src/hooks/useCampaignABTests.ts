import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export interface ABTestVariant {
  id: string
  name: string
  subject?: string
  content?: string
  send_time?: string
  sender_name?: string
  sent: number
  opened: number
  clicked: number
  converted: number
}

export interface CampaignABTest {
  id: string
  user_id: string
  campaign_id?: string
  name: string
  test_type: 'subject' | 'content' | 'send_time' | 'sender_name'
  variants: ABTestVariant[]
  traffic_split: Record<string, number>
  winner_criteria: 'open_rate' | 'click_rate' | 'conversion_rate'
  auto_select_winner: boolean
  winner_after_hours: number
  winner_variant?: string
  status: 'draft' | 'running' | 'completed'
  results: Record<string, any>
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export function useCampaignABTests() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: abTests = [], isLoading } = useQuery({
    queryKey: ['campaign-ab-tests', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('campaign_ab_tests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data as unknown as CampaignABTest[]).map(test => ({
        ...test,
        variants: Array.isArray(test.variants) ? test.variants : [],
        traffic_split: typeof test.traffic_split === 'object' ? test.traffic_split : { a: 50, b: 50 },
        results: typeof test.results === 'object' ? test.results : {}
      }))
    },
    enabled: !!user?.id
  })

  const createABTest = useMutation({
    mutationFn: async (test: Partial<CampaignABTest>) => {
      if (!user?.id) throw new Error('Not authenticated')
      if (!test.name) throw new Error('Name required')
      
      const variants = test.variants || [
        { id: 'a', name: 'Variante A', sent: 0, opened: 0, clicked: 0, converted: 0 },
        { id: 'b', name: 'Variante B', sent: 0, opened: 0, clicked: 0, converted: 0 }
      ]

      const { data, error } = await supabase
        .from('campaign_ab_tests')
        .insert([{ 
          name: test.name,
          test_type: test.test_type || 'subject',
          user_id: user.id,
          variants: JSON.parse(JSON.stringify(variants)),
          traffic_split: test.traffic_split || { a: 50, b: 50 }
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-ab-tests'] })
      toast({ title: 'Test A/B créé', description: 'Le test a été créé avec succès' })
    }
  })

  const updateABTest = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CampaignABTest> & { id: string }) => {
      const updateData: Record<string, any> = { ...updates }
      if (updates.variants) updateData.variants = JSON.parse(JSON.stringify(updates.variants))
      
      const { data, error } = await supabase
        .from('campaign_ab_tests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-ab-tests'] })
      toast({ title: 'Test mis à jour', description: 'Les modifications ont été enregistrées' })
    }
  })

  const deleteABTest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campaign_ab_tests')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-ab-tests'] })
      toast({ title: 'Test supprimé', description: 'Le test A/B a été supprimé' })
    }
  })

  const startABTest = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('campaign_ab_tests')
        .update({ 
          status: 'running',
          started_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-ab-tests'] })
      toast({ title: 'Test démarré', description: 'Le test A/B est maintenant en cours' })
    }
  })

  const selectWinner = useMutation({
    mutationFn: async ({ id, winnerId }: { id: string; winnerId: string }) => {
      const { data, error } = await supabase
        .from('campaign_ab_tests')
        .update({ 
          status: 'completed',
          winner_variant: winnerId,
          completed_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-ab-tests'] })
      toast({ title: 'Gagnant sélectionné', description: 'Le test A/B est terminé' })
    }
  })

  return {
    abTests,
    isLoading,
    createABTest: createABTest.mutate,
    updateABTest: updateABTest.mutate,
    deleteABTest: deleteABTest.mutate,
    startABTest: startABTest.mutate,
    selectWinner: selectWinner.mutate,
    isCreating: createABTest.isPending
  }
}
