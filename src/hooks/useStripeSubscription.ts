import { useState, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
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
  
  // Cache pour éviter les appels répétés
  const lastCheckRef = useRef<number>(0)
  const cacheRef = useRef<StripeSubscription | null>(null)
  const isCheckingRef = useRef(false)

  const checkSubscription = useCallback(async (): Promise<StripeSubscription | null> => {
    if (!user) return null
    
    // Éviter les appels multiples simultanés
    if (isCheckingRef.current) {
      console.log('Check subscription already in progress, skipping...')
      return cacheRef.current
    }
    
    // Cache pendant 30 secondes
    const now = Date.now()
    if (cacheRef.current && (now - lastCheckRef.current) < 30000) {
      console.log('Using cached subscription data')
      setSubscription(cacheRef.current)
      return cacheRef.current
    }

    try {
      setLoading(true)
      isCheckingRef.current = true
      
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      })

      if (error) {
        // Gestion spéciale des rate limits
        if (error.message?.includes('rate limit')) {
          console.warn('Stripe rate limit reached, using cached data')
          if (cacheRef.current) {
            setSubscription(cacheRef.current)
            return cacheRef.current
          }
        }
        throw error
      }

      const subscriptionData: StripeSubscription = {
        subscribed: data.subscribed || false,
        subscription_tier: data.subscription_tier || null,
        subscription_end: data.subscription_end || null
      }

      // Mise à jour du cache
      cacheRef.current = subscriptionData
      lastCheckRef.current = now
      setSubscription(subscriptionData)
      
      return subscriptionData
    } catch (error: any) {
      console.error('Error checking subscription:', error)
      
      // En cas d'erreur, utiliser le cache si disponible
      if (cacheRef.current) {
        setSubscription(cacheRef.current)
        return cacheRef.current
      }
      
      // Seulement afficher le toast si ce n'est pas un rate limit
      if (!error.message?.includes('rate limit')) {
        toast({
          title: "Erreur de vérification",
          description: "Impossible de vérifier l'abonnement. Veuillez réessayer plus tard.",
          variant: "destructive"
        })
      }
      
      return null
    } finally {
      setLoading(false)
      isCheckingRef.current = false
    }
  }, [user, toast])

  const createCheckout = async (plan: 'pro' | 'ultra_pro') => {
    if (!user) return null

    try {
      setLoading(true)
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { plan },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (error) throw error

      // Open Stripe checkout in new tab
      if (data.url) {
        window.open(data.url, '_blank')
      }
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