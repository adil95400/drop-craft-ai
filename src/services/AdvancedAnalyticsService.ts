/**
 * @module AdvancedAnalyticsService
 * @description Service layer for advanced analytics features:
 * performance metrics, custom reports, predictive AI analytics,
 * and A/B testing experiment management.
 *
 * All methods gracefully return empty arrays on failure to avoid
 * breaking the UI when analytics data is unavailable.
 */
import { advancedAnalyticsApi } from '@/services/api/client';

/** A single recorded performance metric (e.g. page load time, TTFB). */
interface PerformanceMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_type?: string;
  recorded_at?: string;
}

/** A generated or scheduled analytics report. */
interface AdvancedReport {
  id: string;
  report_name: string;
  report_type: string;
  status?: string;
  generated_at?: string;
  file_url?: string;
  report_data?: any;
}

/** Result of a predictive AI analysis run. */
interface PredictiveAnalysis {
  id: string;
  prediction_type: string;
  confidence_score: number;
  predictions: any;
}

/** An A/B test experiment with variants and statistical results. */
interface ABTestExperiment {
  id: string;
  experiment_name: string;
  experiment_type?: string;
  hypothesis?: string;
  status?: string;
  statistical_significance?: number;
}

export class AdvancedAnalyticsService {
  /**
   * Fetch all performance metrics for the current user.
   * @returns Array of {@link PerformanceMetric}, or `[]` on error.
   */
  static async getPerformanceMetrics(): Promise<PerformanceMetric[]> {
    try {
      const resp = await advancedAnalyticsApi.performanceMetrics();
      return resp.items;
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      return [];
    }
  }

  /**
   * Fetch all advanced reports (PDF exports, scheduled reports, etc.).
   * @returns Array of {@link AdvancedReport}, or `[]` on error.
   */
  static async getAdvancedReports(): Promise<AdvancedReport[]> {
    try {
      const resp = await advancedAnalyticsApi.listReports();
      return resp.items;
    } catch (error) {
      console.error('Error fetching advanced reports:', error);
      return [];
    }
  }

  /**
   * Retrieve predictive analytics results (churn, demand forecasting, etc.).
   * @returns Array of {@link PredictiveAnalysis}, or `[]` on error.
   */
  static async getPredictiveAnalytics(): Promise<PredictiveAnalysis[]> {
    try {
      const resp = await advancedAnalyticsApi.predictiveAnalytics();
      return resp.items;
    } catch (error) {
      console.error('Error fetching predictive analytics:', error);
      return [];
    }
  }

  /**
   * List all A/B test experiments.
   * @returns Array of {@link ABTestExperiment}, or `[]` on error.
   */
  static async getABTests(): Promise<ABTestExperiment[]> {
    try {
      const resp = await advancedAnalyticsApi.listABTests();
      return resp.items;
    } catch (error) {
      console.error('Error fetching AB tests:', error);
      return [];
    }
  }

  /**
   * Generate a new advanced report asynchronously.
   * @param config.reportType - Type of report (e.g. "sales_summary", "inventory").
   * @param config.config     - Report-specific options (date range, filters…).
   */
  static async generateAdvancedReport(config: { reportType: string; config: any }) {
    return advancedAnalyticsApi.generateReport(config);
  }

  /**
   * Create and start a new A/B test experiment.
   * @param testConfig - Full experiment configuration including variants,
   *                     success metrics, and traffic allocation.
   */
  static async createABTest(testConfig: {
    experimentName: string;
    experimentType: string;
    hypothesis: string;
    controlVariant: any;
    testVariants: any[];
    successMetrics: any[];
    trafficAllocation: any;
  }) {
    return advancedAnalyticsApi.createABTest(testConfig);
  }

  /**
   * Trigger a new predictive analysis run across all user data.
   * Results are stored and retrievable via {@link getPredictiveAnalytics}.
   */
  static async runPredictiveAnalysis() {
    return advancedAnalyticsApi.runPredictive();
  }
}
