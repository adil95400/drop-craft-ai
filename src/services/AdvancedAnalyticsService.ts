import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PerformanceMetrics = Database['public']['Tables']['performance_metrics']['Row'];
type AdvancedReports = Database['public']['Tables']['advanced_reports']['Row'];
type PredictiveAnalytics = Database['public']['Tables']['predictive_analytics']['Row'];

export class AdvancedAnalyticsService {
  static async getPerformanceMetrics(metricType?: string, timeRange?: string) {
    const { data, error } = await supabase
      .from('performance_metrics')
      .select('*')
      .order('collected_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async getAdvancedReports() {
    const { data, error } = await supabase
      .from('advanced_reports')
      .select('*')
      .order('generated_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async getPredictiveAnalytics() {
    const { data, error } = await supabase
      .from('predictive_analytics')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async getABTests() {
    const { data, error } = await supabase
      .from('ab_test_experiments')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async generateAdvancedReport(config: { reportType: string; config: any }) {
    const { data, error } = await supabase.functions.invoke('advanced-analytics', {
      body: {
        action: 'generate_report',
        reportType: config.reportType,
        config: config.config
      }
    })

    if (error) throw error
    return data
  }

  static async createABTest(testConfig: {
    experimentName: string;
    experimentType: string;
    hypothesis: string;
    controlVariant: any;
    testVariants: any[];
    successMetrics: any[];
    trafficAllocation: any;
  }) {
    const { data, error } = await supabase
      .from('ab_test_experiments')
      .insert({
        experiment_name: testConfig.experimentName,
        experiment_type: testConfig.experimentType,
        hypothesis: testConfig.hypothesis,
        control_variant: testConfig.controlVariant,
        test_variants: testConfig.testVariants,
        success_metrics: testConfig.successMetrics,
        traffic_allocation: testConfig.trafficAllocation,
        status: 'draft'
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async runPredictiveAnalysis() {
    const { data, error } = await supabase.functions.invoke('advanced-analytics', {
      body: {
        action: 'run_predictive_analysis'
      }
    })

    if (error) throw error
    return data
  }

  async generateAdvancedReport(reportType: string, config: any) {
    try {
      const { data, error } = await supabase.functions.invoke('advanced-analytics', {
        body: {
          action: 'generate_report',
          report_type: reportType,
          report_config: config
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating advanced report:', error);
      throw error;
    }
  }

  async collectPerformanceMetrics(metrics: any[]) {
    try {
      const { data, error } = await supabase.functions.invoke('advanced-analytics', {
        body: {
          action: 'collect_metrics',
          metrics
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error collecting performance metrics:', error);
      throw error;
    }
  }

  async generatePredictiveAnalysis(predictionType: string, targetMetric: string, predictionPeriod: string) {
    try {
      const { data, error } = await supabase.functions.invoke('advanced-analytics', {
        body: {
          action: 'predictive_analysis',
          prediction_type: predictionType,
          target_metric: targetMetric,
          prediction_period: predictionPeriod
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating predictive analysis:', error);
      throw error;
    }
  }

  async getPerformanceMetrics(metricType?: string, timeRange?: string): Promise<PerformanceMetrics[]> {
    try {
      let query = supabase
        .from('performance_metrics')
        .select('*')
        .order('collected_at', { ascending: false });

      if (metricType) {
        query = query.eq('metric_type', metricType);
      }

      if (timeRange) {
        const startDate = this.getTimeRangeDate(timeRange);
        query = query.gte('collected_at', startDate);
      }

      const { data, error } = await query.limit(1000);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      throw error;
    }
  }

  async getAdvancedReports(reportType?: string): Promise<AdvancedReports[]> {
    try {
      let query = supabase
        .from('advanced_reports')
        .select('*')
        .order('generated_at', { ascending: false });

      if (reportType) {
        query = query.eq('report_type', reportType);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching advanced reports:', error);
      throw error;
    }
  }

  async getPredictiveAnalytics(predictionType?: string): Promise<PredictiveAnalytics[]> {
    try {
      let query = supabase
        .from('predictive_analytics')
        .select('*')
        .order('created_at', { ascending: false });

      if (predictionType) {
        query = query.eq('prediction_type', predictionType);
      }

      // Only get valid predictions
      query = query.gt('valid_until', new Date().toISOString());

      const { data, error } = await query.limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching predictive analytics:', error);
      throw error;
    }
  }

  async deleteReport(reportId: string) {
    try {
      const { error } = await supabase
        .from('advanced_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }

  async deletePrediction(predictionId: string) {
    try {
      const { error } = await supabase
        .from('predictive_analytics')
        .delete()
        .eq('id', predictionId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting prediction:', error);
      throw error;
    }
  }

  // Utility functions
  private getTimeRangeDate(timeRange: string): string {
    const now = new Date();
    switch (timeRange) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    }
  }

  // Real-time metrics collection
  async startMetricsCollection(components: string[] = []) {
    const defaultComponents = ['api', 'database', 'storage', 'payments'];
    const metricsToCollect = components.length > 0 ? components : defaultComponents;

    // Simulate collecting various performance metrics
    const metrics = metricsToCollect.map(component => ({
      type: 'performance',
      name: `${component}_response_time`,
      value: Math.random() * 200 + 50, // 50-250ms
      unit: 'milliseconds',
      dimensions: {
        component,
        environment: 'production',
        region: 'auto'
      },
      metadata: {
        collected_by: 'advanced_analytics_service',
        collection_method: 'realtime'
      }
    }));

    return await this.collectPerformanceMetrics(metrics);
  }

  // Metric aggregation and analysis
  aggregateMetrics(metrics: PerformanceMetrics[], aggregationType: 'hourly' | 'daily' | 'weekly' = 'hourly') {
    const aggregated: { [key: string]: any } = {};

    metrics.forEach(metric => {
      const key = `${metric.metric_type}_${metric.metric_name}`;
      
      if (!aggregated[key]) {
        aggregated[key] = {
          metric_type: metric.metric_type,
          metric_name: metric.metric_name,
          metric_unit: metric.metric_unit,
          values: [],
          min: Number.MAX_VALUE,
          max: Number.MIN_VALUE,
          sum: 0,
          count: 0
        };
      }

      aggregated[key].values.push({
        value: metric.metric_value,
        timestamp: metric.collected_at,
        dimensions: metric.dimensions
      });

      aggregated[key].min = Math.min(aggregated[key].min, metric.metric_value);
      aggregated[key].max = Math.max(aggregated[key].max, metric.metric_value);
      aggregated[key].sum += metric.metric_value;
      aggregated[key].count++;
    });

    // Calculate statistics
    Object.values(aggregated).forEach((agg: any) => {
      agg.average = agg.sum / agg.count;
      agg.median = this.calculateMedian(agg.values.map((v: any) => v.value));
      agg.standardDeviation = this.calculateStandardDeviation(agg.values.map((v: any) => v.value), agg.average);
    });

    return aggregated;
  }

  private calculateMedian(values: number[]): number {
    const sorted = values.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private calculateStandardDeviation(values: number[], mean: number): number {
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  // Data export functionality
  async exportMetricsData(format: 'csv' | 'json' = 'json', timeRange?: string) {
    const metrics = await this.getPerformanceMetrics(undefined, timeRange);
    
    if (format === 'csv') {
      return this.convertToCSV(metrics);
    }
    
    return JSON.stringify(metrics, null, 2);
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => 
      Object.values(item).map(value => 
        typeof value === 'object' ? JSON.stringify(value) : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  }
}