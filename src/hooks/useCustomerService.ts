import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function handleError(error: unknown) {
  const msg = error instanceof Error ? error.message : 'Unknown error';
  if (msg.includes('429')) toast.error('Limite IA atteinte. Réessayez dans quelques minutes.');
  else if (msg.includes('402')) toast.error('Crédits IA épuisés. Passez au plan supérieur.');
  else toast.error(msg);
}

export function useCreateTicket() {
  return useMutation({
    mutationFn: async (ticket: {
      subject: string;
      message: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      category?: string;
      order_id?: string;
      customer_id?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-customer-service', {
        body: { action: 'create_ticket', ticket },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => toast.success('Ticket créé avec succès'),
    onError: handleError,
  });
}

export function useAITicketRespond() {
  return useMutation({
    mutationFn: async (ticket_id: string) => {
      const { data, error } = await supabase.functions.invoke('ai-customer-service', {
        body: { action: 'ai_respond', ticket_id },
      });
      if (error) throw error;
      return data;
    },
    onError: handleError,
  });
}

export function useProcessReturn() {
  return useMutation({
    mutationFn: async (return_request: {
      order_id: string;
      items: Array<{ product_id: string; quantity: number; reason: string }>;
      preferred_resolution: 'refund' | 'exchange' | 'store_credit';
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-customer-service', {
        body: { action: 'process_return', return_request },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => toast.success('Retour traité avec succès'),
    onError: handleError,
  });
}

export function useAutoRefund() {
  return useMutation({
    mutationFn: async (refund_params: {
      order_id: string;
      amount?: number;
      reason: string;
      full_refund?: boolean;
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-customer-service', {
        body: { action: 'auto_refund', refund_params },
      });
      if (error) throw error;
      return data;
    },
    onError: handleError,
  });
}

export function useChatSuggest() {
  return useMutation({
    mutationFn: async (chat_context: {
      customer_message: string;
      conversation_history?: Array<{ role: string; content: string }>;
      customer_id?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-customer-service', {
        body: { action: 'chat_suggest', chat_context },
      });
      if (error) throw error;
      return data;
    },
    onError: handleError,
  });
}
