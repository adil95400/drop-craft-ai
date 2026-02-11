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
    // Check if push notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
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
      // Get VAPID public key
      const { data: vapidData, error: vapidError } = await supabase.functions.invoke('push-notification-service', {
        body: { action: 'get_vapid_public_key' }
      });

      if (vapidError) throw vapidError;

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidData.publicKey
      });

      // Send subscription to backend
      const { data, error } = await supabase.functions.invoke('push-notification-service', {
        body: {
          action: 'register_subscription',
          userId: user.id,
          subscription: subscription.toJSON(),
          platform: 'web',
          deviceInfo: {
            userAgent: navigator.userAgent,
            language: navigator.language
          }
        }
      });

      if (error) throw error;

      setIsSubscribed(true);
      toast.success('Abonnement aux notifications activé');
      return data.subscription;
    } catch (error: any) {
      console.error('Error subscribing to push:', error);
      toast.error('Erreur lors de l\'abonnement aux notifications');
      return null;
    }
  }, [user?.id, isSupported]);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

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
      const { data, error } = await supabase.functions.invoke('push-notification-service', {
        body: { action: 'test_push', userId: user.id }
      });

      if (error) throw error;

      if (data.sent > 0) {
        toast.success('Notification de test envoyée');
      } else {
        toast.info('Aucun abonnement actif trouvé');
      }
    } catch (error: any) {
      console.error('Error sending test notification:', error);
      toast.error('Erreur lors de l\'envoi du test');
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
    sendTestNotification
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
