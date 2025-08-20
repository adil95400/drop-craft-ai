-- Create revoked_tokens table for tracking force disconnected users
CREATE TABLE public.revoked_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  revoked_by uuid NOT NULL,
  reason text DEFAULT 'force_disconnect',
  revoked_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.revoked_tokens ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_revoked_tokens_user_id ON public.revoked_tokens(user_id);
CREATE INDEX idx_revoked_tokens_expires_at ON public.revoked_tokens(expires_at);

-- Only admins can manage revoked tokens
CREATE POLICY "Admins can manage revoked tokens"
ON public.revoked_tokens
FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role)
);

-- Create function to check if a user's token is revoked
CREATE OR REPLACE FUNCTION public.is_token_revoked(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.revoked_tokens 
    WHERE user_id = check_user_id 
    AND expires_at > now()
  );
$$;

-- Create function to revoke user token
CREATE OR REPLACE FUNCTION public.revoke_user_token(target_user_id uuid, admin_user_id uuid, revoke_reason text DEFAULT 'force_disconnect')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = admin_user_id AND role = 'admin'::app_role
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Insert revocation record
  INSERT INTO public.revoked_tokens (user_id, revoked_by, reason)
  VALUES (target_user_id, admin_user_id, revoke_reason);

  -- Log security event
  INSERT INTO public.security_events (
    user_id,
    event_type,
    severity,
    description,
    metadata
  ) VALUES (
    admin_user_id,
    'user_force_disconnect',
    'critical',
    'Admin force disconnected user',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'reason', revoke_reason,
      'timestamp', now()
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'User token revoked successfully',
    'target_user_id', target_user_id
  );
END;
$$;

-- Create cleanup function for expired revoked tokens
CREATE OR REPLACE FUNCTION public.cleanup_revoked_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.revoked_tokens 
  WHERE expires_at < now();
END;
$$;