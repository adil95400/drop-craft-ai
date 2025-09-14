import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export interface QuotaStatus {
  quota_key: string
  current_count: number
  limit_value: number
  percentage_used: number
  reset_date: string
}

export function useQuotas() {
  const { user } = useAuth()
  const [quotas, setQuotas] = useState<QuotaStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuotas = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      
      // Récupérer le plan utilisateur
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      const userPlan = profile?.plan || 'standard'
      
      // Récupérer les limites du plan
      const { data: limits, error: limitsError } = await supabase
        .from('plan_limits')
        .select('*')
        .eq('plan_type', userPlan)

      if (limitsError) throw limitsError

      // Récupérer les quotas utilisateur actuels
      const { data: userQuotas, error: quotasError } = await supabase
        .from('user_quotas')
        .select('*')
        .eq('user_id', user.id)

      if (quotasError) throw quotasError

      // Construire la liste des quotas
      const quotasList: QuotaStatus[] = (limits || []).map(limit => {
        const userQuota = userQuotas?.find(q => q.quota_key === limit.limit_key)
        const currentCount = userQuota?.current_count || 0
        const limitValue = limit.limit_value
        const percentageUsed = limitValue === -1 ? 0 : Math.round((currentCount / limitValue) * 100)
        
        return {
          quota_key: limit.limit_key,
          current_count: currentCount,
          limit_value: limitValue,
          percentage_used: percentageUsed,
          reset_date: userQuota?.reset_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      })
      
      setQuotas(quotasList)
    } catch (err) {
      console.error('Error fetching quotas:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch quotas')
    } finally {
      setLoading(false)
    }
  }

  const checkQuota = async (quotaKey: string, incrementBy: number = 1): Promise<boolean> => {
    if (!user) return false

    try {
      const { data, error: quotaError } = await supabase.rpc('check_user_quota', {
        quota_key_param: quotaKey,
        increment_by: incrementBy
      })
      
      if (quotaError) throw quotaError
      
      // Refresh quotas after check
      await fetchQuotas()
      
      return data || false
    } catch (err) {
      console.error('Error checking quota:', err)
      setError(err instanceof Error ? err.message : 'Failed to check quota')
      return false
    }
  }

  useEffect(() => {
    fetchQuotas()
  }, [user])

  return {
    quotas,
    loading,
    error,
    checkQuota,
    refreshQuotas: fetchQuotas
  }
}