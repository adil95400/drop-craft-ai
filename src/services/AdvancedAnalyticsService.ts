import { advancedAnalyticsApi } from '@/services/api/client';

interface PerformanceMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_type?: string;
  recorded_at?: string;
}

interface AdvancedReport {
  id: string;
  report_name: string;
  report_type: string;
  status?: string;
  generated_at?: string;
  file_url?: string;
  report_data?: any;
}

interface PredictiveAnalysis {
  id: string;
  prediction_type: string;
  confidence_score: number;
  predictions: any;
}

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
      console.error('Error fetching performance metrics:', error);
      return [];
    }
  }

  static async getAdvancedReports(): Promise<AdvancedReport[]> {
    try {
      const resp = await advancedAnalyticsApi.listReports();
      return resp.items;
    } catch (error) {
      console.error('Error fetching advanced reports:', error);
      return [];
    }
  }

  static async getPredictiveAnalytics(): Promise<PredictiveAnalysis[]> {
    try {
      const resp = await advancedAnalyticsApi.predictiveAnalytics();
      return resp.items;
    } catch (error) {
      console.error('Error fetching predictive analytics:', error);
      return [];
    }
  }

  static async getABTests(): Promise<ABTestExperiment[]> {
    try {
      const resp = await advancedAnalyticsApi.listABTests();
      return resp.items;
    } catch (error) {
      console.error('Error fetching AB tests:', error);
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
