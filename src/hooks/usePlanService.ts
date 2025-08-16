import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export type PlanType = 'standard' | 'pro' | 'ultra_pro'

interface PlanServiceHook {
  checkPlanAccess: (requiredPlan: PlanType) => Promise<boolean>
  upgradePlan: (newPlan: PlanType, paymentIntentId?: string) => Promise<boolean>
  loading: boolean
}

export const usePlanService = (): PlanServiceHook => {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const checkPlanAccess = async (requiredPlan: PlanType): Promise<boolean> => {
    if (!user) return false

    try {
      setLoading(true)
      const { data, error } = await supabase.functions.invoke('check-plan', {
        body: {
          userId: user.id,
          requiredPlan
        }
      })

      if (error) throw error

      return data.hasAccess
    } catch (error: any) {
      console.error('Error checking plan access:', error)
      toast({
        title: "Erreur",
        description: "Impossible de vérifier l'accès au plan",
        variant: "destructive"
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const upgradePlan = async (newPlan: PlanType, paymentIntentId?: string): Promise<boolean> => {
    if (!user) return false

    try {
      setLoading(true)
      const { data, error } = await supabase.functions.invoke('upgrade-plan', {
        body: {
          userId: user.id,
          newPlan,
          paymentIntentId
        }
      })

      if (error) throw error

      toast({
        title: "Plan mis à jour",
        description: `Votre plan a été mis à niveau vers ${newPlan}`,
        variant: "default"
      })

      return true
    } catch (error: any) {
      console.error('Error upgrading plan:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à niveau le plan",
        variant: "destructive"
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    checkPlanAccess,
    upgradePlan,
    loading
  }
}