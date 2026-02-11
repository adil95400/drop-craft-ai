
-- Table pour les achats de crédits IA (add-ons)
CREATE TABLE public.credit_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quota_key TEXT NOT NULL DEFAULT 'ai_generations',
  credits_purchased INTEGER NOT NULL,
  credits_remaining INTEGER NOT NULL,
  price_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  stripe_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'refunded')),
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_credit_addons_user ON public.credit_addons(user_id);
CREATE INDEX idx_credit_addons_status ON public.credit_addons(user_id, status);
CREATE INDEX idx_credit_addons_quota ON public.credit_addons(user_id, quota_key, status);

-- Enable RLS
ALTER TABLE public.credit_addons ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own credit addons"
  ON public.credit_addons FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credit addons"
  ON public.credit_addons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credit addons"
  ON public.credit_addons FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable realtime for credit updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_addons;
