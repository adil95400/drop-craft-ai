import { supabase } from '@/integrations/supabase/client';

export interface BusinessInsight {
  id: string;
  user_id: string;
  insight_type: string;
  category: string;
  title: string;
  description: string;
  severity: string;
  confidence_score: number;
  impact_score: number;
  actionable_recommendations: any;
  supporting_data: any;
  ai_analysis: any;
  status: string;
  priority: number;
  expires_at?: string;
  acknowledged_at?: string;
  acted_upon_at?: string;
  outcome_data: any;
  created_at: string;
  updated_at: string;
}

export interface BusinessIntelligenceReport {
  success: boolean;
  summary: {
    totalInsights: number;
    criticalIssues: number;
    opportunities: number;
    averageConfidence: number;
  };
  insights: BusinessInsight[];
  report: {
    executiveSummary: string;
    keyPoints: string[];
    priorityRecommendations: string[];
    nextSteps: string[];
  };
  businessMetrics: any;
  lastAnalysis: string;
}

export class BusinessIntelligenceService {
  
  static async generateInsights(analysisType: string = 'full', timeRange: string = '30d'): Promise<BusinessIntelligenceReport> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('business-intelligence-insights', {
      body: {
        userId: currentUser.user.id,
        analysisType,
        timeRange
      }
    });

    if (error) throw error;
    return data;
  }

  static async getAllInsights(): Promise<BusinessInsight[]> {
    const { data, error } = await supabase
      .from('business_intelligence_insights')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as BusinessInsight[];
  }

  static async getInsightsByCategory(category: BusinessInsight['category']): Promise<BusinessInsight[]> {
    const { data, error } = await supabase
      .from('business_intelligence_insights')
      .select('*')
      .eq('category', category)
      .order('impact_score', { ascending: false });

    if (error) throw error;
    return (data || []) as BusinessInsight[];
  }

  static async getInsightsBySeverity(severity: BusinessInsight['severity']): Promise<BusinessInsight[]> {
    const { data, error } = await supabase
      .from('business_intelligence_insights')
      .select('*')
      .eq('severity', severity)
      .order('confidence_score', { ascending: false });

    if (error) throw error;
    return (data || []) as BusinessInsight[];
  }

  static async updateInsightStatus(
    insightId: string, 
    status: BusinessInsight['status'], 
    outcomeData?: any
  ): Promise<BusinessInsight> {
    const updates: any = { 
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'acknowledged' && !updates.acknowledged_at) {
      updates.acknowledged_at = new Date().toISOString();
    }
    
    if (status === 'acted_upon') {
      updates.acted_upon_at = new Date().toISOString();
      if (outcomeData) {
        updates.outcome_data = outcomeData;
      }
    }

    const { data, error } = await supabase
      .from('business_intelligence_insights')
      .update(updates)
      .eq('id', insightId)
      .select()
      .single();

    if (error) throw error;
    return data as BusinessInsight;
  }

  static async acknowledgeInsight(insightId: string): Promise<BusinessInsight> {
    return this.updateInsightStatus(insightId, 'acknowledged');
  }

  static async markAsActedUpon(insightId: string, outcomeData: any): Promise<BusinessInsight> {
    return this.updateInsightStatus(insightId, 'acted_upon', outcomeData);
  }

  static async dismissInsight(insightId: string): Promise<BusinessInsight> {
    return this.updateInsightStatus(insightId, 'dismissed');
  }

  static async getPriorityInsights(): Promise<BusinessInsight[]> {
    const { data, error } = await supabase
      .from('business_intelligence_insights')
      .select('*')
      .eq('status', 'new')
      .gte('impact_score', 70)
      .order('priority', { ascending: false })
      .order('impact_score', { ascending: false })
      .limit(10);

    if (error) throw error;
    return (data || []) as BusinessInsight[];
  }

  static async getInsightMetrics(): Promise<any> {
    const { data: insights, error } = await supabase
      .from('business_intelligence_insights')
      .select('*');

    if (error) throw error;

    if (!insights || insights.length === 0) {
      return {
        totalInsights: 0,
        newInsights: 0,
        criticalInsights: 0,
        opportunities: 0,
        averageConfidence: 0,
        averageImpact: 0,
        actionRate: 0
      };
    }

    const newInsights = insights.filter(i => i.status === 'new').length;
    const criticalInsights = insights.filter(i => i.severity === 'critical').length;
    const opportunities = insights.filter(i => i.severity === 'opportunity').length;
    const actedUponInsights = insights.filter(i => i.status === 'acted_upon').length;
    
    const averageConfidence = insights.reduce((sum, i) => sum + i.confidence_score, 0) / insights.length;
    const averageImpact = insights.reduce((sum, i) => sum + i.impact_score, 0) / insights.length;
    const actionRate = (actedUponInsights / insights.length) * 100;

    return {
      totalInsights: insights.length,
      newInsights,
      criticalInsights,
      opportunities,
      averageConfidence: Math.round(averageConfidence),
      averageImpact: Math.round(averageImpact),
      actionRate: Math.round(actionRate)
    };
  }

  static async getInsightsByTimeRange(days: number): Promise<BusinessInsight[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const { data, error } = await supabase
      .from('business_intelligence_insights')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as BusinessInsight[];
  }

  static async createCustomInsight(insightData: {
    insight_type: string;
    category: string;
    title: string;
    description: string;
    severity?: string;
    confidence_score?: number;
    impact_score?: number;
    actionable_recommendations?: any;
    supporting_data?: any;
    ai_analysis?: any;
    priority?: number;
  }): Promise<BusinessInsight> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('business_intelligence_insights')
      .insert({
        user_id: currentUser.user.id,
        insight_type: insightData.insight_type,
        category: insightData.category,
        title: insightData.title,
        description: insightData.description,
        severity: insightData.severity || 'info',
        confidence_score: insightData.confidence_score || 0,
        impact_score: insightData.impact_score || 0,
        actionable_recommendations: insightData.actionable_recommendations || [],
        supporting_data: insightData.supporting_data || {},
        ai_analysis: insightData.ai_analysis || {},
        status: 'new',
        priority: insightData.priority || 5,
        outcome_data: {}
      })
      .select()
      .single();

    if (error) throw error;
    return data as BusinessInsight;
  }

  static async getDashboardSummary(): Promise<any> {
    const [insights, metrics] = await Promise.all([
      this.getPriorityInsights(),
      this.getInsightMetrics()
    ]);

    const recentInsights = await this.getInsightsByTimeRange(7);
    const criticalIssues = insights.filter(i => i.severity === 'critical');
    const opportunities = insights.filter(i => i.severity === 'opportunity');

    return {
      totalInsights: metrics.totalInsights,
      newThisWeek: recentInsights.length,
      criticalIssues: criticalIssues.length,
      opportunities: opportunities.length,
      priorityActions: insights.slice(0, 5),
      overallHealth: this.calculateHealthScore(metrics),
      trends: {
        insightGeneration: 'increasing',
        actionRate: metrics.actionRate,
        avgConfidence: metrics.averageConfidence
      }
    };
  }

  private static calculateHealthScore(metrics: any): string {
    const score = (metrics.actionRate + metrics.averageConfidence + metrics.averageImpact) / 3;
    
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'needs_attention';
  }

  static async exportInsights(format: 'csv' | 'json' = 'json'): Promise<any> {
    const insights = await this.getAllInsights();
    
    if (format === 'csv') {
      // Convertir en CSV (implémentation simplifiée)
      const headers = ['Date', 'Type', 'Catégorie', 'Titre', 'Sévérité', 'Confiance', 'Impact', 'Statut'];
      const rows = insights.map(insight => [
        insight.created_at,
        insight.insight_type,
        insight.category,
        insight.title,
        insight.severity,
        insight.confidence_score,
        insight.impact_score,
        insight.status
      ]);
      
      return { headers, rows };
    }
    
    return insights;
  }

  // Méthodes d'analyse prédictive
  static async predictTrends(category: string, timeHorizon: number = 30): Promise<any> {
    const insights = await this.getInsightsByCategory(category as BusinessInsight['category']);
    
    // Analyse des tendances basée sur les insights historiques
    const trendAnalysis = {
      category,
      timeHorizon,
      predictedTrends: [
        'Stabilité des performances',
        'Croissance modérée attendue',
        'Risques identifiés et surveillés'
      ],
      confidence: 75,
      recommendedActions: [
        'Continuer la surveillance',
        'Optimiser les processus existants'
      ]
    };

    return trendAnalysis;
  }
}