import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useStripeCheckout } from '@/hooks/useStripeCheckout'

interface TrialData {
  id: string
  user_id: string
  trial_plan: string
  trial_days: number
  status: string
  ends_at: string
  started_at: string
  coupon_code: string | null
}

export function useFreeTrial() {
  const { toast } = useToast()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { createCheckoutSession } = useStripeCheckout()

  // Fetch real trial data from free_trial_subscriptions table
  const { data: trial, isLoading } = useQuery({
    queryKey: ['free-trial', user?.id],
    queryFn: async (): Promise<TrialData | null> => {
      if (!user) return null

      const { data, error } = await (supabase as any)
        .from('free_trial_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (error || !data) return null

      return {
        id: data.id,
        user_id: data.user_id,
        trial_plan: data.trial_plan,
        trial_days: data.trial_days,
        status: data.status,
        ends_at: data.ends_at,
        started_at: data.started_at,
        coupon_code: data.coupon_code,
      }
    },
    enabled: !!user,
  })

  // Activate trial via secure edge function (user_id extracted from JWT server-side)
  const activateTrialMutation = useMutation({
    mutationFn: async (params: {
      trialDays?: number
      plan?: string
      couponCode?: string
    }) => {
      const { data, error } = await supabase.functions.invoke('trial-activate', {
        body: params,
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['free-trial'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast({
        title: '🎉 Essai gratuit activé',
        description: `Profitez de ${data?.trial?.days || 14} jours d'accès au plan ${data?.trial?.plan || 'Pro'}`,
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'activer l\'essai gratuit',
        variant: 'destructive',
      })
    },
  })

  // Convert trial → redirect to Stripe checkout for the trial plan
  const convertTrialMutation = useMutation({
    mutationFn: async () => {
      if (!trial) throw new Error('No active trial')
      const planType = (trial.trial_plan || 'pro') as 'standard' | 'pro' | 'ultra_pro'
      await createCheckoutSession(planType)
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de convertir l\'essai',
        variant: 'destructive',
      })
    },
  })

  // Cancel trial
  const cancelTrialMutation = useMutation({
    mutationFn: async () => {
      if (!trial || !user) throw new Error('No active trial')

      await (supabase as any)
        .from('free_trial_subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', trial.id)
        .eq('user_id', user.id)

      // Reset profile to free plan
      await supabase
        .from('profiles')
        .update({
          subscription_plan: 'standard',
        })
        .eq('id', user.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['free-trial'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast({
        title: 'Essai annulé',
        description: 'Votre essai gratuit a été annulé',
      })
    },
  })

  const daysRemaining = trial?.ends_at
    ? Math.max(
        0,
        Math.ceil(
          (new Date(trial.ends_at).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0

  const hasActiveTrial = trial?.status === 'active' && daysRemaining > 0
  const hasUsedTrial = !!trial

  return {
    trial,
    isLoading,
    hasActiveTrial,
    hasUsedTrial,
    daysRemaining,
    activateTrial: activateTrialMutation.mutate,
    isActivating: activateTrialMutation.isPending,
    convertTrial: convertTrialMutation.mutate,
    isConverting: convertTrialMutation.isPending,
    cancelTrial: cancelTrialMutation.mutate,
    isCancelling: cancelTrialMutation.isPending,
  }
}
