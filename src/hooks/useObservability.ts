import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface SystemMetrics {
  system: {
    cpu_usage: number
    memory_usage: number
    disk_usage: number
    network_io: number
  }
  application: {
    active_users: number
    requests_per_minute: number
    error_rate: string
    response_time_ms: number
  }
  business: {
    orders_today: number
    revenue_today: number
    conversion_rate: string
    cart_abandonment: string
  }
  database: {
    connections: number
    queries_per_second: number
    cache_hit_rate: string
    storage_usage_gb: string
  }
}

interface AlertRule {
  id?: string
  name: string
  metric_name: string
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
  threshold: number
  duration_minutes: number
  notification_channels: string[]
  is_active?: boolean
  created_at?: string
}

interface ActiveAlert {
  id: string
  alert_rule_id: string
  status: 'active' | 'resolved' | 'acknowledged'
  triggered_at: string
  resolved_at?: string
  current_value: number
  details: Record<string, any>
}

interface SystemLog {
  id: string
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical'
  message: string
  source?: string
  metadata: Record<string, any>
  timestamp: string
}

interface HealthStatus {
  overall_status: string
  services: {
    database: { status: string; response_time_ms: number }
    api: { status: string; response_time_ms: number }
    storage: { status: string; response_time_ms: number }
    cache: { status: string; response_time_ms: number }
  }
  uptime_percentage: string
  last_incident: string | null
  performance_score: number
}

export function useObservability() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [alertRules, setAlertRules] = useState<AlertRule[]>([])
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([])
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Fetch real-time metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('observability', {
        method: 'GET',
        body: { path: '/metrics' }
      })

      if (error) throw error

      setMetrics(data.metrics)
    } catch (error) {
      console.error('Error fetching metrics:', error)
    }
  }, [])

  // Fetch alert rules and active alerts
  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('observability', {
        method: 'GET',
        body: { path: '/alerts' }
      })

      if (error) throw error

      setAlertRules(data.alert_rules || [])
      setActiveAlerts(data.active_alerts || [])
    } catch (error) {
      console.error('Error fetching alerts:', error)
    }
  }

  // Create alert rule
  const createAlertRule = async (alertRule: Omit<AlertRule, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase.functions.invoke('observability', {
        method: 'POST',
        body: {
          ...alertRule,
          path: '/alerts'
        }
      })

      if (error) throw error

      setAlertRules(prev => [...prev, data.alert_rule])
      
      toast({
        title: "Succès",
        description: `Règle d'alerte "${alertRule.name}" créée`,
      })

      return data.alert_rule
    } catch (error) {
      console.error('Error creating alert rule:', error)
      toast({
        title: "Erreur",
        description: "Impossible de créer la règle d'alerte",
        variant: "destructive"
      })
      throw error
    }
  }

  // Store custom metric
  const storeMetric = async (metricData: {
    metric_name: string
    value: number
    tags?: Record<string, string>
    timestamp?: string
  }) => {
    try {
      const { error } = await supabase.functions.invoke('observability', {
        method: 'POST',
        body: {
          ...metricData,
          path: '/metrics'
        }
      })

      if (error) throw error

      toast({
        title: "Métrique enregistrée",
        description: `Métrique "${metricData.metric_name}" enregistrée`,
      })
    } catch (error) {
      console.error('Error storing metric:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la métrique",
        variant: "destructive"
      })
    }
  }

  // Fetch system logs
  const fetchSystemLogs = async (level?: string, limit = 100) => {
    try {
      const params = new URLSearchParams()
      if (level && level !== 'all') params.set('level', level)
      params.set('limit', limit.toString())

      const { data, error } = await supabase.functions.invoke('observability', {
        method: 'GET',
        body: { path: `/logs?${params.toString()}` }
      })

      if (error) throw error

      setSystemLogs(data.logs || [])
    } catch (error) {
      console.error('Error fetching system logs:', error)
    }
  }

  // Fetch system health
  const fetchHealthStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('observability', {
        method: 'GET',
        body: { path: '/health' }
      })

      if (error) throw error

      setHealthStatus(data.health)
    } catch (error) {
      console.error('Error fetching health status:', error)
    }
  }

  // Delete alert rule
  const deleteAlertRule = async (alertRuleId: string) => {
    try {
      const { error } = await supabase
        .from('alert_rules')
        .delete()
        .eq('id', alertRuleId)

      if (error) throw error

      setAlertRules(prev => prev.filter(rule => rule.id !== alertRuleId))
      
      toast({
        title: "Succès",
        description: "Règle d'alerte supprimée",
      })
    } catch (error) {
      console.error('Error deleting alert rule:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la règle",
        variant: "destructive"
      })
    }
  }

  // Acknowledge alert
  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('active_alerts')
        .update({ status: 'acknowledged' })
        .eq('id', alertId)

      if (error) throw error

      setActiveAlerts(prev => prev.map(alert =>
        alert.id === alertId ? { ...alert, status: 'acknowledged' as const } : alert
      ))
      
      toast({
        title: "Alerte acquittée",
        description: "L'alerte a été marquée comme acquittée",
      })
    } catch (error) {
      console.error('Error acknowledging alert:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'acquitter l'alerte",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      await Promise.all([
        fetchMetrics(),
        fetchAlerts(),
        fetchSystemLogs(),
        fetchHealthStatus()
      ])
      setLoading(false)
    }

    loadInitialData()

    // Set up real-time metrics updates
    const metricsInterval = setInterval(fetchMetrics, 30000) // Every 30 seconds

    return () => {
      clearInterval(metricsInterval)
    }
  }, [fetchMetrics])

  return {
    metrics,
    alertRules,
    activeAlerts,
    systemLogs,
    healthStatus,
    loading,
    createAlertRule,
    deleteAlertRule,
    acknowledgeAlert,
    storeMetric,
    fetchSystemLogs,
    fetchMetrics,
    refetch: () => {
      fetchMetrics()
      fetchAlerts()
      fetchSystemLogs()
      fetchHealthStatus()
    }
  }
}