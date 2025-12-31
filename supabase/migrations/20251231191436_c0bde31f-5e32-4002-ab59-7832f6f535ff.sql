-- Create colors table with RLS enabled
CREATE TABLE public.colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  hex_value text NOT NULL,
  rgb_value text,
  category text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.colors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own colors"
ON public.colors
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own colors"
ON public.colors
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own colors"
ON public.colors
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own colors"
ON public.colors
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_colors_updated_at
BEFORE UPDATE ON public.colors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_colors_user_id ON public.colors(user_id);