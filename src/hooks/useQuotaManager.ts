import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface QuotaInfo {
  quota_key: string
  current_count: number
  limit_value: number
  is_unlimited: boolean
  usage_percentage: number
}

interface PlanLimits {
  products: number
  suppliers: number
  monthly_imports: number
  integrations: number
  ai_generations: number
  storage_mb: number
}

export const useQuotaManager = () => {
  const [quotas, setQuotas] = useState<QuotaInfo[]>([])
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null)
  const [loading, setLoading] = useState(false)
  const { user, profile } = useAuth()
  const { toast } = useToast()

  const fetchQuotas = async () => {
    if (!user || !profile) return

    try {
      setLoading(true)
      
      // Fetch plan limits from plan_limits table
      const { data: limits, error: limitsError } = await supabase
        .from('plan_limits')
        .select('*')
        .eq('plan_name', profile.subscription_plan || 'free')

      if (limitsError) throw limitsError

      // Fetch user quotas from quota_usage table
      const { data: userQuotas, error: quotasError } = await (supabase
        .from('quota_usage') as any)
        .select('*')
        .eq('user_id', user.id)

      if (quotasError) throw quotasError

      // Combine data
      const quotaInfo: QuotaInfo[] = (limits || []).map((limit: any) => {
        const userQuota = userQuotas?.find((q: any) => q.quota_key === limit.limit_key)
        const currentCount = userQuota?.current_usage || 0
        const isUnlimited = limit.limit_value === -1
        
        return {
          quota_key: limit.limit_key,
          current_count: currentCount,
          limit_value: limit.limit_value,
          is_unlimited: isUnlimited,
          usage_percentage: isUnlimited ? 0 : Math.min((currentCount / limit.limit_value) * 100, 100)
        }
      })

      setQuotas(quotaInfo)

      // Set plan limits object for easy access
      const planLimitsObj = (limits || []).reduce((acc: any, limit: any) => {
        acc[limit.limit_key as keyof PlanLimits] = limit.limit_value
        return acc
      }, {} as PlanLimits)
      
      setPlanLimits(planLimitsObj)

    } catch (error: any) {
      console.error('Error fetching quotas:', error)
      // Don't show toast for missing tables
    } finally {
      setLoading(false)
    }
  }

  const checkQuota = async (quotaKey: string): Promise<boolean> => {
    if (!user) return false

    try {
      // Simple check based on local quotas
      const quota = quotas.find(q => q.quota_key === quotaKey)
      if (!quota) return true
      if (quota.is_unlimited) return true
      return quota.current_count < quota.limit_value
    } catch (error: any) {
      console.error('Error checking quota:', error)
      return true // Allow action on error
    }
  }

  const incrementQuota = async (quotaKey: string, increment: number = 1) => {
    if (!user) return false

    try {
      // First check if quota allows increment
      const hasQuota = await checkQuota(quotaKey)
      if (!hasQuota) {
        toast({
          title: "Limite atteinte",
          description: `Vous avez atteint la limite de votre plan pour ${quotaKey}. Passez à un plan supérieur.`,
          variant: "destructive"
        })
        return false
      }

      // Upsert user quota in quota_usage table
      const { error } = await (supabase
        .from('quota_usage') as any)
        .upsert({
          user_id: user.id,
          quota_key: quotaKey,
          current_usage: increment,
          period_start: new Date().toISOString(),
          period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }, {
          onConflict: 'user_id,quota_key'
        })

      if (error) throw error

      // Refresh quotas
      await fetchQuotas()
      return true
    } catch (error: any) {
      console.error('Error incrementing quota:', error)
      return true // Allow action on error
    }
  }

  const getQuotaInfo = (quotaKey: string): QuotaInfo | null => {
    return quotas.find(q => q.quota_key === quotaKey) || null
  }

  const canPerformAction = (quotaKey: string): boolean => {
    const quota = getQuotaInfo(quotaKey)
    if (!quota) return true // If no quota found, allow action
    if (quota.is_unlimited) return true
    return quota.current_count < quota.limit_value
  }

  const getUsagePercentage = (quotaKey: string): number => {
    const quota = getQuotaInfo(quotaKey)
    return quota?.usage_percentage || 0
  }

  useEffect(() => {
    if (user && profile) {
      fetchQuotas()
    }
  }, [user, profile])

  return {
    quotas,
    planLimits,
    loading,
    fetchQuotas,
    checkQuota,
    incrementQuota,
    getQuotaInfo,
    canPerformAction,
    getUsagePercentage
  }
}
