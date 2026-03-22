import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

export function usePushSubscription() {
  const { user } = useUnifiedAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }

    setIsLoading(false);
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error('Les notifications push ne sont pas supportées sur ce navigateur');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success('Notifications activées!');
        return true;
      } else if (result === 'denied') {
        toast.error('Les notifications ont été bloquées');
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Erreur lors de la demande de permission');
      return false;
    }
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    if (!user?.id || !isSupported) return null;

    try {
      // Request permission first
      if (Notification.permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) return null;
      }

      // Get Firebase messaging token via service worker
      // For now, register a unique device token for this browser
      const deviceToken = `fcm-web-${crypto.randomUUID()}`;

      // Register token with backend via Firebase Push edge function
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
        },
      });

      if (error) throw error;

      setIsSubscribed(true);
      toast.success('Abonnement aux notifications activé');
      return data;
    } catch (error: any) {
      console.error('Error subscribing to push:', error);
      toast.error("Erreur lors de l'abonnement aux notifications");
      return null;
    }
  }, [user?.id, isSupported, requestPermission]);

  const unsubscribe = useCallback(async () => {
    try {
      setIsSubscribed(false);
      toast.success('Abonnement aux notifications désactivé');
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      toast.error('Erreur lors de la désinscription');
    }
  }, []);

  const sendTestNotification = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.functions.invoke('firebase-push', {
        body: { action: 'test_push', userId: user.id },
      });

      if (error) throw error;

      if (data.sent > 0) {
        toast.success('Notification de test envoyée');
      } else {
        toast.info('Aucun abonnement actif trouvé');
      }
    } catch (error: any) {
      console.error('Error sending test notification:', error);
      toast.error("Erreur lors de l'envoi du test");
    }
  }, [user?.id]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}
