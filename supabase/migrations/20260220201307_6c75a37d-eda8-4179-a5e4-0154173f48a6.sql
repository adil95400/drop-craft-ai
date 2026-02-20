
-- Table des alertes de renouvellement envoyées
CREATE TABLE public.renewal_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL, -- '30_days' | '7_days' | '3_days' | '1_day' | 'expired'
  subscription_end_date TIMESTAMPTZ NOT NULL,
  channel TEXT NOT NULL DEFAULT 'in_app', -- 'in_app' | 'email' | 'both'
  is_read BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Préférences d'alertes de renouvellement
CREATE TABLE public.renewal_alert_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  alert_30_days BOOLEAN NOT NULL DEFAULT true,
  alert_7_days BOOLEAN NOT NULL DEFAULT true,
  alert_3_days BOOLEAN NOT NULL DEFAULT true,
  alert_1_day BOOLEAN NOT NULL DEFAULT true,
  channel TEXT NOT NULL DEFAULT 'both', -- 'in_app' | 'email' | 'both'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_renewal_alerts_user ON public.renewal_alerts(user_id);
CREATE INDEX idx_renewal_alerts_type ON public.renewal_alerts(alert_type, user_id);

-- RLS
ALTER TABLE public.renewal_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewal_alert_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users view own renewal alerts"
ON public.renewal_alerts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own renewal alerts"
ON public.renewal_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own renewal alerts"
ON public.renewal_alerts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users view own renewal prefs"
ON public.renewal_alert_preferences FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own renewal prefs"
ON public.renewal_alert_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own renewal prefs"
ON public.renewal_alert_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_renewal_prefs_updated_at
BEFORE UPDATE ON public.renewal_alert_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
