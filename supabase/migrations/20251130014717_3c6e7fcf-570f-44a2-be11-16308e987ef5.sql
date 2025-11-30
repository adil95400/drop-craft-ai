-- Table des coupons de réduction
CREATE TABLE IF NOT EXISTS public.promotional_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informations coupon
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  coupon_type TEXT NOT NULL CHECK (coupon_type IN ('percentage', 'fixed_amount', 'free_trial')),
  
  -- Valeur de la réduction
  discount_value DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  
  -- Conditions d'utilisation
  min_purchase_amount DECIMAL(10,2),
  max_discount_amount DECIMAL(10,2),
  applies_to TEXT[] DEFAULT ARRAY['all'], -- 'all', 'subscription', 'features', specific plan names
  
  -- Limites d'utilisation
  usage_limit INTEGER, -- NULL = unlimited
  usage_count INTEGER DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,
  
  -- Période de validité
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  
  -- Essai gratuit
  trial_days INTEGER, -- Pour les coupons de type 'free_trial'
  
  -- État
  is_active BOOLEAN DEFAULT true,
  
  -- Métadonnées
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des utilisations de coupons
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES public.promotional_coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Détails de l'utilisation
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  discount_applied DECIMAL(10,2) NOT NULL,
  original_amount DECIMAL(10,2),
  final_amount DECIMAL(10,2),
  
  -- Contexte
  order_id UUID,
  subscription_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des essais gratuits
CREATE TABLE IF NOT EXISTS public.free_trial_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Configuration de l'essai
  trial_plan TEXT NOT NULL, -- 'pro', 'ultra_pro'
  trial_days INTEGER NOT NULL,
  
  -- Dates
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  
  -- État
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'converted', 'cancelled')),
  converted_to_paid BOOLEAN DEFAULT false,
  conversion_date TIMESTAMPTZ,
  
  -- Source
  coupon_code TEXT,
  referral_source TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.promotional_coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.promotional_coupons(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_coupons_valid ON public.promotional_coupons(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_redemptions_user ON public.coupon_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_coupon ON public.coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_trials_user ON public.free_trial_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_trials_status ON public.free_trial_subscriptions(status);

-- RLS Policies
ALTER TABLE public.promotional_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.free_trial_subscriptions ENABLE ROW LEVEL SECURITY;

-- Admins peuvent tout faire sur les coupons
CREATE POLICY "Admins can manage coupons"
  ON public.promotional_coupons
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Users peuvent voir les coupons actifs (pour validation)
CREATE POLICY "Users can view active coupons"
  ON public.promotional_coupons
  FOR SELECT
  USING (is_active = true AND valid_from <= NOW() AND (valid_until IS NULL OR valid_until >= NOW()));

-- Users peuvent voir leurs propres redemptions
CREATE POLICY "Users can view own redemptions"
  ON public.coupon_redemptions
  FOR SELECT
  USING (user_id = auth.uid());

-- Users peuvent voir leur propre essai gratuit
CREATE POLICY "Users can view own trial"
  ON public.free_trial_subscriptions
  FOR SELECT
  USING (user_id = auth.uid());

-- Admins peuvent voir tous les essais
CREATE POLICY "Admins can view all trials"
  ON public.free_trial_subscriptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_promotional_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.promotional_coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_promotional_updated_at();

CREATE TRIGGER update_trials_updated_at
  BEFORE UPDATE ON public.free_trial_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_promotional_updated_at();