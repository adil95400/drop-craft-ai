import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { performSecureSignOut } from '@/utils/auth';
import { productionLogger } from '@/utils/productionLogger';

export const DisconnectNotification = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    productionLogger.info('Setting up disconnect notification listener', { userId: user.id }, 'DisconnectNotification');

    // Subscribe to real-time disconnect notifications
    const channel = supabase.channel('user-disconnections')
      .on('broadcast', { event: 'force_disconnect' }, (payload) => {
        productionLogger.info('Received disconnect notification', payload, 'DisconnectNotification');
        
        if (payload.payload.userId === user.id) {
          productionLogger.info('User is being force disconnected', undefined, 'DisconnectNotification');
          
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
        productionLogger.info('Disconnect notification channel status', status, 'DisconnectNotification');
      });

    // Also check for token revocation periodically
    const checkTokenRevocation = async () => {
      try {
        const { data, error } = await supabase.rpc('is_token_revoked', {
          token_id: user.id
        });

        if (error) {
          productionLogger.error('Token revocation check', error, 'DisconnectNotification');
          return;
        }

        if (data === true) {
          productionLogger.info('Token is revoked, signing out user', undefined, 'DisconnectNotification');
          
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
        productionLogger.error('Token revocation check', error as Error, 'DisconnectNotification');
      }
    };

    // Check token revocation every 30 seconds
    const interval = setInterval(checkTokenRevocation, 30000);

    // Initial check
    checkTokenRevocation();

    return () => {
      productionLogger.info('Cleaning up disconnect notification listener', undefined, 'DisconnectNotification');
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user, toast]);

  // This component doesn't render anything
  return null;
};