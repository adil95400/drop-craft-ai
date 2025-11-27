-- Phase 1: Add AI scores and enrichment columns to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS ai_score NUMERIC CHECK (ai_score >= 0 AND ai_score <= 100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS trend_score NUMERIC CHECK (trend_score >= 0 AND trend_score <= 100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS competition_score NUMERIC CHECK (competition_score >= 0 AND competition_score <= 100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS profit_potential NUMERIC CHECK (profit_potential >= 0 AND profit_potential <= 100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_winner BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_ids TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS best_supplier_id TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS conversion_rate NUMERIC DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_optimized_at TIMESTAMP WITH TIME ZONE;

-- Add same columns to imported_products
ALTER TABLE imported_products ADD COLUMN IF NOT EXISTS ai_score NUMERIC CHECK (ai_score >= 0 AND ai_score <= 100);
ALTER TABLE imported_products ADD COLUMN IF NOT EXISTS trend_score NUMERIC CHECK (trend_score >= 0 AND trend_score <= 100);
ALTER TABLE imported_products ADD COLUMN IF NOT EXISTS competition_score NUMERIC CHECK (competition_score >= 0 AND competition_score <= 100);
ALTER TABLE imported_products ADD COLUMN IF NOT EXISTS profit_potential NUMERIC CHECK (profit_potential >= 0 AND profit_potential <= 100);
ALTER TABLE imported_products ADD COLUMN IF NOT EXISTS is_winner BOOLEAN DEFAULT FALSE;
ALTER TABLE imported_products ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT FALSE;
ALTER TABLE imported_products ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT FALSE;
ALTER TABLE imported_products ADD COLUMN IF NOT EXISTS supplier_ids TEXT[];
ALTER TABLE imported_products ADD COLUMN IF NOT EXISTS best_supplier_id TEXT;
ALTER TABLE imported_products ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE imported_products ADD COLUMN IF NOT EXISTS conversion_rate NUMERIC DEFAULT 0;
ALTER TABLE imported_products ADD COLUMN IF NOT EXISTS last_optimized_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_ai_score ON products(ai_score DESC) WHERE ai_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_trend_score ON products(trend_score DESC) WHERE trend_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_is_winner ON products(is_winner) WHERE is_winner = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_is_trending ON products(is_trending) WHERE is_trending = TRUE;
CREATE INDEX IF NOT EXISTS idx_imported_products_ai_score ON imported_products(ai_score DESC) WHERE ai_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_imported_products_trend_score ON imported_products(trend_score DESC) WHERE trend_score IS NOT NULL;

-- Create unified products view for better performance
CREATE OR REPLACE VIEW unified_products_view AS
SELECT 
  p.id,
  p.user_id,
  p.name,
  p.description,
  p.price,
  p.cost_price,
  p.sku,
  p.category,
  p.status,
  p.stock_quantity,
  p.image_url,
  p.ai_score,
  p.trend_score,
  p.competition_score,
  p.profit_potential,
  p.is_winner,
  p.is_trending,
  p.is_bestseller,
  p.supplier_ids,
  p.best_supplier_id,
  p.view_count,
  p.conversion_rate,
  p.profit_margin,
  p.created_at,
  p.updated_at,
  'products' as source,
  COALESCE(sp.min_price, p.cost_price) as best_supplier_price,
  COALESCE(sp.supplier_count, 0) as supplier_count,
  CASE 
    WHEN p.price > 0 AND p.cost_price > 0 THEN ((p.price - p.cost_price) / p.price * 100)
    ELSE 0 
  END as calculated_margin
FROM products p
LEFT JOIN (
  SELECT 
    psm.product_id, 
    MIN(sp.price) as min_price, 
    COUNT(DISTINCT psm.primary_supplier_id) as supplier_count
  FROM product_supplier_mapping psm
  JOIN supplier_products sp ON psm.primary_supplier_id = sp.supplier_id
  GROUP BY psm.product_id
) sp ON p.id = sp.product_id
WHERE p.status = 'active'

UNION ALL

SELECT 
  ip.id,
  ip.user_id,
  ip.name,
  ip.description,
  ip.price,
  ip.cost_price,
  ip.sku,
  ip.category,
  ip.status,
  0 as stock_quantity,
  COALESCE(ip.image_urls[1], '') as image_url,
  ip.ai_score,
  ip.trend_score,
  ip.competition_score,
  ip.profit_potential,
  ip.is_winner,
  ip.is_trending,
  ip.is_bestseller,
  ip.supplier_ids,
  ip.best_supplier_id,
  ip.view_count,
  ip.conversion_rate,
  CASE 
    WHEN ip.price > 0 AND ip.cost_price > 0 THEN ((ip.price - ip.cost_price) / ip.price * 100)
    ELSE 0 
  END as profit_margin,
  ip.created_at,
  ip.updated_at,
  'imported_products' as source,
  ip.cost_price as best_supplier_price,
  0 as supplier_count,
  CASE 
    WHEN ip.price > 0 AND ip.cost_price > 0 THEN ((ip.price - ip.cost_price) / ip.price * 100)
    ELSE 0 
  END as calculated_margin
FROM imported_products ip
WHERE ip.status IN ('active', 'published');