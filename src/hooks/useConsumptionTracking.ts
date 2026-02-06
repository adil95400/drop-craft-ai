/**
 * Hook centralisé pour le suivi de consommation en temps réel
 * Gère les logs, alertes et statistiques de consommation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export type QuotaKey = 
  | 'products' 
  | 'imports_monthly' 
  | 'ai_generations' 
  | 'stores' 
  | 'suppliers' 
  | 'workflows' 
  | 'storage_mb';

export type AlertType = 'warning_10' | 'warning_5' | 'exhausted' | 'reset';
export type ConsumptionSource = 'web' | 'api' | 'chrome_extension' | 'automation';

export interface ConsumptionAlert {
  id: string;
  user_id: string;
  quota_key: QuotaKey;
  alert_type: AlertType;
  threshold_percent: number;
  current_usage: number;
  limit_value: number;
  message: string;
  channels_sent: string[];
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
  read_at: string | null;
}

export interface ConsumptionLog {
  id: string;
  user_id: string;
  quota_key: QuotaKey;
  action_type: string;
  action_detail: Record<string, unknown>;
  tokens_used: number;
  cost_estimate: number;
  source: ConsumptionSource;
  created_at: string;
}

export interface ConsumptionStats {
  period: string;
  start_date: string;
  end_date: string;
  by_quota_key: Record<string, {
    total_actions: number;
    total_tokens: number;
    total_cost: number;
  }>;
  by_source: Record<string, number>;
  by_day: Array<{
    date: string;
    actions: number;
    tokens: number;
    cost: number;
  }>;
}

const QUOTA_LABELS: Record<QuotaKey, string> = {
  products: 'Produits',
  imports_monthly: 'Imports mensuels',
  ai_generations: 'Générations IA',
  stores: 'Boutiques',
  suppliers: 'Fournisseurs',
  workflows: 'Workflows',
  storage_mb: 'Stockage (Mo)'
};

const ALERT_ICONS: Record<AlertType, string> = {
  warning_10: '⚠️',
  warning_5: '🔶',
  exhausted: '⛔',
  reset: '✅'
};

export function useConsumptionTracking() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch unread alerts
  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['consumption-alerts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumption_alerts')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ConsumptionAlert[];
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  // Fetch consumption stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['consumption-stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_consumption_stats', {
        p_user_id: user!.id,
        p_period: 'month'
      });

      if (error) throw error;
      return data as unknown as ConsumptionStats;
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  // Log consumption mutation
  const logConsumptionMutation = useMutation({
    mutationFn: async (params: {
      quotaKey: QuotaKey;
      actionType: string;
      actionDetail?: Record<string, string | number | boolean>;
      tokensUsed?: number;
      costEstimate?: number;
      source?: ConsumptionSource;
    }) => {
      const { data, error } = await supabase.rpc('log_consumption_and_check_alerts', {
        p_user_id: user!.id,
        p_quota_key: params.quotaKey,
        p_action_type: params.actionType,
        p_action_detail: params.actionDetail || {},
        p_tokens_used: params.tokensUsed || 0,
        p_cost_estimate: params.costEstimate || 0,
        p_source: params.source || 'web'
      });

      if (error) throw error;
      return data as { logged: boolean; current_usage: number; limit: number; percentage_remaining: number; alert_triggered: string | null };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['consumption-stats'] });
      queryClient.invalidateQueries({ queryKey: ['quota-usage'] });

      // Show toast if alert triggered
      if (result.alert_triggered) {
        const icon = ALERT_ICONS[result.alert_triggered as AlertType] || '⚠️';
        
        if (result.alert_triggered === 'exhausted') {
          toast.error(`${icon} Quota épuisé !`, {
            description: `Vous avez atteint votre limite. Passez à un plan supérieur.`,
            action: {
              label: 'Upgrader',
              onClick: () => window.location.href = '/dashboard/subscription',
            },
          });
        } else if (result.alert_triggered === 'warning_5') {
          toast.warning(`${icon} Attention: 5% restant !`, {
            description: `Votre quota arrive bientôt à épuisement.`,
          });
        } else if (result.alert_triggered === 'warning_10') {
          toast.warning(`${icon} Alerte: 10% restant`, {
            description: `Pensez à upgrader votre plan.`,
          });
        }

        queryClient.invalidateQueries({ queryKey: ['consumption-alerts'] });
      }
    },
  });

  // Mark alert as read
  const markAlertReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('consumption_alerts')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consumption-alerts'] });
    },
  });

  // Dismiss alert
  const dismissAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('consumption_alerts')
        .update({ is_dismissed: true, is_read: true, read_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consumption-alerts'] });
    },
  });

  // Real-time subscription for new alerts
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('consumption-alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'consumption_alerts',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newAlert = payload.new as ConsumptionAlert;
          const icon = ALERT_ICONS[newAlert.alert_type] || '⚠️';
          
          toast.warning(`${icon} ${newAlert.message}`, {
            action: {
              label: 'Voir',
              onClick: () => window.location.href = '/dashboard/consumption',
            },
          });

          queryClient.invalidateQueries({ queryKey: ['consumption-alerts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return {
    // State
    alerts,
    stats,
    isLoading: alertsLoading || statsLoading,
    unreadCount: alerts.length,

    // Actions
    logConsumption: logConsumptionMutation.mutateAsync,
    markAlertRead: markAlertReadMutation.mutate,
    dismissAlert: dismissAlertMutation.mutate,
    isLogging: logConsumptionMutation.isPending,

    // Helpers
    getQuotaLabel: (key: QuotaKey) => QUOTA_LABELS[key] || key,
    getAlertIcon: (type: AlertType) => ALERT_ICONS[type] || '⚠️',
  };
}

// Hook for admin consumption overview
export function useAdminConsumption() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.admin_mode === 'admin' || profile?.admin_mode === 'super_admin';

  // Fetch all users consumption
  const { data: usersConsumption, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users-consumption'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_all_users_consumption');
      if (error) throw error;
      return data as Array<{
        user_id: string;
        email: string;
        full_name: string;
        company_name: string;
        plan: string;
        created_at: string;
        last_login_at: string;
        quotas: Array<{
          key: QuotaKey;
          limit: number;
          current: number;
          percentage: number;
          status: 'ok' | 'warning' | 'exhausted' | 'unlimited';
        }>;
        unread_alerts: number;
        addons: Array<{
          quota_key: QuotaKey;
          credits: number;
          expires_at: string | null;
        }>;
      }>;
    },
    enabled: !!user && isAdmin,
    staleTime: 30 * 1000,
  });

  // Fetch global overview
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['admin-consumption-overview'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_consumption_overview');
      if (error) throw error;
      return data as {
        total_users: number;
        users_by_plan: Record<string, number>;
        users_at_limit: number;
        users_near_limit: number;
        total_consumption_today: {
          actions: number;
          tokens: number;
          cost: number;
        };
        consumption_by_quota: Record<string, {
          today: number;
          week: number;
          month: number;
        }>;
      };
    },
    enabled: !!user && isAdmin,
    staleTime: 60 * 1000,
  });

  return {
    usersConsumption: usersConsumption || [],
    overview,
    isLoading: usersLoading || overviewLoading,
    isAdmin,
  };
}
