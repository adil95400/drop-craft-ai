/**
 * Service d'analytics produit - Données réelles depuis Supabase
 * Remplace toutes les données mock par des requêtes réelles
 */

import { supabase } from '@/integrations/supabase/client';
import { fromTable } from '@/integrations/supabase/typedClient';

export interface ProductMetrics {
  // Ventes
  sales7d: number;
  sales30d: number;
  sales90d: number;
  sales12m: number;
  
  // Vues
  views7d: number;
  views30d: number;
  viewsTotal: number;
  
  // Conversions
  addToCart: number;
  cartRate: number;
  conversionRate: number;
  
  // Revenus
  revenue7d: number;
  revenue30d: number;
  revenue90d: number;
  revenue12m: number;
  
  // Marges
  avgMargin: number;
  totalProfit: number;
  
  // Retours
  returnRate: number;
  returnCount: number;
  
  // Tendances
  weekOverWeek: number; // % changement semaine/semaine
  monthOverMonth: number; // % changement mois/mois
  
  // Données temporelles pour graphiques
  dailyData: Array<{
    date: string;
    sales: number;
    revenue: number;
    views: number;
    conversions: number;
  }>;
  
  // Reviews
  avgRating: number;
  reviewsCount: number;
  reviews: Array<{
    id: string;
    author: string;
    rating: number;
    comment: string;
    date: string;
  }>;
}

export class ProductAnalyticsService {
  /**
   * Récupère toutes les métriques d'un produit
   */
  static async getProductMetrics(
    productId: string, 
    userId: string,
    storeId?: string
  ): Promise<ProductMetrics> {
    // Récupérer les données de ventes
    const salesData = await this.getSalesData(productId, userId, storeId);
    
    // Récupérer les données de vues
    const viewsData = await this.getViewsData(productId, userId);
    
    // Récupérer les reviews
    const reviews = await this.getReviews(productId);
    
    // Calculer les métriques
    const now = new Date();
    const date7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const date30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const date90d = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const date12m = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    
    const sales7d = salesData.filter(s => new Date(s.date) >= date7d).reduce((sum, s) => sum + s.quantity, 0);
    const sales30d = salesData.filter(s => new Date(s.date) >= date30d).reduce((sum, s) => sum + s.quantity, 0);
    const sales90d = salesData.filter(s => new Date(s.date) >= date90d).reduce((sum, s) => sum + s.quantity, 0);
    const sales12m = salesData.reduce((sum, s) => sum + s.quantity, 0);
    
    const revenue7d = salesData.filter(s => new Date(s.date) >= date7d).reduce((sum, s) => sum + s.revenue, 0);
    const revenue30d = salesData.filter(s => new Date(s.date) >= date30d).reduce((sum, s) => sum + s.revenue, 0);
    const revenue90d = salesData.filter(s => new Date(s.date) >= date90d).reduce((sum, s) => sum + s.revenue, 0);
    const revenue12m = salesData.reduce((sum, s) => sum + s.revenue, 0);
    
    const views7d = viewsData.filter(v => new Date(v.date) >= date7d).reduce((sum, v) => sum + v.count, 0);
    const views30d = viewsData.filter(v => new Date(v.date) >= date30d).reduce((sum, v) => sum + v.count, 0);
    const viewsTotal = viewsData.reduce((sum, v) => sum + v.count, 0);
    
    // Taux de conversion (ventes / vues * 100)
    const conversionRate = views30d > 0 ? (sales30d / views30d) * 100 : 0;
    
    // Calculer les données journalières pour les graphiques (30 derniers jours)
    const dailyData = this.aggregateDailyData(salesData, viewsData, date30d);
    
    // Tendances (comparaison période actuelle vs période précédente)
    const previousWeekSales = salesData.filter(s => {
      const saleDate = new Date(s.date);
      return saleDate < date7d && saleDate >= new Date(date7d.getTime() - 7 * 24 * 60 * 60 * 1000);
    }).reduce((sum, s) => sum + s.quantity, 0);
    
    const weekOverWeek = previousWeekSales > 0 
      ? ((sales7d - previousWeekSales) / previousWeekSales) * 100 
      : 0;
    
    const previousMonthSales = salesData.filter(s => {
      const saleDate = new Date(s.date);
      return saleDate < date30d && saleDate >= new Date(date30d.getTime() - 30 * 24 * 60 * 60 * 1000);
    }).reduce((sum, s) => sum + s.quantity, 0);
    
    const monthOverMonth = previousMonthSales > 0 
      ? ((sales30d - previousMonthSales) / previousMonthSales) * 100 
      : 0;
    
    // Fetch product cost_price for real margin
    const { data: productData } = await supabase
      .from('products')
      .select('cost_price, price')
      .eq('id', productId)
      .single();
    
    const costPrice = productData?.cost_price || 0;
    const sellingPrice = productData?.price || 0;
    const realMargin = sellingPrice > 0 && costPrice > 0
      ? Math.round(((sellingPrice - costPrice) / sellingPrice) * 100)
      : 0;

    // Fetch return data from returns table
    const { data: returnsData } = await supabase
      .from('returns')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', date12m.toISOString());
    
    const returnCount = returnsData?.length || 0;
    const returnRate = sales12m > 0 ? Math.round((returnCount / sales12m) * 100 * 10) / 10 : 0;

    // Add-to-cart estimation from views with better ratio
    const addToCart = views30d > 0 ? Math.round(views30d * (conversionRate / 100) * 2) : 0;
    const cartRate = views30d > 0 ? Math.round((addToCart / views30d) * 100) : 0;
    
    return {
      sales7d,
      sales30d,
      sales90d,
      sales12m,
      views7d,
      views30d,
      viewsTotal,
      addToCart,
      cartRate,
      conversionRate,
      revenue7d,
      revenue30d,
      revenue90d,
      revenue12m,
      avgMargin: realMargin,
      totalProfit: realMargin > 0 ? revenue12m * (realMargin / 100) : 0,
      returnRate,
      returnCount,
      weekOverWeek,
      monthOverMonth,
      dailyData,
      avgRating: reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0,
      reviewsCount: reviews.length,
      reviews
    };
  }
  
  /**
   * Récupère les données de ventes depuis order_items
   */
  private static async getSalesData(
    productId: string, 
    userId: string,
    storeId?: string
  ): Promise<Array<{ date: string; quantity: number; revenue: number }>> {
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        quantity,
        price,
        orders!inner(
          user_id,
          created_at,
          status
        )
      `)
      .eq('product_id', productId)
      .eq('orders.user_id', userId)
      .in('orders.status', ['completed', 'processing', 'shipped'])
      .gte('orders.created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order('orders.created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching sales data:', error);
      return [];
    }
    
    return (data || []).map((item: any) => ({
      date: item.orders.created_at,
      quantity: item.quantity,
      revenue: item.quantity * item.price
    }));
  }
  
  /**
   * Récupère les données de vues depuis product_views
   */
  private static async getViewsData(
    productId: string,
    userId: string
  ): Promise<Array<{ date: string; count: number }>> {
    try {
      const { data, error } = await fromTable('product_views')
        .select('viewed_at')
        .eq('product_id', productId)
        .gte('viewed_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('viewed_at', { ascending: false });
      
      if (error) throw error;
      
      // Agréger par jour
      const viewsByDate: Record<string, number> = {};
      (data || []).forEach((view: any) => {
        const date = view.viewed_at.split('T')[0];
        viewsByDate[date] = (viewsByDate[date] || 0) + 1;
      });
      
      return Object.entries(viewsByDate).map(([date, count]) => ({ date, count }));
    } catch (error) {
      console.error('Error fetching views data:', error);
      // Si la table n'existe pas encore, retourner des données vides
      return [];
    }
  }
  
  /**
   * Récupère les reviews du produit
   */
  private static async getReviews(productId: string): Promise<Array<{
    id: string;
    author: string;
    rating: number;
    comment: string;
    date: string;
  }>> {
    try {
      const { data, error } = await fromTable('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      return (data || []).map((review: any) => ({
        id: review.id,
        author: review.customer_name || 'Client anonyme',
        rating: review.rating,
        comment: review.comment || '',
        date: review.created_at
      }));
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  }
  
  /**
   * Agrège les données par jour pour les graphiques
   */
  private static aggregateDailyData(
    salesData: Array<{ date: string; quantity: number; revenue: number }>,
    viewsData: Array<{ date: string; count: number }>,
    startDate: Date
  ): Array<{
    date: string;
    sales: number;
    revenue: number;
    views: number;
    conversions: number;
  }> {
    const dailyMap: Record<string, any> = {};
    
    // Initialiser les 30 derniers jours
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyMap[dateStr] = {
        date: dateStr,
        sales: 0,
        revenue: 0,
        views: 0,
        conversions: 0
      };
    }
    
    // Ajouter les ventes
    salesData.forEach(sale => {
      const dateStr = sale.date.split('T')[0];
      if (dailyMap[dateStr]) {
        dailyMap[dateStr].sales += sale.quantity;
        dailyMap[dateStr].revenue += sale.revenue;
      }
    });
    
    // Ajouter les vues
    viewsData.forEach(view => {
      const dateStr = view.date.split('T')[0];
      if (dailyMap[dateStr]) {
        dailyMap[dateStr].views += view.count;
      }
    });
    
    // Calculer les conversions
    Object.values(dailyMap).forEach((day: any) => {
      day.conversions = day.views > 0 ? (day.sales / day.views) * 100 : 0;
    });
    
    return Object.values(dailyMap).sort((a: any, b: any) => 
      a.date.localeCompare(b.date)
    );
  }
}
