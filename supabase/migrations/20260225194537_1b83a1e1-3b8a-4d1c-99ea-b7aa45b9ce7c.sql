
-- White-Label settings table per tenant/user
CREATE TABLE public.white_label_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID,
  brand_name TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT DEFAULT '#8b5cf6',
  accent_color TEXT DEFAULT '#f59e0b',
  logo_url TEXT,
  favicon_url TEXT,
  custom_domain TEXT,
  custom_css TEXT,
  email_branding BOOLEAN DEFAULT true,
  hide_platform_badge BOOLEAN DEFAULT false,
  custom_login_bg TEXT,
  font_family TEXT DEFAULT 'Inter',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.white_label_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own white-label settings"
ON public.white_label_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own white-label settings"
ON public.white_label_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own white-label settings"
ON public.white_label_settings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own white-label settings"
ON public.white_label_settings FOR DELETE
USING (auth.uid() = user_id);

-- Updated at trigger
CREATE TRIGGER update_white_label_settings_updated_at
BEFORE UPDATE ON public.white_label_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for white-label assets
INSERT INTO storage.buckets (id, name, public) VALUES ('white-label', 'white-label', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload white-label assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'white-label' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "White-label assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'white-label');

CREATE POLICY "Users can update their white-label assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'white-label' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their white-label assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'white-label' AND auth.uid()::text = (storage.foldername(name))[1]);
