/**
 * Hook for managing Stripe-synced coupons
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StripeCoupon {
  id: string;
  user_id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  coupon_type: string;
  currency: string;
  duration: string;
  duration_in_months: number | null;
  min_purchase_amount: number | null;
  max_uses: number | null;
  max_redemptions: number | null;
  current_uses: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  stripe_coupon_id: string | null;
  stripe_promotion_code_id: string | null;
  synced_to_stripe: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCouponInput {
  code: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  duration: 'once' | 'repeating' | 'forever';
  duration_in_months?: number;
  max_redemptions?: number;
  description?: string;
  min_purchase_amount?: number;
  expires_at?: string;
}

export function useStripeCoupons() {
  const queryClient = useQueryClient();

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['stripe-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('manage-stripe-coupons', {
        body: { action: 'list' },
      });
      if (error) throw error;
      return (data?.coupons || []) as StripeCoupon[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateCouponInput) => {
      const { data, error } = await supabase.functions.invoke('manage-stripe-coupons', {
        body: { action: 'create', ...input },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripe-coupons'] });
      toast.success('Coupon créé et synchronisé avec Stripe');
    },
    onError: (error: Error) => {
      toast.error('Erreur création coupon', { description: error.message });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ coupon_id, is_active }: { coupon_id: string; is_active: boolean }) => {
      const { data, error } = await supabase.functions.invoke('manage-stripe-coupons', {
        body: { action: 'toggle', coupon_id, is_active },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripe-coupons'] });
      toast.success('Statut du coupon mis à jour');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (coupon_id: string) => {
      const { data, error } = await supabase.functions.invoke('manage-stripe-coupons', {
        body: { action: 'delete', coupon_id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripe-coupons'] });
      toast.success('Coupon supprimé');
    },
    onError: (error: Error) => {
      toast.error('Erreur suppression', { description: error.message });
    },
  });

  return {
    coupons: coupons || [],
    isLoading,
    createCoupon: createMutation.mutate,
    isCreating: createMutation.isPending,
    toggleCoupon: toggleMutation.mutate,
    isToggling: toggleMutation.isPending,
    deleteCoupon: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
