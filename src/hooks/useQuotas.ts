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
      
      // Récupérer le plan utilisateur from profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_plan')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      const userPlan = profile?.subscription_plan || 'free'
      
      // Récupérer les limites du plan
      const { data: limits, error: limitsError } = await supabase
        .from('plan_limits')
        .select('*')
        .eq('plan_name', userPlan)

      if (limitsError) throw limitsError

      // Récupérer les quotas utilisateur actuels
      const { data: userQuotas, error: quotasError } = await (supabase as any)
        .from('quota_usage')
        .select('*')
        .eq('user_id', user.id)

      if (quotasError) throw quotasError

      // Construire la liste des quotas
      const quotasList: QuotaStatus[] = (limits || []).map((limit: any) => {
        const userQuota = (userQuotas as any[])?.find((q: any) => q.quota_key === limit.limit_key)
        const currentCount = userQuota?.current_usage || 0
        const limitValue = limit.limit_value
        const percentageUsed = limitValue === -1 ? 0 : Math.round((currentCount / limitValue) * 100)
        
        return {
          quota_key: limit.limit_key,
          current_count: currentCount,
          limit_value: limitValue,
          percentage_used: percentageUsed,
          reset_date: userQuota?.period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
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
      // Find the quota in local state
      const quota = quotas.find(q => q.quota_key === quotaKey)
      if (!quota) return true // If no quota found, allow
      if (quota.limit_value === -1) return true // Unlimited
      
      const canIncrement = quota.current_count + incrementBy <= quota.limit_value
      
      if (canIncrement) {
        // Update the quota usage
        const { error: updateError } = await (supabase as any)
          .from('quota_usage')
          .upsert({
            user_id: user.id,
            quota_key: quotaKey,
            current_usage: quota.current_count + incrementBy,
            period_start: new Date().toISOString(),
            period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }, {
            onConflict: 'user_id,quota_key'
          })
        
        if (updateError) throw updateError
        
        // Refresh quotas after update
        await fetchQuotas()
      }
      
      return canIncrement
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
