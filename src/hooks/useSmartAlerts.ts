/**
 * P2-4: Hook pour les alertes intelligentes unifiées
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

export interface SmartAlert {
  id: string;
  alert_category: 'price' | 'stock' | 'supplier' | 'performance' | 'opportunity' | 'anomaly' | 'system';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  priority_score: number;
  title: string;
  message: string | null;
  source: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, any>;
  actions: any[];
  is_read: boolean;
  is_resolved: boolean;
  resolved_at: string | null;
  auto_resolved: boolean;
  expires_at: string | null;
  created_at: string;
}

export function useSmartAlerts(filters?: { category?: string; resolved?: boolean }) {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['smart-alerts', user?.id, filters],
    queryFn: async () => {
      let query = (supabase.from('smart_alerts') as any)
        .select('*')
        .eq('user_id', user!.id)
        .order('priority_score', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters?.category) query = query.eq('alert_category', filters.category);
      if (filters?.resolved !== undefined) query = query.eq('is_resolved', filters.resolved);

      const { data, error } = await query;
      if (error) throw error;
      return data as SmartAlert[];
    },
    enabled: !!user?.id,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await (supabase.from('smart_alerts') as any).update({ is_read: true }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smart-alerts'] }),
  });

  const resolveAlert = useMutation({
    mutationFn: async (id: string) => {
      await (supabase.from('smart_alerts') as any).update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: user!.id,
      }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-alerts'] });
      toast.success('Alerte résolue');
    },
  });

  const dismissAlert = useMutation({
    mutationFn: async (id: string) => {
      await (supabase.from('smart_alerts') as any).delete().eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smart-alerts'] }),
  });

  const stats = {
    total: alerts.length,
    unread: alerts.filter(a => !a.is_read).length,
    critical: alerts.filter(a => a.severity === 'critical' && !a.is_resolved).length,
    high: alerts.filter(a => a.severity === 'high' && !a.is_resolved).length,
    byCategory: {
      price: alerts.filter(a => a.alert_category === 'price' && !a.is_resolved).length,
      stock: alerts.filter(a => a.alert_category === 'stock' && !a.is_resolved).length,
      supplier: alerts.filter(a => a.alert_category === 'supplier' && !a.is_resolved).length,
      opportunity: alerts.filter(a => a.alert_category === 'opportunity' && !a.is_resolved).length,
    },
  };

  return {
    alerts,
    stats,
    isLoading,
    markRead: markRead.mutate,
    resolveAlert: resolveAlert.mutate,
    dismissAlert: dismissAlert.mutate,
  };
}
