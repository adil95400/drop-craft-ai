
-- Step 1: Clean base64 data from images column
UPDATE public.products
SET images = (
  SELECT jsonb_agg(elem)
  FROM jsonb_array_elements_text(images::jsonb) AS elem
  WHERE elem::text NOT LIKE 'data:%'
)
WHERE images IS NOT NULL AND images::text LIKE '%data:%';

-- Step 2: Set images to null where all entries were base64 (result is null after cleanup)
UPDATE public.products
SET images = '[]'::jsonb
WHERE images IS NULL AND id IN (
  SELECT id FROM public.products WHERE images IS NULL
);

-- Step 3: Create RPC to promote imported_products to products
CREATE OR REPLACE FUNCTION public.promote_imported_to_products(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promoted INTEGER := 0;
  v_skipped INTEGER := 0;
  v_failed INTEGER := 0;
  v_total INTEGER := 0;
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT ip.*
    FROM imported_products ip
    WHERE ip.user_id = p_user_id
      AND NOT EXISTS (
        SELECT 1 FROM products p
        WHERE p.user_id = p_user_id
          AND (
            (p.sku IS NOT NULL AND p.sku = ip.sku)
            OR (p.source_url IS NOT NULL AND p.source_url = ip.source_url)
            OR (p.title IS NOT NULL AND ip.product_name IS NOT NULL AND p.title = ip.product_name)
          )
      )
  LOOP
    v_total := v_total + 1;
    BEGIN
      INSERT INTO products (
        user_id, title, description, price, cost_price, status,
        stock_quantity, sku, category, source_type, source_url,
        supplier_name, image_url, primary_image_url, currency
      ) VALUES (
        p_user_id,
        COALESCE(rec.product_name, rec.title, 'Import ' || substr(rec.id::text, 1, 8)),
        COALESCE(rec.description, ''),
        COALESCE(rec.price, 0),
        COALESCE(rec.cost_price, rec.price * 0.6),
        'draft',
        COALESCE(rec.stock_quantity, 0),
        COALESCE(rec.sku, 'IMP-' || substr(rec.id::text, 1, 12)),
        rec.category,
        COALESCE(rec.source_platform, 'import'),
        rec.source_url,
        COALESCE(rec.supplier_name, rec.source_platform),
        COALESCE(rec.image_url, rec.primary_image_url),
        COALESCE(rec.primary_image_url, rec.image_url),
        COALESCE(rec.currency, 'EUR')
      );
      v_promoted := v_promoted + 1;
    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed + 1;
    END;
  END LOOP;

  v_skipped := (SELECT count(*) FROM imported_products WHERE user_id = p_user_id) - v_total;

  RETURN json_build_object(
    'promoted', v_promoted,
    'skipped', v_skipped,
    'failed', v_failed,
    'total_imported', v_total + v_skipped
  );
END;
$$;
