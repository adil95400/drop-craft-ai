import { supabase } from '@/integrations/supabase/client'

export interface BusinessInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'info' | 'success';
  insight_type: 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'prediction';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  severity: 'critical' | 'warning' | 'opportunity' | 'info';
  category: 'revenue' | 'customers' | 'products' | 'orders' | 'performance' | 'sales' | 'inventory' | 'marketing' | 'customer' | 'financial';
  actionable: boolean;
  recommendation?: string;
  actionable_recommendations?: string[];
  confidence_score: number;
  impact_score: number;
  data?: any;
  createdAt: string;
  isAcknowledged: boolean;
  isDismissed: boolean;
}

export interface InsightMetrics {
  totalInsights: number;
  newInsights: number;
  highPriorityInsights: number;
  acknowledgedInsights: number;
  criticalInsights: number;
  opportunities: number;
  actionRate: number;
  categoryBreakdown: Record<string, number>;
}

export interface BusinessIntelligenceReport {
  summary: {
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

    // Mock implementation for now - in a real app this would call an AI service
    const mockReport: BusinessIntelligenceReport = {
      summary: {
        executiveSummary: "Votre commerce électronique montre des tendances positives avec une croissance de 12.5% ce mois-ci.",
        keyPoints: [
          "Augmentation des ventes de 12.5% par rapport au mois dernier",
          "Taux de conversion en amélioration (3.2%)",
          "5 nouveaux clients cette semaine",
          "Stock faible sur 3 produits populaires"
        ],
        priorityRecommendations: [
          "Réapprovisionner les produits en rupture de stock",
          "Optimiser les campagnes marketing pour les produits performants",
          "Analyser les abandons de panier pour améliorer le tunnel de conversion"
        ],
        nextSteps: [
          "Contacter les fournisseurs pour réapprovisionnement",
          "Configurer des alertes de stock automatiques",
          "Planifier une campagne email pour les clients inactifs"
        ]
      },
      businessMetrics: {
        revenue: 15420,
        orders: 89,
        customers: 234,
        products: 1247,
        conversionRate: 3.2,
        growth: 12.5
      },
      lastAnalysis: new Date().toISOString()
    };

    return mockReport;
  }

  static async getPriorityInsights(): Promise<BusinessInsight[]> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error('Not authenticated');

    // Mock implementation - in a real app this would fetch from database
    const mockInsights: BusinessInsight[] = [
      {
        id: '1',
        type: 'opportunity',
        insight_type: 'opportunity',
        title: 'Opportunité de croissance détectée',
        description: 'Vos ventes de produits électroniques ont augmenté de 35% cette semaine',
        impact: 'high',
        severity: 'opportunity',
        category: 'sales',
        actionable: true,
        recommendation: 'Augmentez votre stock de produits électroniques et lancez une campagne marketing ciblée',
        actionable_recommendations: [
          'Augmentez votre stock de produits électroniques',
          'Lancez une campagne marketing ciblée',
          'Analysez les tendances de vente pour optimiser l\'offre'
        ],
        confidence_score: 85,
        impact_score: 92,
        createdAt: new Date().toISOString(),
        isAcknowledged: false,
        isDismissed: false
      },
      {
        id: '2',
        type: 'warning',
        insight_type: 'risk',
        title: 'Stock faible détecté',
        description: '3 produits populaires sont bientôt en rupture de stock',
        impact: 'high',
        severity: 'critical',
        category: 'inventory',
        actionable: true,
        recommendation: 'Contactez vos fournisseurs pour réapprovisionner ces produits rapidement',
        actionable_recommendations: [
          'Contactez vos fournisseurs immédiatement',
          'Configurez des alertes de stock automatiques',
          'Identifiez des fournisseurs alternatifs'
        ],
        confidence_score: 95,
        impact_score: 88,
        createdAt: new Date().toISOString(),
        isAcknowledged: false,
        isDismissed: false
      },
      {
        id: '3',
        type: 'success',
        insight_type: 'trend',
        title: 'Amélioration du taux de conversion',
        description: 'Votre taux de conversion a augmenté de 0.5% ce mois-ci',
        impact: 'medium',
        severity: 'info',
        category: 'marketing',
        actionable: false,
        confidence_score: 78,
        impact_score: 65,
        createdAt: new Date().toISOString(),
        isAcknowledged: false,
        isDismissed: false
      }
    ];

    return mockInsights;
  }

  static async getInsightMetrics(): Promise<InsightMetrics> {
    const insights = await this.getPriorityInsights();
    
    const metrics: InsightMetrics = {
      totalInsights: insights.length,
      newInsights: insights.filter(i => !i.isAcknowledged && !i.isDismissed).length,
      highPriorityInsights: insights.filter(i => i.impact === 'high').length,
      acknowledgedInsights: insights.filter(i => i.isAcknowledged).length,
      criticalInsights: insights.filter(i => i.severity === 'critical').length,
      opportunities: insights.filter(i => i.severity === 'opportunity').length,
      actionRate: Math.round((insights.filter(i => i.isAcknowledged).length / insights.length) * 100) || 0,
      categoryBreakdown: insights.reduce((acc, insight) => {
        acc[insight.category] = (acc[insight.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return metrics;
  }

  static async acknowledgeInsight(insightId: string): Promise<void> {
    // Mock implementation - in a real app this would update the database
    console.log(`Acknowledging insight ${insightId}`);
  }

  static async dismissInsight(insightId: string): Promise<void> {
    // Mock implementation - in a real app this would update the database
    console.log(`Dismissing insight ${insightId}`);
  }
}