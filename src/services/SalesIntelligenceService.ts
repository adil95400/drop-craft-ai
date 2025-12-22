import { supabase } from '@/integrations/supabase/client';

export interface SalesIntelligenceData {
  id: string;
  user_id: string;
  product_id?: string;
  analysis_type: string;
  time_period: string;
  predictions: any; // JSON field from Supabase
  confidence_score: number;
  market_insights: any; // JSON field from Supabase
  recommended_actions: any; // JSON field from Supabase
  created_at: string;
  updated_at: string;
}

// Typed interfaces for the JSON data
export interface SalesPredictions {
  '3_months': { revenue: number; orders: number; growth_rate: number };
  '6_months': { revenue: number; orders: number; growth_rate: number };
  '12_months': { revenue: number; orders: number; growth_rate: number };
}

export interface MarketInsights {
  seasonal_trends: string;
  demand_patterns: string;
  competitive_position: string;
}

export interface RecommendedAction {
  priority: 'high' | 'medium' | 'low';
  action: string;
  impact: string;
}

export interface ForecastRequest {
  productId?: string;
  timePeriod: 'week' | 'month' | 'quarter' | 'year';
  analysisType: 'forecast' | 'trend_analysis' | 'price_optimization' | 'market_gap';
}

export class SalesIntelligenceService {
  private static instance: SalesIntelligenceService;

  static getInstance(): SalesIntelligenceService {
    if (!SalesIntelligenceService.instance) {
      SalesIntelligenceService.instance = new SalesIntelligenceService();
    }
    return SalesIntelligenceService.instance;
  }

  async generateForecast(params: ForecastRequest): Promise<SalesIntelligenceData> {
    try {
      console.log('[SalesIntelligenceService] Generating forecast', params);

      const { data, error } = await supabase.functions.invoke('sales-forecast', {
        body: params
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate forecast');
      }

      console.log('[SalesIntelligenceService] Forecast generated successfully');
      return data.analysis;
    } catch (error) {
      console.error('[SalesIntelligenceService] Error generating forecast:', error);
      throw error;
    }
  }

  async getForecastHistory(): Promise<SalesIntelligenceData[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('sales_intelligence')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return (data || []).map((d: any) => this.mapToSalesIntelligenceData(d));
    } catch (error) {
      console.error('[SalesIntelligenceService] Error fetching forecast history:', error);
      throw error;
    }
  }

  async getForecastById(id: string): Promise<SalesIntelligenceData | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('sales_intelligence')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return data ? this.mapToSalesIntelligenceData(data) : null;
    } catch (error) {
      console.error('[SalesIntelligenceService] Error fetching forecast:', error);
      throw error;
    }
  }

  async deleteForecast(id: string): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from('sales_intelligence')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('[SalesIntelligenceService] Forecast deleted successfully');
    } catch (error) {
      console.error('[SalesIntelligenceService] Error deleting forecast:', error);
      throw error;
    }
  }

  // Utility methods for analysis
  calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  formatCurrency(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  }

  getConfidenceLevel(score: number): { level: string; color: string } {
    if (score >= 80) {
      return { level: 'Très élevée', color: 'text-green-600' };
    } else if (score >= 60) {
      return { level: 'Élevée', color: 'text-blue-600' };
    } else if (score >= 40) {
      return { level: 'Moyenne', color: 'text-yellow-600' };
    } else {
      return { level: 'Faible', color: 'text-red-600' };
    }
  }
}

export const salesIntelligenceService = SalesIntelligenceService.getInstance();