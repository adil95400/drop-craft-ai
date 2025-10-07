import { useEffect, useState, useRef, useCallback } from 'react';
import { realtimeManager } from '@/services/RealtimeManager';

interface UseOptimizedRealtimeProps {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onUpdate?: (payload: any) => void;
  enabled?: boolean;
}

/**
 * Hook optimisé pour real-time avec pooling automatique
 * Évite les connexions multiples et gère la mémoire
 */
export function useOptimizedRealtime({
  table,
  event = '*',
  filter,
  onUpdate,
  enabled = true,
}: UseOptimizedRealtimeProps) {
  const [isConnected, setIsConnected] = useState(false);
  const subscriberIdRef = useRef(`${table}-${Date.now()}-${Math.random()}`);
  const onUpdateRef = useRef(onUpdate);

  // Garder la référence à jour
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // Callback memoized pour éviter re-subscriptions
  const handleUpdate = useCallback((payload: any) => {
    onUpdateRef.current?.(payload);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const subscriberId = subscriberIdRef.current;

    // S'abonner via le manager
    const unsubscribe = realtimeManager.subscribe(
      table,
      subscriberId,
      handleUpdate,
      { event, filter }
    );

    // Enregistrer le callback
    const channelKey = `realtime:${table}:${event}:${filter || 'all'}`;
    realtimeManager.registerCallback(channelKey, subscriberId, handleUpdate);

    // Vérifier le statut de connexion
    const checkConnection = setInterval(() => {
      const status = realtimeManager.getChannelStatus(table, event, filter);
      setIsConnected(status === 'connected');
    }, 1000);

    return () => {
      clearInterval(checkConnection);
      unsubscribe();
    };
  }, [table, event, filter, enabled, handleUpdate]);

  return { isConnected };
}

/**
 * Hook pour import jobs avec optimisation
 */
export function useOptimizedImportJobs(onJobUpdate?: (job: any) => void) {
  return useOptimizedRealtime({
    table: 'import_jobs',
    onUpdate: (payload) => {
      if (payload.new) {
        onJobUpdate?.(payload.new);
      }
    },
  });
}

/**
 * Hook pour activity logs avec optimisation
 */
export function useOptimizedActivityLogs(onActivityUpdate?: (activity: any) => void) {
  return useOptimizedRealtime({
    table: 'activity_logs',
    onUpdate: (payload) => {
      if (payload.new) {
        onActivityUpdate?.(payload.new);
      }
    },
  });
}

/**
 * Hook pour orders avec optimisation
 */
export function useOptimizedOrders(onOrderUpdate?: (order: any) => void) {
  return useOptimizedRealtime({
    table: 'orders',
    onUpdate: (payload) => {
      if (payload.new) {
        onOrderUpdate?.(payload.new);
      }
    },
  });
}

/**
 * Hook pour products avec optimisation
 */
export function useOptimizedProducts(onProductUpdate?: (product: any) => void) {
  return useOptimizedRealtime({
    table: 'imported_products',
    onUpdate: (payload) => {
      if (payload.new) {
        onProductUpdate?.(payload.new);
      }
    },
  });
}
