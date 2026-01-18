import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface RealtimeNotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface SyncJobUpdate {
  id: string;
  supplier_id: string;
  status: string;
  progress: number;
  processed_items: number;
  total_items: number;
  error_message?: string;
}

export function useSupplierRealtime() {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [activeJobs, setActiveJobs] = useState<Map<string, SyncJobUpdate>>(new Map());
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // S'abonner aux notifications en temps réel
  useEffect(() => {
    let notificationsChannel: ReturnType<typeof supabase.channel>;
    let syncJobsChannel: ReturnType<typeof supabase.channel>;

    const setupChannels = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Canal pour les notifications
      notificationsChannel = supabase
        .channel('supplier-notifications-live')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'supplier_notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const notification = payload.new as RealtimeNotification;
            
            // Mettre à jour le compteur
            setUnreadNotifications(prev => prev + 1);
            
            // Afficher un toast selon la sévérité
            const variant = notification.severity === 'error' ? 'error' : 
                           notification.severity === 'warning' ? 'warning' : 
                           notification.severity === 'success' ? 'success' : 'info';
            
            if (variant === 'error') {
              toast.error(notification.title, { description: notification.message });
            } else if (variant === 'success') {
              toast.success(notification.title, { description: notification.message });
            } else if (variant === 'warning') {
              toast.warning(notification.title, { description: notification.message });
            } else {
              toast.info(notification.title, { description: notification.message });
            }

            // Invalider le cache des notifications
            queryClient.invalidateQueries({ queryKey: ['supplier-notifications'] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'supplier_notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['supplier-notifications'] });
          }
        )
        .subscribe((status) => {
          setIsConnected(status === 'SUBSCRIBED');
        });

      // Canal pour les jobs de synchronisation
      syncJobsChannel = supabase
        .channel('supplier-sync-jobs-live')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'supplier_sync_jobs',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const job = payload.new as SyncJobUpdate;
              
              setActiveJobs(prev => {
                const newMap = new Map(prev);
                if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
                  newMap.delete(job.id);
                } else {
                  newMap.set(job.id, job);
                }
                return newMap;
              });

              // Notification pour les changements de statut importants
              if (payload.eventType === 'UPDATE') {
                if (job.status === 'completed') {
                  toast.success('Synchronisation terminée', {
                    description: `${job.processed_items} éléments traités`
                  });
                } else if (job.status === 'failed') {
                  toast.error('Synchronisation échouée', {
                    description: job.error_message || 'Une erreur est survenue'
                  });
                }
              }
            }

            // Invalider le cache
            queryClient.invalidateQueries({ queryKey: ['sync-jobs'] });
          }
        )
        .subscribe();
    };

    setupChannels();

    return () => {
      if (notificationsChannel) {
        supabase.removeChannel(notificationsChannel);
      }
      if (syncJobsChannel) {
        supabase.removeChannel(syncJobsChannel);
      }
    };
  }, [queryClient]);

  // Charger le compteur initial de notifications non lues
  useEffect(() => {
    const loadUnreadCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from('supplier_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setUnreadNotifications(count || 0);
    };

    loadUnreadCount();
  }, []);

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('supplier_notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setUnreadNotifications(0);
    queryClient.invalidateQueries({ queryKey: ['supplier-notifications'] });
  }, [queryClient]);

  // Obtenir le statut global des syncs
  const getSyncStatus = useCallback(() => {
    const jobs = Array.from(activeJobs.values());
    const running = jobs.filter(j => j.status === 'running').length;
    const pending = jobs.filter(j => j.status === 'pending').length;
    
    return {
      running,
      pending,
      total: jobs.length,
      isActive: running > 0 || pending > 0
    };
  }, [activeJobs]);

  return {
    isConnected,
    activeJobs: Array.from(activeJobs.values()),
    unreadNotifications,
    markAllAsRead,
    getSyncStatus,
  };
}
