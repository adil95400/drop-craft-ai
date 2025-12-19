-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- Add description column to plan_limits if missing
ALTER TABLE public.plan_limits 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Rename plan_name to plan_type for consistency if needed (or add alias)
-- Actually plan_limits uses plan_name, let's keep it consistent

-- Add missing AB test tables
CREATE TABLE public.ab_test_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  test_name TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  ad_creative JSONB DEFAULT '{}',
  traffic_allocation INTEGER DEFAULT 50,
  is_winner BOOLEAN DEFAULT false,
  performance_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ab_test_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own ab tests" ON public.ab_test_variants
  FOR ALL USING (auth.uid() = user_id);

-- Update existing triggers
CREATE TRIGGER update_ab_test_variants_updated_at
  BEFORE UPDATE ON public.ab_test_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();