import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized';
import { toast } from 'sonner';

export interface AbandonedCart {
  id: string;
  user_id: string;
  customer_email: string;
  customer_name: string | null;
  cart_items: any[];
  cart_value: number;
  currency: string;
  abandoned_at: string;
  recovery_status: string;
  recovery_attempts: number;
  last_contacted_at: string | null;
  recovered_at: string | null;
  order_id: string | null;
  source_platform: string | null;
  created_at: string;
}

export function useAbandonedCarts() {
  const { user } = useAuthOptimized();
  const queryClient = useQueryClient();

  const { data: carts = [], isLoading } = useQuery({
    queryKey: ['abandoned-carts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase
        .from('abandoned_carts') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('abandoned_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as AbandonedCart[];
    },
    enabled: !!user?.id,
  });

  const stats = {
    total: carts.length,
    pending: carts.filter(c => c.recovery_status === 'pending').length,
    contacted: carts.filter(c => c.recovery_status === 'contacted').length,
    recovered: carts.filter(c => c.recovery_status === 'recovered').length,
    totalValue: carts.reduce((s, c) => s + Number(c.cart_value), 0),
    recoveredValue: carts.filter(c => c.recovery_status === 'recovered').reduce((s, c) => s + Number(c.cart_value), 0),
    recoveryRate: carts.length > 0
      ? Math.round((carts.filter(c => c.recovery_status === 'recovered').length / carts.length) * 100)
      : 0,
  };

  const sendRecoveryEmail = useMutation({
    mutationFn: async (cartId: string) => {
      const cart = carts.find(c => c.id === cartId);
      if (!cart) throw new Error('Cart not found');

      // Send real recovery email via Brevo
      const { error: brevoError } = await supabase.functions.invoke('brevo-hub', {
        body: {
          action: 'abandoned_cart_email',
          customerEmail: cart.customer_email,
          customerName: cart.customer_name,
          cartItems: cart.cart_items,
          cartValue: cart.cart_value,
          currency: cart.currency || 'EUR',
        },
      });

      if (brevoError) {
        console.error('Brevo email error:', brevoError);
      }

      // Update cart status
      const { error } = await (supabase
        .from('abandoned_carts') as any)
        .update({
          recovery_status: 'contacted',
          recovery_attempts: (cart.recovery_attempts || 0) + 1,
          last_contacted_at: new Date().toISOString(),
        })
        .eq('id', cartId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abandoned-carts'] });
      toast.success('Email de relance envoyé via Brevo');
    },
    onError: () => toast.error('Erreur lors de l\'envoi'),
  });

  const markRecovered = useMutation({
    mutationFn: async (cartId: string) => {
      const { error } = await (supabase
        .from('abandoned_carts') as any)
        .update({
          recovery_status: 'recovered',
          recovered_at: new Date().toISOString(),
        })
        .eq('id', cartId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abandoned-carts'] });
      toast.success('Panier marqué comme récupéré');
    },
  });

  const dismissCart = useMutation({
    mutationFn: async (cartId: string) => {
      const { error } = await (supabase
        .from('abandoned_carts') as any)
        .update({ recovery_status: 'dismissed' })
        .eq('id', cartId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abandoned-carts'] });
      toast.success('Panier ignoré');
    },
  });

  return {
    carts,
    isLoading,
    stats,
    sendRecoveryEmail: sendRecoveryEmail.mutate,
    isSending: sendRecoveryEmail.isPending,
    markRecovered: markRecovered.mutate,
    dismissCart: dismissCart.mutate,
  };
}
