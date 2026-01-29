import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

const STORAGE_KEY = 'shopopti-pending-actions';
const MAX_RETRIES = 3;

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  const { toast } = useToast();

  // Persist pending actions
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingActions));
  }, [pendingActions]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connexion rétablie",
        description: "Synchronisation des données en cours...",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Mode hors-ligne",
        description: "Les modifications seront synchronisées dès que la connexion sera rétablie.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Auto-sync when back online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0 && !isSyncing) {
      syncPendingActions();
    }
  }, [isOnline, pendingActions.length]);

  const addPendingAction = useCallback((
    type: PendingAction['type'],
    entity: string,
    data: Record<string, unknown>
  ) => {
    const action: PendingAction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      entity,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    setPendingActions(prev => [...prev, action]);

    if (!isOnline) {
      toast({
        title: "Action mise en file d'attente",
        description: "Elle sera synchronisée dès que la connexion sera rétablie.",
      });
    }

    return action.id;
  }, [isOnline, toast]);

  const syncPendingActions = useCallback(async () => {
    if (isSyncing || pendingActions.length === 0) return;

    setIsSyncing(true);
    const failedActions: PendingAction[] = [];
    const successfulIds: string[] = [];

    for (const action of pendingActions) {
      try {
        // Simulate API call - in production, this would call the actual API
        await new Promise(resolve => setTimeout(resolve, 100));
        successfulIds.push(action.id);
      } catch (error) {
        if (action.retryCount < MAX_RETRIES) {
          failedActions.push({ ...action, retryCount: action.retryCount + 1 });
        } else {
          console.error('Action failed after max retries:', action);
        }
      }
    }

    setPendingActions(failedActions);
    setIsSyncing(false);

    if (successfulIds.length > 0) {
      toast({
        title: "Synchronisation terminée",
        description: `${successfulIds.length} action(s) synchronisée(s) avec succès.`,
      });
    }

    if (failedActions.length > 0) {
      toast({
        title: "Échec de synchronisation",
        description: `${failedActions.length} action(s) n'ont pas pu être synchronisées.`,
        variant: "destructive",
      });
    }
  }, [isSyncing, pendingActions, toast]);

  const clearPendingActions = useCallback(() => {
    setPendingActions([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    isOnline,
    isSyncing,
    pendingActions,
    pendingCount: pendingActions.length,
    addPendingAction,
    syncPendingActions,
    clearPendingActions,
  };
}
