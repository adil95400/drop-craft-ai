import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized';
import { toast } from 'sonner';

export interface SatisfactionSurvey {
  id: string;
  customer_id: string | null;
  order_id: string | null;
  survey_type: string;
  rating: number | null;
  feedback: string | null;
  sentiment: string | null;
  status: string;
  sent_at: string | null;
  responded_at: string | null;
  reminder_count: number;
  created_at: string;
}

export interface ReviewReminder {
  id: string;
  customer_email: string;
  customer_name: string | null;
  product_id: string | null;
  order_id: string | null;
  status: string;
  scheduled_at: string;
  sent_at: string | null;
  review_received: boolean;
  review_rating: number | null;
  reminder_count: number;
  max_reminders: number;
  created_at: string;
}

export interface RefundRequest {
  id: string;
  order_id: string | null;
  customer_email: string;
  customer_name: string | null;
  amount: number;
  currency: string;
  reason: string;
  reason_category: string;
  status: string;
  auto_approved: boolean;
  notes: string | null;
  created_at: string;
}

export function useCustomerServiceHub() {
  const { user } = useAuthOptimized();
  const queryClient = useQueryClient();

  const { data: tickets = [], isLoading: isLoadingTickets } = useQuery({
    queryKey: ['support-tickets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: surveys = [], isLoading: isLoadingSurveys } = useQuery({
    queryKey: ['satisfaction-surveys', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase.from('satisfaction_surveys') as any)
        .select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return (data || []) as SatisfactionSurvey[];
    },
    enabled: !!user?.id,
  });

  const { data: reminders = [], isLoading: isLoadingReminders } = useQuery({
    queryKey: ['review-reminders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase.from('review_reminders') as any)
        .select('*').eq('user_id', user.id).order('scheduled_at', { ascending: true }).limit(50);
      if (error) throw error;
      return (data || []) as ReviewReminder[];
    },
    enabled: !!user?.id,
  });

  const { data: refunds = [], isLoading: isLoadingRefunds } = useQuery({
    queryKey: ['refund-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase.from('refund_requests') as any)
        .select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return (data || []) as RefundRequest[];
    },
    enabled: !!user?.id,
  });

  const stats = {
    openTickets: tickets.filter((t: any) => t.status === 'open' || t.status === 'in_progress').length,
    totalTickets: tickets.length,
    avgRating: surveys.filter(s => s.rating).length > 0
      ? (surveys.filter(s => s.rating).reduce((s, sv) => s + (sv.rating || 0), 0) / surveys.filter(s => s.rating).length).toFixed(1)
      : '—',
    surveyResponseRate: surveys.length > 0
      ? Math.round((surveys.filter(s => s.status === 'responded').length / surveys.length) * 100)
      : 0,
    pendingRefunds: refunds.filter(r => r.status === 'pending').length,
    totalRefundAmount: refunds.filter(r => r.status === 'approved' || r.status === 'refunded').reduce((s, r) => s + Number(r.amount), 0),
    scheduledReminders: reminders.filter(r => r.status === 'scheduled').length,
    reviewsReceived: reminders.filter(r => r.review_received).length,
  };

  const createSurvey = useMutation({
    mutationFn: async (survey: Partial<SatisfactionSurvey>) => {
      if (!user) throw new Error('Non authentifié');
      const { error } = await (supabase.from('satisfaction_surveys') as any)
        .insert({ ...survey, user_id: user.id, status: 'sent', sent_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['satisfaction-surveys'] }); toast.success('Enquête envoyée'); },
    onError: () => toast.error('Erreur lors de l\'envoi'),
  });

  const createRefund = useMutation({
    mutationFn: async (refund: Partial<RefundRequest>) => {
      if (!user) throw new Error('Non authentifié');
      const autoApprove = Number(refund.amount) < 50;
      const { error } = await (supabase.from('refund_requests') as any)
        .insert({ ...refund, user_id: user.id, auto_approved: autoApprove, status: autoApprove ? 'approved' : 'pending', approved_at: autoApprove ? new Date().toISOString() : null });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['refund-requests'] }); toast.success('Demande de remboursement créée'); },
    onError: () => toast.error('Erreur'),
  });

  const updateRefundStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'approved') updates.approved_at = new Date().toISOString();
      if (status === 'rejected') updates.rejected_at = new Date().toISOString();
      if (status === 'refunded') updates.refunded_at = new Date().toISOString();
      const { error } = await (supabase.from('refund_requests') as any).update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['refund-requests'] }); toast.success('Statut mis à jour'); },
  });

  const scheduleReminder = useMutation({
    mutationFn: async (reminder: Partial<ReviewReminder>) => {
      if (!user) throw new Error('Non authentifié');
      const { error } = await (supabase.from('review_reminders') as any)
        .insert({ ...reminder, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['review-reminders'] }); toast.success('Rappel planifié'); },
  });

  return {
    tickets, isLoadingTickets,
    surveys, isLoadingSurveys,
    reminders, isLoadingReminders,
    refunds, isLoadingRefunds,
    stats,
    createSurvey: createSurvey.mutate,
    createRefund: createRefund.mutate,
    updateRefundStatus: updateRefundStatus.mutate,
    scheduleReminder: scheduleReminder.mutate,
    isCreatingSurvey: createSurvey.isPending,
    isCreatingRefund: createRefund.isPending,
  };
}
