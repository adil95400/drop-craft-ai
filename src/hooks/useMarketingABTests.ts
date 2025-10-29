import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import type { Database } from '@/integrations/supabase/types'

type MarketingABTest = Database['public']['Tables']['ab_test_experiments']['Row']
type MarketingABTestInsert = Database['public']['Tables']['ab_test_experiments']['Insert']
type MarketingABTestUpdate = Database['public']['Tables']['ab_test_experiments']['Update']

export const useMarketingABTests = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const {
    data: abTests = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['marketing-ab-tests', user?.id],
    queryFn: async (): Promise<MarketingABTest[]> => {
      if (!user?.id) return []
      
      const { data, error } = await supabase
        .from('ab_test_experiments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!user?.id
  })

  const createABTest = useMutation({
    mutationFn: async (testData: Omit<MarketingABTestInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('ab_test_experiments')
        .insert([{ ...testData, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-ab-tests'] })
      toast({
        title: "Test A/B créé",
        description: "Votre test A/B a été créé avec succès"
      })
    }
  })

  const updateABTest = useMutation({
    mutationFn: async ({ id, ...updates }: MarketingABTestUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('ab_test_experiments')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-ab-tests'] })
      toast({
        title: "Test A/B mis à jour",
        description: "Les modifications ont été enregistrées"
      })
    }
  })

  return {
    abTests,
    isLoading,
    error,
    createABTest: createABTest.mutate,
    updateABTest: updateABTest.mutate,
    isCreating: createABTest.isPending,
    isUpdating: updateABTest.isPending
  }
}
