-- Migration: Fix Function Search Path Security Issues
-- This migration adds SET search_path = 'public' to all functions to prevent SQL injection attacks

-- Fix calculate_winning_score
CREATE OR REPLACE FUNCTION public.calculate_winning_score(
  p_demand_score numeric,
  p_competition_score numeric,
  p_profitability_score numeric,
  p_trend_score numeric,
  p_saturation_score numeric
)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SET search_path = 'public'
AS $$
BEGIN
  RETURN ROUND(
    (p_demand_score * 0.25 + 
     p_competition_score * 0.20 + 
     p_profitability_score * 0.25 + 
     p_trend_score * 0.20 + 
     p_saturation_score * 0.10)::numeric, 
    2
  );
END;
$$;

-- Fix update_next_sync_time
CREATE OR REPLACE FUNCTION public.update_next_sync_time()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.auto_sync_enabled = true AND NEW.sync_frequency != 'manual' THEN
    NEW.next_sync_at := public.calculate_next_sync(NEW.sync_frequency, COALESCE(NEW.last_sync_at, now()));
  ELSE
    NEW.next_sync_at := NULL;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Fix calculate_next_sync (overload)
CREATE OR REPLACE FUNCTION public.calculate_next_sync(frequency text, base_time timestamp with time zone)
RETURNS timestamp with time zone
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  CASE frequency
    WHEN 'hourly' THEN RETURN base_time + INTERVAL '1 hour';
    WHEN 'daily' THEN RETURN base_time + INTERVAL '1 day';
    WHEN 'weekly' THEN RETURN base_time + INTERVAL '1 week';
    ELSE RETURN NULL;
  END CASE;
END;
$$;

-- Fix cleanup_old_api_logs
CREATE OR REPLACE FUNCTION public.cleanup_old_api_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.api_logs WHERE created_at < now() - interval '30 days';
  DELETE FROM public.webhook_delivery_logs WHERE created_at < now() - interval '30 days';
END;
$$;

-- Fix cleanup_old_product_history
CREATE OR REPLACE FUNCTION public.cleanup_old_product_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.product_history
  WHERE created_at < now() - interval '6 months';
END;
$$;

-- Fix generate_certificate_number
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  cert_number TEXT;
BEGIN
  cert_number := 'DCAI-' || to_char(now(), 'YYYY') || '-' || LPAD(floor(random() * 999999)::text, 6, '0');
  RETURN cert_number;
END;
$$;

-- Fix update_crm_updated_at
CREATE OR REPLACE FUNCTION public.update_crm_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix update_video_tutorials_updated_at
CREATE OR REPLACE FUNCTION public.update_video_tutorials_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix update_webhook_updated_at
CREATE OR REPLACE FUNCTION public.update_webhook_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix update_winner_products_updated_at
CREATE OR REPLACE FUNCTION public.update_winner_products_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$;

-- Fix update_bulk_content_jobs_updated_at
CREATE OR REPLACE FUNCTION public.update_bulk_content_jobs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix update_profit_configurations_updated_at
CREATE OR REPLACE FUNCTION public.update_profit_configurations_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix update_profit_calculations_updated_at
CREATE OR REPLACE FUNCTION public.update_profit_calculations_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix update_published_products_updated_at
CREATE OR REPLACE FUNCTION public.update_published_products_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix update_shopify_webhooks_updated_at
CREATE OR REPLACE FUNCTION public.update_shopify_webhooks_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix update_product_research_updated_at
CREATE OR REPLACE FUNCTION public.update_product_research_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix cleanup_expired_extension_tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_extension_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.extension_auth_tokens
  SET is_active = false
  WHERE expires_at < now() AND is_active = true;
END;
$$;

-- Fix cleanup_revoked_tokens
CREATE OR REPLACE FUNCTION public.cleanup_revoked_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.revoked_tokens 
  WHERE expires_at < now();
END;
$$;

-- Add comment to track security fixes
COMMENT ON FUNCTION public.calculate_winning_score IS 'Security fixed: Added SET search_path';
COMMENT ON FUNCTION public.update_next_sync_time IS 'Security fixed: Added SET search_path';
COMMENT ON FUNCTION public.cleanup_old_api_logs IS 'Security fixed: Added SET search_path';

-- Create index for better performance on cleanup functions
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON public.api_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_product_history_created_at ON public.product_history(created_at);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires_at ON public.revoked_tokens(expires_at);

-- Log security migration
DO $$
BEGIN
  RAISE NOTICE 'Security migration completed: Fixed search_path for trigger and utility functions';
END $$;