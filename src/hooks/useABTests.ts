import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export interface ABTest {
  id: string
  name: string
  description: string
  type: 'email' | 'landing_page' | 'ad' | 'button' | 'headline'
  status: 'draft' | 'running' | 'completed' | 'paused'
  variants: ABTestVariant[]
  traffic_split: number[]
  start_date?: string
  end_date?: string
  goal_metric: 'conversion_rate' | 'click_rate' | 'open_rate' | 'revenue'
  confidence_level: number
  sample_size: number
  current_sample: number
  winner?: string
  created_at: string
  updated_at: string
}

export interface ABTestVariant {
  id: string
  name: string
  description: string
  traffic_percentage: number
  metrics: {
    impressions: number
    clicks: number
    conversions: number
    revenue: number
    conversion_rate: number
    click_rate: number
  }
}

export function useABTests() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ['ab-tests', user?.id],
    queryFn: async (): Promise<ABTest[]> => {
      if (!user?.id) return []
      
      const { data, error } = await supabase
        .from('ab_test_experiments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map((test: any) => {
        const variants = (test.variants || []) as any[]
        const metrics = (test.metrics || {}) as any
        
        return {
          id: test.id,
          name: test.name,
          description: test.description || '',
          type: metrics.type || 'email',
          status: test.status || 'draft',
          variants: variants.map((v: any, index: number) => ({
            id: v.id || `v${index + 1}`,
            name: v.name || `Variant ${index + 1}`,
            description: v.description || '',
            traffic_percentage: v.traffic_percentage || 50,
            metrics: {
              impressions: v.metrics?.impressions || 0,
              clicks: v.metrics?.clicks || 0,
              conversions: v.metrics?.conversions || 0,
              revenue: v.metrics?.revenue || 0,
              conversion_rate: v.metrics?.conversion_rate || 0,
              click_rate: v.metrics?.click_rate || 0
            }
          })),
          traffic_split: metrics.traffic_split || [50, 50],
          start_date: test.start_date,
          end_date: test.end_date,
          goal_metric: metrics.goal_metric || 'conversion_rate',
          confidence_level: metrics.confidence_level || 95,
          sample_size: metrics.sample_size || 1000,
          current_sample: metrics.current_sample || 0,
          winner: test.winner_variant_id,
          created_at: test.created_at,
          updated_at: test.updated_at
        }
      })
    },
    enabled: !!user?.id
  })

  const createTest = useMutation({
    mutationFn: async (testData: Partial<ABTest>) => {
      if (!user?.id) throw new Error('User not authenticated')

      const variants = (testData.variants || []).map(v => ({
        id: v.id,
        name: v.name,
        description: v.description,
        traffic_percentage: v.traffic_percentage,
        metrics: v.metrics
      }))

      const { data, error } = await supabase
        .from('ab_test_experiments')
        .insert([{
          user_id: user.id,
          name: testData.name,
          description: testData.description,
          status: 'draft',
          variants: variants as any,
          metrics: {
            type: testData.type,
            goal_metric: testData.goal_metric,
            confidence_level: testData.confidence_level,
            sample_size: testData.sample_size,
            current_sample: 0,
            traffic_split: testData.traffic_split
          }
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-tests'] })
      toast({
        title: "Test créé",
        description: "Votre test A/B a été créé avec succès"
      })
    }
  })

  const updateTestStatus = useMutation({
    mutationFn: async ({ id, status, winner }: { id: string; status: string; winner?: string }) => {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      }
      
      if (status === 'running') {
        updateData.start_date = new Date().toISOString()
      }
      if (status === 'completed') {
        updateData.end_date = new Date().toISOString()
        if (winner) updateData.winner_variant_id = winner
      }

      const { data, error } = await supabase
        .from('ab_test_experiments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-tests'] })
    }
  })

  return {
    tests,
    isLoading,
    createTest: createTest.mutate,
    updateTestStatus: updateTestStatus.mutate,
    isCreating: createTest.isPending
  }
}
