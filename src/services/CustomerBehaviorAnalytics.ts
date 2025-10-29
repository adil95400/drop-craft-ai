import { supabase } from '@/integrations/supabase/client';

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
  customer_id: string;
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
  key_insights?: any;
  recommended_actions?: any;
  preferences?: any;
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

  async analyzeBehavior(params: BehaviorAnalysisRequest): Promise<CustomerBehaviorData> {
    const { data, error } = await supabase.functions.invoke('customer-intelligence', {
      body: { customerData: params }
    });

    if (error) throw error;
    return data.analysis;
  }

  async getBehaviorHistory(): Promise<CustomerBehaviorData[]> {
    const { data, error } = await supabase
      .from('customer_behavior_analytics')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getBehaviorById(id: string): Promise<CustomerBehaviorData> {
    const { data, error } = await supabase
      .from('customer_behavior_analytics')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async deleteBehaviorAnalysis(id: string): Promise<void> {
    const { error } = await supabase
      .from('customer_behavior_analytics')
      .delete()
      .eq('id', id);

    if (error) throw error;
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