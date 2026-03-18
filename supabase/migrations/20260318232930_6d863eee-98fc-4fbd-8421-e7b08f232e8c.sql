CREATE OR REPLACE FUNCTION public.get_product_stats(p_user_id uuid)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total', count(*),
    'active', count(*) FILTER (WHERE status = 'active'),
    'draft', count(*) FILTER (WHERE status = 'draft'),
    'inactive', count(*) FILTER (WHERE status = 'inactive'),
    'archived', count(*) FILTER (WHERE status = 'archived'),
    'low_stock', count(*) FILTER (WHERE stock_quantity > 0 AND stock_quantity < 10),
    'out_of_stock', count(*) FILTER (WHERE stock_quantity = 0),
    'total_value', COALESCE(round(sum(COALESCE(price, 0) * COALESCE(stock_quantity, 0))::numeric, 2), 0),
    'total_cost', COALESCE(round(sum(COALESCE(cost_price, 0) * COALESCE(stock_quantity, 0))::numeric, 2), 0),
    'total_profit', COALESCE(round(sum((COALESCE(price, 0) - COALESCE(cost_price, 0)) * COALESCE(stock_quantity, 0))::numeric, 2), 0),
    'avg_price', COALESCE(round(avg(COALESCE(price, 0))::numeric, 2), 0),
    'profit_margin', CASE 
      WHEN sum(COALESCE(price, 0) * COALESCE(stock_quantity, 0)) > 0 
      THEN round(((sum(COALESCE(price, 0) * COALESCE(stock_quantity, 0)) - sum(COALESCE(cost_price, 0) * COALESCE(stock_quantity, 0))) / sum(COALESCE(price, 0) * COALESCE(stock_quantity, 0)) * 100)::numeric, 2)
      ELSE 0
    END
  )
  FROM products
  WHERE user_id = p_user_id;
$$;