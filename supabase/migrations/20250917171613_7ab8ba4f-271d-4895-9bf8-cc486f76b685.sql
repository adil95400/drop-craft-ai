-- Migration pour le système d'importation et synchronisation avancé

-- Table des connecteurs de plateformes
CREATE TABLE IF NOT EXISTS public.platform_connectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  shop_id TEXT,
  credentials TEXT NOT NULL, -- Encrypted JSON
  is_active BOOLEAN NOT NULL DEFAULT true,
  sync_frequency TEXT NOT NULL DEFAULT 'manual',
  sync_entities TEXT[] NOT NULL DEFAULT '{"products"}',
  webhook_endpoints TEXT[] DEFAULT '{}',
  error_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des événements webhook
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connector_id UUID REFERENCES platform_connectors(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS pour platform_connectors
ALTER TABLE public.platform_connectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "secure_user_access_platform_connectors" 
ON public.platform_connectors 
FOR ALL 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- RLS pour webhook_events
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "secure_user_access_webhook_events" 
ON public.webhook_events 
FOR ALL 
USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM platform_connectors pc 
    WHERE pc.id = webhook_events.connector_id 
    AND pc.user_id = auth.uid()
  )
);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_platform_connectors_updated_at 
  BEFORE UPDATE ON platform_connectors 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();