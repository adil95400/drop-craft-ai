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
import { logger } from '@/utils/logger';

const LOG_CTX = { component: 'AdvancedAnalyticsService' };

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
  static async getPerformanceMetrics(): Promise<PerformanceMetric[]> {
    try {
      const resp = await advancedAnalyticsApi.performanceMetrics();
      return resp.items;
    } catch (error) {
      logger.error('Error fetching performance metrics', error instanceof Error ? error : undefined, LOG_CTX);
      return [];
    }
  }

  static async getAdvancedReports(): Promise<AdvancedReport[]> {
    try {
      const resp = await advancedAnalyticsApi.listReports();
      return resp.items;
    } catch (error) {
      logger.error('Error fetching advanced reports', error instanceof Error ? error : undefined, LOG_CTX);
      return [];
    }
  }

  static async getPredictiveAnalytics(): Promise<PredictiveAnalysis[]> {
    try {
      const resp = await advancedAnalyticsApi.predictiveAnalytics();
      return resp.items;
    } catch (error) {
      logger.error('Error fetching predictive analytics', error instanceof Error ? error : undefined, LOG_CTX);
      return [];
    }
  }

  static async getABTests(): Promise<ABTestExperiment[]> {
    try {
      const resp = await advancedAnalyticsApi.listABTests();
      return resp.items;
    } catch (error) {
      logger.error('Error fetching AB tests', error instanceof Error ? error : undefined, LOG_CTX);
      return [];
    }
  }

  static async generateAdvancedReport(config: { reportType: string; config: any }) {
    return advancedAnalyticsApi.generateReport(config);
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
    return advancedAnalyticsApi.createABTest(testConfig);
  }

  static async runPredictiveAnalysis() {
    return advancedAnalyticsApi.runPredictive();
  }
}
