import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export type PlanType = 'free' | 'pro' | 'ultra_pro' | 'standard'

interface PlanState {
  plan: PlanType
  loading: boolean
  error: string | null
}

export const useNewPlan = (user?: User | null) => {
  const [planState, setPlanState] = useState<PlanState>({
    plan: 'free',
    loading: true,
    error: null
  })
  const { toast } = useToast()

  useEffect(() => {
    if (!user) {
      setPlanState({ plan: 'free', loading: false, error: null })
      return
    }

    fetchUserPlan(user.id)
  }, [user])

  const fetchUserPlan = async (userId: string) => {
    try {
      setPlanState(prev => ({ ...prev, loading: true, error: null }))
      
      const { data, error } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', userId)
        .maybeSingle()

      if (error) throw error

      const userPlan = (data?.plan as PlanType) || 'free'
      setPlanState({ plan: userPlan, loading: false, error: null })
    } catch (error: any) {
      console.error('Error fetching user plan:', error)
      setPlanState({ 
        plan: 'free', 
        loading: false, 
        error: error.message || 'Erreur lors de la récupération du plan' 
      })
      toast({
        title: "Erreur",
        description: "Impossible de récupérer le plan utilisateur",
        variant: "destructive"
      })
    }
  }

  const updatePlan = async (newPlan: PlanType) => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ plan: newPlan as any })
        .eq('id', user.id)

      if (error) throw error

      setPlanState(prev => ({ ...prev, plan: newPlan }))
      return true
    } catch (error: any) {
      console.error('Error updating plan:', error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le plan",
        variant: "destructive"
      })
      return false
    }
  }

  const hasPlan = (minPlan: PlanType): boolean => {
    const planHierarchy = { free: 0, pro: 1, ultra_pro: 2 }
    return planHierarchy[planState.plan] >= planHierarchy[minPlan]
  }

  const isUltraPro = () => planState.plan === 'ultra_pro'
  const isPro = () => planState.plan === 'pro' || planState.plan === 'ultra_pro'
  const isFree = () => planState.plan === 'free'

  return {
    ...planState,
    hasPlan,
    isUltraPro,
    isPro,
    isFree,
    updatePlan,
    refetch: () => user && fetchUserPlan(user.id)
  }
}