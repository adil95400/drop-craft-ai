-- Table to track which products have auto-regeneration enabled
CREATE TABLE IF NOT EXISTS public.content_auto_update_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  content_types TEXT[] NOT NULL DEFAULT ARRAY['description', 'title'],
  tone TEXT NOT NULL DEFAULT 'professional',
  language TEXT NOT NULL DEFAULT 'fr',
  template_prompt TEXT DEFAULT '',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.content_auto_update_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own auto-update configs"
  ON public.content_auto_update_configs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_content_auto_update_configs_updated_at
  BEFORE UPDATE ON public.content_auto_update_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to queue content regeneration when products change
CREATE OR REPLACE FUNCTION public.queue_content_regen_on_product_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_config RECORD;
BEGIN
  -- Only trigger on meaningful field changes
  IF OLD.name IS NOT DISTINCT FROM NEW.name
     AND OLD.description IS NOT DISTINCT FROM NEW.description
     AND OLD.category IS NOT DISTINCT FROM NEW.category
     AND OLD.price IS NOT DISTINCT FROM NEW.price THEN
    RETURN NEW;
  END IF;

  -- Find active auto-update configs for this product
  FOR v_config IN
    SELECT * FROM public.content_auto_update_configs
    WHERE product_id = NEW.id AND is_enabled = true
  LOOP
    -- Create an optimization job for regeneration
    INSERT INTO public.ai_optimization_jobs (
      user_id, job_type, target_type, target_id, status, priority,
      input_data
    ) VALUES (
      v_config.user_id, 'auto_regen', 'descriptions', NEW.id::text, 'pending', 3,
      jsonb_build_object(
        'products', jsonb_build_array(jsonb_build_object(
          'id', NEW.id, 'name', NEW.name, 'description', NEW.description,
          'category', NEW.category, 'price', NEW.price, 'sku', NEW.sku
        )),
        'contentTypes', v_config.content_types,
        'tone', v_config.tone,
        'language', v_config.language,
        'templatePrompt', COALESCE(v_config.template_prompt, ''),
        'auto_regen', true
      )
    );

    -- Update trigger stats
    UPDATE public.content_auto_update_configs
    SET last_triggered_at = now(), trigger_count = COALESCE(trigger_count, 0) + 1
    WHERE id = v_config.id;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_content_regen_on_product_update
  AFTER UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_content_regen_on_product_update();
