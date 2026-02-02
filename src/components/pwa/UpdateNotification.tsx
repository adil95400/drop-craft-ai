import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpdateNotificationProps {
  className?: string;
}

export function UpdateNotification({ className }: UpdateNotificationProps) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SW_UPDATED') {
        console.log('[Update] New version available:', event.data.version);
        setUpdateAvailable(true);
      }
      if (event.data?.type === 'RELOAD_PAGE') {
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    // Vérifier les mises à jour au démarrage
    navigator.serviceWorker.ready.then((registration) => {
      // Vérifier immédiatement
      registration.update().catch(console.error);
      
      // Puis toutes les 5 minutes
      const interval = setInterval(() => {
        registration.update().catch(console.error);
      }, 5 * 60 * 1000);

      // Écouter les nouveaux SW
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[Update] New service worker installed');
              setUpdateAvailable(true);
            }
          });
        }
      });

      return () => clearInterval(interval);
    });

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleUpdate = useCallback(async () => {
    setIsUpdating(true);
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Demander au nouveau SW de prendre le contrôle
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      
      // Forcer le rechargement après un court délai
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('[Update] Failed to update:', error);
      // Fallback: recharger simplement
      window.location.reload();
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    // Réafficher après 30 minutes
    setTimeout(() => setDismissed(false), 30 * 60 * 1000);
  }, []);

  if (!updateAvailable || dismissed) return null;

  return (
    <div
      className={cn(
        'fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96',
        'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground',
        'rounded-lg shadow-2xl p-4 z-50',
        'animate-in slide-in-from-bottom-5 duration-300',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 bg-white/20 rounded-full">
          <Sparkles className="h-5 w-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">
            Nouvelle version disponible !
          </h4>
          <p className="text-xs opacity-90 mt-1">
            Des améliorations et corrections sont prêtes à être installées.
          </p>
          
          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleUpdate}
              disabled={isUpdating}
              className="bg-white text-primary hover:bg-white/90"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Mettre à jour
                </>
              )}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
            >
              Plus tard
            </Button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default UpdateNotification;
