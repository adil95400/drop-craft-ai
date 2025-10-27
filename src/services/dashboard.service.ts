import { supabase } from '@/integrations/supabase/client';
import { ProductsService } from './products.service';
import { OrdersService } from './orders.service';
import { CustomersService } from './customers.service';

export class DashboardService {
  /**
   * Récupère toutes les statistiques du dashboard
   */
  static async getDashboardStats(userId: string) {
    try {
      // Récupérer les stats en parallèle
      const [productStats, orderStats, customerStats] = await Promise.all([
        ProductsService.getProductStats(userId),
        OrdersService.getOrderStats(userId),
        CustomersService.getCustomerStats(userId)
      ]);

      // Calculer les KPIs
      const conversionRate = customerStats.total > 0
        ? (orderStats.total / customerStats.total) * 100
        : 0;

      const stats = {
        products: productStats,
        orders: orderStats,
        customers: customerStats,
        kpis: {
          conversionRate,
          avgBasket: orderStats.avgOrderValue,
          customerLifetimeValue: customerStats.avgLifetimeValue,
          revenueGrowth: orderStats.revenueGrowth,
          ordersGrowth: orderStats.ordersGrowth,
          customerGrowth: customerStats.customerGrowth
        }
      };

      return stats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Récupère les données pour les graphiques
   */
  static async getChartData(userId: string, period: 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        break;
    }

    // Récupérer les commandes de la période
    const { data: orders, error } = await supabase
      .from('orders')
      .select('total_amount, created_at, status')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Grouper par jour/mois selon la période
    const groupedData: { [key: string]: { revenue: number; orders: number } } = {};

    orders.forEach(order => {
      const date = new Date(order.created_at);
      let key: string;

      if (period === 'week') {
        key = date.toLocaleDateString('fr-FR', { weekday: 'short' });
      } else if (period === 'month') {
        key = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      } else {
        key = date.toLocaleDateString('fr-FR', { month: 'short' });
      }

      if (!groupedData[key]) {
        groupedData[key] = { revenue: 0, orders: 0 };
      }

      if (order.status === 'delivered' || order.status === 'completed') {
        groupedData[key].revenue += order.total_amount || 0;
      }
      groupedData[key].orders += 1;
    });

    return Object.entries(groupedData).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders
    }));
  }

  /**
   * Récupère les alertes et notifications
   */
  static async getAlerts(userId: string) {
    const alerts = [];

    // Vérifier les stocks faibles
    const { data: lowStockProducts } = await supabase
      .from('imported_products')
      .select('name, stock_quantity')
      .eq('user_id', userId)
      .lt('stock_quantity', 10)
      .gt('stock_quantity', 0);

    if (lowStockProducts && lowStockProducts.length > 0) {
      alerts.push({
        type: 'warning',
        title: 'Stock faible',
        message: `${lowStockProducts.length} produit(s) ont un stock inférieur à 10`,
        action: '/products'
      });
    }

    // Vérifier les commandes en attente
    const { data: pendingOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (pendingOrders && pendingOrders.length > 5) {
      alerts.push({
        type: 'info',
        title: 'Commandes en attente',
        message: `${pendingOrders.length} commande(s) nécessitent votre attention`,
        action: '/orders?status=pending'
      });
    }

    // Vérifier les produits non optimisés
    const { data: unoptimizedProducts } = await supabase
      .from('imported_products')
      .select('id')
      .eq('user_id', userId)
      .eq('ai_optimized', false)
      .eq('status', 'published');

    if (unoptimizedProducts && unoptimizedProducts.length > 0) {
      alerts.push({
        type: 'info',
        title: 'Optimisation AI disponible',
        message: `${unoptimizedProducts.length} produit(s) peuvent être optimisés par l'IA`,
        action: '/products?filter=unoptimized'
      });
    }

    return alerts;
  }

  /**
   * Récupère les activités récentes
   */
  static async getRecentActivities(userId: string, limit: number = 10) {
    // Récupérer les dernières commandes
    const { data: recentOrders } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total_amount,
        status,
        created_at,
        customer:customers(name, email)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Récupérer les derniers produits ajoutés
    const { data: recentProducts } = await supabase
      .from('imported_products')
      .select('id, name, price, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    const activities = [
      ...(recentOrders || []).map(order => ({
        type: 'order' as const,
        id: order.id,
        title: `Nouvelle commande ${order.order_number}`,
        description: `${order.total_amount}€ - ${order.status}`,
        date: order.created_at,
        metadata: order
      })),
      ...(recentProducts || []).map(product => ({
        type: 'product' as const,
        id: product.id,
        title: `Produit ajouté: ${product.name}`,
        description: `Prix: ${product.price}€`,
        date: product.created_at,
        metadata: product
      }))
    ];

    // Trier par date
    return activities.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, limit);
  }

  /**
   * Récupère les produits les plus vendus
   */
  static async getTopProducts(userId: string, limit: number = 5) {
    // Retourner un tableau vide pour l'instant - sera implémenté avec les données réelles
    return [];
  }
}
