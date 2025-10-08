import { useState, useEffect, useCallback } from 'react';
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

const PLAN_PRICES = {
  standard: 'price_1S7KZaFdyZLEbAYa8kA9hCUb',
  pro: 'price_1S7Ka5FdyZLEbAYaszKu4XDM',
  ultra_pro: 'price_1S7KaNFdyZLEbAYaovKWFgc4',
};

export function useStripeSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) {
        // Handle specific error cases
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
          throw error;
        }
        return;
      }

      setSubscription(data);
      
      // Trigger plan refetch to sync UI
      if (data?.subscribed && data?.product_id) {
        console.log('Subscription verified and synced with profile');
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier l'abonnement",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const createCheckout = useCallback(async (plan: Exclude<PlanType, 'free'>) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté",
        variant: "destructive"
      });
      return;
    }

    try {
      const priceId = PLAN_PRICES[plan];
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la session de paiement",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  const openCustomerPortal = useCallback(async () => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('stripe-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir le portail client",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  useEffect(() => {
    checkSubscription();
    
    // Refresh every minute
    const interval = setInterval(checkSubscription, 60000);
    
    return () => clearInterval(interval);
  }, [checkSubscription]);

  return {
    subscription,
    loading,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    hasFeature: (feature: string) => {
      if (!subscription) return false;
      
      const featureAccess = {
        free: [],
        standard: ['basic_import', 'basic_analytics'],
        pro: ['basic_import', 'basic_analytics', 'ai_import', 'advanced_analytics', 'unlimited_integrations'],
        ultra_pro: ['basic_import', 'basic_analytics', 'ai_import', 'advanced_analytics', 'unlimited_integrations', 'white_label', 'priority_support']
      };
      
      return featureAccess[subscription.plan]?.includes(feature) || false;
    }
  };
}