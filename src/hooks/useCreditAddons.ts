/**
 * Hook pour la gestion des crédits IA add-on (achat + consommation)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CreditPack {
  id: string;
  credits: number;
  label: string;
  price: number;
  currency: string;
  popular?: boolean;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'small', credits: 50, label: '50 crédits IA', price: 4.99, currency: 'EUR' },
  { id: 'medium', credits: 200, label: '200 crédits IA', price: 14.99, currency: 'EUR', popular: true },
  { id: 'large', credits: 500, label: '500 crédits IA', price: 29.99, currency: 'EUR' },
];

export function useCreditAddons() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: addons = [], isLoading } = useQuery({
    queryKey: ['credit-addons', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('credit_addons')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      return data as Array<{
        id: string;
        quota_key: string;
        credits_purchased: number;
        credits_remaining: number;
        price_paid: number;
        status: string;
        purchased_at: string;
        expires_at: string | null;
      }>;
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const totalCreditsRemaining = addons.reduce((sum, a) => sum + a.credits_remaining, 0);

  const purchaseMutation = useMutation({
    mutationFn: async (packId: string) => {
      const { data, error } = await supabase.functions.invoke('purchase-credits', {
        body: { pack_id: packId },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
        return { redirected: true };
      }

      return { redirected: false, success: data.success };
    },
    onSuccess: (result) => {
      if (!result.redirected) {
        toast.success('Crédits ajoutés avec succès !');
        queryClient.invalidateQueries({ queryKey: ['credit-addons'] });
        queryClient.invalidateQueries({ queryKey: ['quota-usage'] });
      }
    },
    onError: (error) => {
      toast.error("Erreur lors de l'achat", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });

  return {
    addons,
    totalCreditsRemaining,
    isLoading,
    packs: CREDIT_PACKS,
    purchaseCredits: purchaseMutation.mutate,
    isPurchasing: purchaseMutation.isPending,
  };
}
