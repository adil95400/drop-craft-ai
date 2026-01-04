-- Create content_templates table for reusable templates
CREATE TABLE IF NOT EXISTS public.content_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('blog', 'product', 'social', 'email', 'seo')),
  content JSONB NOT NULL DEFAULT '{}',
  variables TEXT[] DEFAULT '{}',
  category TEXT,
  is_favorite BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content_calendar table for editorial planning
CREATE TABLE IF NOT EXISTS public.content_calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('blog', 'social', 'email', 'video', 'image')),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'cancelled')),
  content_id UUID,
  platform TEXT,
  notes TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content_library table for all generated content
CREATE TABLE IF NOT EXISTS public.content_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('description', 'seo_title', 'meta_description', 'blog', 'social', 'email', 'ad_copy')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  ai_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_library ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_templates
CREATE POLICY "Users can view their own templates" ON public.content_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own templates" ON public.content_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own templates" ON public.content_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own templates" ON public.content_templates FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for content_calendar
CREATE POLICY "Users can view their own calendar" ON public.content_calendar FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create calendar entries" ON public.content_calendar FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their calendar" ON public.content_calendar FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete calendar entries" ON public.content_calendar FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for content_library
CREATE POLICY "Users can view their own library" ON public.content_library FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to their library" ON public.content_library FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their library" ON public.content_library FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from library" ON public.content_library FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_content_templates_updated_at BEFORE UPDATE ON public.content_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_content_calendar_updated_at BEFORE UPDATE ON public.content_calendar FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_content_library_updated_at BEFORE UPDATE ON public.content_library FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();