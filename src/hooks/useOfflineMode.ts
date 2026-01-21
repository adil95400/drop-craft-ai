import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface CacheStatus {
  static: number;
  dynamic: number;
  api: number;
  pending: number;
  version: string;
}

interface PendingAction {
  id: number;
  url: string;
  method: string;
  body?: string;
  timestamp: number;
}

export function useOfflineMode() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const { toast } = useToast();

  // Surveiller le statut de connexion
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connexion rétablie",
        description: "Synchronisation des données en cours...",
      });
      // Déclencher la synchronisation
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Mode hors ligne",
        description: "Vos modifications seront synchronisées automatiquement.",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Récupérer le statut du cache
  const refreshCacheStatus = useCallback(async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      return new Promise<CacheStatus>((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          setCacheStatus(event.data);
          resolve(event.data);
        };
        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_CACHE_STATUS' },
          [messageChannel.port2]
        );
      });
    }
    return null;
  }, []);

  // Sauvegarder une action pour synchronisation ultérieure
  const saveForLater = useCallback(async (action: Omit<PendingAction, 'id' | 'timestamp'>) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      return new Promise<boolean>((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            refreshCacheStatus();
          }
          resolve(event.data.success);
        };
        navigator.serviceWorker.controller.postMessage(
          { type: 'SAVE_PENDING_ACTION', action },
          [messageChannel.port2]
        );
      });
    }
    return false;
  }, [refreshCacheStatus]);

  // Déclencher la synchronisation
  const triggerSync = useCallback(async () => {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      try {
        await (registration as any).sync.register('sync-pending-actions');
        console.log('Background sync registered');
      } catch (error) {
        console.error('Background sync failed:', error);
      }
    }
  }, []);

  // Mettre en cache des données
  const cacheData = useCallback(async (key: string, data: unknown) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_DATA',
        key,
        data
      });
    }
    // Fallback: localStorage
    try {
      localStorage.setItem(`offline_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to cache data in localStorage:', error);
    }
  }, []);

  // Récupérer des données du cache
  const getCachedData = useCallback(async <T>(key: string, maxAge = 5 * 60 * 1000): Promise<T | null> => {
    // Essayer le Service Worker d'abord
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        const timeout = setTimeout(() => resolve(null), 1000);
        
        messageChannel.port1.onmessage = (event) => {
          clearTimeout(timeout);
          resolve(event.data.data as T);
        };
        
        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_CACHED_DATA', key },
          [messageChannel.port2]
        );
      });
    }
    
    // Fallback: localStorage
    try {
      const cached = localStorage.getItem(`offline_${key}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < maxAge) {
          return data as T;
        }
      }
    } catch (error) {
      console.warn('Failed to get cached data:', error);
    }
    
    return null;
  }, []);

  // Écouter les messages du Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'SYNC_COMPLETE') {
          toast({
            title: "Synchronisation terminée",
            description: "Vos données ont été synchronisées avec succès.",
          });
          refreshCacheStatus();
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, [toast, refreshCacheStatus]);

  // Initialiser le statut du cache
  useEffect(() => {
    refreshCacheStatus();
  }, [refreshCacheStatus]);

  return {
    isOnline,
    cacheStatus,
    pendingActions,
    saveForLater,
    triggerSync,
    cacheData,
    getCachedData,
    refreshCacheStatus
  };
}

/**
 * HOC pour gérer automatiquement le mode offline dans les requêtes
 */
export function withOfflineSupport<T>(
  fetchFn: () => Promise<T>,
  cacheKey: string,
  options?: { maxAge?: number }
) {
  return async (): Promise<T> => {
    if (navigator.onLine) {
      try {
        const data = await fetchFn();
        // Mettre en cache les données
        try {
          localStorage.setItem(`offline_${cacheKey}`, JSON.stringify({
            data,
            timestamp: Date.now()
          }));
        } catch {}
        return data;
      } catch (error) {
        // En cas d'erreur réseau, essayer le cache
        const cached = localStorage.getItem(`offline_${cacheKey}`);
        if (cached) {
          const { data } = JSON.parse(cached);
          return data as T;
        }
        throw error;
      }
    } else {
      // Mode offline: utiliser le cache
      const cached = localStorage.getItem(`offline_${cacheKey}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const maxAge = options?.maxAge ?? 30 * 60 * 1000; // 30 min par défaut
        if (Date.now() - timestamp < maxAge) {
          return data as T;
        }
      }
      throw new Error('Données non disponibles hors ligne');
    }
  };
}
