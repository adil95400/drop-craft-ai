import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useForceDisconnect = () => {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const { toast } = useToast();

  const disconnectUser = async (targetUserId: string, reason?: string) => {
    setIsDisconnecting(true);
    
    try {
      console.log('Attempting to disconnect user:', targetUserId);
      
      const { data, error } = await supabase.functions.invoke('force-disconnect-user', {
        body: {
          targetUserId,
          reason: reason || 'force_disconnect'
        }
      });

      if (error) {
        console.error('Error disconnecting user:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de déconnecter l\'utilisateur',
          variant: 'destructive'
        });
        return { success: false, error };
      }

      console.log('User disconnected successfully:', data);
      
      toast({
        title: 'Utilisateur déconnecté',
        description: data.message || 'L\'utilisateur a été déconnecté avec succès',
      });

      return { success: true, data };
      
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur inattendue s\'est produite',
        variant: 'destructive'
      });
      return { success: false, error };
    } finally {
      setIsDisconnecting(false);
    }
  };

  const disconnectAllUsers = async (reason?: string) => {
    setIsDisconnecting(true);
    
    try {
      // For mass disconnection, we'll use the maintenance mode approach
      const { error } = await supabase
        .from('security_events')
        .insert({
          event_type: 'mass_disconnect',
          severity: 'critical',
          description: 'Admin initiated mass user disconnection',
          metadata: { 
            action: 'mass_disconnect', 
            reason: reason || 'admin_action',
            timestamp: new Date().toISOString()
          }
        });

      if (error) {
        console.error('Error logging mass disconnect:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de déconnecter tous les utilisateurs',
          variant: 'destructive'
        });
        return { success: false, error };
      }

      toast({
        title: 'Déconnexion en masse initiée',
        description: 'Tous les utilisateurs vont être déconnectés',
        variant: 'destructive'
      });

      return { success: true };
      
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur inattendue s\'est produite',
        variant: 'destructive'
      });
      return { success: false, error };
    } finally {
      setIsDisconnecting(false);
    }
  };

  return {
    disconnectUser,
    disconnectAllUsers,
    isDisconnecting
  };
};