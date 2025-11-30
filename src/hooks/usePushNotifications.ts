import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SendPushNotificationParams {
  userId: string;
  title: string;
  body: string;
  tag?: string;
  url?: string;
  data?: Record<string, any>;
}

export function usePushNotifications() {
  const { toast } = useToast();

  const sendPushNotification = useMutation({
    mutationFn: async (params: SendPushNotificationParams) => {
      const { data, error } = await supabase.functions.invoke('push-notification', {
        body: params
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      console.log('Push notification sent:', data);
    },
    onError: (error: Error) => {
      console.error('Error sending push notification:', error);
      toast({
        title: "Erreur d'envoi",
        description: "Impossible d'envoyer la notification push",
        variant: "destructive"
      });
    }
  });

  const registerDevice = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Non supporté",
        description: "Les notifications ne sont pas supportées sur cet appareil",
        variant: "destructive"
      });
      return null;
    }

    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      return null;
    }

    // Générer un token unique pour ce device (simulation)
    // Dans un environnement de production, vous utiliseriez FCM ou APNs pour obtenir un vrai token
    const deviceToken = `web-${crypto.randomUUID()}`;
    const platform = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'ios' : 
                     /Android/.test(navigator.userAgent) ? 'android' : 'web';

    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No user found');
      return null;
    }

    // Enregistrer le token dans la base de données
    const { data, error } = await supabase
      .from('device_tokens')
      .upsert({
        user_id: user.id,
        token: deviceToken,
        platform,
        active: true,
        last_used_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,token'
      })
      .select()
      .single();

    if (error) {
      console.error('Error registering device:', error);
      return null;
    }

    toast({
      title: "✅ Appareil enregistré",
      description: "Vous recevrez des notifications push"
    });

    return data;
  };

  return {
    sendPushNotification: sendPushNotification.mutate,
    isSending: sendPushNotification.isPending,
    registerDevice
  };
}
