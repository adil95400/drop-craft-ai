-- Table pour stocker les request IDs pour anti-replay (30 jours TTL)
CREATE TABLE IF NOT EXISTS public.request_replay_log (
  request_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  response_hash TEXT
);

-- Index pour cleanup des entrées expirées
CREATE INDEX idx_request_replay_expires ON public.request_replay_log(expires_at);

-- Index pour recherche par user
CREATE INDEX idx_request_replay_user ON public.request_replay_log(user_id, processed_at DESC);

-- Enable RLS
ALTER TABLE public.request_replay_log ENABLE ROW LEVEL SECURITY;

-- Politique: les utilisateurs ne peuvent voir que leurs propres entrées
CREATE POLICY "Users can view their own replay logs"
ON public.request_replay_log FOR SELECT
USING (auth.uid() = user_id);

-- Politique: le service peut insérer des entrées
CREATE POLICY "Service can insert replay logs"
ON public.request_replay_log FOR INSERT
WITH CHECK (true);

-- Table améliorée pour les logs du gateway
CREATE TABLE IF NOT EXISTS public.gateway_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT,
  duration_ms INTEGER,
  error_code TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour recherche
CREATE INDEX idx_gateway_logs_user ON public.gateway_logs(user_id, created_at DESC);
CREATE INDEX idx_gateway_logs_action ON public.gateway_logs(action, created_at DESC);
CREATE INDEX idx_gateway_logs_level ON public.gateway_logs(level) WHERE level IN ('error', 'warn');

-- Enable RLS
ALTER TABLE public.gateway_logs ENABLE ROW LEVEL SECURITY;

-- Politique: utilisateurs peuvent voir leurs logs
CREATE POLICY "Users can view their own gateway logs"
ON public.gateway_logs FOR SELECT
USING (auth.uid() = user_id);

-- Politique: service peut insérer des logs
CREATE POLICY "Service can insert gateway logs"
ON public.gateway_logs FOR INSERT
WITH CHECK (true);

-- Fonction pour nettoyer les vieux logs
CREATE OR REPLACE FUNCTION public.cleanup_gateway_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprimer les logs de plus de 90 jours
  DELETE FROM public.gateway_logs
  WHERE created_at < now() - INTERVAL '90 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Supprimer les entrées replay expirées
  DELETE FROM public.request_replay_log
  WHERE expires_at < now();
  
  RETURN deleted_count;
END;
$$;