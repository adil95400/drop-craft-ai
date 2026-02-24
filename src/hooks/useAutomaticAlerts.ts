/**
 * Automatic Alerting System
 * Evaluates thresholds on real data and creates active_alerts entries automatically.
 */
import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

interface AlertRule {
  id: string;
  alert_type: string;
  is_enabled: boolean;
  threshold_value: number | null;
  threshold_percent: number | null;
  conditions: Record<string, any> | null;
  channels: string[] | null;
  priority: number | null;
}

interface ActiveAlert {
  id: string;
  title: string;
  message: string | null;
  severity: string | null;
  alert_type: string;
  status: string | null;
  acknowledged: boolean | null;
  created_at: string | null;
  metadata: Record<string, any> | null;
}

export function useAutomaticAlerts() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();

  // Fetch alert rules
  const { data: rules = [] } = useQuery({
    queryKey: ['alert-rules', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('alert_configurations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_enabled', true);
      if (error) throw error;
      return (data || []) as AlertRule[];
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  // Fetch active alerts
  const { data: activeAlerts = [], isLoading } = useQuery({
    queryKey: ['active-alerts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('active_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as ActiveAlert[];
    },
    enabled: !!user?.id,
    refetchInterval: 60_000,
  });

  // Create alert
  const createAlert = useMutation({
    mutationFn: async (alert: {
      title: string;
      message: string;
      severity: string;
      alert_type: string;
      metadata?: Record<string, any>;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Deduplicate: don't create if same type+title exists in last hour
      const { data: existing } = await supabase
        .from('active_alerts')
        .select('id')
        .eq('user_id', user.id)
        .eq('alert_type', alert.alert_type)
        .eq('title', alert.title)
        .eq('status', 'active')
        .gte('created_at', new Date(Date.now() - 3600_000).toISOString())
        .limit(1);

      if (existing && existing.length > 0) return null;

      const { error } = await supabase.from('active_alerts').insert({
        user_id: user.id,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        alert_type: alert.alert_type,
        status: 'active',
        metadata: alert.metadata || {},
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['active-alerts'] }),
  });

  // Acknowledge alert
  const acknowledgeAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('active_alerts')
        .update({ acknowledged: true, acknowledged_at: new Date().toISOString(), status: 'acknowledged' })
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['active-alerts'] }),
  });

  // Resolve alert
  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('active_alerts')
        .update({ status: 'resolved' })
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['active-alerts'] }),
  });

  // Automatic threshold evaluation
  const evaluateThresholds = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Check API error rate
      const { data: recentApiLogs } = await supabase
        .from('api_logs')
        .select('status_code')
        .gte('created_at', new Date(Date.now() - 3600_000).toISOString())
        .limit(500);

      if (recentApiLogs && recentApiLogs.length > 20) {
        const errorCount = recentApiLogs.filter(l => (l.status_code || 0) >= 500).length;
        const errorRate = errorCount / recentApiLogs.length;
        if (errorRate > 0.05) {
          createAlert.mutate({
            title: 'Taux d\'erreur API élevé',
            message: `${(errorRate * 100).toFixed(1)}% d'erreurs sur les ${recentApiLogs.length} dernières requêtes`,
            severity: errorRate > 0.15 ? 'critical' : 'warning',
            alert_type: 'api_error_rate',
            metadata: { error_rate: errorRate, sample_size: recentApiLogs.length },
          });
        }
      }

      // Check low stock products
      const { count: lowStockCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .lt('stock_quantity', 5)
        .eq('status', 'active');

      if ((lowStockCount || 0) > 0) {
        createAlert.mutate({
          title: 'Produits en stock critique',
          message: `${lowStockCount} produit(s) actif(s) avec moins de 5 unités en stock`,
          severity: (lowStockCount || 0) > 10 ? 'critical' : 'warning',
          alert_type: 'low_stock',
          metadata: { low_stock_count: lowStockCount },
        });
      }

      // Check failed integrations
      const { data: failedIntegrations } = await supabase
        .from('integrations')
        .select('id, platform_name')
        .eq('user_id', user.id)
        .eq('connection_status', 'error');

      if (failedIntegrations && failedIntegrations.length > 0) {
        createAlert.mutate({
          title: 'Intégrations en erreur',
          message: `${failedIntegrations.length} intégration(s) déconnectée(s): ${failedIntegrations.map(i => i.platform_name || 'N/A').join(', ')}`,
          severity: 'high',
          alert_type: 'integration_failure',
          metadata: { failed_ids: failedIntegrations.map(i => i.id) },
        });
      }
    } catch (err) {
      console.error('Alert evaluation error:', err);
    }
  }, [user?.id]);

  // Run evaluation every 5 minutes
  useEffect(() => {
    if (!user?.id) return;
    evaluateThresholds();
    const interval = setInterval(evaluateThresholds, 5 * 60_000);
    return () => clearInterval(interval);
  }, [user?.id, evaluateThresholds]);

  return {
    rules,
    activeAlerts,
    isLoading,
    acknowledgeAlert: acknowledgeAlert.mutate,
    resolveAlert: resolveAlert.mutate,
    createAlert: createAlert.mutate,
    evaluateThresholds,
  };
}
