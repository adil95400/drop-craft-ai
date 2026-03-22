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
      // Use notification hub for cascading delivery (Push → Email)
      const { data, error } = await supabase.functions.invoke('notification-hub', {
        body: {
          action: 'send',
          userId: params.userId,
          title: params.title,
          body: params.body,
          url: params.url,
          data: params.data,
          type: 'transactional',
          channel: 'auto',
        }
      });

      if (error) throw error;
      return data;
    },
    onError: (error: Error) => {
      console.error('Error sending push notification:', error);
      toast({
        title: "Erreur d'envoi",
        description: "Impossible d'envoyer la notification",
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

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No user found');
      return null;
    }

    const deviceToken = `fcm-web-${crypto.randomUUID()}`;

    // Register via Firebase Push edge function
    const { data, error } = await supabase.functions.invoke('firebase-push', {
      body: {
        action: 'register_token',
        userId: user.id,
        fcmToken: deviceToken,
        platform: 'web',
        deviceInfo: {
          userAgent: navigator.userAgent,
          language: navigator.language,
        },
      }
    });

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
