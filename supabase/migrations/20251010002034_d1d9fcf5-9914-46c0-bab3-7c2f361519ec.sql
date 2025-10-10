-- Phase 5: Rate Limiting et Performance

-- Table pour tracker les rate limits par utilisateur
CREATE TABLE IF NOT EXISTS public.import_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, action_type, window_start)
);

-- Index pour queries rapides
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action 
ON public.import_rate_limits(user_id, action_type, window_start DESC);

-- RLS pour rate_limits
ALTER TABLE public.import_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rate limits"
ON public.import_rate_limits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage rate limits"
ON public.import_rate_limits FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Fonction pour vérifier et incrémenter le rate limit
CREATE OR REPLACE FUNCTION public.check_import_rate_limit(
  p_user_id uuid,
  p_action_type text,
  p_max_requests integer DEFAULT 10,
  p_window_minutes integer DEFAULT 60
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamptz;
  v_current_count integer;
  v_is_allowed boolean;
BEGIN
  -- Calculer le début de la fenêtre
  v_window_start := date_trunc('hour', now()) + 
    (floor(extract(minute from now()) / p_window_minutes) * p_window_minutes || ' minutes')::interval;
  
  -- Nettoyer les anciennes entrées
  DELETE FROM public.import_rate_limits
  WHERE window_start < now() - (p_window_minutes || ' minutes')::interval;
  
  -- Insérer ou mettre à jour le compteur
  INSERT INTO public.import_rate_limits (user_id, action_type, window_start, request_count)
  VALUES (p_user_id, p_action_type, v_window_start, 1)
  ON CONFLICT (user_id, action_type, window_start)
  DO UPDATE SET 
    request_count = import_rate_limits.request_count + 1,
    updated_at = now()
  RETURNING request_count INTO v_current_count;
  
  v_is_allowed := v_current_count <= p_max_requests;
  
  RETURN jsonb_build_object(
    'allowed', v_is_allowed,
    'current_count', v_current_count,
    'max_requests', p_max_requests,
    'window_minutes', p_window_minutes,
    'reset_at', v_window_start + (p_window_minutes || ' minutes')::interval
  );
END;
$$;

-- Fonction automatique de déblocage des jobs via cron
CREATE OR REPLACE FUNCTION public.auto_unlock_stuck_imports()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affected_count integer;
BEGIN
  -- Débloquer les jobs coincés
  UPDATE public.import_jobs
  SET 
    status = 'failed',
    completed_at = now(),
    errors = ARRAY['Job automatically failed - timeout after 30 minutes'],
    updated_at = now()
  WHERE status = 'processing'
  AND started_at < now() - interval '30 minutes';
  
  GET DIAGNOSTICS v_affected_count = ROW_COUNT;
  
  IF v_affected_count > 0 THEN
    -- Logger dans security_events
    INSERT INTO public.security_events (
      user_id,
      event_type,
      severity,
      description,
      metadata
    )
    SELECT 
      user_id,
      'import_auto_timeout',
      'warning',
      'Import job automatically timed out',
      jsonb_build_object(
        'job_count', v_affected_count,
        'timestamp', now()
      )
    FROM public.import_jobs
    WHERE status = 'failed'
    AND errors @> ARRAY['Job automatically failed - timeout after 30 minutes']
    LIMIT 1;
  END IF;
END;
$$;

-- Créer le cron job pour débloquer automatiquement les imports (toutes les 10 minutes)
SELECT cron.schedule(
  'auto-unlock-stuck-imports',
  '*/10 * * * *',
  $$SELECT public.auto_unlock_stuck_imports();$$
);