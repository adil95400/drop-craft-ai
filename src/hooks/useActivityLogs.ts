import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface ActivityLog {
  id: string
  user_id: string
  action: string
  description: string
  entity_type?: string
  entity_id?: string
  metadata?: any
  ip_address?: string
  user_agent?: string
  created_at: string
}

export const useActivityLogs = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('activity_logs' as any)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
      
        if (error) throw error
        return (data || []).map((item: any) => ({
          id: item.id || '',
          user_id: item.user_id || '',
          action: item.action || '',
          description: item.description || '',
          entity_type: item.entity_type,
          entity_id: item.entity_id,
          metadata: item.metadata,
          ip_address: item.ip_address,
          user_agent: item.user_agent,
          created_at: item.created_at || new Date().toISOString()
        })) as ActivityLog[]
      } catch (err) {
        console.warn('Activity logs table not found, returning empty array')
        return [] as ActivityLog[]
      }
    }
  })

  const logActivity = useMutation({
    mutationFn: async (activity: Omit<ActivityLog, 'id' | 'user_id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('activity_logs' as any)
        .insert([{ ...activity, user_id: user.id }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] })
    }
  })

  const recentActivities = logs.slice(0, 10)
  const todayActivities = logs.filter(log => 
    new Date(log.created_at).toDateString() === new Date().toDateString()
  )

  return {
    logs,
    adminLogs: logs,
    recentActivities,
    todayActivities,
    isLoading,
    isLoadingAdminLogs: isLoading,
    logActivity: logActivity.mutate,
    isLogging: logActivity.isPending
  }
}