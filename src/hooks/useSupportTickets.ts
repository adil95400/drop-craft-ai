import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  email: string | null;
  status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_staff: boolean;
  attachments: any[];
  created_at: string;
}

export interface CreateTicketData {
  subject: string;
  message: string;
  email?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
}

export function useSupportTickets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all tickets for the user
  const { data: tickets = [], isLoading: isLoadingTickets, error: ticketsError } = useQuery({
    queryKey: ['support-tickets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SupportTicket[];
    },
    enabled: !!user?.id,
  });

  // Create a new ticket
  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: CreateTicketData) => {
      if (!user?.id) throw new Error('Utilisateur non connecté');

      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: ticketData.subject,
          message: ticketData.message,
          email: ticketData.email || user.email,
          priority: ticketData.priority || 'medium',
          category: ticketData.category || 'general',
        })
        .select()
        .single();

      if (error) throw error;
      return data as SupportTicket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Ticket créé avec succès', {
        description: 'Notre équipe vous répondra dans les plus brefs délais.',
      });
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la création du ticket', {
        description: error.message,
      });
    },
  });

  // Update ticket status
  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: SupportTicket['status'] }) => {
      const { data, error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;
      return data as SupportTicket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Ticket mis à jour');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la mise à jour', {
        description: error.message,
      });
    },
  });

  return {
    tickets,
    isLoadingTickets,
    ticketsError,
    createTicket: createTicketMutation.mutate,
    isCreatingTicket: createTicketMutation.isPending,
    updateTicket: updateTicketMutation.mutate,
    isUpdatingTicket: updateTicketMutation.isPending,
  };
}

// Hook for ticket messages
export function useTicketMessages(ticketId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['ticket-messages', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];

      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as TicketMessage[];
    },
    enabled: !!ticketId && !!user?.id,
  });

  const addMessageMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      if (!user?.id) throw new Error('Utilisateur non connecté');

      const { data, error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          user_id: user.id,
          message,
          is_staff: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as TicketMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', ticketId] });
      toast.success('Message envoyé');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de l\'envoi', {
        description: error.message,
      });
    },
  });

  return {
    messages,
    isLoading,
    addMessage: addMessageMutation.mutate,
    isAddingMessage: addMessageMutation.isPending,
  };
}
