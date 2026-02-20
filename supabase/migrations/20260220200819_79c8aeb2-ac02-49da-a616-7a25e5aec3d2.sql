
-- Table des codes de parrainage
CREATE TABLE public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  code TEXT NOT NULL UNIQUE,
  reward_type TEXT NOT NULL DEFAULT 'credits', -- 'credits' | 'discount_percent' | 'discount_fixed'
  reward_value NUMERIC(10,2) NOT NULL DEFAULT 10,
  referee_reward_type TEXT NOT NULL DEFAULT 'credits',
  referee_reward_value NUMERIC(10,2) NOT NULL DEFAULT 10,
  max_uses INTEGER DEFAULT NULL, -- null = unlimited
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des parrainages effectués
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL, -- parrain
  referee_id UUID NOT NULL, -- filleul
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'completed' | 'rewarded' | 'expired'
  referrer_reward_given BOOLEAN NOT NULL DEFAULT false,
  referee_reward_given BOOLEAN NOT NULL DEFAULT false,
  referrer_reward_amount NUMERIC(10,2) DEFAULT 0,
  referee_reward_amount NUMERIC(10,2) DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_referral_codes_user ON public.referral_codes(user_id);
CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referee ON public.referrals(referee_id);

-- RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Policies referral_codes
CREATE POLICY "Users can view their own referral codes"
ON public.referral_codes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral codes"
ON public.referral_codes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral codes"
ON public.referral_codes FOR UPDATE USING (auth.uid() = user_id);

-- Public read for code lookup (anyone can look up a code to use it)
CREATE POLICY "Anyone can lookup active referral codes"
ON public.referral_codes FOR SELECT USING (is_active = true);

-- Policies referrals
CREATE POLICY "Users can view referrals they're part of"
ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "Users can create referrals as referee"
ON public.referrals FOR INSERT WITH CHECK (auth.uid() = referee_id);

-- Triggers
CREATE TRIGGER update_referral_codes_updated_at
BEFORE UPDATE ON public.referral_codes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_referrals_updated_at
BEFORE UPDATE ON public.referrals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
