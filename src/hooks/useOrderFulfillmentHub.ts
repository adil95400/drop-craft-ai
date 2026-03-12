/**
 * useOrderFulfillmentHub — Unified hook for Order Fulfillment module
 * Covers: split orders, packing slip templates, batch processing
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ─── Split Orders ────────────────────────────────────────────────────

export function useSplitOrders(parentOrderId?: string) {
  const queryClient = useQueryClient();

  const { data: splits = [], isLoading } = useQuery({
    queryKey: ['split-orders', parentOrderId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      let q = (supabase.from('split_orders') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (parentOrderId) q = q.eq('parent_order_id', parentOrderId);
      else q = q.limit(100);

      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const createSplit = useMutation({
    mutationFn: async (split: {
      parent_order_id: string;
      supplier_name: string;
      supplier_id?: string;
      items: any[];
      subtotal?: number;
      shipping_cost?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await (supabase.from('split_orders') as any).insert({
        ...split,
        user_id: user.id,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Split order créé');
      queryClient.invalidateQueries({ queryKey: ['split-orders'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateSplitStatus = useMutation({
    mutationFn: async ({ id, status, tracking_number, carrier }: {
      id: string; status: string; tracking_number?: string; carrier?: string;
    }) => {
      const updates: any = { status };
      if (tracking_number) updates.tracking_number = tracking_number;
      if (carrier) updates.carrier = carrier;
      if (status === 'processing') updates.processed_at = new Date().toISOString();
      if (status === 'shipped') updates.shipped_at = new Date().toISOString();
      if (status === 'delivered') updates.delivered_at = new Date().toISOString();

      const { error } = await (supabase.from('split_orders') as any)
        .update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Statut mis à jour');
      queryClient.invalidateQueries({ queryKey: ['split-orders'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stats = {
    total: splits.length,
    pending: splits.filter((s: any) => s.status === 'pending').length,
    processing: splits.filter((s: any) => s.status === 'processing').length,
    shipped: splits.filter((s: any) => s.status === 'shipped').length,
    delivered: splits.filter((s: any) => s.status === 'delivered').length,
    failed: splits.filter((s: any) => s.status === 'failed').length,
  };

  return { splits, isLoading, stats, createSplit, updateSplitStatus };
}

// ─── Packing Slip Templates ─────────────────────────────────────────

export function usePackingSlipTemplates() {
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['packing-slip-templates'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await (supabase.from('packing_slip_templates') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (template: {
      name: string;
      company_name?: string;
      company_address?: string;
      logo_url?: string;
      thank_you_message?: string;
      footer_text?: string;
      show_prices?: boolean;
      show_barcode?: boolean;
      brand_color?: string;
      template_style?: string;
      insert_message?: string;
      is_default?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // If setting as default, unset other defaults
      if (template.is_default) {
        await (supabase.from('packing_slip_templates') as any)
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { error } = await (supabase.from('packing_slip_templates') as any).insert({
        ...template,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Template créé');
      queryClient.invalidateQueries({ queryKey: ['packing-slip-templates'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      if (updates.is_default) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await (supabase.from('packing_slip_templates') as any)
            .update({ is_default: false })
            .eq('user_id', user.id);
        }
      }
      const { error } = await (supabase.from('packing_slip_templates') as any)
        .update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Template mis à jour');
      queryClient.invalidateQueries({ queryKey: ['packing-slip-templates'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('packing_slip_templates') as any)
        .delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Template supprimé');
      queryClient.invalidateQueries({ queryKey: ['packing-slip-templates'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { templates, isLoading, createTemplate, updateTemplate, deleteTemplate };
}

// ─── Batch Processing ────────────────────────────────────────────────

export function useBatchFulfillment() {
  const queryClient = useQueryClient();

  const batchProcess = useMutation({
    mutationFn: async (orderIds: string[]) => {
      const { data, error } = await supabase.functions.invoke('auto-fulfillment-engine', {
        body: { action: 'batch_process', order_ids: orderIds },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const processed = data?.processed || 0;
      toast.success(`${processed} commandes traitées en lot`);
      queryClient.invalidateQueries({ queryKey: ['auto-fulfillment'] });
      queryClient.invalidateQueries({ queryKey: ['split-orders'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const batchRetry = useMutation({
    mutationFn: async (orderIds: string[]) => {
      const { data, error } = await supabase.functions.invoke('auto-fulfillment-engine', {
        body: { action: 'batch_retry', order_ids: orderIds },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Relance en lot effectuée');
      queryClient.invalidateQueries({ queryKey: ['auto-fulfillment'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { batchProcess, batchRetry };
}
