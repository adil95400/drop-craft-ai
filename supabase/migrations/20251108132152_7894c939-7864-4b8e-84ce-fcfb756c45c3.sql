-- Create storage bucket for video tutorials
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'video-tutorials',
  'video-tutorials',
  true,
  524288000, -- 500MB limit
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
);

-- Create storage policies for video tutorials
CREATE POLICY "Anyone can view video tutorials"
ON storage.objects FOR SELECT
USING (bucket_id = 'video-tutorials');

CREATE POLICY "Admins can upload video tutorials"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'video-tutorials' 
  AND auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admins can update video tutorials"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'video-tutorials'
  AND auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admins can delete video tutorials"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'video-tutorials'
  AND auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Create video tutorials table
CREATE TABLE IF NOT EXISTS public.video_tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_type TEXT NOT NULL CHECK (video_type IN ('youtube', 'upload', 'external')),
  youtube_id TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_tutorials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_tutorials
CREATE POLICY "Anyone can view active video tutorials"
ON public.video_tutorials FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all video tutorials"
ON public.video_tutorials FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admins can insert video tutorials"
ON public.video_tutorials FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admins can update video tutorials"
ON public.video_tutorials FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admins can delete video tutorials"
ON public.video_tutorials FOR DELETE
USING (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_video_tutorials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_video_tutorials_updated_at
BEFORE UPDATE ON public.video_tutorials
FOR EACH ROW
EXECUTE FUNCTION public.update_video_tutorials_updated_at();

-- Create index for faster queries
CREATE INDEX idx_video_tutorials_platform ON public.video_tutorials(platform);
CREATE INDEX idx_video_tutorials_active ON public.video_tutorials(is_active);
CREATE INDEX idx_video_tutorials_order ON public.video_tutorials(platform, order_index);

-- Insert some placeholder data
INSERT INTO public.video_tutorials (platform, title, description, video_type, duration, order_index)
VALUES 
  ('shopify', 'Introduction à l''intégration Shopify', 'Vue d''ensemble complète du processus d''intégration', 'youtube', '5:30', 1),
  ('shopify', 'Configuration pas à pas des API Shopify', 'Tutoriel détaillé avec enregistrement d''écran', 'youtube', '8:45', 2),
  ('woocommerce', 'Introduction à l''intégration WooCommerce', 'Configuration complète de WooCommerce REST API', 'youtube', '6:15', 1),
  ('etsy', 'Configuration du Developer Portal Etsy', 'Créer et configurer votre application Etsy', 'youtube', '7:00', 1),
  ('prestashop', 'Activation et configuration du Webservice PrestaShop', 'Guide complet pour activer l''API PrestaShop', 'youtube', '9:20', 1);