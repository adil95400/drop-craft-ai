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
          .select('plan')
          .eq('id', user.id)
          .maybeSingle()

        if (!mounted) return

        if (error) throw error

        const userPlan = (data?.plan as PlanType) || 'standard'
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
  }, [user?.id]) // Seul user.id dans les deps

  const isPro = () => state.plan === 'pro' || state.plan === 'ultra_pro'
  const isUltraPro = () => state.plan === 'ultra_pro'

  return {
    ...state,
    isPro,
    isUltraPro
  }
}