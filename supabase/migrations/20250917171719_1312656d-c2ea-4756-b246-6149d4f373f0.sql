-- Migration corrigée pour le système d'importation et synchronisation

-- Créer d'abord la table platform_connectors
CREATE TABLE IF NOT EXISTS public.platform_connectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  shop_id TEXT,
  credentials TEXT NOT NULL,
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

-- Ensuite créer la table webhook_events avec référence
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connector_id UUID REFERENCES public.platform_connectors(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.platform_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can manage their own connectors" 
ON public.platform_connectors 
FOR ALL 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can access their webhook events" 
ON public.webhook_events 
FOR ALL 
USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.platform_connectors pc 
    WHERE pc.id = webhook_events.connector_id 
    AND pc.user_id = auth.uid()
  )
);