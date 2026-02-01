-- =====================================================
-- P1.3 Extension Token Scopes System
-- Granular permissions for extension API access
-- =====================================================

-- 1. Create enum for scope categories
CREATE TYPE public.extension_scope_category AS ENUM (
  'products',      -- Product operations
  'orders',        -- Order management
  'sync',          -- Synchronization
  'analytics',     -- Analytics & reporting
  'settings',      -- User settings
  'ai',            -- AI features
  'admin'          -- Administrative operations
);

-- 2. Create extension_scopes table (static scope definitions)
CREATE TABLE public.extension_scopes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scope_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  category extension_scope_category NOT NULL,
  min_plan TEXT DEFAULT 'free',
  is_sensitive BOOLEAN DEFAULT false,
  rate_limit_per_hour INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Insert predefined scopes
INSERT INTO public.extension_scopes (scope_name, display_name, description, category, min_plan, is_sensitive, rate_limit_per_hour) VALUES
-- Products
('products:read', 'Lire les produits', 'Consulter les produits importés', 'products', 'free', false, 200),
('products:write', 'Modifier les produits', 'Créer et modifier des produits', 'products', 'free', false, 100),
('products:import', 'Importer des produits', 'Importer depuis les marketplaces', 'products', 'free', false, 50),
('products:bulk', 'Import en masse', 'Import de nombreux produits à la fois', 'products', 'pro', false, 20),
('products:delete', 'Supprimer les produits', 'Supprimer des produits', 'products', 'free', true, 50),

-- Orders
('orders:read', 'Lire les commandes', 'Consulter les commandes', 'orders', 'free', false, 200),
('orders:write', 'Gérer les commandes', 'Créer et modifier des commandes', 'orders', 'pro', true, 50),
('orders:fulfill', 'Traiter les commandes', 'Marquer les commandes comme traitées', 'orders', 'pro', true, 30),

-- Sync
('sync:read', 'Lire le statut sync', 'Consulter le statut de synchronisation', 'sync', 'free', false, 100),
('sync:trigger', 'Déclencher sync', 'Lancer une synchronisation manuelle', 'sync', 'free', false, 10),
('sync:auto', 'Sync automatique', 'Configuration de la sync auto', 'sync', 'pro', false, 5),

-- Analytics
('analytics:read', 'Lire les analytics', 'Consulter les statistiques', 'analytics', 'free', false, 100),
('analytics:export', 'Exporter les données', 'Exporter les rapports', 'analytics', 'pro', false, 10),

-- Settings
('settings:read', 'Lire les paramètres', 'Consulter les paramètres utilisateur', 'settings', 'free', false, 100),
('settings:write', 'Modifier les paramètres', 'Modifier les paramètres', 'settings', 'free', false, 30),

-- AI
('ai:generate', 'Générer contenu IA', 'Utiliser les fonctionnalités IA', 'ai', 'pro', false, 50),
('ai:optimize', 'Optimisation IA', 'Optimiser les listings avec l''IA', 'ai', 'ultra_pro', false, 20),

-- Admin (restricted)
('admin:users', 'Gérer les utilisateurs', 'Administration des utilisateurs', 'admin', 'admin', true, 10),
('admin:system', 'Accès système', 'Accès aux fonctions système', 'admin', 'admin', true, 5);

-- 4. Create extension_token_scopes junction table
CREATE TABLE public.extension_token_scopes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL REFERENCES public.extension_auth_tokens(id) ON DELETE CASCADE,
  scope_id UUID NOT NULL REFERENCES public.extension_scopes(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  UNIQUE(token_id, scope_id)
);

-- 5. Create scope usage log for audit
CREATE TABLE public.extension_scope_usage_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL,
  user_id UUID NOT NULL,
  scope_name TEXT NOT NULL,
  action TEXT NOT NULL,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  request_metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Enable RLS
ALTER TABLE public.extension_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extension_token_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extension_scope_usage_log ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for extension_scopes (read-only for all)
CREATE POLICY "Scopes are readable by authenticated users"
ON public.extension_scopes FOR SELECT
TO authenticated
USING (true);

-- 8. RLS Policies for extension_token_scopes
CREATE POLICY "Users can read their own token scopes"
ON public.extension_token_scopes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.extension_auth_tokens t
    WHERE t.id = token_id AND t.user_id = auth.uid()
  )
);

CREATE POLICY "Service role can manage token scopes"
ON public.extension_token_scopes FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 9. RLS Policies for scope_usage_log
CREATE POLICY "Users can read their own scope usage"
ON public.extension_scope_usage_log FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can read all scope usage"
ON public.extension_scope_usage_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert scope usage"
ON public.extension_scope_usage_log FOR INSERT
TO service_role
WITH CHECK (true);

-- 10. Create indexes
CREATE INDEX idx_token_scopes_token_id ON public.extension_token_scopes(token_id);
CREATE INDEX idx_token_scopes_scope_id ON public.extension_token_scopes(scope_id);
CREATE INDEX idx_scope_usage_user_id ON public.extension_scope_usage_log(user_id);
CREATE INDEX idx_scope_usage_created_at ON public.extension_scope_usage_log(created_at DESC);
CREATE INDEX idx_scope_usage_scope_name ON public.extension_scope_usage_log(scope_name);

-- 11. Function to check if a token has a specific scope
CREATE OR REPLACE FUNCTION public.token_has_scope(
  p_token_id UUID,
  p_scope_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_scope BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM extension_token_scopes ts
    JOIN extension_scopes s ON s.id = ts.scope_id
    WHERE ts.token_id = p_token_id
      AND s.scope_name = p_scope_name
      AND (ts.expires_at IS NULL OR ts.expires_at > now())
  ) INTO v_has_scope;
  
  RETURN v_has_scope;
END;
$$;

-- 12. Function to validate token with scopes
CREATE OR REPLACE FUNCTION public.validate_token_with_scopes(
  p_token TEXT,
  p_required_scopes TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_record RECORD;
  v_user_record RECORD;
  v_scopes TEXT[];
  v_missing_scopes TEXT[];
  v_scope TEXT;
BEGIN
  -- Get token
  SELECT * INTO v_token_record
  FROM extension_auth_tokens
  WHERE token = p_token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND revoked_at IS NULL;
  
  IF v_token_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Token invalide ou expiré',
      'code', 'TOKEN_INVALID'
    );
  END IF;
  
  -- Get user profile
  SELECT id, email, subscription_plan, full_name
  INTO v_user_record
  FROM profiles
  WHERE id = v_token_record.user_id;
  
  IF v_user_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Utilisateur non trouvé',
      'code', 'USER_NOT_FOUND'
    );
  END IF;
  
  -- Get all scopes for this token
  SELECT ARRAY_AGG(s.scope_name)
  INTO v_scopes
  FROM extension_token_scopes ts
  JOIN extension_scopes s ON s.id = ts.scope_id
  WHERE ts.token_id = v_token_record.id
    AND (ts.expires_at IS NULL OR ts.expires_at > now());
  
  v_scopes := COALESCE(v_scopes, ARRAY[]::TEXT[]);
  
  -- Check required scopes if provided
  IF p_required_scopes IS NOT NULL AND array_length(p_required_scopes, 1) > 0 THEN
    v_missing_scopes := ARRAY[]::TEXT[];
    
    FOREACH v_scope IN ARRAY p_required_scopes LOOP
      IF NOT (v_scope = ANY(v_scopes)) THEN
        v_missing_scopes := array_append(v_missing_scopes, v_scope);
      END IF;
    END LOOP;
    
    IF array_length(v_missing_scopes, 1) > 0 THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Scopes manquants: ' || array_to_string(v_missing_scopes, ', '),
        'code', 'INSUFFICIENT_SCOPES',
        'missing_scopes', to_jsonb(v_missing_scopes),
        'token_scopes', to_jsonb(v_scopes)
      );
    END IF;
  END IF;
  
  -- Update last_used_at
  UPDATE extension_auth_tokens
  SET last_used_at = now(), usage_count = COALESCE(usage_count, 0) + 1
  WHERE id = v_token_record.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'token_id', v_token_record.id,
    'user', jsonb_build_object(
      'id', v_user_record.id,
      'email', v_user_record.email,
      'plan', COALESCE(v_user_record.subscription_plan, 'free'),
      'full_name', v_user_record.full_name
    ),
    'scopes', to_jsonb(v_scopes),
    'expires_at', v_token_record.expires_at
  );
END;
$$;

-- 13. Function to grant scopes to a token
CREATE OR REPLACE FUNCTION public.grant_token_scopes(
  p_token_id UUID,
  p_scope_names TEXT[],
  p_granted_by UUID,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_scope_name TEXT;
  v_scope_id UUID;
  v_granted_count INTEGER := 0;
  v_errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
  FOREACH v_scope_name IN ARRAY p_scope_names LOOP
    -- Get scope ID
    SELECT id INTO v_scope_id
    FROM extension_scopes
    WHERE scope_name = v_scope_name;
    
    IF v_scope_id IS NULL THEN
      v_errors := array_append(v_errors, 'Scope inconnu: ' || v_scope_name);
      CONTINUE;
    END IF;
    
    -- Insert or update scope grant
    INSERT INTO extension_token_scopes (token_id, scope_id, granted_by, expires_at)
    VALUES (p_token_id, v_scope_id, p_granted_by, p_expires_at)
    ON CONFLICT (token_id, scope_id) 
    DO UPDATE SET 
      expires_at = EXCLUDED.expires_at,
      granted_by = EXCLUDED.granted_by,
      granted_at = now();
    
    v_granted_count := v_granted_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'granted_count', v_granted_count,
    'errors', to_jsonb(v_errors)
  );
END;
$$;

-- 14. Function to log scope usage
CREATE OR REPLACE FUNCTION public.log_scope_usage(
  p_token_id UUID,
  p_user_id UUID,
  p_scope_name TEXT,
  p_action TEXT,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_ip_address TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO extension_scope_usage_log (
    token_id, user_id, scope_name, action, 
    success, error_message, request_metadata, ip_address
  ) VALUES (
    p_token_id, p_user_id, p_scope_name, p_action,
    p_success, p_error_message, p_metadata, p_ip_address
  );
  
  -- Update usage count on token scope
  UPDATE extension_token_scopes ts
  SET usage_count = COALESCE(usage_count, 0) + 1, last_used_at = now()
  FROM extension_scopes s
  WHERE ts.scope_id = s.id 
    AND ts.token_id = p_token_id 
    AND s.scope_name = p_scope_name;
END;
$$;

-- 15. Function to get rate limit for scope
CREATE OR REPLACE FUNCTION public.get_scope_rate_limit(
  p_scope_name TEXT
)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(rate_limit_per_hour, 100)
  FROM extension_scopes
  WHERE scope_name = p_scope_name;
$$;

-- 16. Update generate_extension_token to include scope granting
CREATE OR REPLACE FUNCTION public.generate_extension_token(
  p_user_id UUID,
  p_permissions TEXT[] DEFAULT ARRAY['products:read', 'products:import', 'sync:read'],
  p_device_info JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT;
  v_refresh_token TEXT;
  v_token_id UUID;
  v_expires_at TIMESTAMPTZ;
  v_refresh_expires_at TIMESTAMPTZ;
  v_user_plan TEXT;
  v_allowed_scopes TEXT[];
BEGIN
  -- Generate tokens
  v_token := encode(gen_random_bytes(48), 'base64');
  v_refresh_token := encode(gen_random_bytes(48), 'base64');
  v_expires_at := now() + interval '7 days';
  v_refresh_expires_at := now() + interval '30 days';
  
  -- Get user plan
  SELECT COALESCE(subscription_plan, 'free') INTO v_user_plan
  FROM profiles WHERE id = p_user_id;
  
  -- Filter scopes based on user plan
  SELECT ARRAY_AGG(scope_name)
  INTO v_allowed_scopes
  FROM extension_scopes
  WHERE scope_name = ANY(p_permissions)
    AND (
      min_plan = 'free' 
      OR (min_plan = 'pro' AND v_user_plan IN ('pro', 'ultra_pro', 'enterprise'))
      OR (min_plan = 'ultra_pro' AND v_user_plan IN ('ultra_pro', 'enterprise'))
      OR (min_plan = 'admin' AND public.has_role(p_user_id, 'admin'))
    );
  
  v_allowed_scopes := COALESCE(v_allowed_scopes, ARRAY['products:read']::TEXT[]);
  
  -- Insert token
  INSERT INTO extension_auth_tokens (
    user_id, token, refresh_token, expires_at, refresh_expires_at,
    device_info, permissions, token_type
  ) VALUES (
    p_user_id, v_token, v_refresh_token, v_expires_at, v_refresh_expires_at,
    p_device_info, to_jsonb(v_allowed_scopes), 'extension'
  )
  RETURNING id INTO v_token_id;
  
  -- Grant scopes to token
  PERFORM grant_token_scopes(v_token_id, v_allowed_scopes, p_user_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'token', v_token,
    'refresh_token', v_refresh_token,
    'token_id', v_token_id,
    'expires_at', v_expires_at,
    'refresh_expires_at', v_refresh_expires_at,
    'permissions', to_jsonb(v_allowed_scopes)
  );
END;
$$;