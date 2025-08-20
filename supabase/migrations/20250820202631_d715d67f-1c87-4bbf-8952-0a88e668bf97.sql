-- Create Canva integrations table
CREATE TABLE public.canva_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  canva_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  canva_brand_id TEXT,
  canva_team_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Canva designs table
CREATE TABLE public.canva_designs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  canva_design_id TEXT NOT NULL UNIQUE,
  canva_integration_id UUID NOT NULL,
  title TEXT NOT NULL,
  design_type TEXT, -- 'presentation', 'social-media-post', 'logo', etc.
  thumbnail_url TEXT,
  design_url TEXT,
  export_urls JSONB DEFAULT '{}', -- URLs for different formats (PNG, PDF, etc.)
  metadata JSONB DEFAULT '{}',
  tags TEXT[],
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'deleted', 'archived'
  last_modified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Canva webhooks table to track webhook events
CREATE TABLE public.canva_webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  canva_design_id TEXT,
  event_type TEXT NOT NULL, -- 'design.publish', 'design.update', etc.
  event_data JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.canva_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canva_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canva_webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for canva_integrations
CREATE POLICY "Users can manage their own Canva integrations"
ON public.canva_integrations
FOR ALL
USING (auth.uid() = user_id);

-- RLS policies for canva_designs
CREATE POLICY "Users can manage their own Canva designs"
ON public.canva_designs
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all Canva designs"
ON public.canva_designs
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- RLS policies for canva_webhook_events
CREATE POLICY "Users can view their own webhook events"
ON public.canva_webhook_events
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage webhook events"
ON public.canva_webhook_events
FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role');

-- Add foreign key constraints
ALTER TABLE public.canva_designs
ADD CONSTRAINT fk_canva_designs_integration
FOREIGN KEY (canva_integration_id) REFERENCES public.canva_integrations(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX idx_canva_integrations_user_id ON public.canva_integrations(user_id);
CREATE INDEX idx_canva_designs_user_id ON public.canva_designs(user_id);
CREATE INDEX idx_canva_designs_canva_id ON public.canva_designs(canva_design_id);
CREATE INDEX idx_canva_webhook_events_processed ON public.canva_webhook_events(processed);

-- Add trigger for updated_at
CREATE TRIGGER update_canva_integrations_updated_at
BEFORE UPDATE ON public.canva_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_canva_designs_updated_at
BEFORE UPDATE ON public.canva_designs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();