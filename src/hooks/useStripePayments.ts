import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string
  status: string
  plan_name: string
  price_id: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

interface PaymentMethod {
  id: string
  type: string
  card?: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
  }
}

interface Invoice {
  id: string
  amount_paid: number
  currency: string
  status: string
  invoice_pdf: string
  created: number
}

export const useStripePayments = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch user subscription
  const {
    data: subscription,
    isLoading: isLoadingSubscription
  } = useQuery({
    queryKey: ['user-subscription'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (error) throw error
      return data as Subscription | null
    }
  })

  // Create checkout session
  const createCheckoutSession = useMutation({
    mutationFn: async ({ 
      priceId, 
      successUrl, 
      cancelUrl 
    }: { 
      priceId: string
      successUrl?: string
      cancelUrl?: string 
    }) => {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          price_id: priceId,
          success_url: successUrl || `${window.location.origin}/success`,
          cancel_url: cancelUrl || `${window.location.origin}/pricing`
        }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      if (data.url) {
        window.open(data.url, '_blank')
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de paiement",
        description: error.message || "Impossible de créer la session de paiement",
        variant: "destructive",
      })
    }
  })

  // Create customer portal session
  const createPortalSession = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: {
          return_url: window.location.origin
        }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Redirect to Stripe Customer Portal
      if (data.url) {
        window.open(data.url, '_blank')
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur d'accès au portail",
        description: error.message || "Impossible d'accéder au portail client",
        variant: "destructive",
      })
    }
  })

  // Check subscription status
  const checkSubscription = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-subscription')
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] })
      toast({
        title: "Statut mis à jour",
        description: "Le statut de votre abonnement a été actualisé",
      })
    }
  })

  // Cancel subscription
  const cancelSubscription = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscription_id: subscriptionId }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] })
      toast({
        title: "Abonnement annulé",
        description: "Votre abonnement sera annulé à la fin de la période en cours",
      })
    }
  })

  // Resume subscription
  const resumeSubscription = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { data, error } = await supabase.functions.invoke('resume-subscription', {
        body: { subscription_id: subscriptionId }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] })
      toast({
        title: "Abonnement réactivé",
        description: "Votre abonnement a été réactivé avec succès",
      })
    }
  })

  // Create one-time payment
  const createPayment = useMutation({
    mutationFn: async ({ 
      amount, 
      currency = 'eur',
      description 
    }: { 
      amount: number
      currency?: string
      description: string 
    }) => {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: amount * 100, // Convert to cents
          currency,
          description
        }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank')
      }
    }
  })

  // Get usage statistics for billing
  const getUsageStats = () => {
    // This would typically fetch from your usage tracking
    return {
      products_imported: 0,
      orders_processed: 0,
      api_calls: 0,
      storage_used: 0
    }
  }

  // Check if user has active subscription
  const hasActiveSubscription = () => {
    return subscription && 
           subscription.status === 'active' && 
           new Date(subscription.current_period_end) > new Date()
  }

  // Check if subscription is cancelled
  const isSubscriptionCancelled = () => {
    return subscription?.cancel_at_period_end === true
  }

  return {
    subscription,
    isLoadingSubscription,
    hasActiveSubscription: hasActiveSubscription(),
    isSubscriptionCancelled: isSubscriptionCancelled(),
    createCheckoutSession: createCheckoutSession.mutate,
    createPortalSession: createPortalSession.mutate,
    checkSubscription: checkSubscription.mutate,
    cancelSubscription: cancelSubscription.mutate,
    resumeSubscription: resumeSubscription.mutate,
    createPayment: createPayment.mutate,
    getUsageStats,
    isCreatingCheckout: createCheckoutSession.isPending,
    isCreatingPortal: createPortalSession.isPending,
    isCheckingSubscription: checkSubscription.isPending,
    isCancelling: cancelSubscription.isPending,
    isResuming: resumeSubscription.isPending,
    isCreatingPayment: createPayment.isPending
  }
}