import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface StripeSubscription {
  subscribed: boolean
  subscription_tier: string | null
  subscription_end: string | null
}

export const useStripeSubscription = () => {
  const [loading, setLoading] = useState(false)
  const [subscription, setSubscription] = useState<StripeSubscription | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  const checkSubscription = async () => {
    if (!user) return null

    try {
      setLoading(true)
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (error) throw error

      const subscriptionData = {
        subscribed: data.subscribed,
        subscription_tier: data.subscription_tier,
        subscription_end: data.subscription_end
      }
      setSubscription(subscriptionData)
      return subscriptionData
    } catch (error: any) {
      console.error('Error checking subscription:', error)
      toast({
        title: "Erreur",
        description: "Impossible de vérifier l'abonnement",
        variant: "destructive"
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  const createCheckout = async (plan: 'pro' | 'ultra_pro') => {
    if (!user) return null

    try {
      setLoading(true)
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (error) throw error

      // Open Stripe checkout in new tab
      window.open(data.url, '_blank')
      return data.url
    } catch (error: any) {
      console.error('Error creating checkout:', error)
      toast({
        title: "Erreur",
        description: "Impossible de créer la session de paiement",
        variant: "destructive"
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  const openCustomerPortal = async () => {
    if (!user) return null

    try {
      setLoading(true)
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (error) throw error

      // Open Stripe customer portal in new tab
      window.open(data.url, '_blank')
      return data.url
    } catch (error: any) {
      console.error('Error opening customer portal:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir le portail client",
        variant: "destructive"
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    subscription,
    loading,
    checkSubscription,
    createCheckout,
    openCustomerPortal
  }
}