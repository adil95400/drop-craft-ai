import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

export function useFreeTrial() {
  const { toast } = useToast()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: trial, isLoading } = useQuery({
    queryKey: ['free-trial', user?.id],
    queryFn: async () => {
      if (!user) return null

      const { data, error } = await supabase
        .from('free_trial_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    },
    enabled: !!user,
  })

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
        description: `Profitez de ${data.trial.days} jours d'accès au plan ${data.trial.plan}`,
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

  const convertTrialMutation = useMutation({
    mutationFn: async () => {
      if (!trial) throw new Error('No active trial')

      const { error } = await supabase
        .from('free_trial_subscriptions')
        .update({
          status: 'converted',
          converted_to_paid: true,
          conversion_date: new Date().toISOString(),
        })
        .eq('id', trial.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['free-trial'] })
      toast({
        title: '✅ Abonnement activé',
        description: 'Votre essai a été converti en abonnement payant',
      })
    },
  })

  const cancelTrialMutation = useMutation({
    mutationFn: async () => {
      if (!trial) throw new Error('No active trial')

      const { error } = await supabase
        .from('free_trial_subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', trial.id)

      if (error) throw error

      // Réinitialiser le profil au plan gratuit
      await supabase
        .from('profiles')
        .update({
          plan: 'standard',
          subscription_status: 'inactive',
          subscription_expires_at: null,
        })
        .eq('id', user?.id)
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
