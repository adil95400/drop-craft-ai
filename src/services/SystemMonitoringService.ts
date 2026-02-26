/**
 * @module SystemMonitoringService
 * @description Real-time system health monitoring and alerting service.
 *
 * Provides both static helpers (for quick one-off queries) and instance
 * methods (for richer monitoring workflows including real-time polling,
 * alert resolution, and performance trend analysis).
 *
 * Data sources:
 *  - `system_health_monitoring` table
 *  - `performance_metrics` table
 *  - `system-monitoring` edge function
 */
import { supabase } from "@/integrations/supabase/client";

/** Health snapshot for a single infrastructure component. */
interface SystemHealthMonitoring {
  id: string;
  component_name: string;
  health_status: 'healthy' | 'warning' | 'critical';
  /** Score 0–100 computed from error rate, latency, and uptime. */
  performance_score: number;
  error_rate?: number;
  response_time_ms?: number;
  uptime_percentage?: number;
  metrics_data?: any;
  alerts_triggered?: any[];
  last_check_at?: string;
  created_at?: string;
}

export class SystemMonitoringService {
  // ── Static convenience methods ─────────────────────────────────

  /** Fetch all component health records, most-recently-checked first. */
  static async getSystemHealth() {
    const { data, error } = await (supabase as any)
      .from('system_health_monitoring')
      .select('*')
      .order('last_check_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as SystemHealthMonitoring[];
  }

  /** Fetch system-level performance metrics. */
  static async getPerformanceMetrics() {
    const { data, error } = await (supabase as any)
      .from('performance_metrics')
      .select('*')
      .eq('metric_type', 'system')
      .order('collected_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  /** Trigger a server-side health check via the edge function. */
  static async runSystemHealthCheck() {
    const { data, error } = await supabase.functions.invoke('system-monitoring', {
      body: { action: 'health_check' }
    });
    if (error) throw error;
    return data;
  }

  /** Request server-side system optimization (cache clear, index rebuild…). */
  static async optimizeSystemPerformance() {
    const { data, error } = await supabase.functions.invoke('system-monitoring', {
      body: { action: 'optimize_system' }
    });
    if (error) throw error;
    return data;
  }

  // ── Instance methods ───────────────────────────────────────────

  /** Fetch system health summary via the edge function. */
  async getSystemHealth() {
    try {
      const { data, error } = await supabase.functions.invoke('system-monitoring', {
        body: { action: 'get_system_health' }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting system health:', error);
      throw error;
    }
  }

  /**
   * Fetch performance metrics filtered by type and timeframe.
   * @param metricType - Metric category filter (default: "all").
   * @param timeframe  - Lookback window, e.g. "24h", "7d" (default: "24h").
   */
  async getPerformanceMetrics(metricType: string = 'all', timeframe: string = '24h') {
    try {
      const { data, error } = await supabase.functions.invoke('system-monitoring', {
        body: { action: 'get_metrics', metric_type: metricType, timeframe }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      throw error;
    }
  }

  /**
   * Create a system alert via the monitoring edge function.
   * @param alertType     - Category (e.g. "high_error_rate", "disk_full").
   * @param severity      - Urgency level.
   * @param message       - Human-readable description.
   * @param componentName - Affected component identifier.
   * @param metadata      - Additional context attached to the alert.
   */
  async createSystemAlert(alertType: string, severity: 'low' | 'medium' | 'high' | 'critical', message: string, componentName: string, metadata: any = {}) {
    try {
      const { data, error } = await supabase.functions.invoke('system-monitoring', {
        body: { action: 'create_alert', alert_type: alertType, severity, message, component_name: componentName, metadata }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating system alert:', error);
      throw error;
    }
  }

  /**
   * Retrieve system alerts with optional filters.
   * @param severityFilter  - Filter by severity level.
   * @param componentFilter - Filter by component name.
   * @param limit           - Max results (default 50).
   */
  async getSystemAlerts(severityFilter?: string, componentFilter?: string, limit: number = 50) {
    try {
      const { data, error } = await supabase.functions.invoke('system-monitoring', {
        body: { action: 'get_alerts', severity_filter: severityFilter, component_filter: componentFilter, limit }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting system alerts:', error);
      throw error;
    }
  }

  /**
   * Push updated health metrics for a specific component.
   * @param componentName    - Component identifier.
   * @param healthStatus     - New health status.
   * @param performanceScore - New score (0–100).
   */
  async updateComponentHealth(
    componentName: string,
    healthStatus: 'healthy' | 'warning' | 'critical',
    performanceScore: number,
    errorRate?: number,
    responseTimeMs?: number,
    uptimePercentage?: number,
    metricsData: any = {}
  ) {
    try {
      const { data, error } = await supabase.functions.invoke('system-monitoring', {
        body: {
          action: 'update_component_health',
          component_name: componentName,
          health_status: healthStatus,
          performance_score: performanceScore,
          error_rate: errorRate,
          response_time_ms: responseTimeMs,
          uptime_percentage: uptimePercentage,
          metrics_data: metricsData
        }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating component health:', error);
      throw error;
    }
  }

  /** Fetch all health monitoring records from the database. */
  async getHealthMonitoring(): Promise<SystemHealthMonitoring[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('system_health_monitoring')
        .select('*')
        .order('last_check_at', { ascending: false });
      if (error) throw error;
      return (data || []) as SystemHealthMonitoring[];
    } catch (error) {
      console.error('Error fetching health monitoring data:', error);
      throw error;
    }
  }

  /**
   * Get health data for a single component.
   * @returns The component record, or `null` if not found.
   */
  async getComponentHealth(componentName: string): Promise<SystemHealthMonitoring | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('system_health_monitoring')
        .select('*')
        .eq('component_name', componentName)
        .maybeSingle();
      if (error) throw error;
      return data as SystemHealthMonitoring | null;
    } catch (error) {
      console.error('Error fetching component health:', error);
      throw error;
    }
  }

  // ── Real-time monitoring ───────────────────────────────────────

  /**
   * Start a monitoring pass for a list of components (or defaults).
   * Generates synthetic metrics and updates each component's health record.
   * @param components - Component names to monitor (uses defaults if empty).
   */
  async startRealTimeMonitoring(components: string[] = []) {
    const defaultComponents = [
      'api_server', 'database', 'file_storage',
      'payment_processing', 'email_service', 'cdn'
    ];
    const componentsToMonitor = components.length > 0 ? components : defaultComponents;

    try {
      const results = await Promise.all(
        componentsToMonitor.map(c => this.monitorComponent(c))
      );
      return { success: true, monitored_components: componentsToMonitor, results };
    } catch (error) {
      console.error('Error starting real-time monitoring:', error);
      throw error;
    }
  }

  /** Run a single monitoring cycle for one component. */
  private async monitorComponent(componentName: string) {
    const metrics = await this.generateComponentMetrics(componentName);
    return await this.updateComponentHealth(
      componentName,
      metrics.healthStatus,
      metrics.performanceScore,
      metrics.errorRate,
      metrics.responseTime,
      metrics.uptime,
      metrics.additionalMetrics
    );
  }

  /**
   * Generate synthetic metrics for a component (simulated).
   * In production this would query real infrastructure APIs.
   */
  private async generateComponentMetrics(componentName: string) {
    const baseMetrics = {
      api_server: { baseScore: 85, baseResponseTime: 150, baseErrorRate: 2 },
      database: { baseScore: 90, baseResponseTime: 50, baseErrorRate: 1 },
      file_storage: { baseScore: 88, baseResponseTime: 100, baseErrorRate: 1.5 },
      payment_processing: { baseScore: 95, baseResponseTime: 200, baseErrorRate: 0.5 },
      email_service: { baseScore: 92, baseResponseTime: 300, baseErrorRate: 1 },
      cdn: { baseScore: 96, baseResponseTime: 80, baseErrorRate: 0.2 }
    };

    const base = baseMetrics[componentName as keyof typeof baseMetrics] || 
                { baseScore: 80, baseResponseTime: 200, baseErrorRate: 3 };

    const performanceScore = Math.max(0, Math.min(100, base.baseScore + (Math.random() - 0.5) * 20));
    const responseTime = Math.max(10, base.baseResponseTime + (Math.random() - 0.5) * base.baseResponseTime * 0.5);
    const errorRate = Math.max(0, base.baseErrorRate + (Math.random() - 0.5) * base.baseErrorRate);
    const uptime = Math.max(80, Math.min(100, 98 + (Math.random() - 0.5) * 4));

    let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (performanceScore < 70 || errorRate > 5 || uptime < 90) {
      healthStatus = 'critical';
    } else if (performanceScore < 80 || errorRate > 2 || uptime < 95) {
      healthStatus = 'warning';
    }

    return {
      healthStatus,
      performanceScore: Math.round(performanceScore),
      errorRate: Math.round(errorRate * 100) / 100,
      responseTime: Math.round(responseTime),
      uptime: Math.round(uptime * 100) / 100,
      additionalMetrics: {
        cpu_usage: Math.random() * 80 + 10,
        memory_usage: Math.random() * 70 + 20,
        disk_usage: Math.random() * 50 + 10,
        network_latency: Math.random() * 100 + 20,
        active_connections: Math.floor(Math.random() * 1000 + 100),
        throughput: Math.floor(Math.random() * 10000 + 1000)
      }
    };
  }

  // ── Alert management ───────────────────────────────────────────

  /**
   * Resolve (remove) a specific alert from a component's triggered alerts list.
   * If no alerts remain, the component status reverts to "healthy".
   */
  async resolveAlert(componentName: string, alertType: string) {
    try {
      const component = await this.getComponentHealth(componentName);
      if (!component) return;

      const alerts = Array.isArray(component.alerts_triggered) ? component.alerts_triggered : [];
      const filteredAlerts = alerts.filter((alert: any) => alert.type !== alertType);

      const { error } = await (supabase as any)
        .from('system_health_monitoring')
        .update({
          alerts_triggered: filteredAlerts,
          health_status: filteredAlerts.length === 0 ? 'healthy' : component.health_status
        })
        .eq('component_name', componentName);

      if (error) throw error;
      return { success: true, resolved_alert: alertType };
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }

  // ── Performance analysis ───────────────────────────────────────

  /**
   * Analyze performance trends by comparing the most recent 10 data points
   * against the preceding 10.
   * @param metrics - Time-ordered array of metric records (must have a `value` field).
   * @returns Trend direction, percentage change, and actionable recommendations.
   */
  analyzePerformanceTrends(metrics: any[]) {
    if (!metrics || metrics.length < 2) {
      return {
        trend: 'insufficient_data',
        trend_direction: 'stable',
        performance_change: 0,
        recommendations: ['Collect more data to analyze trends']
      };
    }

    const recentMetrics = metrics.slice(-10);
    const olderMetrics = metrics.slice(0, Math.min(10, metrics.length - 10));

    if (olderMetrics.length === 0) {
      return {
        trend: 'stable',
        trend_direction: 'stable',
        performance_change: 0,
        recommendations: ['Continue monitoring for trend analysis']
      };
    }

    const recentAvg = recentMetrics.reduce((sum: number, m: any) => sum + (m.value || 0), 0) / recentMetrics.length;
    const olderAvg = olderMetrics.reduce((sum: number, m: any) => sum + (m.value || 0), 0) / olderMetrics.length;
    const performanceChange = ((recentAvg - olderAvg) / olderAvg) * 100;

    let trendDirection = 'stable';
    let trend = 'stable';
    if (Math.abs(performanceChange) > 10) {
      trend = performanceChange > 0 ? 'improving' : 'declining';
      trendDirection = performanceChange > 0 ? 'increasing' : 'decreasing';
    }

    return {
      trend,
      trend_direction: trendDirection,
      performance_change: Math.round(performanceChange * 100) / 100,
      recent_average: Math.round(recentAvg * 100) / 100,
      older_average: Math.round(olderAvg * 100) / 100,
      recommendations: this.generatePerformanceRecommendations(trend, performanceChange, recentAvg)
    };
  }

  /** Generate human-readable recommendations from trend data. */
  private generatePerformanceRecommendations(trend: string, change: number, current: number): string[] {
    const recommendations: string[] = [];

    if (trend === 'declining') {
      recommendations.push('Performance is declining - investigate recent changes');
      recommendations.push('Check system resources and scaling requirements');
      if (Math.abs(change) > 20) {
        recommendations.push('Consider immediate intervention - significant performance drop detected');
      }
    } else if (trend === 'improving') {
      recommendations.push('Performance is improving - monitor to maintain gains');
      recommendations.push('Document recent optimizations for future reference');
    } else {
      recommendations.push('Performance is stable - continue current monitoring');
    }

    if (current < 70) {
      recommendations.push('Current performance below optimal - consider system optimization');
    } else if (current > 90) {
      recommendations.push('Excellent performance - consider if resources can be optimized');
    }

    return recommendations;
  }

  // ── Aggregate health score ─────────────────────────────────────

  /**
   * Calculate an overall system health score from all component snapshots.
   * @param components - Array of component health records.
   * @returns Weighted average score, per-component scores, critical list, and recommendations.
   */
  calculateSystemHealthScore(components: SystemHealthMonitoring[]): {
    overall_score: number;
    component_scores: { [key: string]: number };
    critical_components: string[];
    recommendations: string[];
  } {
    if (!components || components.length === 0) {
      return {
        overall_score: 0,
        component_scores: {},
        critical_components: [],
        recommendations: ['No component data available for health assessment']
      };
    }

    const componentScores: { [key: string]: number } = {};
    const criticalComponents: string[] = [];
    let totalScore = 0;
    let validComponents = 0;

    components.forEach(component => {
      const score = component.performance_score || 0;
      componentScores[component.component_name] = score;
      if (component.health_status === 'critical') {
        criticalComponents.push(component.component_name);
      }
      totalScore += score;
      validComponents++;
    });

    const overallScore = validComponents > 0 ? Math.round(totalScore / validComponents) : 0;

    return {
      overall_score: overallScore,
      component_scores: componentScores,
      critical_components: criticalComponents,
      recommendations: this.generateSystemRecommendations(overallScore, criticalComponents, components)
    };
  }

  /** Generate system-wide recommendations based on overall health. */
  private generateSystemRecommendations(overallScore: number, criticalComponents: string[], components: SystemHealthMonitoring[]): string[] {
    const recommendations: string[] = [];

    if (overallScore < 60) {
      recommendations.push('System health is poor - immediate attention required');
      recommendations.push('Review all critical components and system architecture');
    } else if (overallScore < 80) {
      recommendations.push('System health needs improvement - schedule maintenance review');
      recommendations.push('Focus on optimizing underperforming components');
    } else if (overallScore > 95) {
      recommendations.push('Excellent system health - maintain current practices');
      recommendations.push('Consider documenting current configuration as a baseline');
    }

    if (criticalComponents.length > 0) {
      recommendations.push(`Critical components need immediate attention: ${criticalComponents.join(', ')}`);
    }

    const highErrorComponents = components.filter(c => (c.error_rate || 0) > 5);
    if (highErrorComponents.length > 0) {
      recommendations.push('High error rates detected in some components - investigate error patterns');
    }

    const lowUptimeComponents = components.filter(c => (c.uptime_percentage || 100) < 95);
    if (lowUptimeComponents.length > 0) {
      recommendations.push('Some components have low uptime - review availability requirements');
    }

    return recommendations;
  }
}
