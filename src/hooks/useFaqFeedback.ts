import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FaqFeedback {
  id: string;
  faq_id: string;
  user_id: string;
  helpful: boolean;
  created_at: string;
}

export function useFaqFeedback() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's feedback
  const { data: userFeedback = [] } = useQuery({
    queryKey: ['faq-feedback', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('faq_feedback')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as FaqFeedback[];
    },
    enabled: !!user?.id,
  });

  // Submit feedback
  const submitFeedbackMutation = useMutation({
    mutationFn: async ({ faqId, helpful }: { faqId: string; helpful: boolean }) => {
      if (!user?.id) throw new Error('Utilisateur non connecté');

      // Check if feedback exists
      const existingFeedback = userFeedback.find(f => f.faq_id === faqId);

      if (existingFeedback) {
        // Update existing feedback
        const { data, error } = await supabase
          .from('faq_feedback')
          .update({ helpful })
          .eq('id', existingFeedback.id)
          .select()
          .single();

        if (error) throw error;
        return data as FaqFeedback;
      } else {
        // Insert new feedback
        const { data, error } = await supabase
          .from('faq_feedback')
          .insert({
            faq_id: faqId,
            user_id: user.id,
            helpful,
          })
          .select()
          .single();

        if (error) throw error;
        return data as FaqFeedback;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['faq-feedback'] });
      toast.success(variables.helpful ? 'Merci pour votre retour positif !' : 'Merci pour votre retour');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de l\'envoi du feedback', {
        description: error.message,
      });
    },
  });

  const getUserFeedbackForFaq = (faqId: string): boolean | null => {
    const feedback = userFeedback.find(f => f.faq_id === faqId);
    return feedback ? feedback.helpful : null;
  };

  return {
    userFeedback,
    submitFeedback: submitFeedbackMutation.mutate,
    isSubmitting: submitFeedbackMutation.isPending,
    getUserFeedbackForFaq,
  };
}
