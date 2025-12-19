import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { performSecureSignOut } from '@/utils/auth';
import { logAction, logError } from '@/utils/consoleCleanup';

export const DisconnectNotification = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    logAction('Setting up disconnect notification listener', { userId: user.id });

    // Subscribe to real-time disconnect notifications
    const channel = supabase.channel('user-disconnections')
      .on('broadcast', { event: 'force_disconnect' }, (payload) => {
        logAction('Received disconnect notification', payload);
        
        if (payload.payload.userId === user.id) {
          logAction('User is being force disconnected');
          
          toast({
            title: 'Session terminée',
            description: 'Votre session a été terminée par un administrateur. Redirection...',
            variant: 'destructive',
            duration: 3000
          });

          // Wait a moment for the toast to show, then sign out
          setTimeout(async () => {
            await performSecureSignOut(supabase);
          }, 2000);
        }
      })
      .subscribe((status) => {
        logAction('Disconnect notification channel status', status);
      });

    // Also check for token revocation periodically
    const checkTokenRevocation = async () => {
      try {
        const { data, error } = await supabase.rpc('is_token_revoked', {
          check_user_id: user.id
        });

        if (error) {
          logError(error, 'Token revocation check');
          return;
        }

        if (data === true) {
          logAction('Token is revoked, signing out user');
          
          toast({
            title: 'Session expirée',
            description: 'Votre session a expiré. Redirection...',
            variant: 'destructive'
          });

          setTimeout(async () => {
            await performSecureSignOut(supabase);
          }, 2000);
        }
      } catch (error) {
        logError(error as Error, 'Token revocation check');
      }
    };

    // Check token revocation every 30 seconds
    const interval = setInterval(checkTokenRevocation, 30000);

    // Initial check
    checkTokenRevocation();

    return () => {
      logAction('Cleaning up disconnect notification listener');
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user, toast]);

  // This component doesn't render anything
  return null;
};