import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePlan } from '@/contexts/PlanContext';

export interface StripeSubscription {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
  plan?: string;
}

export const useStripeIntegration = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setPlan } = usePlan();
  const [isLoading, setIsLoading] = useState(false);

  // Check subscription status
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['stripe-subscription'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      return data as StripeSubscription;
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Create checkout session
  const createCheckoutMutation = useMutation({
    mutationFn: async (plan: 'standard' | 'pro' | 'ultra_pro') => {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { plan }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
      } else if (data.success) {
        // Free plan activated directly
        setPlan(data.plan);
        queryClient.invalidateQueries({ queryKey: ['stripe-subscription'] });
        toast({
          title: "Plan activé",
          description: data.message || "Votre plan a été activé avec succès"
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de paiement",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Open customer portal
  const openPortalMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('stripe-portal');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur d'accès au portail",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Refresh subscription
  const refreshSubscription = async () => {
    setIsLoading(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['stripe-subscription'] });
      toast({
        title: "Abonnement actualisé",
        description: "Votre statut d'abonnement a été mis à jour"
      });
    } catch (error: any) {
      toast({
        title: "Erreur de rafraîchissement",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const hasActiveSubscription = () => {
    return subscription?.subscribed === true;
  };

  const isSubscriptionCancelled = () => {
    return subscription?.subscribed === false && subscription?.subscription_end;
  };

  const getSubscriptionTier = () => {
    return subscription?.subscription_tier || 'standard';
  };

  const createCheckout = (plan: 'standard' | 'pro' | 'ultra_pro') => {
    createCheckoutMutation.mutate(plan);
  };

  const openPortal = () => {
    openPortalMutation.mutate();
  };

  return {
    // Data
    subscription,
    
    // Loading states
    isLoadingSubscription,
    isLoading,
    isCreatingCheckout: createCheckoutMutation.isPending,
    isOpeningPortal: openPortalMutation.isPending,
    
    // Actions
    createCheckout,
    openPortal,
    refreshSubscription,
    
    // Helpers
    hasActiveSubscription,
    isSubscriptionCancelled,
    getSubscriptionTier
  };
};