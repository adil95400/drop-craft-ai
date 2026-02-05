import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export interface SessionEntry {
  id: string
  created_at: string | null
  user_agent: string | null
  ip_address: string | null
  isCurrent: boolean
}

export function useSessions() {
  const { user } = useAuth()

  const {
    data: sessions = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['user-sessions', user?.id],
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<SessionEntry[]> => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('activity_logs')
        .select('id, created_at, user_agent, ip_address')
        .eq('user_id', user.id)
        .eq('entity_type', 'auth')
        .in('action', ['user_login', 'SIGNED_IN'])
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Failed to fetch sessions:', error)
        return []
      }

      return (data || []).map((log, idx) => ({
        id: log.id,
        created_at: log.created_at,
        user_agent: log.user_agent,
        ip_address: log.ip_address,
        isCurrent: idx === 0,
      }))
    },
  })

  return { sessions, isLoading, refetch }
}
