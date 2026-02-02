import { useState, useEffect, useCallback } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  isOffline: boolean;
  registration: ServiceWorkerRegistration | null;
  version: string | null;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isUpdateAvailable: false,
    isOffline: !navigator.onLine,
    registration: null,
    version: null,
  });

  useEffect(() => {
    if (!state.isSupported) return;

    // Écouter les changements de connexion
    const handleOnline = () => setState(s => ({ ...s, isOffline: false }));
    const handleOffline = () => setState(s => ({ ...s, isOffline: true }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Écouter les messages du SW
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SW_UPDATED') {
        setState(s => ({ ...s, isUpdateAvailable: true, version: event.data.version }));
      }
    };
    navigator.serviceWorker.addEventListener('message', handleMessage);

    // Obtenir la registration
    navigator.serviceWorker.ready.then((registration) => {
      setState(s => ({ ...s, isRegistered: true, registration }));

      // Obtenir la version
      if (registration.active) {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          if (event.data?.version) {
            setState(s => ({ ...s, version: event.data.version }));
          }
        };
        registration.active.postMessage({ type: 'GET_VERSION' }, [messageChannel.port2]);
      }

      // Écouter les mises à jour
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setState(s => ({ ...s, isUpdateAvailable: true }));
            }
          });
        }
      });
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [state.isSupported]);

  const checkForUpdates = useCallback(async () => {
    if (!state.registration) return false;
    
    try {
      await state.registration.update();
      return true;
    } catch (error) {
      console.error('[SW] Update check failed:', error);
      return false;
    }
  }, [state.registration]);

  const applyUpdate = useCallback(async () => {
    if (!state.registration?.waiting) {
      window.location.reload();
      return;
    }

    state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // Attendre que le nouveau SW prenne le contrôle
    await new Promise<void>((resolve) => {
      const handleControllerChange = () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        resolve();
      };
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      
      // Timeout de sécurité
      setTimeout(resolve, 2000);
    });

    window.location.reload();
  }, [state.registration]);

  const clearCache = useCallback(async () => {
    if (!state.registration?.active) return false;

    return new Promise<boolean>((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data?.success ?? false);
      };
      state.registration!.active!.postMessage({ type: 'CLEAR_CACHE' }, [messageChannel.port2]);
      
      // Timeout
      setTimeout(() => resolve(false), 5000);
    });
  }, [state.registration]);

  const forceUpdate = useCallback(async () => {
    // Vider les caches et recharger
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map(name => caches.delete(name)));
    }
    
    // Désenregistrer le SW actuel
    if (state.registration) {
      await state.registration.unregister();
    }
    
    window.location.reload();
  }, [state.registration]);

  return {
    ...state,
    checkForUpdates,
    applyUpdate,
    clearCache,
    forceUpdate,
  };
}

export default useServiceWorker;
