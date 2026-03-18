
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
      AND ip.promoted_to_product_id IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM products p
        WHERE p.user_id = p_user_id
          AND (
            (p.sku IS NOT NULL AND ip.sku IS NOT NULL AND p.sku = ip.sku)
            OR (p.source_url IS NOT NULL AND ip.source_url IS NOT NULL AND p.source_url = ip.source_url)
          )
      )
  LOOP
    v_total := v_total + 1;
    BEGIN
      INSERT INTO products (
        user_id, title, description, price, cost_price, status,
        stock_quantity, sku, category, source_type, source_url,
        supplier_name, image_url, primary_image_url, currency, brand
      ) VALUES (
        p_user_id,
        COALESCE(rec.name, rec.title, 'Import ' || substr(rec.id::text, 1, 8)),
        COALESCE(rec.description, rec.description_text, ''),
        COALESCE(rec.price, 0),
        COALESCE(rec.cost_price, CASE WHEN rec.price > 0 THEN round((rec.price * 0.6)::numeric, 2) ELSE 0 END),
        'draft',
        COALESCE(rec.stock_quantity, 0),
        COALESCE(rec.sku, 'IMP-' || substr(rec.id::text, 1, 12)),
        rec.category,
        COALESCE(rec.source_platform, 'import'),
        rec.source_url,
        COALESCE(rec.supplier_name, rec.source_platform),
        COALESCE(
          CASE WHEN rec.image_urls IS NOT NULL AND jsonb_array_length(rec.image_urls::jsonb) > 0 
            THEN rec.image_urls::jsonb->>0 ELSE NULL END,
          NULL
        ),
        COALESCE(
          CASE WHEN rec.image_urls IS NOT NULL AND jsonb_array_length(rec.image_urls::jsonb) > 0 
            THEN rec.image_urls::jsonb->>0 ELSE NULL END,
          NULL
        ),
        COALESCE(rec.currency, 'EUR'),
        rec.brand
      )
      RETURNING id INTO rec.id;
      
      -- Mark as promoted
      UPDATE imported_products 
      SET promoted_to_product_id = rec.id, 
          promotion_status = 'promoted',
          promoted_at = now()
      WHERE id = rec.id;
      
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
