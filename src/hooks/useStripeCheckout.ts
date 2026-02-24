import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { StripePlanType } from '@/lib/stripe-config';

export const useStripeCheckout = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const createCheckoutSession = async (planType: StripePlanType) => {
    setLoading(true);
    try {
      // Use the secured create-checkout function with priceId
      const { STRIPE_CONFIG } = await import('@/lib/stripe-config');
      const plan = STRIPE_CONFIG.plans[planType];
      if (!plan?.priceId) throw new Error('Plan invalide');

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: plan.priceId }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la session de paiement',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createPortalSession = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-portal');

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'accéder au portail',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return { createCheckoutSession, createPortalSession, loading };
};
