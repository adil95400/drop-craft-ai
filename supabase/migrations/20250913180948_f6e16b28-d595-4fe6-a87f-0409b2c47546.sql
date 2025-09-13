-- Créer les tables pour les intégrations e-commerce
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_data JSONB DEFAULT '{}',
  credentials JSONB DEFAULT '{}',
  encrypted_credentials JSONB DEFAULT '{}',
  connection_status TEXT DEFAULT 'disconnected' CHECK (connection_status IN ('active', 'error', 'syncing', 'disconnected')),
  sync_status TEXT DEFAULT 'never' CHECK (sync_status IN ('active', 'error', 'syncing', 'never')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_errors TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Champs spécifiques pour l'authentification
  api_key TEXT,
  api_secret TEXT,
  access_token TEXT,
  refresh_token TEXT,
  credential_access_log JSONB DEFAULT '{}',
  credential_encryption_version INTEGER DEFAULT 1,
  last_credential_access TIMESTAMP WITH TIME ZONE,
  require_additional_auth BOOLEAN DEFAULT false
);

-- Créer les tables pour les logs de synchronisation
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL DEFAULT 'full',
  status TEXT NOT NULL CHECK (status IN ('completed', 'failed', 'running')),
  products_synced INTEGER DEFAULT 0,
  orders_synced INTEGER DEFAULT 0,
  errors TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Créer les tables pour les logs de santé des intégrations
CREATE TABLE IF NOT EXISTS public.health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'slow', 'error')),
  response_time INTEGER,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
CREATE POLICY "Users can manage their integrations" ON public.integrations
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their sync logs" ON public.sync_logs
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.integrations 
  WHERE integrations.id = sync_logs.integration_id 
  AND integrations.user_id = auth.uid()
));

CREATE POLICY "Users can view their health logs" ON public.health_logs
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.integrations 
  WHERE integrations.id = health_logs.integration_id 
  AND integrations.user_id = auth.uid()
));

-- Créer des triggers pour les timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();