import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface QuotaServiceHook {
  checkQuota: (quotaKey: string, incrementBy?: number) => Promise<{
    canProceed: boolean
    currentCount: number
    limit: number | null
    resetDate: string | null
  } | null>
  loading: boolean
}

export const useQuotaService = (): QuotaServiceHook => {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const checkQuota = async (quotaKey: string, incrementBy = 0) => {
    if (!user) return null

    try {
      setLoading(true)
      const { data, error } = await supabase.functions.invoke('check-quota', {
        body: {
          userId: user.id,
          quotaKey,
          incrementBy
        }
      })

      if (error) throw error

      if (!data.canProceed && incrementBy === 0) {
        toast({
          title: "Quota dépassé",
          description: `Vous avez atteint votre limite pour ${quotaKey}. Passez à un plan supérieur.`,
          variant: "destructive"
        })
      }

      return {
        canProceed: data.canProceed,
        currentCount: data.currentCount,
        limit: data.limit,
        resetDate: data.resetDate
      }
    } catch (error: any) {
      console.error('Error checking quota:', error)
      toast({
        title: "Erreur",
        description: "Impossible de vérifier le quota",
        variant: "destructive"
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    checkQuota,
    loading
  }
}