import { supabase } from '@/integrations/supabase/client';

export interface CustomerBehaviorData {
  id: string;
  user_id: string;
  customer_id?: string;
  behavior_type: string;
  analysis_data: any; // JSON field from Supabase
  behavioral_score: number;
  lifetime_value?: number;
  churn_probability?: number;
  recommendations: any; // JSON field from Supabase
  created_at: string;
  updated_at: string;
}

export interface BehaviorAnalysisRequest {
  customerId?: string;
  behaviorType: 'purchase_pattern' | 'browsing_behavior' | 'engagement' | 'churn_risk';
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
    try {
      console.log('[CustomerBehaviorAnalytics] Analyzing customer behavior', params);

      const { data, error } = await supabase.functions.invoke('customer-behavior-analysis', {
        body: params
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze customer behavior');
      }

      console.log('[CustomerBehaviorAnalytics] Analysis completed successfully');
      return data.analysis;
    } catch (error) {
      console.error('[CustomerBehaviorAnalytics] Error analyzing behavior:', error);
      throw error;
    }
  }

  async getBehaviorHistory(): Promise<CustomerBehaviorData[]> {
    try {
      const { data, error } = await supabase
        .from('customer_behavior_analytics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('[CustomerBehaviorAnalytics] Error fetching behavior history:', error);
      throw error;
    }
  }

  async getBehaviorById(id: string): Promise<CustomerBehaviorData | null> {
    try {
      const { data, error } = await supabase
        .from('customer_behavior_analytics')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('[CustomerBehaviorAnalytics] Error fetching behavior analysis:', error);
      throw error;
    }
  }

  async deleteBehaviorAnalysis(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('customer_behavior_analytics')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('[CustomerBehaviorAnalytics] Behavior analysis deleted successfully');
    } catch (error) {
      console.error('[CustomerBehaviorAnalytics] Error deleting analysis:', error);
      throw error;
    }
  }

  // Utility methods
  getSegmentColor(segment: string): string {
    const colorMap: Record<string, string> = {
      'champions': 'text-green-600',
      'loyal': 'text-blue-600',
      'at_risk': 'text-yellow-600',
      'lost': 'text-red-600',
      'new': 'text-purple-600'
    };
    return colorMap[segment] || 'text-gray-600';
  }

  getChurnRiskLevel(probability: number): { level: string; color: string } {
    if (probability >= 75) {
      return { level: 'Très élevé', color: 'text-red-600' };
    } else if (probability >= 50) {
      return { level: 'Élevé', color: 'text-orange-600' };
    } else if (probability >= 25) {
      return { level: 'Moyen', color: 'text-yellow-600' };
    } else {
      return { level: 'Faible', color: 'text-green-600' };
    }
  }

  formatLifetimeValue(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  getBehaviorIcon(behaviorType: string): string {
    const iconMap: Record<string, string> = {
      'purchase_pattern': '🛒',
      'browsing_behavior': '👀',
      'engagement': '💬',
      'churn_risk': '⚠️'
    };
    return iconMap[behaviorType] || '📊';
  }
}

export const customerBehaviorAnalytics = CustomerBehaviorAnalytics.getInstance();