import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export type PlanType = 'free' | 'standard' | 'pro' | 'ultra_pro';

interface SubscriptionData {
  subscribed: boolean;
  product_id: string | null;
  plan: PlanType;
  subscription_end: string | null;
}

// Product IDs from Stripe
export const STRIPE_PRODUCTS = {
  standard: 'prod_T3RS5DA7XYPWBP',
  pro: 'prod_T3RTReiXnCg9hy',
  ultra_pro: 'prod_T3RTMipVwUA7Ud',
} as const;

// Price IDs from Stripe (recurring monthly)
export const STRIPE_PRICES = {
  standard: 'price_1S7KZaFdyZLEbAYa8kA9hCUb',   // 19€/mois
  pro: 'price_1S7Ka5FdyZLEbAYaszKu4XDM',        // 29€/mois
  ultra_pro: 'price_1S7KaNFdyZLEbAYaovKWFgc4', // 99€/mois
} as const;

// Map product IDs to plan types
const productToPlan: Record<string, PlanType> = {
  [STRIPE_PRODUCTS.standard]: 'standard',
  [STRIPE_PRODUCTS.pro]: 'pro',
  [STRIPE_PRODUCTS.ultra_pro]: 'ultra_pro',
};

export function useStripeSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const lastCheckRef = useRef<number>(0);

  const checkSubscription = useCallback(async (force = false) => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    // Rate limiting: prevent multiple calls within 30 seconds unless forced
    const now = Date.now();
    if (!force && now - lastCheckRef.current < 30000) {
      console.log('[Stripe] Skipping check - rate limited');
      return;
    }
    lastCheckRef.current = now;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) {
        if (error.message?.includes('Rate limit')) {
          toast({
            title: "Limite atteinte",
            description: "Trop de requêtes. Veuillez réessayer dans quelques instants.",
            variant: "destructive"
          });
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          toast({
            title: "Erreur de connexion",
            description: "Vérifiez votre connexion internet",
            variant: "destructive"
          });
        } else {
          console.error('Subscription check error:', error);
        }
        return;
      }

      // Map product_id to plan if not already set correctly
      if (data?.product_id && !data.plan) {
        data.plan = productToPlan[data.product_id] || 'free';
      }

      setSubscription(data);
      
      if (data?.subscribed) {
        console.log('[Stripe] Subscription verified:', data.plan, 'until', data.subscription_end);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const createCheckout = useCallback(async (plan: Exclude<PlanType, 'free'>) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour souscrire",
        variant: "destructive"
      });
      return;
    }

    try {
      const priceId = STRIPE_PRICES[plan];
      if (!priceId) {
        throw new Error(`Prix invalide pour le plan: ${plan}`);
      }

      toast({
        title: "Redirection...",
        description: "Préparation de la page de paiement Stripe",
      });

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('URL de checkout non reçue');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer la session de paiement",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  const openCustomerPortal = useCallback(async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Redirection...",
        description: "Ouverture du portail de gestion",
      });

      const { data, error } = await supabase.functions.invoke('stripe-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('URL du portail non reçue');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'ouvrir le portail client",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  // Initial check and periodic refresh (every 5 minutes to avoid rate limits)
  useEffect(() => {
    // Only check once on mount
    if (user && lastCheckRef.current === 0) {
      checkSubscription(true);
    }
    
    // Refresh every 5 minutes instead of 60 seconds
    const interval = setInterval(() => checkSubscription(), 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [checkSubscription, user]);

  // Check on URL params (success redirect from Stripe)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      // Force refresh after successful checkout
      setTimeout(() => checkSubscription(true), 2000);
      toast({
        title: "🎉 Paiement réussi!",
        description: "Votre abonnement est maintenant actif",
      });
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (urlParams.get('canceled') === 'true') {
      toast({
        title: "Paiement annulé",
        description: "Aucun montant n'a été débité",
        variant: "destructive"
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [checkSubscription, toast]);

  return {
    subscription,
    loading,
    checkSubscription: () => checkSubscription(true),
    createCheckout,
    openCustomerPortal,
    isPro: subscription?.plan === 'pro' || subscription?.plan === 'ultra_pro',
    isUltraPro: subscription?.plan === 'ultra_pro',
    hasFeature: (feature: string) => {
      if (!subscription) return false;
      
      const featureAccess: Record<PlanType, string[]> = {
        free: [],
        standard: ['basic_import', 'basic_analytics', '1000_products', '3_integrations'],
        pro: ['basic_import', 'basic_analytics', 'ai_import', 'advanced_analytics', 'unlimited_integrations', '10000_products', 'automation'],
        ultra_pro: ['basic_import', 'basic_analytics', 'ai_import', 'advanced_analytics', 'unlimited_integrations', 'unlimited_products', 'white_label', 'priority_support', 'api_access', 'automation']
      };
      
      return featureAccess[subscription.plan]?.includes(feature) || false;
    }
  };
}