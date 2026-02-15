
-- Table de scoring client
CREATE TABLE IF NOT EXISTS public.customer_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  total_score INTEGER DEFAULT 0,
  recency_score INTEGER DEFAULT 0,
  frequency_score INTEGER DEFAULT 0,
  monetary_score INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  segment_id UUID REFERENCES public.customer_segments(id) ON DELETE SET NULL,
  last_calculated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, customer_id)
);

ALTER TABLE public.customer_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own scores"
  ON public.customer_scores FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table des communications automatisées
CREATE TABLE IF NOT EXISTS public.customer_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  segment_id UUID REFERENCES public.customer_segments(id) ON DELETE SET NULL,
  communication_type TEXT NOT NULL DEFAULT 'email',
  subject TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.customer_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own communications"
  ON public.customer_communications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Triggers pour updated_at
CREATE OR REPLACE TRIGGER update_customer_scores_updated_at
  BEFORE UPDATE ON public.customer_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_customer_communications_updated_at
  BEFORE UPDATE ON public.customer_communications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
