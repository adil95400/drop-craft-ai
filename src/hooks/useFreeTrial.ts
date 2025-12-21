import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

interface TrialData {
  id: string
  user_id: string
  plan: string
  status: string
  ends_at: string
  created_at: string
}

export function useFreeTrial() {
  const { toast } = useToast()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: trial, isLoading } = useQuery({
    queryKey: ['free-trial', user?.id],
    queryFn: async (): Promise<TrialData | null> => {
      if (!user) return null

      // Use profiles table to check subscription status
      const { data, error } = await supabase
        .from('profiles')
        .select('id, subscription_plan, created_at, updated_at')
        .eq('id', user.id)
        .single()

      if (error) return null
      
      // Mock trial data based on profile
      if (data?.subscription_plan === 'pro' || data?.subscription_plan === 'ultra_pro') {
        return {
          id: data.id,
          user_id: data.id,
          plan: data.subscription_plan,
          status: 'active',
          ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: data.created_at
        }
      }
      return null
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

  const convertTrialMutation = useMutation({
    mutationFn: async () => {
      if (!trial) throw new Error('No active trial')

      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_plan: trial.plan || 'pro'
        })
        .eq('id', user?.id)

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

      // Réinitialiser le profil au plan gratuit
      await supabase
        .from('profiles')
        .update({
          subscription_plan: 'standard'
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
