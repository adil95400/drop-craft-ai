import { behaviorApi } from '@/services/api/client';

export interface BehaviorAnalysisRequest {
  customer_id: string;
  customer_email: string;
  customer_name?: string;
  total_orders?: number;
  total_spent?: number;
  avg_order_value?: number;
  last_order_date?: string;
  first_order_date?: string;
}

export interface CustomerBehaviorData {
  id: string;
  customer_id: string | null;
  customer_email: string;
  customer_name?: string;
  analysis_date: string;
  behavioral_score: number;
  engagement_level: 'low' | 'medium' | 'high' | 'very_high';
  purchase_frequency?: string;
  avg_order_value?: number;
  total_orders: number;
  total_spent: number;
  customer_segment: 'vip' | 'loyal' | 'at_risk' | 'new' | 'dormant' | 'champion';
  segment_confidence?: number;
  lifetime_value?: number;
  predicted_next_purchase_days?: number;
  churn_probability?: number;
  churn_risk_level?: 'low' | 'medium' | 'high' | 'critical';
  key_insights?: string[];
  recommended_actions?: string[];
  preferences?: string[];
  created_at: string;
  updated_at: string;
}

export class CustomerBehaviorAnalytics {
  private static instance: CustomerBehaviorAnalytics;

  static getInstance(): CustomerBehaviorAnalytics {
    if (!CustomerBehaviorAnalytics.instance) {
      CustomerBehaviorAnalytics.instance = new CustomerBehaviorAnalytics();
    }
    return CustomerBehaviorAnalytics.instance;
  }

  private mapRowToData(row: any): CustomerBehaviorData {
    const analysisData = row.analysis_data || {};
    return {
      id: row.id,
      customer_id: row.customer_id,
      customer_email: analysisData.customer_email || '',
      customer_name: analysisData.customer_name,
      analysis_date: row.created_at,
      behavioral_score: row.behavioral_score,
      engagement_level: analysisData.engagement_level || 'medium',
      purchase_frequency: analysisData.purchase_frequency,
      avg_order_value: analysisData.avg_order_value,
      total_orders: analysisData.total_orders || 0,
      total_spent: analysisData.total_spent || 0,
      customer_segment: analysisData.customer_segment || 'new',
      segment_confidence: analysisData.segment_confidence,
      lifetime_value: row.lifetime_value || undefined,
      predicted_next_purchase_days: analysisData.predicted_next_purchase_days,
      churn_probability: row.churn_probability || undefined,
      churn_risk_level: analysisData.churn_risk_level,
      key_insights: (row.recommendations as any)?.key_insights || [],
      recommended_actions: (row.recommendations as any)?.recommended_actions || [],
      preferences: analysisData.preferences || [],
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async analyzeBehavior(params: BehaviorAnalysisRequest): Promise<CustomerBehaviorData> {
    const data = await behaviorApi.analyze(params);
    return data.analysis;
  }

  async getBehaviorHistory(): Promise<CustomerBehaviorData[]> {
    const resp = await behaviorApi.history();
    return (resp.items || []).map((row: any) => this.mapRowToData(row));
  }

  async getBehaviorById(id: string): Promise<CustomerBehaviorData> {
    const data = await behaviorApi.getById(id);
    return this.mapRowToData(data);
  }

  async deleteBehaviorAnalysis(id: string): Promise<void> {
    await behaviorApi.delete(id);
  }

  getSegmentColor(segment: string): string {
    const colors: Record<string, string> = {
      vip: 'bg-purple-500',
      champion: 'bg-yellow-500',
      loyal: 'bg-green-500',
      at_risk: 'bg-orange-500',
      dormant: 'bg-red-500',
      new: 'bg-blue-500',
    };
    return colors[segment] || 'bg-gray-500';
  }

  getChurnRiskLevel(probability: number): { level: string; color: string } {
    if (probability >= 75) return { level: 'critical', color: 'bg-red-500' };
    if (probability >= 50) return { level: 'high', color: 'bg-orange-500' };
    if (probability >= 25) return { level: 'medium', color: 'bg-yellow-500' };
    return { level: 'low', color: 'bg-green-500' };
  }

  formatLifetimeValue(value?: number): string {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  getBehaviorIcon(engagement: string): string {
    const icons: Record<string, string> = {
      very_high: '🔥',
      high: '⭐',
      medium: '👍',
      low: '📉',
    };
    return icons[engagement] || '❓';
  }
}

export const customerBehaviorAnalytics = CustomerBehaviorAnalytics.getInstance();
