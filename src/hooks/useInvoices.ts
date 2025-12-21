import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useInvoices = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateInvoice = useMutation({
    mutationFn: async ({ invoiceData, templateId }: any) => {
      const { data, error } = await supabase.functions.invoke('invoice-generator', {
        body: { 
          action: 'generate_invoice', 
          invoice_data: invoiceData,
          template_id: templateId 
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: '📄 Facture générée' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  const sendInvoice = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data, error } = await supabase.functions.invoke('invoice-generator', {
        body: { action: 'send_invoice', invoice_id: invoiceId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: '📧 Facture envoyée' });
    }
  });

  const markPaid = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data, error } = await supabase.functions.invoke('invoice-generator', {
        body: { action: 'mark_paid', invoice_id: invoiceId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: '✅ Facture marquée payée' });
    }
  });

  const getInvoices = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_history' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const getTemplates = useQuery({
    queryKey: ['invoice-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_templates' as any)
        .select('*');
      if (error) throw error;
      return data || [];
    }
  });

  return {
    generateInvoice,
    sendInvoice,
    markPaid,
    getInvoices,
    getTemplates
  };
};
