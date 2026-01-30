-- Sprint 1: Extension Auth System - Enhanced Schema (Fixed)
-- Add permissions, refresh tokens sans dépendances externes

-- 1. Add missing columns to extension_auth_tokens
ALTER TABLE public.extension_auth_tokens 
ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '["import", "sync", "logs"]'::jsonb,
ADD COLUMN IF NOT EXISTS refresh_token text,
ADD COLUMN IF NOT EXISTS refresh_expires_at timestamptz,
ADD COLUMN IF NOT EXISTS token_type text DEFAULT 'extension',
ADD COLUMN IF NOT EXISTS ip_address text,
ADD COLUMN IF NOT EXISTS user_agent text,
ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
ADD COLUMN IF NOT EXISTS revoked_by uuid;

-- 2. Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_extension_auth_tokens_token ON public.extension_auth_tokens(token) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_extension_auth_tokens_user_active ON public.extension_auth_tokens(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_extension_auth_tokens_refresh ON public.extension_auth_tokens(refresh_token) WHERE refresh_token IS NOT NULL;

-- 3. Create extension_sessions table for real-time tracking
CREATE TABLE IF NOT EXISTS public.extension_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid REFERENCES public.extension_auth_tokens(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  session_start timestamptz DEFAULT now(),
  session_end timestamptz,
  last_heartbeat timestamptz DEFAULT now(),
  platform text,
  page_url text,
  actions_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on extension_sessions
ALTER TABLE public.extension_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for extension_sessions
CREATE POLICY "Users can view their own extension sessions"
ON public.extension_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert extension sessions"
ON public.extension_sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update extension sessions"
ON public.extension_sessions FOR UPDATE
USING (true);

-- 4. Create extension_heartbeats table for version tracking
CREATE TABLE IF NOT EXISTS public.extension_heartbeats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token_id uuid REFERENCES public.extension_auth_tokens(id) ON DELETE SET NULL,
  extension_version text NOT NULL,
  platform text,
  browser text,
  browser_version text,
  os text,
  is_active boolean DEFAULT true,
  last_seen_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on extension_heartbeats
ALTER TABLE public.extension_heartbeats ENABLE ROW LEVEL SECURITY;

-- RLS policies for extension_heartbeats
CREATE POLICY "Users can view their own extension heartbeats"
ON public.extension_heartbeats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage extension heartbeats"
ON public.extension_heartbeats FOR ALL
USING (true);

-- 5. Function to generate secure extension token
CREATE OR REPLACE FUNCTION public.generate_extension_token(
  p_user_id uuid,
  p_permissions jsonb DEFAULT '["import", "sync", "logs"]'::jsonb,
  p_device_info jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
  v_refresh_token text;
  v_token_id uuid;
  v_expires_at timestamptz;
  v_refresh_expires_at timestamptz;
BEGIN
  -- Generate secure tokens
  v_token := 'ext_' || replace(gen_random_uuid()::text, '-', '') || '_' || extract(epoch from now())::bigint;
  v_refresh_token := 'ref_' || replace(gen_random_uuid()::text, '-', '') || '_' || extract(epoch from now())::bigint;
  v_expires_at := now() + interval '30 days';
  v_refresh_expires_at := now() + interval '365 days';
  
  -- Revoke old tokens (keep last 2)
  UPDATE public.extension_auth_tokens
  SET is_active = false, revoked_at = now()
  WHERE user_id = p_user_id 
    AND is_active = true
    AND id NOT IN (
      SELECT id FROM public.extension_auth_tokens
      WHERE user_id = p_user_id AND is_active = true
      ORDER BY created_at DESC
      LIMIT 2
    );
  
  -- Insert new token
  INSERT INTO public.extension_auth_tokens (
    user_id, token, refresh_token, permissions,
    device_info, expires_at, refresh_expires_at, is_active, token_type
  ) VALUES (
    p_user_id, v_token, v_refresh_token, p_permissions,
    p_device_info, v_expires_at, v_refresh_expires_at, true, 'extension'
  )
  RETURNING id INTO v_token_id;
  
  -- Log security event
  INSERT INTO public.security_events (user_id, event_type, severity, description, metadata)
  VALUES (p_user_id, 'extension_token_generated', 'info', 'New extension token created', 
    jsonb_build_object('token_id', v_token_id, 'device_info', p_device_info));
  
  RETURN jsonb_build_object(
    'success', true,
    'token', v_token,
    'refresh_token', v_refresh_token,
    'token_id', v_token_id,
    'expires_at', v_expires_at,
    'refresh_expires_at', v_refresh_expires_at,
    'permissions', p_permissions
  );
END;
$$;

-- 6. Function to refresh extension token
CREATE OR REPLACE FUNCTION public.refresh_extension_token(p_refresh_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_record record;
  v_new_token text;
  v_new_expires_at timestamptz;
BEGIN
  -- Find valid refresh token
  SELECT * INTO v_token_record
  FROM public.extension_auth_tokens
  WHERE refresh_token = p_refresh_token
    AND is_active = true
    AND refresh_expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired refresh token');
  END IF;
  
  -- Generate new access token
  v_new_token := 'ext_' || replace(gen_random_uuid()::text, '-', '') || '_' || extract(epoch from now())::bigint;
  v_new_expires_at := now() + interval '30 days';
  
  -- Update token
  UPDATE public.extension_auth_tokens
  SET token = v_new_token,
      expires_at = v_new_expires_at,
      last_used_at = now(),
      usage_count = COALESCE(usage_count, 0) + 1
  WHERE id = v_token_record.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'token', v_new_token,
    'expires_at', v_new_expires_at,
    'user_id', v_token_record.user_id
  );
END;
$$;

-- 7. Function to validate extension token (fast lookup)
CREATE OR REPLACE FUNCTION public.validate_extension_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_record record;
BEGIN
  -- Fast token lookup with profile join
  SELECT t.*, p.subscription_plan, p.first_name, p.last_name, p.email
  INTO v_token_record
  FROM public.extension_auth_tokens t
  LEFT JOIN public.profiles p ON p.id = t.user_id
  WHERE t.token = p_token
    AND t.is_active = true
    AND t.expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired token');
  END IF;
  
  -- Update last used async
  UPDATE public.extension_auth_tokens
  SET last_used_at = now(), usage_count = COALESCE(usage_count, 0) + 1
  WHERE id = v_token_record.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', v_token_record.user_id,
      'email', v_token_record.email,
      'plan', COALESCE(v_token_record.subscription_plan, 'free'),
      'firstName', v_token_record.first_name,
      'lastName', v_token_record.last_name
    ),
    'permissions', v_token_record.permissions,
    'expires_at', v_token_record.expires_at
  );
END;
$$;