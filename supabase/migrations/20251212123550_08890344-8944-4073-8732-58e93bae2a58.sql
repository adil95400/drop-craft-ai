
-- SECURITY FIX: Functions with missing search_path

-- 1. Fix calculate_product_ai_score
CREATE OR REPLACE FUNCTION public.calculate_product_ai_score(p_product_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
DECLARE
  v_score DECIMAL(3,2) := 0;
  v_product RECORD;
BEGIN
  SELECT * INTO v_product FROM public.supplier_products_unified WHERE id = p_product_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  IF v_product.profit_margin > 40 THEN v_score := v_score + 0.3;
  ELSIF v_product.profit_margin > 25 THEN v_score := v_score + 0.2;
  ELSIF v_product.profit_margin > 15 THEN v_score := v_score + 0.1; END IF;
  IF v_product.stock_quantity > 100 THEN v_score := v_score + 0.2;
  ELSIF v_product.stock_quantity > 20 THEN v_score := v_score + 0.15;
  ELSIF v_product.stock_quantity > 0 THEN v_score := v_score + 0.1; END IF;
  IF v_product.conversion_rate > 5 THEN v_score := v_score + 0.3;
  ELSIF v_product.conversion_rate > 2 THEN v_score := v_score + 0.2;
  ELSIF v_product.conversion_rate > 0 THEN v_score := v_score + 0.1; END IF;
  IF v_product.last_synced_at > now() - interval '1 day' THEN v_score := v_score + 0.2;
  ELSIF v_product.last_synced_at > now() - interval '7 days' THEN v_score := v_score + 0.1; END IF;
  RETURN LEAST(v_score, 1.0);
END;
$function$;

-- 2. Fix create_supplier_notification
CREATE OR REPLACE FUNCTION public.create_supplier_notification(p_user_id uuid, p_type text, p_title text, p_message text, p_priority text DEFAULT 'medium', p_supplier_id uuid DEFAULT NULL, p_data jsonb DEFAULT '{}')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE v_notification_id UUID;
BEGIN
  INSERT INTO public.supplier_notifications (user_id, notification_type, title, message, priority, supplier_id, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_priority, p_supplier_id, p_data) RETURNING id INTO v_notification_id;
  RETURN v_notification_id;
END;
$function$;

-- 3. Fix generate_rma_number
CREATE OR REPLACE FUNCTION public.generate_rma_number() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $function$
BEGIN
  IF NEW.rma_number IS NULL OR NEW.rma_number = '' THEN
    NEW.rma_number := 'RMA-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 6));
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. Fix log_audit_event
CREATE OR REPLACE FUNCTION public.log_audit_event(p_action text, p_entity_type text, p_entity_id uuid DEFAULT NULL, p_before_data jsonb DEFAULT NULL, p_after_data jsonb DEFAULT NULL, p_severity text DEFAULT 'info')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE audit_id UUID;
BEGIN
  INSERT INTO public.audit_trail (user_id, action, entity_type, entity_id, before_data, after_data, severity, metadata)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_before_data, p_after_data, p_severity, jsonb_build_object('timestamp', now()))
  RETURNING id INTO audit_id;
  RETURN audit_id;
END;
$function$;
