import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface InvoiceBranding {
  id?: string;
  user_id?: string;
  company_name: string;
  company_address: string;
  company_email: string;
  company_phone: string;
  company_website: string;
  tax_id: string;
  logo_url: string;
  accent_color: string;
  footer_text: string;
  payment_terms: string;
  bank_details: string;
  currency: string;
  invoice_prefix: string;
  next_invoice_number: number;
}

const DEFAULT_BRANDING: InvoiceBranding = {
  company_name: '',
  company_address: '',
  company_email: '',
  company_phone: '',
  company_website: '',
  tax_id: '',
  logo_url: '',
  accent_color: '#6366f1',
  footer_text: 'Merci pour votre confiance !',
  payment_terms: 'Paiement à 30 jours',
  bank_details: '',
  currency: 'EUR',
  invoice_prefix: 'INV',
  next_invoice_number: 1,
};

export function useInvoiceBranding() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: branding, isLoading } = useQuery({
    queryKey: ['invoice-branding'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return DEFAULT_BRANDING;

      const { data, error } = await (supabase.from('invoice_branding') as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return (data as InvoiceBranding) || { ...DEFAULT_BRANDING, user_id: user.id };
    },
  });

  const saveBranding = useMutation({
    mutationFn: async (values: Partial<InvoiceBranding>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const payload = { ...values, user_id: user.id };
      const { data, error } = await (supabase.from('invoice_branding') as any)
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-branding'] });
      toast({ title: '✅ Branding sauvegardé' });
    },
    onError: (e: Error) => {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    },
  });

  return {
    branding: branding || DEFAULT_BRANDING,
    isLoading,
    saveBranding: saveBranding.mutate,
    isSaving: saveBranding.isPending,
  };
}
