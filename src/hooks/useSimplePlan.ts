import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'

export type PlanType = 'standard' | 'pro' | 'ultra_pro'

interface SimplePlanState {
  plan: PlanType
  loading: boolean
  error: string | null
}

export const useSimplePlan = (user?: User | null) => {
  const [state, setState] = useState<SimplePlanState>({
    plan: 'standard',
    loading: false,
    error: null
  })

  useEffect(() => {
    if (!user) {
      setState({ plan: 'standard', loading: false, error: null })
      return
    }

    let mounted = true

    const fetchPlan = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }))
        
        const { data, error } = await supabase
          .from('profiles')
          .select('subscription_plan')
          .eq('id', user.id)
          .maybeSingle()

        if (!mounted) return

        if (error) throw error

        // Map subscription_plan to PlanType
        const planMapping: Record<string, PlanType> = {
          'pro': 'pro',
          'ultra_pro': 'ultra_pro',
          'ultra-pro': 'ultra_pro',
          'standard': 'standard',
          'free': 'standard'
        }
        
        const userPlan = planMapping[data?.subscription_plan || ''] || 'standard'
        setState({ plan: userPlan, loading: false, error: null })
      } catch (error: any) {
        if (!mounted) return
        setState({ 
          plan: 'standard', 
          loading: false, 
          error: error.message || 'Erreur' 
        })
      }
    }

    fetchPlan()

    return () => {
      mounted = false
    }
  }, [user?.id])

  const isPro = () => state.plan === 'pro' || state.plan === 'ultra_pro'
  const isUltraPro = () => state.plan === 'ultra_pro'

  return {
    ...state,
    isPro,
    isUltraPro
  }
}