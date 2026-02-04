-- =============================================================================
-- MIGRATION: Legacy Scope to Granular Scope Conversion (Fixed)
-- Fixes FORBIDDEN_SCOPE errors in extension-gateway
-- =============================================================================

-- 1. Fonction de mapping legacy -> granulaire
CREATE OR REPLACE FUNCTION public.map_legacy_permission(legacy_perm TEXT)
RETURNS TEXT[]
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE legacy_perm
    WHEN 'import' THEN ARRAY['products:read', 'products:import', 'products:write']
    WHEN 'sync' THEN ARRAY['sync:read', 'sync:trigger']
    WHEN 'logs' THEN ARRAY['analytics:read']
    WHEN 'bulk' THEN ARRAY['products:bulk']
    WHEN 'ai_optimize' THEN ARRAY['ai:generate', 'ai:optimize']
    WHEN 'stock_monitor' THEN ARRAY['sync:auto']
    WHEN 'settings' THEN ARRAY['settings:read', 'settings:write']
    WHEN 'products:read' THEN ARRAY['products:read']
    WHEN 'products:write' THEN ARRAY['products:write']
    WHEN 'products:import' THEN ARRAY['products:import']
    WHEN 'products:bulk' THEN ARRAY['products:bulk']
    WHEN 'products:delete' THEN ARRAY['products:delete']
    WHEN 'sync:read' THEN ARRAY['sync:read']
    WHEN 'sync:trigger' THEN ARRAY['sync:trigger']
    WHEN 'sync:auto' THEN ARRAY['sync:auto']
    WHEN 'analytics:read' THEN ARRAY['analytics:read']
    WHEN 'analytics:export' THEN ARRAY['analytics:export']
    WHEN 'settings:read' THEN ARRAY['settings:read']
    WHEN 'settings:write' THEN ARRAY['settings:write']
    WHEN 'ai:generate' THEN ARRAY['ai:generate']
    WHEN 'ai:optimize' THEN ARRAY['ai:optimize']
    WHEN 'orders:read' THEN ARRAY['orders:read']
    WHEN 'orders:write' THEN ARRAY['orders:write']
    WHEN 'orders:fulfill' THEN ARRAY['orders:fulfill']
    WHEN 'admin:users' THEN ARRAY['admin:users']
    WHEN 'admin:system' THEN ARRAY['admin:system']
    ELSE ARRAY[legacy_perm]::TEXT[]
  END;
$$;

-- 2. Fonction de migration pour un token individuel (sans updated_at)
CREATE OR REPLACE FUNCTION public.migrate_token_to_granular_scopes(p_token_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_permissions JSONB;
  v_perm TEXT;
  v_granular_scopes TEXT[];
  v_scope_name TEXT;
  v_scope_id UUID;
  v_user_id UUID;
  v_granted INTEGER := 0;
BEGIN
  SELECT permissions, user_id INTO v_permissions, v_user_id
  FROM extension_auth_tokens WHERE id = p_token_id;
  
  IF v_permissions IS NULL OR jsonb_array_length(v_permissions) = 0 THEN
    v_permissions := '["products:read", "products:import", "sync:read", "settings:read", "analytics:read"]'::jsonb;
  END IF;
  
  FOR v_perm IN SELECT jsonb_array_elements_text(v_permissions)
  LOOP
    v_granular_scopes := map_legacy_permission(v_perm);
    
    FOREACH v_scope_name IN ARRAY v_granular_scopes LOOP
      SELECT id INTO v_scope_id FROM extension_scopes WHERE scope_name = v_scope_name;
      
      IF v_scope_id IS NOT NULL THEN
        INSERT INTO extension_token_scopes (token_id, scope_id, granted_by)
        VALUES (p_token_id, v_scope_id, v_user_id)
        ON CONFLICT (token_id, scope_id) DO NOTHING;
        
        IF FOUND THEN
          v_granted := v_granted + 1;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
  
  -- Update permissions field only (no updated_at column)
  UPDATE extension_auth_tokens
  SET permissions = (
    SELECT COALESCE(to_jsonb(array_agg(DISTINCT s.scope_name)), '[]'::jsonb)
    FROM extension_token_scopes ts
    JOIN extension_scopes s ON s.id = ts.scope_id
    WHERE ts.token_id = p_token_id
  )
  WHERE id = p_token_id;
  
  RETURN v_granted;
END;
$$;

-- 3. Fonction batch pour migrer tous les tokens actifs
CREATE OR REPLACE FUNCTION public.migrate_all_legacy_tokens()
RETURNS TABLE(token_id UUID, scopes_granted INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token RECORD;
  v_granted INTEGER;
BEGIN
  FOR v_token IN 
    SELECT id FROM extension_auth_tokens 
    WHERE is_active = true AND revoked_at IS NULL
  LOOP
    v_granted := migrate_token_to_granular_scopes(v_token.id);
    token_id := v_token.id;
    scopes_granted := v_granted;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- 4. Exécuter la migration sur tous les tokens actifs
DO $$
DECLARE
  v_token RECORD;
  v_total_tokens INTEGER := 0;
  v_total_scopes INTEGER := 0;
  v_granted INTEGER;
BEGIN
  FOR v_token IN 
    SELECT id FROM extension_auth_tokens 
    WHERE is_active = true AND revoked_at IS NULL
  LOOP
    v_granted := migrate_token_to_granular_scopes(v_token.id);
    v_total_tokens := v_total_tokens + 1;
    v_total_scopes := v_total_scopes + v_granted;
  END LOOP;
  
  RAISE NOTICE 'Migration terminée: % tokens migrés, % scopes attribués', v_total_tokens, v_total_scopes;
END;
$$;

-- 5. Mettre à jour generate_extension_token pour utiliser les scopes granulaires par défaut
CREATE OR REPLACE FUNCTION public.generate_extension_token(
  p_user_id UUID,
  p_email TEXT,
  p_requested_scopes TEXT[] DEFAULT NULL
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
  v_scope_id UUID;
  v_scope_name TEXT;
  v_granted_scopes TEXT[] := ARRAY[]::TEXT[];
  v_user_plan TEXT;
  v_default_scopes TEXT[] := ARRAY['products:read', 'products:import', 'sync:read', 'settings:read', 'analytics:read'];
  v_pro_scopes TEXT[] := ARRAY['products:read', 'products:write', 'products:import', 'products:bulk', 'sync:read', 'sync:trigger', 'analytics:read', 'analytics:export', 'settings:read', 'settings:write', 'ai:generate'];
  v_final_scopes TEXT[];
BEGIN
  SELECT COALESCE(subscription_plan, 'free') INTO v_user_plan
  FROM profiles WHERE id = p_user_id;
  
  IF v_user_plan IN ('pro', 'enterprise', 'lifetime') THEN
    v_final_scopes := COALESCE(p_requested_scopes, v_pro_scopes);
  ELSE
    v_final_scopes := COALESCE(p_requested_scopes, v_default_scopes);
  END IF;
  
  v_token := 'ext_' || encode(gen_random_bytes(32), 'base64');
  v_token := replace(replace(replace(v_token, '+', '-'), '/', '_'), '=', '');
  
  v_refresh_token := 'ref_' || encode(gen_random_bytes(32), 'base64');
  v_refresh_token := replace(replace(replace(v_refresh_token, '+', '-'), '/', '_'), '=', '');
  
  v_expires_at := now() + interval '30 days';
  
  INSERT INTO extension_auth_tokens (
    user_id, token, refresh_token, expires_at, is_active, permissions
  ) VALUES (
    p_user_id, v_token, v_refresh_token, v_expires_at, true, to_jsonb(v_final_scopes)
  )
  RETURNING id INTO v_token_id;
  
  FOREACH v_scope_name IN ARRAY v_final_scopes LOOP
    SELECT id INTO v_scope_id FROM extension_scopes WHERE scope_name = v_scope_name;
    
    IF v_scope_id IS NOT NULL THEN
      INSERT INTO extension_token_scopes (token_id, scope_id, granted_by)
      VALUES (v_token_id, v_scope_id, p_user_id)
      ON CONFLICT (token_id, scope_id) DO NOTHING;
      
      v_granted_scopes := array_append(v_granted_scopes, v_scope_name);
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'token', v_token,
    'refresh_token', v_refresh_token,
    'expires_at', v_expires_at,
    'token_id', v_token_id,
    'permissions', v_granted_scopes,
    'user', jsonb_build_object(
      'id', p_user_id,
      'email', p_email,
      'plan', v_user_plan
    )
  );
END;
$$;