import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

export interface Alert {
  id: string;
  user_id: string;
  alert_type: 'stock_low' | 'stock_out' | 'price_change' | 'delivery_delay' | 'negative_margin' | 'winning_product' | 'supplier_issue';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  metadata: Record<string, any>;
  status: 'active' | 'dismissed' | 'resolved';
  acknowledged: boolean;
  acknowledged_at?: string;
  created_at: string;
}

export interface AlertConfig {
  id?: string;
  user_id?: string;
  alert_type: string;
  is_enabled: boolean;
  threshold_value?: number;
  threshold_percent?: number;
  channels: string[];
  priority: number;
  conditions?: Record<string, any>;
}

export function useRealtimeAlerts() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Fetch active alerts
  const { data: alerts = [], isLoading: isLoadingAlerts, refetch: refetchAlerts } = useQuery({
    queryKey: ['active-alerts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('active_alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as Alert[];
    },
    enabled: !!user?.id,
  });

  // Fetch alert configurations
  const { data: alertConfigs = [], isLoading: isLoadingConfigs, refetch: refetchConfigs } = useQuery({
    queryKey: ['alert-configs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase.functions.invoke('realtime-alerts-engine', {
        body: { action: 'get_alert_configs', userId: user.id }
      });

      if (error) throw error;
      return data.configs as AlertConfig[];
    },
    enabled: !!user?.id,
  });

  // Subscribe to realtime alerts
  useEffect(() => {
    if (!user?.id || isSubscribed) return;

    const channel = supabase
      .channel('active-alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'active_alerts',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newAlert = payload.new as Alert;
          
          // Show toast notification
          const toastType = newAlert.severity === 'critical' ? 'error' : 
                           newAlert.severity === 'warning' ? 'warning' : 'info';
          
          if (toastType === 'error') {
            toast.error(newAlert.title, { description: newAlert.message });
          } else if (toastType === 'warning') {
            toast.warning(newAlert.title, { description: newAlert.message });
          } else {
            toast.info(newAlert.title, { description: newAlert.message });
          }

          // Invalidate alerts query
          queryClient.invalidateQueries({ queryKey: ['active-alerts'] });
        }
      )
      .subscribe();

    setIsSubscribed(true);

    return () => {
      supabase.removeChannel(channel);
      setIsSubscribed(false);
    };
  }, [user?.id, isSubscribed, queryClient]);

  // Check all alerts
  const checkAlerts = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('realtime-alerts-engine', {
        body: { action: 'check_all_alerts', userId: user.id }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['active-alerts'] });
      toast.success(`Vérification terminée: ${data.summary.totalAlertsCreated} alertes créées`);
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la vérification', { description: error.message });
    }
  });

  // Dismiss single alert
  const dismissAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase.functions.invoke('realtime-alerts-engine', {
        body: { action: 'dismiss_alert', alertId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-alerts'] });
    }
  });

  // Dismiss all alerts
  const dismissAllAlerts = useMutation({
    mutationFn: async (type?: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('realtime-alerts-engine', {
        body: { action: 'dismiss_all_alerts', userId: user.id, type }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-alerts'] });
      toast.success('Toutes les alertes ont été masquées');
    }
  });

  // Update alert configuration
  const updateConfig = useMutation({
    mutationFn: async (config: Partial<AlertConfig>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('realtime-alerts-engine', {
        body: { action: 'update_alert_config', userId: user.id, config }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-configs'] });
      toast.success('Configuration mise à jour');
    }
  });

  // Create alert configuration
  const createConfig = useMutation({
    mutationFn: async (config: Partial<AlertConfig>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('realtime-alerts-engine', {
        body: { action: 'create_alert_config', userId: user.id, config }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-configs'] });
      toast.success('Configuration créée');
    }
  });

  // Group alerts by type
  const alertsByType = alerts.reduce((acc, alert) => {
    if (!acc[alert.alert_type]) {
      acc[alert.alert_type] = [];
    }
    acc[alert.alert_type].push(alert);
    return acc;
  }, {} as Record<string, Alert[]>);

  // Count by severity
  const alertsBySeverity = {
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    info: alerts.filter(a => a.severity === 'info').length,
  };

  return {
    alerts,
    alertConfigs,
    alertsByType,
    alertsBySeverity,
    isLoadingAlerts,
    isLoadingConfigs,
    checkAlerts: checkAlerts.mutate,
    isChecking: checkAlerts.isPending,
    dismissAlert: dismissAlert.mutate,
    dismissAllAlerts: dismissAllAlerts.mutate,
    updateConfig: updateConfig.mutate,
    createConfig: createConfig.mutate,
    refetchAlerts,
    refetchConfigs,
    totalAlerts: alerts.length,
  };
}
