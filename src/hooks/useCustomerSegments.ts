import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export interface CustomerSegment {
  id: string
  name: string
  description: string
  count: number
  total: number
  avgValue: number
  engagement: number
  color: string
  criteria?: any
}

export function useCustomerSegments() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: segments = [], isLoading } = useQuery({
    queryKey: ['customer-segments', user?.id],
    queryFn: async (): Promise<CustomerSegment[]> => {
      if (!user?.id) return []
      
      // Fetch segments
      const { data: segmentsData, error: segError } = await supabase
        .from('marketing_segments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (segError) throw segError

      // Fetch total customers count
      const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const total = totalCustomers || 0

      const colors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-destructive', 'bg-muted']

      return (segmentsData || []).map((segment: any, index: number) => {
        const criteria = (segment.criteria || {}) as any
        
        return {
          id: segment.id,
          name: segment.name,
          description: segment.description || '',
          count: segment.contact_count || 0,
          total: total,
          avgValue: criteria.avg_value || 0,
          engagement: criteria.engagement || 0,
          color: colors[index % colors.length],
          criteria: segment.criteria
        }
      })
    },
    enabled: !!user?.id
  })

  const createSegment = useMutation({
    mutationFn: async (segmentData: Partial<CustomerSegment>) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('marketing_segments')
        .insert([{
          user_id: user.id,
          name: segmentData.name,
          description: segmentData.description,
          contact_count: 0,
          criteria: {
            avg_value: segmentData.avgValue || 0,
            engagement: segmentData.engagement || 0
          }
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-segments'] })
      toast({
        title: "Segment créé",
        description: "Le segment a été créé avec succès"
      })
    }
  })

  return {
    segments,
    isLoading,
    createSegment: createSegment.mutate,
    isCreating: createSegment.isPending
  }
}
