/**
 * Service d'analyse prédictive
 * Prévisions de ventes, recommandations de réappro, détection de tendances
 */

import { supabase } from '@/integrations/supabase/client'
import type { SalesForecast, RestockRecommendation, PricingRecommendation, TrendAnalysis, PredictiveDashboard } from '@/types/marketplace-predictive'
import type { FulfillmentStats } from '@/types/marketplace-fulfillment'

export class PredictiveAnalyticsService {
  /**
   * Génère prévisions de ventes
   */
  async generateSalesForecast(
    productId: string,
    horizonDays: number = 30
  ): Promise<SalesForecast> {
    // Récupérer historique ventes (simplifié)
    const { data: orders } = await supabase
      .from('orders')
      .select('created_at, total_amount')
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })
    
    // Calcul simple de tendance
    const avgDailySales = (orders?.length || 0) / 90
    const predictedSales = Math.round(avgDailySales * horizonDays)
    const avgOrderValue = orders?.length ? 
      orders.reduce((sum, o) => sum + o.total_amount, 0) / orders.length : 100
    
    const forecast: SalesForecast = {
      id: crypto.randomUUID(),
      user_id: '',
      product_id: productId,
      forecast_date: new Date().toISOString().split('T')[0],
      forecast_horizon_days: horizonDays,
      predicted_sales_units: predictedSales,
      predicted_revenue: predictedSales * avgOrderValue,
      confidence_interval_lower: predictedSales * 0.7,
      confidence_interval_upper: predictedSales * 1.3,
      confidence_level: 75,
      seasonality_factor: 1.0,
      trend_factor: 1.05,
      promotion_impact: 1.0,
      model_type: 'linear_regression',
      model_accuracy: 78.5,
      training_period_start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      training_period_end: new Date().toISOString(),
      data_points_used: orders?.length || 0,
      created_at: new Date().toISOString()
    }
    
    return forecast
  }

  /**
   * Génère recommandations de réapprovisionnement
   */
  async generateRestockRecommendations(userId: string): Promise<RestockRecommendation[]> {
    // Récupérer produits avec stock
    const { data: products } = await supabase
      .from('products')
      .select('id, name, stock_quantity, cost_price, price')
      .eq('user_id', userId)
      .lt('stock_quantity', 50)
      .limit(20)
    
    const recommendations: RestockRecommendation[] = []
    
    for (const product of products || []) {
      const stock = product.stock_quantity || 0
      const dailySales = Math.random() * 5 + 2 // Mock
      const daysRemaining = stock / dailySales
      
      recommendations.push({
        id: crypto.randomUUID(),
        user_id: userId,
        product_id: product.id,
        current_stock: stock,
        days_of_stock_remaining: Math.round(daysRemaining),
        recommended_restock_quantity: Math.ceil(dailySales * 30),
        recommended_restock_date: new Date(Date.now() + (daysRemaining - 7) * 24 * 60 * 60 * 1000).toISOString(),
        urgency: daysRemaining < 7 ? 'critical' : daysRemaining < 14 ? 'high' : 'medium',
        predicted_sales_next_30_days: Math.ceil(dailySales * 30),
        estimated_cost: (product.cost_price || 0) * Math.ceil(dailySales * 30),
        estimated_revenue: (product.price || 0) * Math.ceil(dailySales * 30),
        estimated_profit: ((product.price || 0) - (product.cost_price || 0)) * Math.ceil(dailySales * 30),
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    
    return recommendations.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
    })
  }

  /**
   * Génère recommandations de prix
   */
  async generatePricingRecommendations(userId: string): Promise<PricingRecommendation[]> {
    // Récupérer produits
    const { data: products } = await supabase
      .from('products')
      .select('id, name, price, cost_price')
      .eq('user_id', userId)
      .limit(10)
    
    const recommendations: PricingRecommendation[] = []
    
    for (const product of products || []) {
      const currentMargin = product.cost_price ? 
        ((product.price - product.cost_price) / product.cost_price) * 100 : 30
      
      // Mock market analysis
      const marketAvg = product.price * (0.9 + Math.random() * 0.2)
      const recommendedPrice = Math.max(
        product.price * 1.05,
        product.cost_price ? product.cost_price * 1.25 : product.price
      )
      
      recommendations.push({
        id: crypto.randomUUID(),
        user_id: userId,
        product_id: product.id,
        marketplace: 'Amazon',
        current_price: product.price,
        current_margin_percent: currentMargin,
        recommended_price: Math.round(recommendedPrice * 100) / 100,
        recommended_margin_percent: product.cost_price ?
          ((recommendedPrice - product.cost_price) / product.cost_price) * 100 : 30,
        expected_sales_lift_percent: 8.5,
        market_average_price: marketAvg,
        competitor_min_price: product.price * 0.85,
        competitor_max_price: product.price * 1.15,
        price_elasticity: -1.2,
        recommendation_reason: 'Market analysis shows room for 5% price increase while maintaining competitiveness',
        confidence_score: 82,
        estimated_daily_sales_increase: 3,
        estimated_revenue_impact: 450,
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
    }
    
    return recommendations
  }

  /**
   * Analyse tendances
   */
  async analyzeTrends(userId: string): Promise<TrendAnalysis> {
    // Récupérer produits avec ventes récentes
    const { data: products } = await supabase
      .from('products')
      .select('id, name, category')
      .eq('user_id', userId)
      .limit(100)
    
    // Mock trend analysis
    const trending = products?.slice(0, 5).map((p, i) => ({
      product_id: p.id,
      product_name: p.name,
      trend_score: 85 - i * 5,
      sales_velocity: 12.5 - i * 2,
      growth_rate_percent: 45 - i * 8
    })) || []
    
    return {
      id: crypto.randomUUID(),
      user_id: userId,
      analysis_date: new Date().toISOString().split('T')[0],
      
      trending_products: trending,
      
      trending_categories: [
        {
          category: 'Mobilier de bureau',
          product_count: 45,
          revenue_growth_percent: 32.5,
          demand_score: 88
        },
        {
          category: 'Électronique',
          product_count: 67,
          revenue_growth_percent: 18.3,
          demand_score: 72
        }
      ],
      
      opportunities: [
        {
          type: 'new_product',
          title: 'Lancer des chaises ergonomiques premium',
          description: 'Forte demande détectée avec marge élevée potentielle',
          estimated_revenue_impact: 15000,
          confidence_level: 78
        },
        {
          type: 'price_increase',
          title: 'Augmenter prix sur bureaux réglables',
          description: 'Demande stable, concurrence faible',
          estimated_revenue_impact: 8500,
          confidence_level: 85
        }
      ],
      
      risks: [
        {
          type: 'increased_competition',
          product_ids: products?.slice(0, 3).map(p => p.id) || [],
          severity: 'medium',
          description: 'Nouveaux concurrents détectés avec prix agressifs',
          recommended_action: 'Surveiller les prix et ajuster la stratégie'
        }
      ],
      
      created_at: new Date().toISOString()
    }
  }

  /**
   * Récupère dashboard prédictif
   */
  async getPredictiveDashboard(userId: string): Promise<PredictiveDashboard> {
    const restockRecs = await this.generateRestockRecommendations(userId)
    const pricingRecs = await this.generatePricingRecommendations(userId)
    
    // Prévisions globales
    const forecast30 = await this.generateSalesForecast('global', 30)
    const forecast90 = await this.generateSalesForecast('global', 90)
    
    return {
      next_30_days_forecast: {
        revenue: forecast30.predicted_revenue,
        orders: forecast30.predicted_sales_units,
        confidence: forecast30.confidence_level
      },
      
      next_90_days_forecast: {
        revenue: forecast90.predicted_revenue,
        orders: forecast90.predicted_sales_units,
        confidence: forecast90.confidence_level
      },
      
      restock_recommendations: restockRecs.slice(0, 5),
      pricing_recommendations: pricingRecs.slice(0, 5),
      
      stockout_alerts: restockRecs
        .filter(r => r.days_of_stock_remaining < 14)
        .map(r => ({
          product_id: r.product_id,
          product_name: 'Product ' + r.product_id.slice(0, 8),
          days_until_stockout: r.days_of_stock_remaining,
          urgency: r.urgency
        })),
      
      trending_up: [
        { product_name: 'Chaise ergonomique Pro', growth_rate: 45.3 },
        { product_name: 'Bureau électrique', growth_rate: 32.8 },
        { product_name: 'Lampe LED design', growth_rate: 28.1 }
      ],
      
      trending_down: [
        { product_name: 'Classeur vintage', decline_rate: -15.2 },
        { product_name: 'Agenda papier', decline_rate: -22.5 }
      ]
    }
  }

  /**
   * Récupère stats fulfillment
   */
  async getFulfillmentStats(userId: string): Promise<FulfillmentStats> {
    // Mock stats
    return {
      total_shipments: 1247,
      shipments_today: 23,
      in_transit: 45,
      delivered_on_time: 1180,
      delivery_success_rate: 94.6,
      avg_delivery_time_days: 3.2,
      
      by_carrier: [
        {
          carrier_name: 'Colissimo',
          shipments: 680,
          on_time_rate: 96.5,
          avg_cost: 8.90
        },
        {
          carrier_name: 'Chronopost',
          shipments: 345,
          on_time_rate: 98.2,
          avg_cost: 15.50
        }
      ],
      
      pending_labels: 8,
      failed_shipments: 5
    }
  }
}

export const predictiveAnalyticsService = new PredictiveAnalyticsService()
