/**
 * useJobRealtime — Real-time job progress via Supabase Realtime
 * Subscribes to postgres_changes on the `jobs` table for the current user.
 * Fires toast notifications on status transitions (running → completed/failed).
 */
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface JobChangePayload {
  id: string;
  status: string;
  job_type?: string;
  name?: string;
  processed_items?: number;
  failed_items?: number;
  total_items?: number;
  error_message?: string;
}

export function useJobRealtime() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const prevStatuses = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('job-progress-live')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'jobs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const job = payload.new as JobChangePayload;
          const prevStatus = prevStatuses.current.get(job.id);

          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ['import-jobs-real'] });
          queryClient.invalidateQueries({ queryKey: ['import-stats-real'] });

          // Only notify on terminal status transitions
          if (prevStatus && prevStatus !== job.status) {
            const label = job.name || job.job_type || 'Job';

            if (job.status === 'completed') {
              const succeeded = (job.processed_items ?? 0) - (job.failed_items ?? 0);
              toast.success(`${label} terminé`, {
                description: `${succeeded} produit(s) importé(s) avec succès`,
              });
            } else if (job.status === 'failed') {
              toast.error(`${label} échoué`, {
                description: job.error_message?.slice(0, 120) || 'Une erreur est survenue',
                action: {
                  label: 'Voir',
                  onClick: () => {
                    // Navigate handled by the import hub
                    queryClient.invalidateQueries({ queryKey: ['import-jobs-real'] });
                  },
                },
              });
            }
          }

          prevStatuses.current.set(job.id, job.status);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'jobs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const job = payload.new as JobChangePayload;
          prevStatuses.current.set(job.id, job.status);
          queryClient.invalidateQueries({ queryKey: ['import-jobs-real'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}
