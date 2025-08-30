-- Enable realtime for notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Enable realtime for orders table
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Enable realtime for activity_logs table  
ALTER TABLE public.activity_logs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;

-- Create user_preferences table for storing dashboard settings and keyboard shortcuts
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  preferences jsonb NOT NULL DEFAULT '{}',
  shortcuts jsonb NOT NULL DEFAULT '{}',
  dashboard_config jsonb NOT NULL DEFAULT '{}',
  notification_settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT user_preferences_user_id_unique UNIQUE(user_id)
);

-- Enable RLS on user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_preferences
CREATE POLICY "Users can manage their own preferences"
  ON public.user_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for user_preferences updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create dashboard_metrics table for real analytics data
CREATE TABLE IF NOT EXISTS public.dashboard_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  metric_type text NOT NULL,
  metric_value numeric NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT dashboard_metrics_user_date_type UNIQUE(user_id, date, metric_type)
);

-- Enable RLS on dashboard_metrics
ALTER TABLE public.dashboard_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for dashboard_metrics
CREATE POLICY "Users can view their own metrics"
  ON public.dashboard_metrics
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert metrics"
  ON public.dashboard_metrics
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own metrics"
  ON public.dashboard_metrics
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for dashboard_metrics
ALTER TABLE public.dashboard_metrics REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dashboard_metrics;

-- Create function to get real dashboard analytics
CREATE OR REPLACE FUNCTION public.get_dashboard_analytics(user_id_param uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  orders_count integer;
  revenue_total numeric;
  customers_count integer;
  products_count integer;
  avg_order_value numeric;
  conversion_rate numeric;
  revenue_growth numeric;
  orders_growth numeric;
  customers_growth numeric;
BEGIN
  -- Get basic metrics
  SELECT COUNT(*) INTO orders_count
  FROM orders 
  WHERE user_id = user_id_param AND created_at > NOW() - INTERVAL '30 days';
  
  SELECT COALESCE(SUM(total_amount), 0) INTO revenue_total
  FROM orders 
  WHERE user_id = user_id_param AND created_at > NOW() - INTERVAL '30 days';
  
  SELECT COUNT(DISTINCT customer_id) INTO customers_count
  FROM orders 
  WHERE user_id = user_id_param AND customer_id IS NOT NULL AND created_at > NOW() - INTERVAL '30 days';
  
  SELECT COUNT(*) INTO products_count
  FROM imported_products 
  WHERE user_id = user_id_param AND status = 'published';
  
  -- Calculate average order value
  avg_order_value := CASE WHEN orders_count > 0 THEN revenue_total / orders_count ELSE 0 END;
  
  -- Mock conversion rate calculation (would need visitor data)
  conversion_rate := CASE WHEN products_count > 0 THEN LEAST(orders_count::numeric / products_count * 10, 100) ELSE 0 END;
  
  -- Calculate growth rates (comparing last 30 days to previous 30 days)
  WITH current_period AS (
    SELECT 
      COUNT(*) as current_orders,
      COALESCE(SUM(total_amount), 0) as current_revenue,
      COUNT(DISTINCT customer_id) as current_customers
    FROM orders 
    WHERE user_id = user_id_param 
    AND created_at BETWEEN NOW() - INTERVAL '30 days' AND NOW()
  ),
  previous_period AS (
    SELECT 
      COUNT(*) as prev_orders,
      COALESCE(SUM(total_amount), 0) as prev_revenue,
      COUNT(DISTINCT customer_id) as prev_customers
    FROM orders 
    WHERE user_id = user_id_param 
    AND created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days'
  )
  SELECT 
    CASE WHEN pp.prev_orders > 0 THEN ROUND(((cp.current_orders - pp.prev_orders)::numeric / pp.prev_orders * 100), 1) ELSE 0 END,
    CASE WHEN pp.prev_revenue > 0 THEN ROUND(((cp.current_revenue - pp.prev_revenue) / pp.prev_revenue * 100), 1) ELSE 0 END,
    CASE WHEN pp.prev_customers > 0 THEN ROUND(((cp.current_customers - pp.prev_customers)::numeric / pp.prev_customers * 100), 1) ELSE 0 END
  INTO orders_growth, revenue_growth, customers_growth
  FROM current_period cp, previous_period pp;
  
  -- Build result JSON
  result := jsonb_build_object(
    'revenue', revenue_total,
    'orders', orders_count,
    'products', products_count,
    'customers', customers_count,
    'conversionRate', conversion_rate,
    'averageOrderValue', avg_order_value,
    'revenueGrowth', COALESCE(revenue_growth, 0),
    'ordersGrowth', COALESCE(orders_growth, 0),
    'customersGrowth', COALESCE(customers_growth, 0),
    'lastUpdated', extract(epoch from now())
  );
  
  RETURN result;
END;
$$;

-- Create function to generate dashboard notifications
CREATE OR REPLACE FUNCTION public.generate_dashboard_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_record RECORD;
  low_stock_products integer;
  recent_orders integer;
  notification_id uuid;
BEGIN
  -- Loop through all users who have products
  FOR user_record IN 
    SELECT DISTINCT user_id 
    FROM imported_products 
    WHERE status = 'published'
  LOOP
    -- Check for low stock products
    SELECT COUNT(*) INTO low_stock_products
    FROM imported_products 
    WHERE user_id = user_record.user_id 
    AND stock_quantity <= 5 
    AND stock_quantity > 0
    AND status = 'published';
    
    -- Create low stock notification if needed
    IF low_stock_products > 0 THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        action_url
      ) VALUES (
        user_record.user_id,
        'stock_alert',
        'Stock faible détecté',
        low_stock_products || ' produit(s) ont un stock faible',
        '/inventory'
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Check for recent orders (last hour)
    SELECT COUNT(*) INTO recent_orders
    FROM orders 
    WHERE user_id = user_record.user_id 
    AND created_at > NOW() - INTERVAL '1 hour';
    
    -- Create order notification if needed
    IF recent_orders > 0 THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        action_url
      ) VALUES (
        user_record.user_id,
        'new_orders',
        'Nouvelles commandes',
        recent_orders || ' nouvelle(s) commande(s) reçue(s)',
        '/orders'
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;