import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FeedbackData {
  type: 'bug' | 'feature' | 'satisfaction' | 'general';
  rating?: number;
  message: string;
  page?: string;
  metadata?: Record<string, unknown>;
}

export function useFeedback() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const submitFeedback = useCallback(async (feedback: FeedbackData) => {
    setIsSubmitting(true);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      // Store feedback in activity_logs table
      const { error } = await supabase.from('activity_logs').insert({
        user_id: userData.user?.id || 'anonymous',
        action: 'feedback_submitted',
        description: `${feedback.type}: ${feedback.message.substring(0, 100)}`,
        entity_type: 'feedback',
        metadata: {
          feedback_type: feedback.type,
          rating: feedback.rating,
          message: feedback.message,
          page: feedback.page || window.location.pathname,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          ...feedback.metadata,
        },
        severity: feedback.type === 'bug' ? 'warning' : 'info',
        source: 'user_feedback',
      });

      if (error) throw error;

      toast({
        title: "Merci pour votre retour !",
        description: "Votre feedback nous aide à améliorer ShopOpti+.",
      });

      return true;
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer votre feedback. Réessayez plus tard.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [toast]);

  const trackAbandonment = useCallback(async (
    action: string,
    step: number,
    totalSteps: number,
    context?: Record<string, unknown>
  ) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      await supabase.from('activity_logs').insert({
        user_id: userData.user?.id || 'anonymous',
        action: 'action_abandoned',
        description: `Abandoned ${action} at step ${step}/${totalSteps}`,
        entity_type: 'workflow',
        metadata: {
          action,
          step,
          totalSteps,
          completion_rate: (step / totalSteps) * 100,
          page: window.location.pathname,
          ...context,
        },
        severity: 'info',
        source: 'abandonment_tracking',
      });
    } catch (error) {
      console.error('Failed to track abandonment:', error);
    }
  }, []);

  const trackSatisfaction = useCallback(async (
    feature: string,
    rating: number,
    comment?: string
  ) => {
    return submitFeedback({
      type: 'satisfaction',
      rating,
      message: comment || `Rated ${feature}: ${rating}/5`,
      metadata: { feature },
    });
  }, [submitFeedback]);

  return {
    isSubmitting,
    submitFeedback,
    trackAbandonment,
    trackSatisfaction,
  };
}
