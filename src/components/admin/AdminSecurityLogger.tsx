import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useToast } from '@/hooks/use-toast';

export const useAdminSecurityLogger = () => {
  const { user } = useUnifiedAuth();
  const { toast } = useToast();

  const logAdminAction = useCallback(async (
    action: string,
    description: string,
    metadata?: Record<string, any>
  ) => {
    if (!user) return;

    try {
      await supabase.from('security_events').insert({
        user_id: user.id,
        event_type: 'admin_action',
        severity: 'info',
        description: `Action admin: ${description}`,
        metadata: {
          action,
          timestamp: new Date().toISOString(),
          user_email: user.email,
          ...metadata
        }
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'action admin:', error);
    }
  }, [user]);

  const logSecurityEvent = useCallback(async (
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string,
    metadata?: Record<string, any>
  ) => {
    if (!user) return;

    try {
      await supabase.from('security_events').insert({
        user_id: user.id,
        event_type: 'security_alert',
        severity,
        description,
        metadata: {
          timestamp: new Date().toISOString(),
          user_email: user.email,
          ...metadata
        }
      });

      if (severity === 'high' || severity === 'critical') {
        toast({
          title: "Alerte de sécurité",
          description: description,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'événement de sécurité:', error);
    }
  }, [user, toast]);

  return {
    logAdminAction,
    logSecurityEvent
  };
};