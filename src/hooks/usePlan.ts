import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { getEffectivePlan, type UserProfile, type UserRole, type AdminMode } from '@/utils/adminUtils'

export type PlanType = 'standard' | 'pro' | 'ultra_pro'

interface PlanState {
  plan: PlanType
  role: UserRole
  admin_mode: AdminMode
  effectivePlan: PlanType
  loading: boolean
  error: string | null
}

export const usePlan = (user?: User | null) => {
  const [planState, setPlanState] = useState<PlanState>({
    plan: 'standard',
    role: 'user',
    admin_mode: null,
    effectivePlan: 'standard',
    loading: true,
    error: null
  })
  const { toast } = useToast()

  useEffect(() => {
    if (!user) {
      setPlanState({ 
        plan: 'standard', 
        role: 'user',
        admin_mode: null,
        effectivePlan: 'standard',
        loading: false, 
        error: null 
      })
      return
    }

    fetchUserPlan(user.id)
  }, [user])

  const fetchUserPlan = async (userId: string) => {
    try {
      setPlanState(prev => ({ ...prev, loading: true, error: null }))
      
      const { data, error } = await supabase
        .from('profiles')
        .select('plan, role, admin_mode')
        .eq('id', userId)
        .maybeSingle()

      if (error) throw error

      const profile: UserProfile = {
        plan: (data?.plan as PlanType) || 'standard',
        role: (data?.role as UserRole) || 'user',
        admin_mode: (data?.admin_mode as AdminMode) || null,
      }

      const effectivePlan = getEffectivePlan(profile)

      setPlanState({ 
        plan: profile.plan,
        role: profile.role,
        admin_mode: profile.admin_mode,
        effectivePlan,
        loading: false, 
        error: null 
      })
    } catch (error: any) {
      console.error('Error fetching user plan:', error)
      setPlanState({ 
        plan: 'standard',
        role: 'user',
        admin_mode: null,
        effectivePlan: 'standard',
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
    const planHierarchy = { standard: 0, pro: 1, ultra_pro: 2 }
    return planHierarchy[planState.effectivePlan] >= planHierarchy[minPlan]
  }

  const isUltraPro = () => planState.effectivePlan === 'ultra_pro'
  const isPro = () => planState.effectivePlan === 'pro' || planState.effectivePlan === 'ultra_pro'

  return {
    ...planState,
    hasPlan,
    isUltraPro,
    isPro,
    updatePlan,
    refetch: () => user && fetchUserPlan(user.id)
  }
}