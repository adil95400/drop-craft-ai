import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface QuotaUsage {
  quotaKey: string
  currentCount: number
  limit: number
  resetDate: string
}

interface QuotaState {
  quotas: Record<string, QuotaUsage>
  loading: boolean
  error: string | null
}

export const useQuotas = (user?: User | null) => {
  const [quotaState, setQuotaState] = useState<QuotaState>({
    quotas: {},
    loading: true,
    error: null
  })
  const { toast } = useToast()

  useEffect(() => {
    if (!user) {
      setQuotaState({ quotas: {}, loading: false, error: null })
      return
    }

    fetchQuotas(user.id)
  }, [user])

  const fetchQuotas = async (userId: string) => {
    try {
      setQuotaState(prev => ({ ...prev, loading: true, error: null }))
      
      // Récupérer les quotas utilisateur
      const { data: userQuotas, error: quotasError } = await supabase
        .from('user_quotas')
        .select('*')
        .eq('user_id', userId)

      if (quotasError) throw quotasError

      // Récupérer le plan utilisateur
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError

      // Récupérer les limites du plan
      const { data: limits, error: limitsError } = await supabase
        .from('plans_limits')
        .select('*')
        .eq('plan', profile.plan)

      if (limitsError) throw limitsError

      // Construire l'objet quotas
      const quotas: Record<string, QuotaUsage> = {}
      
      limits.forEach(limit => {
        const userQuota = userQuotas?.find(q => q.quota_key === limit.limit_key)
        quotas[limit.limit_key] = {
          quotaKey: limit.limit_key,
          currentCount: userQuota?.current_count || 0,
          limit: limit.limit_value,
          resetDate: userQuota?.reset_date || new Date().toISOString()
        }
      })

      setQuotaState({ quotas, loading: false, error: null })
    } catch (error: any) {
      console.error('Error fetching quotas:', error)
      setQuotaState({ 
        quotas: {}, 
        loading: false, 
        error: error.message || 'Erreur lors de la récupération des quotas' 
      })
    }
  }

  const checkQuota = async (quotaKey: string): Promise<boolean> => {
    if (!user) return false

    try {
      const { data, error } = await supabase.rpc('check_quota', {
        user_id_param: user.id,
        quota_key_param: quotaKey
      })

      if (error) throw error
      return data || false
    } catch (error: any) {
      console.error('Error checking quota:', error)
      return false
    }
  }

  const incrementQuota = async (quotaKey: string, incrementBy: number = 1): Promise<boolean> => {
    if (!user) return false

    try {
      const { data, error } = await supabase.rpc('increment_quota', {
        user_id_param: user.id,
        quota_key_param: quotaKey,
        increment_by: incrementBy
      })

      if (error) throw error
      
      // Rafraîchir les quotas après incrémentation
      await fetchQuotas(user.id)
      return data || false
    } catch (error: any) {
      console.error('Error incrementing quota:', error)
      toast({
        title: "Quota dépassé",
        description: `Vous avez atteint votre limite pour ${quotaKey}`,
        variant: "destructive"
      })
      return false
    }
  }

  const getQuotaUsage = (quotaKey: string): QuotaUsage | null => {
    return quotaState.quotas[quotaKey] || null
  }

  const isQuotaExceeded = (quotaKey: string): boolean => {
    const quota = getQuotaUsage(quotaKey)
    if (!quota) return false
    if (quota.limit === -1) return false // illimité
    return quota.currentCount >= quota.limit
  }

  const getQuotaPercentage = (quotaKey: string): number => {
    const quota = getQuotaUsage(quotaKey)
    if (!quota || quota.limit === -1) return 0
    return Math.min((quota.currentCount / quota.limit) * 100, 100)
  }

  return {
    ...quotaState,
    checkQuota,
    incrementQuota,
    getQuotaUsage,
    isQuotaExceeded,
    getQuotaPercentage,
    refetch: () => user && fetchQuotas(user.id)
  }
}

export const useQuota = (quotaKey: string, user?: User | null) => {
  const { getQuotaUsage, checkQuota, incrementQuota, isQuotaExceeded, getQuotaPercentage, loading, error } = useQuotas(user)
  
  return {
    quota: getQuotaUsage(quotaKey),
    checkQuota: () => checkQuota(quotaKey),
    incrementQuota: (incrementBy?: number) => incrementQuota(quotaKey, incrementBy),
    isExceeded: isQuotaExceeded(quotaKey),
    percentage: getQuotaPercentage(quotaKey),
    loading,
    error
  }
}