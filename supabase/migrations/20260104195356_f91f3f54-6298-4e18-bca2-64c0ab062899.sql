-- =============================================
-- STORAGE BUCKET FOR MEDIA
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-library', 
  'media-library', 
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav', 'application/pdf']
);

-- Storage policies
CREATE POLICY "Media files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'media-library');

CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'media-library' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'media-library' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
USING (bucket_id = 'media-library' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================
-- MEDIA LIBRARY TABLE
-- =============================================
CREATE TABLE public.media_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image', -- image, video, audio, document
  width INTEGER,
  height INTEGER,
  duration INTEGER, -- for video/audio in seconds
  alt_text TEXT,
  title TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  folder_path TEXT DEFAULT '/',
  metadata JSONB DEFAULT '{}',
  usage_rights JSONB DEFAULT '{}', -- license, attribution, expiry
  variants JSONB DEFAULT '{}', -- thumbnail, square, etc.
  is_favorite BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own media" ON public.media_assets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own media" ON public.media_assets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media" ON public.media_assets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media" ON public.media_assets
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_media_assets_user_id ON public.media_assets(user_id);
CREATE INDEX idx_media_assets_media_type ON public.media_assets(media_type);
CREATE INDEX idx_media_assets_category ON public.media_assets(category);
CREATE INDEX idx_media_assets_tags ON public.media_assets USING GIN(tags);

-- =============================================
-- MEDIA FOLDERS
-- =============================================
CREATE TABLE public.media_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  parent_id UUID REFERENCES public.media_folders(id) ON DELETE CASCADE,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.media_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own folders" ON public.media_folders
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- CONTENT TRANSLATIONS
-- =============================================
CREATE TABLE public.content_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id UUID NOT NULL, -- references blog_posts, content_library, etc.
  content_type TEXT NOT NULL, -- 'blog_post', 'content_library', 'template', 'page'
  source_language TEXT NOT NULL DEFAULT 'fr',
  target_language TEXT NOT NULL,
  original_content JSONB NOT NULL, -- title, content, excerpt, meta_description
  translated_content JSONB NOT NULL,
  translation_status TEXT NOT NULL DEFAULT 'draft', -- draft, pending_review, approved, published
  translator_type TEXT DEFAULT 'ai', -- ai, human
  translator_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  quality_score INTEGER, -- 0-100
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(content_id, target_language)
);

ALTER TABLE public.content_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own translations" ON public.content_translations
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_translations_content ON public.content_translations(content_id, content_type);
CREATE INDEX idx_translations_language ON public.content_translations(target_language);

-- =============================================
-- SUPPORTED LANGUAGES
-- =============================================
CREATE TABLE public.supported_languages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL, -- fr, en, es, de, etc.
  name TEXT NOT NULL,
  native_name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  url_prefix TEXT, -- /fr/, /en/
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.supported_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own languages" ON public.supported_languages
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- PAGE BUILDER - PAGES
-- =============================================
CREATE TABLE public.landing_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  page_type TEXT DEFAULT 'landing', -- landing, product, marketing, blog
  status TEXT DEFAULT 'draft', -- draft, published, archived
  content JSONB NOT NULL DEFAULT '{"sections": []}', -- page builder content
  seo_title TEXT,
  seo_description TEXT,
  og_image TEXT,
  template_id UUID,
  published_at TIMESTAMPTZ,
  published_by UUID,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own pages" ON public.landing_pages
  FOR ALL USING (auth.uid() = user_id);

CREATE UNIQUE INDEX idx_landing_pages_slug ON public.landing_pages(user_id, slug);

-- =============================================
-- PAGE BUILDER - COMPONENTS
-- =============================================
CREATE TABLE public.page_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- header, hero, features, testimonials, cta, footer, etc.
  description TEXT,
  thumbnail_url TEXT,
  component_data JSONB NOT NULL, -- component structure
  is_public BOOLEAN DEFAULT false, -- marketplace
  is_premium BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.page_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public or own components" ON public.page_components
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can manage their own components" ON public.page_components
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- CONTENT ROLES & PERMISSIONS
-- =============================================
CREATE TYPE public.content_role AS ENUM ('viewer', 'writer', 'editor', 'publisher', 'admin');

CREATE TABLE public.content_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- owner
  member_email TEXT NOT NULL,
  member_user_id UUID, -- if registered
  role content_role NOT NULL DEFAULT 'writer',
  permissions JSONB DEFAULT '{}', -- granular permissions
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, member_email)
);

ALTER TABLE public.content_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage team" ON public.content_team_members
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Members can view their invites" ON public.content_team_members
  FOR SELECT USING (member_user_id = auth.uid());

-- =============================================
-- CONTENT WORKFLOWS
-- =============================================
CREATE TABLE public.content_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  current_status TEXT NOT NULL DEFAULT 'draft',
  assigned_to UUID,
  due_date TIMESTAMPTZ,
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  comments JSONB DEFAULT '[]',
  history JSONB DEFAULT '[]', -- status changes
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own workflows" ON public.content_workflows
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- SOCIAL DISTRIBUTION
-- =============================================
CREATE TABLE public.social_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL, -- facebook, instagram, linkedin, twitter, tiktok
  account_name TEXT NOT NULL,
  account_id TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  profile_url TEXT,
  profile_image TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own social accounts" ON public.social_accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.social_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id UUID, -- linked content
  content_type TEXT,
  social_account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  post_content TEXT NOT NULL,
  media_urls TEXT[],
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft', -- draft, scheduled, published, failed
  platform_post_id TEXT, -- ID from the platform
  engagement_data JSONB DEFAULT '{}', -- likes, shares, comments
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own social posts" ON public.social_posts
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- CONTENT ANALYTICS
-- =============================================
CREATE TABLE public.content_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  avg_read_time INTEGER DEFAULT 0, -- seconds
  scroll_depth INTEGER DEFAULT 0, -- percentage
  shares INTEGER DEFAULT 0,
  cta_clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue_generated NUMERIC DEFAULT 0,
  source_breakdown JSONB DEFAULT '{}',
  device_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(content_id, date)
);

ALTER TABLE public.content_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analytics" ON public.content_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics" ON public.content_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- CONTENT A/B TESTS
-- =============================================
CREATE TABLE public.content_ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  test_name TEXT NOT NULL,
  test_element TEXT NOT NULL, -- title, image, cta, layout
  variants JSONB NOT NULL, -- [{id, name, content, traffic_pct}]
  winner_criteria TEXT DEFAULT 'clicks', -- clicks, conversions, time_on_page
  status TEXT DEFAULT 'draft', -- draft, running, completed, paused
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  results JSONB DEFAULT '{}',
  winner_variant_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own ab tests" ON public.content_ab_tests
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- CONTENT VERSIONS (enhanced)
-- =============================================
CREATE TABLE public.content_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  content_snapshot JSONB NOT NULL,
  change_summary TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_auto_backup BOOLEAN DEFAULT false
);

ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own versions" ON public.content_versions
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_content_versions_content ON public.content_versions(content_id, content_type);

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER update_media_assets_updated_at
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_media_folders_updated_at
  BEFORE UPDATE ON public.media_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_translations_updated_at
  BEFORE UPDATE ON public.content_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_landing_pages_updated_at
  BEFORE UPDATE ON public.landing_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_page_components_updated_at
  BEFORE UPDATE ON public.page_components
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_workflows_updated_at
  BEFORE UPDATE ON public.content_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_accounts_updated_at
  BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_posts_updated_at
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_ab_tests_updated_at
  BEFORE UPDATE ON public.content_ab_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();