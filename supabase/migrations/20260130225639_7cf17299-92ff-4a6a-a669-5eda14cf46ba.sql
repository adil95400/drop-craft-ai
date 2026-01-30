-- Fix validate_extension_token to use full_name instead of first_name/last_name
CREATE OR REPLACE FUNCTION public.validate_extension_token(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_token_record record;
BEGIN
  -- Fast token lookup with profile join
  SELECT t.*, p.subscription_plan, p.full_name, p.email
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
      'fullName', v_token_record.full_name
    ),
    'permissions', v_token_record.permissions,
    'expires_at', v_token_record.expires_at
  );
END;
$function$;