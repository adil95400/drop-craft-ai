import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/utils/logger'

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

    // Fetch real data from database
    const { data: orders } = await supabase.from('orders').select('*').eq('user_id', currentUser.user.id);
    const { data: customers } = await supabase.from('customers').select('*').eq('user_id', currentUser.user.id);
    const { getProductList } = await import('@/services/api/productHelpers')
    const products = await getProductList(500) as any[]

    const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0;
    const totalOrders = orders?.length || 0;
    const totalProducts = products?.length || 0;
    const totalCustomers = customers?.length || 0;
    const conversionRate = totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0;

    const report: BusinessIntelligenceReport = {
      summary: {
        executiveSummary: totalOrders > 0 
          ? `Votre commerce électronique a enregistré ${totalOrders} commandes pour un chiffre d'affaires de ${totalRevenue.toFixed(2)}€.`
          : "Aucune donnée de vente disponible pour le moment.",
        keyPoints: [
          `${totalOrders} commandes enregistrées`,
          `${totalCustomers} clients actifs`,
          `${totalProducts} produits au catalogue`,
          `Taux de conversion: ${conversionRate.toFixed(1)}%`
        ],
        priorityRecommendations: [
          totalProducts === 0 ? "Ajoutez des produits à votre catalogue" : "Optimisez vos fiches produits",
          totalCustomers === 0 ? "Lancez une campagne d'acquisition client" : "Fidélisez vos clients existants",
          "Analysez vos performances de vente"
        ],
        nextSteps: [
          "Consulter le tableau de bord analytique détaillé",
          "Configurer des objectifs de vente",
          "Automatiser le suivi des performances"
        ]
      },
      businessMetrics: {
        revenue: totalRevenue,
        orders: totalOrders,
        customers: totalCustomers,
        products: totalProducts,
        conversionRate,
        growth: 0
      },
      lastAnalysis: new Date().toISOString()
    };

    return report;
  }

  static async getPriorityInsights(): Promise<BusinessInsight[]> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error('Not authenticated');

    // Fetch real data to generate insights
    const { getProductList } = await import('@/services/api/productHelpers')
    const { data: orders } = await supabase.from('orders').select('*').eq('user_id', currentUser.user.id);
    const products = await getProductList(500) as any[];
    const { data: customers } = await supabase.from('customers').select('*').eq('user_id', currentUser.user.id);

    const insights: BusinessInsight[] = [];

    // Insight: Low stock products
    const lowStockProducts = products?.filter(p => (p.stock_quantity || 0) < 10) || [];
    if (lowStockProducts.length > 0) {
      insights.push({
        id: '1',
        type: 'warning',
        insight_type: 'risk',
        title: 'Stock faible détecté',
        description: `${lowStockProducts.length} produits ont un stock inférieur à 10 unités`,
        impact: 'high',
        severity: 'warning',
        category: 'inventory',
        actionable: true,
        recommendation: 'Réapprovisionner ces produits rapidement pour éviter les ruptures de stock',
        actionable_recommendations: [
          'Contacter vos fournisseurs',
          'Configurer des alertes de stock automatiques',
          'Analyser les délais de livraison'
        ],
        confidence_score: 95,
        impact_score: 88,
        createdAt: new Date().toISOString(),
        isAcknowledged: false,
        isDismissed: false
      });
    }

    // Insight: New customers
    const recentCustomers = customers?.filter(c => {
      const createdDate = new Date(c.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdDate > weekAgo;
    }) || [];

    if (recentCustomers.length > 0) {
      insights.push({
        id: '2',
        type: 'success',
        insight_type: 'trend',
        title: 'Nouveaux clients cette semaine',
        description: `${recentCustomers.length} nouveaux clients se sont inscrits`,
        impact: 'medium',
        severity: 'opportunity',
        category: 'customer',
        actionable: true,
        recommendation: 'Contactez ces nouveaux clients pour améliorer leur expérience',
        actionable_recommendations: [
          'Envoyer un email de bienvenue personnalisé',
          'Offrir un code promo pour leur première commande',
          'Collecter des retours sur leur expérience'
        ],
        confidence_score: 90,
        impact_score: 75,
        createdAt: new Date().toISOString(),
        isAcknowledged: false,
        isDismissed: false
      });
    }

    // Insight: Revenue opportunity
    const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0;
    if (totalRevenue > 1000) {
      insights.push({
        id: '3',
        type: 'opportunity',
        insight_type: 'opportunity',
        title: 'Performance de vente positive',
        description: `Votre chiffre d'affaires atteint ${totalRevenue.toFixed(2)}€`,
        impact: 'high',
        severity: 'opportunity',
        category: 'sales',
        actionable: true,
        recommendation: 'Capitalisez sur cette dynamique en lançant une campagne marketing',
        actionable_recommendations: [
          'Analyser les produits les plus vendus',
          'Optimiser vos campagnes publicitaires',
          'Développer des offres groupées'
        ],
        confidence_score: 85,
        impact_score: 92,
        createdAt: new Date().toISOString(),
        isAcknowledged: false,
        isDismissed: false
      });
    }

    return insights;
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
    const { error } = await supabase
      .from('analytics_insights')
      .update({ metadata: { acknowledged: true, acknowledged_at: new Date().toISOString() } })
      .eq('id', insightId)
    if (error) logger.warn('Failed to acknowledge insight', { component: 'BI', metadata: { insightId, error: error.message } })
  }

  static async dismissInsight(insightId: string): Promise<void> {
    const { error } = await supabase
      .from('analytics_insights')
      .update({ metadata: { dismissed: true, dismissed_at: new Date().toISOString() } })
      .eq('id', insightId)
    if (error) logger.warn('Failed to dismiss insight', { component: 'BI', metadata: { insightId, error: error.message } })
  }
}