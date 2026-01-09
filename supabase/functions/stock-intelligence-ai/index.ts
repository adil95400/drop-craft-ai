import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Product {
  id: string;
  title: string;
  sku: string;
  stock_quantity: number;
  price: number;
  cost_price?: number;
  category?: string;
}

interface SalesData {
  product_id: string;
  quantity: number;
  date: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action } = await req.json();

    if (action === 'generate-predictions') {
      // Fetch products
      const { data: products } = await supabase
        .from('products')
        .select('id, title, sku, stock_quantity, price, cost_price, category')
        .eq('user_id', user.id)
        .limit(50);

      if (!products || products.length === 0) {
        return new Response(JSON.stringify({ 
          success: true, 
          predictions: [],
          suggestions: [],
          alerts: [],
          message: 'Aucun produit trouvé'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch recent orders for sales velocity calculation
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity, created_at')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Calculate sales velocity per product
      const salesByProduct = new Map<string, number>();
      (orderItems || []).forEach((item: any) => {
        const current = salesByProduct.get(item.product_id) || 0;
        salesByProduct.set(item.product_id, current + (item.quantity || 1));
      });

      // Generate AI-powered predictions
      const predictions = [];
      const suggestions = [];
      const alerts = [];

      for (const product of products as Product[]) {
        const totalSales = salesByProduct.get(product.id) || 0;
        const dailyVelocity = totalSales / 30;
        
        // Calculate days until stockout
        const daysUntilStockout = dailyVelocity > 0 
          ? Math.floor(product.stock_quantity / dailyVelocity)
          : null;

        // Determine urgency based on stock levels and velocity
        let urgency = 'low';
        if (product.stock_quantity === 0) {
          urgency = 'critical';
        } else if (daysUntilStockout !== null && daysUntilStockout <= 7) {
          urgency = 'critical';
        } else if (daysUntilStockout !== null && daysUntilStockout <= 14) {
          urgency = 'high';
        } else if (daysUntilStockout !== null && daysUntilStockout <= 30) {
          urgency = 'medium';
        }

        // Determine trend based on velocity
        let trend = 'stable';
        if (dailyVelocity > 5) trend = 'increasing';
        else if (dailyVelocity > 2) trend = 'stable';
        else if (dailyVelocity > 0) trend = 'decreasing';

        // Calculate confidence score
        const confidence = Math.min(95, 60 + Math.floor(totalSales / 5) * 5);

        // Calculate reorder quantity (2 weeks of stock + safety buffer)
        const reorderQty = Math.max(10, Math.ceil(dailyVelocity * 21));

        const prediction = {
          id: crypto.randomUUID(),
          user_id: user.id,
          product_id: product.id,
          store_id: null,
          current_stock: product.stock_quantity,
          predicted_stockout_date: daysUntilStockout 
            ? new Date(Date.now() + daysUntilStockout * 24 * 60 * 60 * 1000).toISOString()
            : null,
          predicted_days_until_stockout: daysUntilStockout,
          confidence_score: confidence,
          daily_sale_velocity: dailyVelocity,
          trend_direction: trend,
          recommendation: generateRecommendation(product, dailyVelocity, urgency),
          reorder_quantity: reorderQty,
          reorder_urgency: urgency,
          last_calculated_at: new Date().toISOString(),
        };

        predictions.push(prediction);

        // Generate reorder suggestion for urgent items
        if (urgency === 'critical' || urgency === 'high') {
          suggestions.push({
            id: crypto.randomUUID(),
            user_id: user.id,
            product_id: product.id,
            supplier_id: null,
            store_id: null,
            suggested_quantity: reorderQty,
            suggested_reorder_point: Math.ceil(dailyVelocity * 7),
            estimated_cost: (product.cost_price || product.price * 0.6) * reorderQty,
            priority_score: urgency === 'critical' ? 95 : 75,
            reasoning: {
              reason: urgency === 'critical' 
                ? 'Rupture imminente - réassort urgent nécessaire'
                : 'Stock faible - anticiper le réassort',
              velocity: `${dailyVelocity.toFixed(1)} ventes/jour`,
              daysLeft: daysUntilStockout || 'N/A'
            },
            status: 'pending',
          });
        }

        // Generate alerts for critical items
        if (urgency === 'critical' || product.stock_quantity === 0) {
          const alertType = product.stock_quantity === 0 ? 'out_of_stock' : 'low_stock';
          alerts.push({
            id: crypto.randomUUID(),
            user_id: user.id,
            product_id: product.id,
            store_id: null,
            alert_type: alertType,
            severity: product.stock_quantity === 0 ? 'critical' : 'high',
            title: product.stock_quantity === 0 
              ? `Rupture de stock: ${product.title}`
              : `Stock critique: ${product.title}`,
            message: product.stock_quantity === 0
              ? `Le produit "${product.title}" est en rupture de stock.`
              : `Le produit "${product.title}" n'a plus que ${product.stock_quantity} unités (${daysUntilStockout} jours restants).`,
            current_stock: product.stock_quantity,
            threshold_value: 10,
            recommended_action: `Commander ${reorderQty} unités immédiatement`,
            action_data: { reorder_qty: reorderQty, product_sku: product.sku },
            is_read: false,
            is_resolved: false,
          });
        }
      }

      // Clear old predictions and insert new ones
      await supabase
        .from('stock_predictions')
        .delete()
        .eq('user_id', user.id);

      if (predictions.length > 0) {
        await supabase
          .from('stock_predictions')
          .insert(predictions);
      }

      // Only add new suggestions if none pending
      const { data: existingSuggestions } = await supabase
        .from('reorder_suggestions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if ((!existingSuggestions || existingSuggestions.length === 0) && suggestions.length > 0) {
        await supabase
          .from('reorder_suggestions')
          .insert(suggestions);
      }

      // Add new alerts
      if (alerts.length > 0) {
        await supabase
          .from('stock_alerts')
          .insert(alerts);
      }

      return new Response(JSON.stringify({
        success: true,
        predictions: predictions.length,
        suggestions: suggestions.length,
        alerts: alerts.length,
        summary: {
          criticalProducts: predictions.filter(p => p.reorder_urgency === 'critical').length,
          highUrgencyProducts: predictions.filter(p => p.reorder_urgency === 'high').length,
          lowStockProducts: predictions.filter(p => p.current_stock < 10).length,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Action non reconnue' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Stock Intelligence Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Une erreur est survenue' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateRecommendation(product: Product, velocity: number, urgency: string): string {
  if (product.stock_quantity === 0) {
    return `URGENT: Réapprovisionnement immédiat requis. Commander au minimum ${Math.ceil(velocity * 14)} unités.`;
  }
  if (urgency === 'critical') {
    return `Risque de rupture dans les 7 jours. Passez commande rapidement.`;
  }
  if (urgency === 'high') {
    return `Stock faible. Planifiez un réapprovisionnement sous 2 semaines.`;
  }
  if (velocity > 3) {
    return `Produit à forte rotation. Surveillez le stock régulièrement.`;
  }
  return `Stock suffisant. Prochaine vérification recommandée dans 30 jours.`;
}
