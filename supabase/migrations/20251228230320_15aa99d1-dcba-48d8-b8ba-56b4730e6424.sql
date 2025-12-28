-- Create Canva integrations table
CREATE TABLE IF NOT EXISTS public.canva_integrations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    canva_user_id TEXT,
    canva_team_id TEXT,
    canva_brand_id TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Create Canva designs table
CREATE TABLE IF NOT EXISTS public.canva_designs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    canva_integration_id UUID REFERENCES public.canva_integrations(id),
    canva_design_id TEXT UNIQUE,
    title TEXT NOT NULL,
    design_type TEXT,
    thumbnail_url TEXT,
    design_url TEXT,
    export_urls JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active',
    last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Canva webhook events table
CREATE TABLE IF NOT EXISTS public.canva_webhook_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    canva_design_id TEXT,
    event_type TEXT NOT NULL,
    event_data JSONB,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI generated images table for marketing
CREATE TABLE IF NOT EXISTS public.marketing_ai_images (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    prompt TEXT NOT NULL,
    image_url TEXT,
    image_base64 TEXT,
    width INTEGER DEFAULT 1024,
    height INTEGER DEFAULT 1024,
    model TEXT DEFAULT 'google/gemini-2.5-flash-image',
    style TEXT,
    category TEXT DEFAULT 'general',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.canva_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canva_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canva_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_ai_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for canva_integrations
CREATE POLICY "Users can view their own integrations" ON public.canva_integrations
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own integrations" ON public.canva_integrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own integrations" ON public.canva_integrations
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for canva_designs
CREATE POLICY "Users can view their own designs" ON public.canva_designs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own designs" ON public.canva_designs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own designs" ON public.canva_designs
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own designs" ON public.canva_designs
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for canva_webhook_events
CREATE POLICY "Users can view their own webhook events" ON public.canva_webhook_events
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for marketing_ai_images
CREATE POLICY "Users can view their own AI images" ON public.marketing_ai_images
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own AI images" ON public.marketing_ai_images
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own AI images" ON public.marketing_ai_images
    FOR DELETE USING (auth.uid() = user_id);

-- Add update triggers
CREATE TRIGGER update_canva_integrations_updated_at BEFORE UPDATE ON public.canva_integrations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_canva_designs_updated_at BEFORE UPDATE ON public.canva_designs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();