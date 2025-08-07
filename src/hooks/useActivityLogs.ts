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
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (error) throw error
      return data as ActivityLog[]
    }
  })

  const logActivity = useMutation({
    mutationFn: async (activity: Omit<ActivityLog, 'id' | 'user_id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('activity_logs')
        .insert([activity])
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
    recentActivities,
    todayActivities,
    isLoading,
    logActivity: logActivity.mutate,
    isLogging: logActivity.isPending
  }
}